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
    const response = await fetch(
      `https://api.github.com/repos/${repoUrl}/stats/commit_activity`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    // 202 means data is being generated
    if (response.status === 202) {
      return NextResponse.json(
        { message: "Weekly commit activity is being generated. Please wait..." },
        { status: 202 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitHub API error: status ${response.status}` },
        { status: response.status }
      );
    }

    // The data contains objects: {week: 12345678, total: 12, days: [...]}
    const data = await response.json();

    // Map into weekly totals and dates for the frontend chart
    const weeklyData = data.map((weekEntry: any) => ({
      week: new Date(weekEntry.week * 1000).toLocaleDateString(),
      total: weekEntry.total,
    }));

    return NextResponse.json(weeklyData);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
