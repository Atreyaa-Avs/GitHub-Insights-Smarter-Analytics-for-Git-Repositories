import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch contributors from DB -------------------
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
    // Find the repo first
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    // Fetch contributors from ContributorRank table
    const contributors = await prisma.contributorRank.findMany({
      where: { repo_id: repo.id },
      include: { user: true },
      orderBy: { contributions: "desc" },
    });

    return NextResponse.json(contributors);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch contributors from GitHub & save to DB -------------------
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

    // Fetch contributors from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contributors?per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub API error", status: response.status });
    }

    const contributorsData = await response.json();

    // Upsert each contributor into GhUser + ContributorRank
    for (const c of contributorsData) {
      // Upsert user
      await prisma.ghUser.upsert({
        where: { login: c.login },
        update: { avatar_url: c.avatar_url, type: c.type },
        create: { login: c.login, avatar_url: c.avatar_url, type: c.type },
      });

      // Upsert ContributorRank
      await prisma.contributorRank.upsert({
        where: { repo_id_user_login: { repo_id: repo.id, user_login: c.login } },
        update: { contributions: c.contributions },
        create: {
          repo_id: repo.id,
          user_login: c.login,
          contributions: c.contributions,
        },
      });
    }

    return NextResponse.json({ message: "Contributors saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
