import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// Normalize commit for frontend
function normalizeCommit(c: any) {
  return {
    sha: c.sha,
    message: c.message || "No message",
    committed_at: c.committed_at?.toISOString() || new Date().toISOString(),
    author: { name: c.author_login || "Unknown" },
    committer: { name: c.committer_login || "Unknown" },
  };
}

// ---------------- POST: fetch from GitHub & upsert ----------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");
  if (!repoUrl) return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });

  const [owner, name] = repoUrl.split("/");
  if (!owner || !name) return NextResponse.json({ error: "Invalid repoUrl format" }, { status: 400 });

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });

  try {
    // Ensure repo exists
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {},
      create: { owner, name },
    });

    // Fetch latest 20 commits from GitHub
    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/commits?per_page=20`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );
    if (!commitsRes.ok) throw new Error(`GitHub API error: ${commitsRes.status}`);
    const commitsData = await commitsRes.json();

    // Upsert commits into DB
    const commits = commitsData.map((c: any) => ({
      sha: c.sha,
      message: c.commit?.message || "No message",
      committed_at: new Date(c.commit?.committer?.date || Date.now()),
      author_login: c.commit?.author?.name || null,
      committer_login: c.commit?.committer?.name || null,
      repo_id: repo.id,
    }));

    for (const c of commits) {
      await prisma.commit.upsert({
        where: { sha: c.sha },
        update: {
          message: c.message,
          committed_at: c.committed_at,
          author_login: c.author_login,
          committer_login: c.committer_login,
          repo_id: c.repo_id,
        },
        create: c,
      });
    }

    // Get lifetime commit count from GitHub via per_page=1 and Link header
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

    const recentCommits = commits.map(normalizeCommit);
    return NextResponse.json({ totalCommits, recentCommits });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------- GET: fetch from DB, fallback to POST ----------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");
  if (!repoUrl) return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });

  const [owner, name] = repoUrl.split("/");
  if (!owner || !name) return NextResponse.json({ error: "Invalid repoUrl format" }, { status: 400 });

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      // If repo not in DB, fallback to POST
      return POST(request);
    }

    // Get latest 20 commits from DB
    const recentCommitsRaw = await prisma.commit.findMany({
      where: { repo_id: repo.id },
      orderBy: { committed_at: "desc" },
      take: 20,
    });

    const recentCommits = recentCommitsRaw.map(normalizeCommit);

    // Get lifetime commit count from GitHub
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubAccessToken) return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });

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

    return NextResponse.json({ totalCommits, recentCommits });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
