import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// -----------------------------------------------------------------------------
// 🔹 Helper: Fetch top committers from GitHub and update DB
// -----------------------------------------------------------------------------
async function fetchFromGitHubAndSave(owner: string, name: string, repoId: bigint) {
  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    throw new Error("GitHub token not configured");
  }

  console.log(`⚡ Fetching top committers from GitHub for ${owner}/${name}...`);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contributors?per_page=10`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const contributors = await response.json();
  if (!Array.isArray(contributors) || contributors.length === 0) {
    throw new Error("No contributors returned from GitHub API");
  }

  // Upsert contributors + their ranks
  for (const c of contributors) {
    if (!c.login) continue;

    await prisma.ghUser.upsert({
      where: { login: c.login },
      update: { avatar_url: c.avatar_url ?? null },
      create: { login: c.login, avatar_url: c.avatar_url ?? null },
    });

    await prisma.contributorRank.upsert({
      where: {
        repo_id_user_login: {
          repo_id: repoId,
          user_login: c.login,
        },
      },
      update: { contributions: c.contributions ?? 0 },
      create: {
        repo_id: repoId,
        user_login: c.login,
        contributions: c.contributions ?? 0,
      },
    });
  }

  console.log(`✅ Successfully fetched & saved ${contributors.length} contributors from GitHub`);

  return contributors;
}

// -----------------------------------------------------------------------------
// 🔹 GET: Try to fetch from DB; fallback to GitHub (POST logic)
// -----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl required (format: owner/repo)" },
      { status: 422 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    // Try to find repo in DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // Fallback if repo not found — trigger POST logic
    if (!repo) {
      console.warn("⚠️ Repo not found in DB, fetching from GitHub via POST fallback...");
      const contributors = await fetchFromGitHubAndSave(owner, name, BigInt(0)); // temporary repo_id
      return NextResponse.json({
        message: "Repo not in DB — fetched directly from GitHub.",
        topCommitters: contributors,
        source: "github_fallback",
      });
    }

    // Get top committers from DB
    const topCommitters = await prisma.contributorRank.findMany({
      where: { repo_id: repo.id },
      orderBy: { contributions: "desc" },
      take: 10,
      include: { user: true },
    });

    // Check if issues exist — if none, trigger fallback (GitHub)
    const issuesCount = await prisma.issue.count({ where: { repo_id: repo.id } });

    if (topCommitters.length === 0 || issuesCount === 0) {
      console.warn(
        `⚠️ Fallback: No committers or no issues found for ${owner}/${name}. Fetching from GitHub...`
      );
      const contributors = await fetchFromGitHubAndSave(owner, name, repo.id);
      return NextResponse.json({
        message: "Fetched committers from GitHub due to empty DB state.",
        topCommitters: contributors,
        source: "github_fallback",
      });
    }

    // ✅ If DB data available
    return NextResponse.json({
      source: "database",
      totalContributors: topCommitters.length,
      topCommitters,
    });
  } catch (error) {
    console.error("❌ Error in GET /get-top-committers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// 🔹 POST: Force-refresh top committers from GitHub
// -----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl required (format: owner/repo)" },
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

    const contributors = await fetchFromGitHubAndSave(owner, name, repo.id);

    return NextResponse.json({
      message: "Top committers fetched & saved successfully",
      totalSaved: contributors.length,
      source: "github_post",
    });
  } catch (error) {
    console.error("❌ Error in POST /get-top-committers:", error);
    return NextResponse.json(
      { error: "Failed to fetch or save top committers" },
      { status: 500 }
    );
  }
}
