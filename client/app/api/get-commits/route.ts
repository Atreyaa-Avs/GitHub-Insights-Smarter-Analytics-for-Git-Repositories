import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch commits from DB -------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
  }

  // Extract owner and repo name from URL (e.g., "owner/repo")
  const [owner, name] = repoUrl.split("/");

  if (!owner || !name) {
    return NextResponse.json(
      { error: "Invalid repoUrl format" },
      { status: 400 }
    );
  }

  try {
    // Fetch the repo from DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
      include: {
        commits: {
          orderBy: { committed_at: "desc" },
          take: 5,
        },
      },
    });

    if (!repo) {
      // Call your POST logic internally
      const response = await POST(request);
      return response;
    }

    return NextResponse.json({
      totalCommits: repo.commits.length, // Or store total count separately
      recentCommits: repo.commits,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ------------------- POST: fetch from GitHub & save to DB -------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
  }

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  // Extract owner and repo name from URL
  const [owner, name] = repoUrl.split("/");

  if (!owner || !name) {
    return NextResponse.json(
      { error: "Invalid repoUrl format" },
      { status: 400 }
    );
  }

  try {
    // Fetch repo details from GitHub
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${name}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching repo" },
        { status: repoResponse.status }
      );
    }

    const repoData = await repoResponse.json();

    // Upsert Repo in DB
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {
        description: repoData.description,
        visibility: repoData.private ? "private" : "public",
        default_branch: repoData.default_branch,
        stargazers_count: repoData.stargazers_count,
        watchers_count: repoData.watchers_count,
        forks_count: repoData.forks_count,
        size_kb: repoData.size,
        language: repoData.language,
        license_name: repoData.license?.name,
        homepage: repoData.homepage,
        updated_at: new Date(repoData.updated_at),
        pushed_at: new Date(repoData.pushed_at),
      },
      create: {
        owner,
        name,
        description: repoData.description,
        visibility: repoData.private ? "private" : "public",
        default_branch: repoData.default_branch,
        stargazers_count: repoData.stargazers_count,
        watchers_count: repoData.watchers_count,
        forks_count: repoData.forks_count,
        size_kb: repoData.size,
        language: repoData.language,
        license_name: repoData.license?.name,
        homepage: repoData.homepage,
        created_at: new Date(repoData.created_at),
        updated_at: new Date(repoData.updated_at),
        pushed_at: new Date(repoData.pushed_at),
      },
    });

    // Fetch recent commits from GitHub
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${name}/commits?per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!commitsResponse.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching commits" },
        { status: commitsResponse.status }
      );
    }

    const recentCommits = await commitsResponse.json();

    // Save commits to DB (upsert by SHA)
    for (const c of recentCommits) {
      await prisma.commit.upsert({
        where: { sha: c.sha },
        update: {
          message: c.commit.message,
          committed_at: new Date(c.commit.committer.date),
          author_login: c.author?.login || null,
          committer_login: c.committer?.login || null,
          repo_id: repo.id,
        },
        create: {
          sha: c.sha,
          message: c.commit.message,
          committed_at: new Date(c.commit.committer.date),
          author_login: c.author?.login || null,
          committer_login: c.committer?.login || null,
          repo_id: repo.id,
        },
      });
    }

    return NextResponse.json({
      message: "Repo and commits saved successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
