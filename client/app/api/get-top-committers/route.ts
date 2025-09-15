// /app/api/get-top-committers/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl required (owner/repo)" },
      { status: 422 }
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
    // Gets contributors sorted by commits (GitHub returns max 100 per page)
    const response = await fetch(
      `https://api.github.com/repos/${repoUrl}/contributors?per_page=10`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitHub API error: status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Only pick login and contributions
    const contributorData = data.map((c: any) => ({
      login: c.login,
      contributions: c.contributions,
      avatar_url: c.avatar_url, // Optional: for future enhancements
    }));

    return NextResponse.json(contributorData);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
