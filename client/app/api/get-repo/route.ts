import { NextResponse } from "next/server";

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
  // if no pagination, only 1 page
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
    // Fetch main repo data
    const repoRes = await fetch(`https://api.github.com/repos/${repoUrl}`, {
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

    // Fetch branch count
    const branchCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${repoUrl}/branches`,
      githubAccessToken
    );

    // Fetch tag count
    const tagCount = await getCountFromPaginatedApi(
      `https://api.github.com/repos/${repoUrl}/tags`,
      githubAccessToken
    );

    // Fetch open PR count via Search API
    const prSearchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${repoUrl}+is:pr+is:open&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
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

    // Fetch last commit date
    let lastCommitDate = null;
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoUrl}/commits?per_page=1`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubAccessToken}`,
          },
        }
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

    // Compose enhanced repo info
    const enhancedRepoData = {
      ...repoData,
      branch_count: branchCount,
      tag_count: tagCount,
      open_prs_count: openPrsCount,
      last_commit: lastCommitDate,
    };

    return NextResponse.json(enhancedRepoData);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
