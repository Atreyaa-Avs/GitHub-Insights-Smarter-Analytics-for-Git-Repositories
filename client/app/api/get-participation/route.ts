import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch participation stats from DB -------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (owner/repo)" },
      { status: 400 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    const stats = await prisma.participationStats.findMany({
      where: { repo_id: repo.id },
      orderBy: { week_start: "asc" }, // oldest first
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch participation stats from GitHub & save to DB -------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (owner/repo)" },
      { status: 400 }
    );
  }

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });
  }

  const [owner, name] = repoUrl.split("/");

  try {
    // Get repo
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    // Fetch participation stats from GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}/stats/participation`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
      },
    });

    if (response.status === 202) {
      return NextResponse.json(
        { message: "Participation stats are being generated, try again shortly." },
        { status: 202 }
      );
    }

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub API error", status: response.status });
    }

    const data = await response.json(); 
    // data = { all: [week0, week1, ...], owner: [week0, week1, ...] }

    const allCommits = data.all || [];
    const ownerCommits = data.owner || [];

    const now = new Date();
    const startYear = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year

    // Upsert weekly participation stats
    for (let i = 0; i < allCommits.length; i++) {
      const weekStart = new Date(startYear);
      weekStart.setDate(startYear.getDate() + i * 7);

      await prisma.participationStats.upsert({
        where: { repo_id_week_start: { repo_id: repo.id, week_start: weekStart } },
        update: {
          all_commits: allCommits[i],
          owner_commits: ownerCommits[i] || 0,
        },
        create: {
          repo_id: repo.id,
          week_start: weekStart,
          all_commits: allCommits[i],
          owner_commits: ownerCommits[i] || 0,
        },
      });
    }

    return NextResponse.json({ message: "Participation stats saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
