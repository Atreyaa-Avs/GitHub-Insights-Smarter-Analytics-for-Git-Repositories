import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
  }

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch per_page=1 to get total commits via Link header
    const countResponse = await fetch(
      `https://api.github.com/repos/${repoUrl}/commits?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!countResponse.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching commit count" },
        { status: countResponse.status }
      );
    }

    let totalCommits = 1; // default fallback
    const linkHeader = countResponse.headers.get("link");
    if (linkHeader) {
      const match = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
      if (match) {
        totalCommits = Number(match[1]);
      }
    }

    // Fetch top 5 recent commits
    const recentResponse = await fetch(
      `https://api.github.com/repos/${repoUrl}/commits?per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!recentResponse.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching recent commits" },
        { status: recentResponse.status }
      );
    }

    const recentCommits = await recentResponse.json();

    // Return total commits and recent commits
    return NextResponse.json({ totalCommits, recentCommits });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
