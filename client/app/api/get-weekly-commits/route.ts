import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl required (owner/repo)" }, { status: 422 }
    );
  }

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" }, { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoUrl}/stats/commit_activity`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`
        },
      }
    );

    if (response.status === 202) {
      return NextResponse.json(
        { message: "Weekly commit statistics are being generated. Try again shortly." },
        { status: 202 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitHub API error: status ${response.status}` },
        { status: response.status }
      );
    }

    // Map to week label and commit total
    const data = await response.json();
    const weekly = data.map((entry: any) => ({
      week: new Date(entry.week * 1000).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }), // eg "13 Apr, 2025"
      total: entry.total
    }));

    return NextResponse.json(weekly);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, { status: 500 }
    );
  }
}
