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
    // 1. Get total release count using pagination
    const countRes = await fetch(
      `https://api.github.com/repos/${repoUrl}/releases?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    let totalCount = 1; // fallback to 1 if only one release
    const linkHeader = countRes.headers.get("link");
    if (linkHeader) {
      const lastPageMatch = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
      if (lastPageMatch) {
        totalCount = Number(lastPageMatch[1]);
      }
    }

    // 2. Get the 5 latest releases
    const releasesRes = await fetch(
      `https://api.github.com/repos/${repoUrl}/releases?per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );
    const releases = await releasesRes.json();

    return NextResponse.json({ totalCount, releases });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
