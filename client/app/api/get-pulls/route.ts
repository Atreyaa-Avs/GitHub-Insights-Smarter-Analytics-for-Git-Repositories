import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// Utility to safely serialize BigInt fields
function safeJson(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// -----------------------------------------------------------------------------
// 🔹 GET: Fetch PRs from DB — fallback to POST if PRs or Issues are empty
// -----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (format: owner/repo)" },
      { status: 400 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      console.log(`❌ Repo not found: ${owner}/${name}`);
      return NextResponse.json(
        { error: "Repo not found in DB" },
        { status: 404 }
      );
    }

    // 📦 Fetch PRs and Issues from DB
    const pulls = await prisma.pull.findMany({
      where: { repo_id: repo.id },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const issues = await prisma.issue.findMany({
      where: { repo_id: repo.id },
      take: 1,
    });

    const totalCount = await prisma.pull.count({
      where: { repo_id: repo.id },
    });

    // ⚡ If either PRs or Issues are empty → trigger POST fallback
    if (!pulls.length || !issues.length) {
      console.log(
        `⚠️ Fallback triggered for ${owner}/${name}: ${
          !pulls.length ? "No PRs" : "No Issues"
        } found. Running POST...`
      );

      const postResponse = await POST(request);
      const postData = await postResponse.json();
      console.log(`📦 POST fallback data for ${owner}/${name}:`, postData);

      return NextResponse.json({
        message: "Triggered POST fallback as PRs or Issues were empty",
        ...postData,
      });
    }

    // ✅ Return DB PRs if available
    const safePulls = safeJson(pulls);

    return NextResponse.json({
      totalCount,
      latestCount: safePulls.length,
      pulls: safePulls,
    });
  } catch (error) {
    console.error("❌ Error fetching PRs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// 🔹 POST: Fetch PRs from GitHub & save to DB (up to 50)
// -----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (format: owner/repo)" },
      { status: 400 }
    );
  }

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      console.log(`❌ Repo not found during POST: ${owner}/${name}`);
      return NextResponse.json(
        { error: "Repo not found in DB" },
        { status: 404 }
      );
    }

    console.log(`🚀 [POST] Fetching up to 50 PRs for ${owner}/${name} from GitHub...`);

    // 🌐 Fetch latest 50 PRs
    const ghResponse = await fetch(
      `https://api.github.com/repos/${owner}/${name}/pulls?state=all&per_page=50`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    console.log(`[POST] GitHub response status: ${ghResponse.status}`);

    if (ghResponse.status === 403) {
      return NextResponse.json(
        { error: "GitHub API rate limit exceeded. Try again later." },
        { status: 403 }
      );
    }

    if (!ghResponse.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching pull requests" },
        { status: ghResponse.status }
      );
    }

    const prsData: any[] = await ghResponse.json();
    console.log(`[POST] Received ${prsData.length} PRs from GitHub.`);

    if (!Array.isArray(prsData) || prsData.length === 0) {
      console.log(`⚠️ [POST] No pull requests found for ${owner}/${name}.`);
      return NextResponse.json(
        { message: "No pull requests found for this repository." },
        { status: 404 }
      );
    }

    // 🪄 Upsert each PR record
    const upsertOps = prsData.map((pr) =>
      prisma.pull.upsert({
        where: {
          repo_id_pr_number: { repo_id: repo.id, pr_number: pr.number },
        },
        update: {
          title: pr.title,
          state: pr.state,
          updated_at: pr.updated_at ? new Date(pr.updated_at) : new Date(),
          closed_at: pr.closed_at ? new Date(pr.closed_at) : null,
          merged_at: pr.merged_at ? new Date(pr.merged_at) : null,
          author_login: pr.user?.login || null,
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
      })
    );

    await Promise.all(upsertOps);

    console.log(`✅ [POST] Saved ${prsData.length} PRs to DB for ${owner}/${name}`);

    return NextResponse.json({
      message: "Pull requests saved successfully",
      totalSaved: prsData.length,
    });
  } catch (error) {
    console.error("❌ Error saving PRs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
