import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");
  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
  }

  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch the latest 5 open issues (NOT PRs) and accurate count
    const searchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${repoUrl}+is:issue+is:open&sort=created&order=desc&per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );
    const searchData = await searchRes.json();
    const totalCount = searchData.total_count;
    const issues = searchData.items; // already only issues, latest first

    return NextResponse.json({ totalCount, issues });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
