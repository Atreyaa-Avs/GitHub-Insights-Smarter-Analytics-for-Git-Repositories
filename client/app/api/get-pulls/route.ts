// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const repoUrl = searchParams.get("repoUrl");

//   if (!repoUrl) {
//     return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
//   }

//   const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;

//   if (!githubAccessToken) {
//     return NextResponse.json(
//       { error: "GitHub token not configured" },
//       { status: 500 }
//     );
//   }

//   try {
//     const response = await fetch(
//       `https://api.github.com/repos/${repoUrl}/pulls?state=all&per_page=5`,
//       {
//         headers: {
//           Accept: "application/vnd.github+json",
//           Authorization: `Bearer ${githubAccessToken}`,
//         },
//       }
//     );

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: "GitHub API error" },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();

//     // Extract total count from Link header if available
//     let totalCount = data.length; // default fallback
//     const linkHeader = response.headers.get("link");
//     if (linkHeader) {
//       const lastPageMatch = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
//       if (lastPageMatch) {
//         const lastPage = Number(lastPageMatch[1]);
//         // GitHub pagination max per_page is 100
//         totalCount = lastPage * 5;
//       }
//     }

//     return NextResponse.json({ totalCount, pulls: data });
//   } catch (error) {
//     console.error("Fetch error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

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
    // 1. Accurate PR count from Search API
    const prSearchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${repoUrl}+is:pr+is:open&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );
    const prSearchData = await prSearchRes.json();
    const totalCount = prSearchData.total_count;

    // 2. The first 5 open PRs
    const prsRes = await fetch(
      `https://api.github.com/repos/${repoUrl}/pulls?state=open&per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );
    const pulls = await prsRes.json();

    return NextResponse.json({ totalCount, pulls });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
