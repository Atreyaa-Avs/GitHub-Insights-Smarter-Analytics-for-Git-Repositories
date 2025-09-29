import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch issues from DB -------------------
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

    const issues = await prisma.issue.findMany({
      where: { repo_id: repo.id },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    const totalCount = await prisma.issue.count({ where: { repo_id: repo.id } });

    return NextResponse.json({ totalCount, issues });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch open issues from GitHub & save to DB -------------------
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

    // Fetch latest 5 open issues from GitHub
    const searchRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+is:issue+is:open&sort=created&order=desc&per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!searchRes.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching issues" },
        { status: searchRes.status }
      );
    }

    const searchData = await searchRes.json();
    const issuesData = searchData.items;

    // Upsert issues into DB
    for (const i of issuesData) {
      await prisma.issue.upsert({
        where: { repo_id_issue_number: { repo_id: repo.id, issue_number: i.number } },
        update: {
          title: i.title,
          state: i.state,
          updated_at: new Date(i.updated_at),
          closed_at: i.closed_at ? new Date(i.closed_at) : null,
        },
        create: {
          repo_id: repo.id,
          issue_number: i.number,
          title: i.title,
          state: i.state,
          created_at: new Date(i.created_at),
          updated_at: new Date(i.updated_at),
          closed_at: i.closed_at ? new Date(i.closed_at) : null,
          author_login: i.user?.login || null,
        },
      });
    }

    return NextResponse.json({ message: "Open issues saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
