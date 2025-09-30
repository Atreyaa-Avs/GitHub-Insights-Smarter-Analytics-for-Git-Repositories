import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper to get total count from paginated API
async function getCountFromPaginatedApi(url: string, token: string) {
  const res = await fetch(url + "?per_page=1", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API error at ${url}, status ${res.status}`);
  }
  const linkHeader = res.headers.get("link");
  if (linkHeader) {
    const lastPageMatch = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
    if (lastPageMatch) {
      return Number(lastPageMatch[1]);
    }
  }
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

// ------------------- BigInt-safe JSON helper -------------------
function safeJSON(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value))
  );
}

// ------------------- GET: fetch repo from DB -------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (owner/repo)" },
      { status: 400 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
      include: { commits: true },
    });

    if (!repo) {
      // Fallback to POST logic to fetch & insert
      return POST(request);
    }

    // Return BigInt-safe JSON
    return NextResponse.json(safeJSON(repo));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch from GitHub & upsert into DB -------------------
export async function POST(request: NextRequest) {
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

  const [owner, name] = repoUrl.split("/");

  try {
    // Fetch main repo details
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
      },
    });

    if (!repoRes.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching repo details" },
        { status: repoRes.status }
      );
    }

    const repoData = await repoRes.json();

    // Fetch branch and tag counts
    const branchCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${owner}/${name}/branches`,
      githubAccessToken
    );

    const tagCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${owner}/${name}/tags`,
      githubAccessToken
    );

    // Fetch open PR count via Search API
    const prSearchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+is:pr+is:open&per_page=1`,
      { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${githubAccessToken}` } }
    );
    const prSearchData = await prSearchRes.json();
    const openPrsCount = prSearchData.total_count ?? 0;

    // Fetch open issues count via Search API
    const issuesSearchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+is:issue+is:open&per_page=1`,
      { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${githubAccessToken}` } }
    );
    const issuesSearchData = await issuesSearchRes.json();
    const openIssuesCount = issuesSearchData.total_count ?? 0;

    // Fetch last commit date
    let lastCommitDate: string | null = null;
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${name}/commits?per_page=1`,
        { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${githubAccessToken}` } }
      );
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        if (Array.isArray(commitData) && commitData.length > 0) {
          lastCommitDate = commitData[0].commit?.committer?.date || null;
        }
      }
    } catch {
      lastCommitDate = null;
    }

    // Upsert into Prisma Repo table
    const repo = await prisma.repo.upsert({
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

    // Return BigInt-safe JSON only
    return NextResponse.json(safeJSON({ message: "Repo data saved successfully", repo }));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
