import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";

async function getCountFromPaginatedApi(url: string, token: string) {
  const res = await fetch(url + "?per_page=1", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${url}`);
  const linkHeader = res.headers.get("link");
  if (linkHeader) {
    const match = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
    if (match) return Number(match[1]);
  }
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

export const fetchRepoData = inngest.createFunction(
  { id: "fetch-repo-data" },
  { event: "repo/fetch" },
  async ({ event, step }) => {
    const { owner, name } = event.data;
    const token = process.env.GITHUB_ACCESS_TOKEN;
    if (!token) throw new Error("GitHub token missing");

    // Step 1: Fetch repo info
    const repoData = await step.run("Fetch Repo Metadata", async () => {
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Repo not found: ${owner}/${name}`);
      return res.json();
    });

    // Step 2: Fetch branch/tag counts
    const [branchCount, tagCount] = await Promise.all([
      getCountFromPaginatedApi(`https://api.github.com/repos/${owner}/${name}/branches`, token),
      getCountFromPaginatedApi(`https://api.github.com/repos/${owner}/${name}/tags`, token),
    ]);

    // Step 3: Fetch PR & issues
    const [prs, issues] = await Promise.all([
      fetch(`https://api.github.com/search/issues?q=repo:${owner}/${name}+is:pr+is:open`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`https://api.github.com/search/issues?q=repo:${owner}/${name}+is:issue+is:open`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ]);

    const open_prs_count = prs.total_count ?? 0;
    const open_issues_count = issues.total_count ?? 0;

    // Step 4: Upsert into DB
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {
        description: repoData.description,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        open_prs_count,
        open_issues_count,
        branch_count: branchCount,
        tag_count: tagCount,
        updated_at: new Date(repoData.updated_at),
      },
      create: {
        owner,
        name,
        description: repoData.description,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        open_prs_count,
        open_issues_count,
        branch_count: branchCount,
        tag_count: tagCount,
        created_at: new Date(repoData.created_at),
        updated_at: new Date(repoData.updated_at),
      },
    });

    return { message: `Repo ${owner}/${name} updated`, repoId: repo.id };
  }
);

async function fetchCommitsFromGitHub(owner: string, name: string, repoId: bigint | number) {
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

export const fetchContributors = inngest.createFunction(
  { id: "fetch-contributors" },
  { event: "repo/fetch.contributors" },
  async ({ event, step }) => {
    const { owner, name, githubAccessToken } = event.data;

    // Ensure repo exists
    const repo = await step.run("Ensure repo", async () =>
      prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
      })
    );

    // Fetch contributors
    const contributorsData = await step.run("Fetch GitHub contributors", async () => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${name}/contributors?per_page=100`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
      );
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      return res.json();
    });

    // Upsert each contributor
    await step.run("Upsert contributors", async () => {
      for (const c of contributorsData) {
        await prisma.ghUser.upsert({
          where: { login: c.login },
          update: { avatar_url: c.avatar_url, type: c.type },
          create: { login: c.login, avatar_url: c.avatar_url, type: c.type },
        });

        await prisma.contributorRank.upsert({
          where: { repo_id_user_login: { repo_id: repo.id, user_login: c.login } },
          update: { contributions: c.contributions },
          create: {
            repo_id: repo.id,
            user_login: c.login,
            contributions: c.contributions,
          },
        });
      }
    });

    return {
      totalContributors: contributorsData.length,
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

    // 1️⃣ Ensure repo exists
    const repo = await step.run("Ensure repo", async () =>
      prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
      })
    );

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
      for (const i of issuesData) {
        await prisma.issue.upsert({
          where: {
            repo_id_issue_number: { repo_id: repo.id, issue_number: i.number },
          },
          update: {
            title: i.title,
            state: i.state,
            updated_at: new Date(i.updated_at),
            closed_at: i.closed_at ? new Date(i.closed_at) : null,
          },
          create: {
            repo_id: repo.id,
            issue_number: i.number,
            title: i.title,
            state: i.state,
            created_at: new Date(i.created_at),
            updated_at: new Date(i.updated_at),
            closed_at: i.closed_at ? new Date(i.closed_at) : null,
            author_login: i.user?.login || null,
          },
        });
      }
    });

    return { totalFetched: issuesData.length };
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
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}/languages`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      });

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

    // 1️⃣ Ensure repo exists
    const repo = await step.run("Ensure repo", async () =>
      prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {},
        create: { owner, name },
      })
    );

    // 2️⃣ Fetch PRs from GitHub (latest 50)
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

      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      return res.json();
    });

    // 3️⃣ Upsert PRs into DB
    await step.run("Upsert PRs", async () => {
      const ops = prsData.map((pr: any) =>
        prisma.pull.upsert({
          where: { repo_id_pr_number: { repo_id: repo.id, pr_number: pr.number } },
          update: {
            title: pr.title,
            state: pr.state,
            updated_at: pr.updated_at ? new Date(pr.updated_at) : new Date(),
            closed_at: pr.closed_at ? new Date(pr.closed_at) : null,
            merged_at: pr.merged_at ? new Date(pr.merged_at) : null,
            author_login: pr.user?.login || null,
          },
          create: {
            repo_id: repo.id,
            pr_number: pr.number,
            title: pr.title,
            state: pr.state,
            created_at: new Date(pr.created_at),
            updated_at: new Date(pr.updated_at),
            closed_at: pr.closed_at ? new Date(pr.closed_at) : null,
            merged_at: pr.merged_at ? new Date(pr.merged_at) : null,
            author_login: pr.user?.login || null,
          },
        })
      );
      await Promise.all(ops);
    });

    return { totalSaved: prsData.length };
  }
);

export const syncReleases = inngest.createFunction(
  { id: "sync-releases" },
  { event: "repo/sync.releases" },
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

    // 2️⃣ Fetch releases from GitHub
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

      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      return res.json();
    });

    if (!Array.isArray(releasesData) || releasesData.length === 0) {
      return { message: "No releases found for this repository" };
    }

    // 3️⃣ Upsert releases into DB
    await step.run("Upsert releases", async () => {
      const ops = releasesData.map((release: any) =>
        prisma.release.upsert({
          where: { release_id: release.id },
          update: {
            tag_name: release.tag_name,
            name: release.name,
            html_url: release.html_url,
            created_at: release.created_at ? new Date(release.created_at) : null,
            published_at: release.published_at ? new Date(release.published_at) : null,
          },
          create: {
            release_id: release.id,
            tag_name: release.tag_name,
            name: release.name,
            html_url: release.html_url,
            created_at: release.created_at ? new Date(release.created_at) : null,
            published_at: release.published_at ? new Date(release.published_at) : null,
            repo_id: repo.id,
          },
        })
      );
      await Promise.all(ops);
    });

    return { totalSaved: releasesData.length };
  }
);

export const syncWeeklyCommits = inngest.createFunction(
  { id: "sync-weekly-commits" },
  { event: "repo/sync.weeklyCommits" },
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

    // 2️⃣ Fetch weekly commits from GitHub
    const commitsData = await step.run("Fetch GitHub weekly commits", async () => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${name}/stats/commit_activity`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
      );

      if (res.status === 202) throw new Error("GitHub stats are being generated, try again later.");
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

      return res.json();
    });

    // 3️⃣ Upsert weekly commits into DB
    await step.run("Upsert weekly commits", async () => {
      const ops = commitsData.map((week: any) =>
        prisma.weeklyCommit.upsert({
          where: { repo_id_week: { repo_id: repo.id, week: new Date(week.week * 1000) } },
          update: { total: week.total },
          create: { repo_id: repo.id, week: new Date(week.week * 1000), total: week.total },
        })
      );
      await Promise.all(ops);
    });

    return { totalWeeks: commitsData.length };
  }
);