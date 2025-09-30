// // /app/api/get-top-committers/route.ts
// import { prisma } from "@/utils/prisma";
// import { NextRequest, NextResponse } from "next/server";

// // ------------------- GET: fetch top committers from DB -------------------
// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

//   if (!repoUrl || !repoUrl.includes("/")) {
//     return NextResponse.json(
//       { error: "Valid repoUrl required (owner/repo)" },
//       { status: 422 }
//     );
//   }

//   const [owner, name] = repoUrl.split("/");

//   try {
//     const repo = await prisma.repo.findUnique({
//       where: { owner_name: { owner, name } },
//     });

//     if (!repo) {
//       return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
//     }

//     const topCommitters = await prisma.contributorRank.findMany({
//       where: { repo_id: repo.id },
//       orderBy: { contributions: "desc" },
//       take: 10,
//       include: { user: true }, // include GhUser details
//     });

//     return NextResponse.json(topCommitters);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }

// // ------------------- POST: fetch top committers from GitHub & save to DB -------------------
// export async function POST(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

//   if (!repoUrl || !repoUrl.includes("/")) {
//     return NextResponse.json(
//       { error: "Valid repoUrl required (owner/repo)" },
//       { status: 422 }
//     );
//   }

//   const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
//   if (!githubAccessToken) {
//     return NextResponse.json(
//       { error: "GitHub token not configured" },
//       { status: 500 }
//     );
//   }

//   const [owner, name] = repoUrl.split("/");

//   try {
//     const repo = await prisma.repo.findUnique({
//       where: { owner_name: { owner, name } },
//     });

//     if (!repo) {
//       return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
//     }

//     // Fetch top contributors from GitHub
//     const response = await fetch(
//       `https://api.github.com/repos/${owner}/${name}/contributors?per_page=10`,
//       {
//         headers: {
//           Accept: "application/vnd.github+json",
//           Authorization: `Bearer ${githubAccessToken}`,
//         },
//       }
//     );

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: `GitHub API error: status ${response.status}` },
//         { status: response.status }
//       );
//     }

//     const contributors = await response.json();

//     // Upsert contributors into DB
//     for (const c of contributors) {
//       // First ensure GhUser exists
//       await prisma.ghUser.upsert({
//         where: { login: c.login },
//         update: { avatar_url: c.avatar_url },
//         create: { login: c.login, avatar_url: c.avatar_url },
//       });

//       // Then upsert ContributorRank
//       await prisma.contributorRank.upsert({
//         where: { repo_id_user_login: { repo_id: repo.id, user_login: c.login } },
//         update: { contributions: c.contributions },
//         create: {
//           repo_id: repo.id,
//           user_login: c.login,
//           contributions: c.contributions,
//         },
//       });
//     }

//     return NextResponse.json({ message: "Top committers saved successfully" });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }
