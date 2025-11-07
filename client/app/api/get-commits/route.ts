import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------- Normalize commit for frontend ----------------
function normalizeCommit(c: any) {
  return {
    sha: c.sha,
    message: c.message || "No message",
    committed_at:
      typeof c.committed_at === "string"
        ? c.committed_at
        : c.committed_at?.toISOString() || new Date().toISOString(),
    author: { name: c.author_login || "Unknown" },
    committer: { name: c.committer_login || "Unknown" },
  };
}

// ---------------- Main GET Handler ----------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl)
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });

  const [owner, name] = repoUrl.split("/");
  if (!owner || !name)
    return NextResponse.json({ error: "Invalid repoUrl format" }, { status: 400 });

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken)
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });

  try {
    // Try fetching repo from DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // If repo not found → trigger background sync
    if (!repo) {
      console.log(`GET: Repo not found for ${owner}/${name}, triggering Inngest sync`);
      await inngest.send({
        name: "repo/sync.commits",
        data: { owner, name },
      }); 
      return NextResponse.json({
        status: "queued",
        message: `Commit sync started for ${owner}/${name}`,
      });
    }

    // Try fetching recent commits from DB
    const commitsFromDb = await prisma.commit.findMany({
      where: { repo_id: repo.id },
      orderBy: { committed_at: "desc" },
      take: 50,
    });

    // If no commits in DB → trigger background sync
    if (!commitsFromDb.length) {
      console.log(`GET: No commits found for ${owner}/${name}, triggering Inngest sync`);
      await inngest.send({
        name: "repo/sync.commits",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Commit sync started for ${owner}/${name}`,
      });
    }

    // Return existing commits + total count
    const recentCommits = commitsFromDb.map(normalizeCommit);

    const countRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/commits?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    let totalCommits = 1;
    const linkHeader = countRes.headers.get("link");
    if (linkHeader) {
      const match = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
      if (match) totalCommits = Number(match[1]);
    }

    return NextResponse.json({
      totalCommits,
      recentCommits,
      source: "Database",
    });
  } catch (error) {
    console.error("GET /get-commits error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
