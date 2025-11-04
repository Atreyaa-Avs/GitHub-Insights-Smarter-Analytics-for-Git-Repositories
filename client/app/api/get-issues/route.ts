import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------------- Helper: normalize issue ----------------------
function normalizeIssue(i: any) {
  return {
    number: i.issue_number || i.number,
    title: i.title || "No title",
    state: i.state || "open",
    created_at:
      i.created_at instanceof Date
        ? i.created_at.toISOString()
        : new Date(i.created_at).toISOString(),
    updated_at:
      i.updated_at instanceof Date
        ? i.updated_at.toISOString()
        : new Date(i.updated_at).toISOString(),
    closed_at: i.closed_at ? new Date(i.closed_at).toISOString() : null,
    author: i.author_login
      ? { login: i.author_login }
      : i.user
      ? { login: i.user.login }
      : { login: "Unknown" },
  };
}

// ---------------------- POST: Fetch from GitHub & upsert ----------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");
  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (owner/repo)" },
      { status: 400 }
    );
  }

  const [owner, name] = repoUrl.split("/");
  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("Fetching from GitHub (POST)...", { repoUrl });

    // Ensure repo exists or create it
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {},
      create: { owner, name },
    });

    // Fetch only OPEN issues (max 50)
    const res = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${name}+is:issue+is:open&sort=created&order=desc&per_page=50`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    const issuesData = data.items || [];

    console.log(`Fetched ${issuesData.length} open issues from GitHub.`);

    // Upsert each issue into DB
    for (const i of issuesData) {
      await prisma.issue.upsert({
        where: {
          repo_id_issue_number: {
            repo_id: repo.id,
            issue_number: i.number,
          },
        },
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

    const normalizedIssues = issuesData.map(normalizeIssue);

    return NextResponse.json({
      totalCount: issuesData.length,
      issues: normalizedIssues,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------- GET: Fetch from DB (fallback to POST) ----------------------
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

    // Fallback to POST if repo not found
    if (!repo) {
      console.log("Repo not found in DB. Falling back to POST...");
      return POST(request);
    }

    // Fetch only OPEN issues from DB (max 50)
    const issuesRaw = await prisma.issue.findMany({
      where: { repo_id: repo.id, state: "open" },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    // Fallback to POST if repo exists but no open issues stored
    if (!issuesRaw || issuesRaw.length === 0) {
      console.log("No open issues in DB. Fetching fresh data via POST...");
      return POST(request);
    }

    const totalCount = await prisma.issue.count({
      where: { repo_id: repo.id, state: "open" },
    });

    const issues = issuesRaw.map(normalizeIssue);

    return NextResponse.json({ totalCount, issues });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
