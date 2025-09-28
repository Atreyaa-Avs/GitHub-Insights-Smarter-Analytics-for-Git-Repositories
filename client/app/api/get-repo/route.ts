// app/api/get-repo/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Existing helper unchanged
async function getCountFromPaginatedApi(url: string, token: string) {
  const res = await fetch(url + "?per_page=1", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "nextjs-app",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API error at ${url}, status ${res.status}`);
  }
  const linkHeader = res.headers.get("link");
  if (linkHeader) {
    const lastPageMatch = linkHeader.match(/[\?&]page=(\d+)>;\s*rel="last"/);
    if (lastPageMatch) {
      return Number(lastPageMatch[1]);
    }
  }
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (owner/repo)" },
      { status: 400 }
    );
  }

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    // 1) Fetch main repo data (unchanged)
    const repoRes = await fetch(`https://api.github.com/repos/${repoUrl}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
        "User-Agent": "nextjs-app",
      },
    });
    if (!repoRes.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching repo details" },
        { status: repoRes.status }
      );
    }
    const repoData = await repoRes.json();

    // 2) Counts
    const branchCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${repoUrl}/branches`,
      githubAccessToken
    );
    const tagCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${repoUrl}/tags`,
      githubAccessToken
    );

    // 3) Open PR count via Search API
    const prSearchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${repoUrl}+is:pr+is:open&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
          "User-Agent": "nextjs-app",
        },
      }
    );
    if (!prSearchRes.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching open PR count" },
        { status: prSearchRes.status }
      );
    }
    const prSearchData = await prSearchRes.json();
    const openPrsCount = prSearchData.total_count;

    // 4) Last commit date
    let lastCommitDate: string | null = null;
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoUrl}/commits?per_page=1`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
            "User-Agent": "nextjs-app",
          },
        }
      );
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        if (Array.isArray(commitData) && commitData.length > 0) {
          lastCommitDate = commitData[0]?.commit?.committer?.date || null;
        }
      }
    } catch {
      lastCommitDate = null;
    }

    // 5) Compose enhanced repo info (unchanged)
    const enhancedRepoData = {
      ...repoData,
      branch_count: branchCount,
      tag_count: tagCount,
      open_prs_count: openPrsCount,
      last_commit: lastCommitDate,
    };

    // 6) Persist to DB (new)
    try {
      const [owner, name] = repoUrl.split("/");
      const topics: string[] = Array.isArray(repoData.topics) ? repoData.topics : [];
      const license_name: string | null = repoData.license?.name ?? null;

      // Requires @@unique([owner, name], name: "owner_name") on Repo model
      const repoRow = await prisma.repo.upsert({
        where: { owner_name: { owner, name } },
        update: {
          description: repoData.description ?? null,
          visibility: repoData.visibility ?? null,
          default_branch: repoData.default_branch ?? null,
          created_at: repoData.created_at ? new Date(repoData.created_at) : null,
          updated_at: repoData.updated_at ? new Date(repoData.updated_at) : null,
          pushed_at: repoData.pushed_at ? new Date(repoData.pushed_at) : null,

          stargazers_count: repoData.stargazers_count ?? 0,
          watchers_count: repoData.watchers_count ?? 0,
          subscribers_count: repoData.subscribers_count ?? 0,
          forks_count: repoData.forks_count ?? 0,

          branch_count: branchCount,
          tag_count: tagCount,
          open_prs_count: openPrsCount,
          open_issues_count: repoData.open_issues_count ?? 0,
          size_kb: repoData.size ?? 0,
          language: repoData.language ?? null,
          license_name,
          homepage: repoData.homepage ?? null,
          topics,
          last_commit: lastCommitDate ? new Date(lastCommitDate) : null,
        },
        create: {
          owner,
          name,
          description: repoData.description ?? null,
          visibility: repoData.visibility ?? null,
          default_branch: repoData.default_branch ?? null,
          created_at: repoData.created_at ? new Date(repoData.created_at) : null,
          updated_at: repoData.updated_at ? new Date(repoData.updated_at) : null,
          pushed_at: repoData.pushed_at ? new Date(repoData.pushed_at) : null,

          stargazers_count: repoData.stargazers_count ?? 0,
          watchers_count: repoData.watchers_count ?? 0,
          subscribers_count: repoData.subscribers_count ?? 0,
          forks_count: repoData.forks_count ?? 0,

          branch_count: branchCount,
          tag_count: tagCount,
          open_prs_count: openPrsCount,
          open_issues_count: repoData.open_issues_count ?? 0,
          size_kb: repoData.size ?? 0,
          language: repoData.language ?? null,
          license_name,
          homepage: repoData.homepage ?? null,
          topics,
          last_commit: lastCommitDate ? new Date(lastCommitDate) : null,
        },
      });

      // Optional: persist latest commit + users for Overview sync
      try {
        const recentRes = await fetch(
          `https://api.github.com/repos/${repoUrl}/commits?per_page=1`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${githubAccessToken}`,
              "User-Agent": "nextjs-app",
            },
          }
        );
        if (recentRes.ok) {
          const arr = (await recentRes.json()) as any[];
          const c = arr?.[0];
          if (c?.sha) {
            const author_login = c.author?.login ?? null;
            const committer_login = c.committer?.login ?? null;

            if (author_login) {
              await prisma.ghUser.upsert({
                where: { login: author_login },
                update: {
                  avatar_url: c.author?.avatar_url ?? undefined,
                  type: c.author?.type ?? undefined,
                },
                create: {
                  login: author_login,
                  avatar_url: c.author?.avatar_url ?? null,
                  type: c.author?.type ?? null,
                },
              });
            }
            if (committer_login) {
              await prisma.ghUser.upsert({
                where: { login: committer_login },
                update: {
                  avatar_url: c.committer?.avatar_url ?? undefined,
                  type: c.committer?.type ?? undefined,
                },
                create: {
                  login: committer_login,
                  avatar_url: c.committer?.avatar_url ?? null,
                  type: c.committer?.type ?? null,
                },
              });
            }

            const committed_at =
              c.commit?.author?.date
                ? new Date(c.commit.author.date)
                : c.commit?.committer?.date
                ? new Date(c.commit.committer.date)
                : null;

            await prisma.commit.upsert({
              where: { sha: c.sha },
              update: {
                message: c.commit?.message ?? null,
                committed_at,
                repo_id: repoRow.id,
                author_login: author_login ?? null,
                committer_login: committer_login ?? null,
              },
              create: {
                sha: c.sha,
                message: c.commit?.message ?? null,
                committed_at,
                repo_id: repoRow.id,
                author_login: author_login ?? null,
                committer_login: committer_login ?? null,
              },
            });
          }
        }
      } catch {
        // non-fatal
      }
    } catch (dbErr) {
      console.error("DB persist error:", dbErr);
      // Do not fail the response
    }

    // 7) Return unchanged payload for the frontend
    return NextResponse.json(enhancedRepoData);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
