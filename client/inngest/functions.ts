import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";

const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

async function ensureRepoWithId(owner: string, name: string) {
  await prisma.repo.upsert({
    where: { owner_name: { owner, name } },
    update: {},
    create: { owner, name },
  });

  const repo = await prisma.repo.findUnique({
    where: { owner_name: { owner, name } },
    select: { id: true },
  });

  if (!repo?.id)
    throw new Error(`❌ Repo ID still missing for ${owner}/${name}`);

  // 🧩 Normalize BigInt or object into usable numeric form
  const rawId = repo.id as any;
  const normalizedId =
    typeof rawId === "bigint"
      ? rawId
      : typeof rawId === "object" && "value" in rawId
      ? BigInt(rawId.value)
      : BigInt(rawId);

  if (!normalizedId)
    throw new Error(
      `❌ Repo ID invalid format for ${owner}/${name}: ${JSON.stringify(repo)}`
    );

  return normalizedId;
}

async function getCountFromPaginatedApi(url: string, token: string) {
  const res = await fetch(url + "?per_page=1", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok)
    throw new Error(`GitHub API error at ${url}, status ${res.status}`);

  const linkHeader = res.headers.get("link");
  if (linkHeader) {
    const lastPageMatch = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
    if (lastPageMatch) return Number(lastPageMatch[1]);
  }

  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

// Inngest function
export const fetchRepoData = inngest.createFunction(
  { id: "sync-overview" },
  { event: "repo/sync.overview" },
  async ({ event }) => {
    const { owner, name } = event.data;

    if (!GITHUB_TOKEN) throw new Error("GitHub token not configured");

    // Fetch main repo details
    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );
    if (!repoRes.ok)
      throw new Error(`GitHub API error fetching repo ${owner}/${name}`);

    const repoData = await repoRes.json();

    // Fetch branches & tags
    const branchCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${owner}/${name}/branches`,
      GITHUB_TOKEN
    );
    const tagCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${owner}/${name}/tags`,
      GITHUB_TOKEN
    );

    // Fetch open PRs & issues
    const prSearchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+is:pr+is:open&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );
    const prSearchData = await prSearchRes.json();
    const openPrsCount = prSearchData.total_count ?? 0;

    const issuesSearchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+is:issue+is:open&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );
    const issuesSearchData = await issuesSearchRes.json();
    const openIssuesCount = issuesSearchData.total_count ?? 0;

    // Fetch last commit date
    let lastCommitDate: string | null = null;
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${name}/commits?per_page=1`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${GITHUB_TOKEN}`,
          },
        }
      );
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        if (Array.isArray(commitData) && commitData.length > 0) {
          lastCommitDate = commitData[0].commit?.committer?.date || null;
        }
      }
    } catch {}

    // Upsert into Prisma
    await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {
        description: repoData.description,
        visibility: repoData.private ? "private" : "public",
        default_branch: repoData.default_branch,
        stargazers_count: repoData.stargazers_count,
        watchers_count: repoData.watchers_count,
        subscribers_count: repoData.subscribers_count ?? 0,
        forks_count: repoData.forks_count,
        size_kb: repoData.size,
        language: repoData.language,
        license_name: repoData.license?.name,
        homepage: repoData.homepage,
        topics: repoData.topics ?? [],
        updated_at: new Date(repoData.updated_at),
        pushed_at: new Date(repoData.pushed_at),
        branch_count: branchCount,
        tag_count: tagCount,
        open_prs_count: openPrsCount,
        open_issues_count: openIssuesCount,
        last_commit: lastCommitDate ? new Date(lastCommitDate) : null,
        avatar_url: repoData.owner?.avatar_url ?? null,
        html_url: repoData.html_url,
      },
      create: {
        owner,
        name,
        description: repoData.description,
        visibility: repoData.private ? "private" : "public",
        default_branch: repoData.default_branch,
        stargazers_count: repoData.stargazers_count,
        watchers_count: repoData.watchers_count,
        subscribers_count: repoData.subscribers_count ?? 0,
        forks_count: repoData.forks_count,
        size_kb: repoData.size,
        language: repoData.language,
        license_name: repoData.license?.name,
        homepage: repoData.homepage,
        topics: repoData.topics ?? [],
        created_at: new Date(repoData.created_at),
        updated_at: new Date(repoData.updated_at),
        pushed_at: new Date(repoData.pushed_at),
        branch_count: branchCount,
        tag_count: tagCount,
        open_prs_count: openPrsCount,
        open_issues_count: openIssuesCount,
        last_commit: lastCommitDate ? new Date(lastCommitDate) : null,
        avatar_url: repoData.owner?.avatar_url ?? null,
        html_url: repoData.html_url,
      },
    });
  }
);

async function fetchCommitsFromGitHub(
  owner: string,
  name: string,
  repoId: bigint | number
) {
  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) throw new Error("GitHub token not configured");

  const commitsRes = await fetch(
    `https://api.github.com/repos/${owner}/${name}/commits?per_page=50`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
      },
    }
  );

  if (!commitsRes.ok) throw new Error(`GitHub API error: ${commitsRes.status}`);
  const commitsData = await commitsRes.json();

  const commits = commitsData.map((c: any) => ({
    sha: c.sha,
    message: c.commit?.message || "No message",
    committed_at: new Date(c.commit?.committer?.date || Date.now()),
    author_login: c.commit?.author?.name || null,
    committer_login: c.commit?.committer?.name || null,
    repo_id: repoId,
  }));

  for (const c of commits) {
    await prisma.commit.upsert({
      where: { sha: c.sha },
      update: c,
      create: c,
    });
  }

  return commits.length;
}

// 👇 Actual Inngest function
export const syncCommits = inngest.createFunction(
  { id: "sync-commits" },
  { event: "repo/sync.commits" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    console.log(`Syncing commits for ${owner}/${name}...`);

    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {},
      create: { owner, name },
    });

    const count = await fetchCommitsFromGitHub(owner, name, repo.id);

    return { synced: count };
  }
);

export const syncContributors = inngest.createFunction(
  { id: "sync-contributors" },
  { event: "repo/sync.contributors" },
  async ({ event, step }) => {
    const { owner, name, githubAccessToken } = event.data;
    const token = githubAccessToken || process.env.GITHUB_ACCESS_TOKEN;
    if (!token) throw new Error("GitHub token not provided");

    console.log(`🔄 Syncing contributors for ${owner}/${name}...`);

    // 1️⃣ Ensure repo exists and safely extract its ID as a number
    const repo = await step.run("Ensure repo", async () => {
      const ensured = await prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
        select: { id: true },
      });

      if (!ensured?.id) throw new Error("❌ Repo ID missing after upsert");

      // ✅ Convert BigInt → number for safe serialization inside Inngest
      return { id: Number(ensured.id) };
    });

    const repoId = repo.id;
    if (!repoId) throw new Error("❌ Repo ID missing after upsert (post-cast)");

    // 2️⃣ Fetch contributors from GitHub
    const contributorsData = await step.run(
      "Fetch GitHub contributors",
      async () => {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}/contributors?per_page=100`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`GitHub API error: ${res.status} - ${text}`);
        }

        return res.json();
      }
    );

    // 3️⃣ Upsert contributors and ranks
    await step.run("Upsert contributors", async () => {
      await Promise.all(
        contributorsData.map(async (c: any) => {
          // Ensure GitHub user exists
          await prisma.ghUser.upsert({
            where: { login: c.login },
            update: { avatar_url: c.avatar_url, type: c.type },
            create: { login: c.login, avatar_url: c.avatar_url, type: c.type },
          });

          // Ensure contributor rank entry
          await prisma.contributorRank.upsert({
            where: {
              repo_id_user_login: {
                repo_id: BigInt(repoId),
                user_login: c.login,
              },
            },
            update: { contributions: c.contributions },
            create: {
              repo_id: BigInt(repoId),
              user_login: c.login,
              contributions: c.contributions,
            },
          });
        })
      );
    });

    console.log(
      `✅ Synced ${contributorsData.length} contributors for ${owner}/${name}`
    );

    return {
      totalContributors: contributorsData.length,
      repoId,
      message: `Contributors for ${owner}/${name} updated successfully`,
    };
  }
);

export const syncIssues = inngest.createFunction(
  { id: "sync-issues" },
  { event: "repo/sync.issues" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubAccessToken) throw new Error("GitHub token not configured");

    // 1️⃣ Ensure repo exists and safely extract repoId
    const repo = await step.run("Ensure repo", async () => {
      const ensured = await prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
        select: { id: true },
      });

      if (!ensured?.id) throw new Error("❌ Repo ID missing after upsert");

      // ✅ Cast BigInt → Number for Inngest-safe serialization
      return { id: Number(ensured.id) };
    });

    const repoId = repo.id;
    if (!repoId) throw new Error("❌ Repo ID missing after upsert (post-cast)");

    // 2️⃣ Fetch open issues from GitHub
    const issuesData = await step.run("Fetch GitHub issues", async () => {
      const res = await fetch(
        `https://api.github.com/search/issues?q=repo:${owner}/${name}+is:issue+is:open&sort=created&order=desc&per_page=50`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();
      return data.items || [];
    });

    // 3️⃣ Upsert each issue into DB
    await step.run("Upsert issues", async () => {
      await Promise.all(
        issuesData.map((i: any) =>
          prisma.issue.upsert({
            where: {
              repo_id_issue_number: {
                repo_id: BigInt(repoId), // ✅ match schema
                issue_number: i.number,
              },
            },
            update: {
              title: i.title,
              state: i.state,
              updated_at: new Date(i.updated_at),
              closed_at: i.closed_at ? new Date(i.closed_at) : null,
            },
            create: {
              repo_id: BigInt(repoId),
              issue_number: i.number,
              title: i.title,
              state: i.state,
              created_at: new Date(i.created_at),
              updated_at: new Date(i.updated_at),
              closed_at: i.closed_at ? new Date(i.closed_at) : null,
              author_login: i.user?.login || null,
            },
          })
        )
      );
    });

    console.log(`✅ Synced ${issuesData.length} issues for ${owner}/${name}`);

    return {
      totalFetched: issuesData.length,
      repoId,
      message: `Issues for ${owner}/${name} synced successfully.`,
    };
  }
);

export const syncLanguages = inngest.createFunction(
  { id: "sync-languages" },
  { event: "repo/sync.languages" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubAccessToken) throw new Error("GitHub token not configured");

    // 1️⃣ Ensure repo exists
    const repo = await step.run("Ensure repo", async () =>
      prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
      })
    );

    // 2️⃣ Fetch languages from GitHub
    const languagesData = await step.run("Fetch GitHub languages", async () => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${name}/languages`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data: Record<string, number> = await res.json();
      return data; // e.g., { "TypeScript": 1200, "JavaScript": 800 }
    });

    // 3️⃣ Upsert languages into DB
    await step.run("Upsert languages", async () => {
      const ops = Object.entries(languagesData).map(([language, bytes]) =>
        prisma.repoLanguage.upsert({
          where: { repo_id_language: { repo_id: repo.id, language } },
          update: { bytes_of_code: BigInt(bytes) },
          create: { repo_id: repo.id, language, bytes_of_code: BigInt(bytes) },
        })
      );
      await Promise.all(ops);
    });

    return { totalLanguages: Object.keys(languagesData).length };
  }
);

export const syncParticipation = inngest.createFunction(
  { id: "sync-participation" },
  { event: "repo/sync.participation" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubAccessToken) throw new Error("GitHub token not configured");

    // 1️⃣ Ensure repo exists
    const repo = await step.run("Ensure repo", async () =>
      prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
      })
    );

    // 2️⃣ Fetch participation stats from GitHub
    const data = await step.run("Fetch GitHub participation", async () => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${name}/stats/participation`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
      );

      if (res.status === 202) {
        throw new Error(
          "GitHub is generating participation stats. Retry later."
        );
      }

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }

      return res.json();
    });

    const allCommits: number[] = Array.isArray((data as any).all)
      ? (data as any).all
      : [];
    const ownerCommits: number[] = Array.isArray((data as any).owner)
      ? (data as any).owner
      : [];

    const now = new Date();
    const startYear = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year

    // 3️⃣ Upsert weekly participation stats
    await step.run("Upsert participation stats", async () => {
      const ops = allCommits.map((commits, i) => {
        const weekStart = new Date(startYear);
        weekStart.setDate(startYear.getDate() + i * 7);

        return prisma.participationStats.upsert({
          where: {
            repo_id_week_start: { repo_id: repo.id, week_start: weekStart },
          },
          update: { all_commits: commits, owner_commits: ownerCommits[i] || 0 },
          create: {
            repo_id: repo.id,
            week_start: weekStart,
            all_commits: commits,
            owner_commits: ownerCommits[i] || 0,
          },
        });
      });

      await Promise.all(ops);
    });

    return { totalWeeks: allCommits.length };
  }
);

export const syncPulls = inngest.createFunction(
  { id: "sync-pulls" },
  { event: "repo/sync.pulls" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubAccessToken) throw new Error("GitHub token not configured");

    // 1️⃣ Ensure repo exists — return ID as string for safe serialization
    const repoIdStr = await step.run("Ensure Repo (string id)", async () => {
      const repo = await prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
        select: { id: true },
      });
      return repo.id.toString(); // BigInt → string (safe for Inngest serialization)
    });

    if (!repoIdStr || typeof repoIdStr !== "string") {
      throw new Error(
        `Failed to ensure repo id for ${owner}/${name}: invalid repoIdStr: ${String(
          repoIdStr
        )}`
      );
    }

    const repoId = BigInt(repoIdStr);
    console.log(`✅ Ensured Repo ID: ${repoId} for ${owner}/${name}`);

    // 2️⃣ Fetch PRs from GitHub
    const prsData = await step.run("Fetch GitHub PRs", async () => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${name}/pulls?state=all&per_page=50`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `GitHub API error: ${res.status} - ${res.statusText} ${
            text ? "- " + text : ""
          }`
        );
      }
      return res.json();
    });

    if (!Array.isArray(prsData)) {
      throw new Error(
        `Unexpected PRs payload for ${owner}/${name}: ${typeof prsData}`
      );
    }

    // 3️⃣ Upsert PRs into DB — all dates are correctly typed
    await step.run("Upsert PRs", async () => {
      for (const pr of prsData) {
        const prNumber =
          typeof pr.number === "number" ? pr.number : parseInt(pr.number);
        if (!Number.isFinite(prNumber)) continue;

        await prisma.pull.upsert({
          where: {
            repo_id_pr_number: {
              repo_id: repoId,
              pr_number: prNumber,
            },
          },
          update: {
            title: pr.title ?? "",
            state: pr.state ?? "unknown",
            updated_at: pr.updated_at ? new Date(pr.updated_at) : new Date(),
            closed_at: pr.closed_at ? new Date(pr.closed_at) : undefined, // ✅ Prisma expects undefined, not null
            merged_at: pr.merged_at ? new Date(pr.merged_at) : undefined,
            author_login: pr.user?.login ?? null,
          },
          create: {
            repo_id: repoId,
            pr_number: prNumber,
            title: pr.title ?? "",
            state: pr.state ?? "unknown",
            created_at: pr.created_at ? new Date(pr.created_at) : new Date(),
            updated_at: pr.updated_at ? new Date(pr.updated_at) : new Date(),
            closed_at: pr.closed_at ? new Date(pr.closed_at) : undefined,
            merged_at: pr.merged_at ? new Date(pr.merged_at) : undefined,
            author_login: pr.user?.login ?? null,
          },
        });
      }
    });

    console.log(
      `✅ Synced ${prsData.length} PRs for ${owner}/${name} (Repo ID: ${repoId})`
    );

    return {
      totalPRs: prsData.length,
      repo_id: repoId.toString(), // return as string to avoid BigInt serialization issues
    };
  }
);

// ---------------- Helper: BigInt-safe JSON serializer ----------------
function safeJson<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export const syncReleases = inngest.createFunction(
  { id: "sync-releases" },
  { event: "repo/sync.releases" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubAccessToken) throw new Error("GitHub token not configured");

    // ---------------------------------------------------------------
    // 1️⃣ Ensure repo exists and safely return ID
    // ---------------------------------------------------------------
    const repo = await step.run("Ensure repo", async () => {
      // Try to find repo first
      const found = await prisma.repo.findUnique({
        where: { owner_name: { owner, name } },
        select: { id: true },
      });

      if (found?.id) {
        console.log(`🔁 Found existing repo: ${owner}/${name} (ID: ${found.id})`);
        return safeJson(found); // convert BigInt to string
      }

      // Create if missing
      const created = await prisma.repo.create({
        data: { owner, name },
        select: { id: true },
      });

      console.log(`🆕 Created new repo: ${owner}/${name} (ID: ${created.id})`);
      return safeJson(created);
    });

    if (!repo?.id) {
      console.error("❌ Repo ID missing — upsert failed. Repo object:", repo);
      throw new Error("Repo ID missing — upsert failed");
    }

    // Normalize repoId safely
    const repoId = BigInt(repo.id);
    console.log(`✅ Ensured Repo ID: ${repoId} for ${owner}/${name}`);

    // ---------------------------------------------------------------
    // 2️⃣ Fetch releases from GitHub
    // ---------------------------------------------------------------
    const releasesData = await step.run("Fetch GitHub releases", async () => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${name}/releases?per_page=50`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
      );

      if (!res.ok) {
        const msg = `GitHub API error: ${res.status} - ${res.statusText}`;
        console.error(msg);
        throw new Error(msg);
      }

      const json = await res.json();
      return Array.isArray(json) ? json : [];
    });

    if (!releasesData.length) {
      console.log(`⚠️ No releases found for ${owner}/${name}`);
      return { message: "No releases found for this repository" };
    }

    // ---------------------------------------------------------------
    // 3️⃣ Upsert releases into DB
    // ---------------------------------------------------------------
    await step.run("Upsert releases", async () => {
      const ops = releasesData.map((r: any) => {
        const createdAt = r.created_at ? new Date(r.created_at) : new Date();
        const publishedAt = r.published_at ? new Date(r.published_at) : new Date();

        return prisma.release.upsert({
          where: { release_id: BigInt(r.id) },
          update: {
            tag_name: r.tag_name ?? "untagged",
            name: r.name ?? r.tag_name ?? "Unnamed Release",
            html_url: r.html_url ?? "",
            created_at: createdAt,
            published_at: publishedAt,
          },
          create: {
            release_id: BigInt(r.id),
            tag_name: r.tag_name ?? "untagged",
            name: r.name ?? r.tag_name ?? "Unnamed Release",
            html_url: r.html_url ?? "",
            created_at: createdAt,
            published_at: publishedAt,
            repo_id: repoId, // ✅ safe BigInt
          },
        });
      });

      await Promise.all(ops);
      console.log(`💾 Upserted ${ops.length} releases for ${owner}/${name}`);
    });

    // ---------------------------------------------------------------
    // 4️⃣ Final summary
    // ---------------------------------------------------------------
    console.log(
      `✅ Synced ${releasesData.length} releases for ${owner}/${name} (Repo ID: ${repoId})`
    );

    return {
      status: "ok",
      totalSaved: releasesData.length,
      repo_id: repoId.toString(),
    };
  }
);



export const syncWeeklyCommits = inngest.createFunction(
  { id: "sync-weekly-commits" },
  { event: "repo/sync.weeklyCommits" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubAccessToken) throw new Error("GitHub token not configured");

    // 1️⃣ Ensure repo exists in DB
    // Ensure repo exists and get id
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {},
      create: { owner, name },
      select: { id: true }, // <-- ensures repo.id is defined
    });

    // 2️⃣ Fetch weekly commits from GitHub
    const commitsData: { week: number; total: number }[] = await step.run(
      "Fetch GitHub weekly commits",
      async () => {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}/stats/commit_activity`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${githubAccessToken}`,
            },
          }
        );

        if (res.status === 202)
          throw new Error("GitHub stats are being generated, try again later.");
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

        return res.json();
      }
    );

    // 3️⃣ Upsert weekly commits into DB
    await step.run("Upsert weekly commits", async () => {
      const ops = commitsData.map((week) =>
        prisma.weeklyCommit.upsert({
          where: {
            repo_id_week: {
              repo_id: repo.id,
              week: new Date(week.week * 1000), // Convert Unix timestamp to Date
            },
          },
          update: { total: week.total },
          create: {
            repo_id: repo.id,
            week: new Date(week.week * 1000),
            total: week.total,
          },
        })
      );
      await Promise.all(ops);
    });

    // 4️⃣ Return safe result for frontend
    return {
      totalWeeks: commitsData.length,
      repoId: repo.id,
    };
  }
);
