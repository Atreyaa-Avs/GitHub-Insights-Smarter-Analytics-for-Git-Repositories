import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------------- Helper: normalize contributor ----------------------
function normalizeContributor(c: any) {
  return {
    login: c.user?.login || c.login || "Unknown",
    avatar_url: c.user?.avatar_url || c.avatar_url || "",
    type: c.user?.type || c.type || "User",
    contributions: c.contributions || 0,
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
    console.log(`🔄 [POST] Fetching contributors for ${owner}/${name}`);

    // Ensure repo exists
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {},
      create: { owner, name },
    });

    // Fetch contributors from GitHub API
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contributors?per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const contributorsData = await res.json();

    console.log(
      `✅ [POST] Received ${contributorsData.length} contributors for ${owner}/${name}`
    );

    // Upsert each contributor into ghUser + contributorRank
    for (const c of contributorsData) {
      await prisma.ghUser.upsert({
        where: { login: c.login },
        update: { avatar_url: c.avatar_url, type: c.type },
        create: { login: c.login, avatar_url: c.avatar_url, type: c.type },
      });

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

    // Normalize top contributors for frontend
    const topContributors = contributorsData
      .sort((a: any, b: any) => b.contributions - a.contributions)
      .slice(0, 50)
      .map(normalizeContributor);

    return NextResponse.json({
      totalContributors: contributorsData.length,
      topContributors,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
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
    // Find repo in DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // If repo doesn't exist, fallback to POST
    if (!repo) {
      console.log(`⚠️ [GET] Repo ${owner}/${name} not found. Falling back to POST...`);
      return POST(request);
    }

    // Get contributors from DB
    const contributorsRaw = await prisma.contributorRank.findMany({
      where: { repo_id: repo.id },
      include: { user: true },
      orderBy: { contributions: "desc" },
      take: 50,
    });

    // Fallback if contributors are empty
    if (contributorsRaw.length === 0) {
      console.log(
        `⚠️ [GET] No contributors found in DB for ${owner}/${name}. Fetching fresh from GitHub...`
      );
      return POST(request);
    }

    const topContributors = contributorsRaw.map(normalizeContributor);

    // Get contributor count (for stats)
    const totalContributors = await prisma.contributorRank.count({
      where: { repo_id: repo.id },
    });

    return NextResponse.json({
      totalContributors,
      topContributors,
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
