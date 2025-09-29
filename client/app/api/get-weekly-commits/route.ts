// /app/api/get-weekly-commits/route.ts
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch weekly commits from DB -------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl required (owner/repo)" }, 
      { status: 422 }
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

    const weeklyCommits = await prisma.weeklyCommit.findMany({
      where: { repo_id: repo.id },
      orderBy: { week: "asc" },
    });

    return NextResponse.json(weeklyCommits);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch weekly commits from GitHub & save -------------------
export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}/stats/commit_activity`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
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

    const data = await response.json();

    for (const entry of data) {
      await prisma.weeklyCommit.upsert({
        where: { repo_id_week: { repo_id: repo.id, week: new Date(entry.week * 1000) } },
        update: { total: entry.total },
        create: { repo_id: repo.id, week: new Date(entry.week * 1000), total: entry.total },
      });
    }

    return NextResponse.json({ message: "Weekly commits saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
