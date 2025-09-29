import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch PRs from DB -------------------
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

    const pulls = await prisma.pull.findMany({
      where: { repo_id: repo.id },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    const totalCount = await prisma.pull.count({ where: { repo_id: repo.id } });

    return NextResponse.json({ totalCount, pulls });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch PRs from GitHub & save to DB -------------------
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

    // Fetch latest 5 open PRs from GitHub
    const prSearchRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/pulls?state=open&per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!prSearchRes.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching PRs" },
        { status: prSearchRes.status }
      );
    }

    const prsData = await prSearchRes.json();

    // Upsert PRs into DB
    for (const pr of prsData) {
      await prisma.pull.upsert({
        where: { repo_id_pr_number: { repo_id: repo.id, pr_number: pr.number } },
        update: {
          title: pr.title,
          state: pr.state,
          updated_at: new Date(pr.updated_at),
          closed_at: pr.closed_at ? new Date(pr.closed_at) : null,
          merged_at: pr.merged_at ? new Date(pr.merged_at) : null,
        },
        create: {
          repo_id: repo.id,
          pr_number: pr.number,
          title: pr.title,
          state: pr.state,
          created_at: new Date(pr.created_at),
          updated_at: new Date(pr.updated_at),
          closed_at: pr.closed_at ? new Date(pr.closed_at) : null,
          merged_at: pr.merged_at ? new Date(pr.merged_at) : null,
          author_login: pr.user?.login || null,
        },
      });
    }

    return NextResponse.json({ message: "Pull requests saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
