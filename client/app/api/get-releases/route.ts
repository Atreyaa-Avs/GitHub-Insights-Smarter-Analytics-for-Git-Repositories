import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ✅ Safe JSON serialization (for BigInt)
function safeJson(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// -----------------------------------------------------------------------------
// 🔹 GET: Fetch releases from DB (fallback to POST if empty)
// -----------------------------------------------------------------------------
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
      console.log(`❌ Repo not found in DB: ${owner}/${name}`);
      const postResponse = await POST(request);
      const postData = await postResponse.json();
      return NextResponse.json({
        message: "Repo missing, triggered POST fallback",
        ...postData,
      });
    }

    // Fetch releases from DB
    const releases = await prisma.release.findMany({
      where: { repo_id: repo.id },
      orderBy: { published_at: "desc" },
      take: 50,
      select: {
        id: true,
        tag_name: true,
        name: true,
        html_url: true,
        published_at: true,
      },
    });

    const totalCount = await prisma.release.count({
      where: { repo_id: repo.id },
    });

    // Fallback if empty
    if (!releases.length) {
      console.log(`⚠️ No releases found in DB for ${owner}/${name}, triggering POST fallback...`);
      const postResponse = await POST(request);
      const postData = await postResponse.json();
      return NextResponse.json({
        message: "Triggered POST fallback as releases were empty",
        ...postData,
      });
    }

    return NextResponse.json({
      totalCount,
      releases: safeJson(releases),
    });
  } catch (error) {
    console.error("❌ Error fetching releases:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// 🔹 POST: Fetch releases from GitHub & save to DB (up to 50)
// -----------------------------------------------------------------------------
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
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    console.log(`🚀 Fetching releases from GitHub for ${owner}/${name}...`);

    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    const releasesRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/releases?per_page=50`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (releasesRes.status === 403) {
      return NextResponse.json(
        { error: "GitHub API rate limit exceeded" },
        { status: 403 }
      );
    }

    if (!releasesRes.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching releases" },
        { status: releasesRes.status }
      );
    }

    const releasesData = await releasesRes.json();

    if (!Array.isArray(releasesData) || releasesData.length === 0) {
      return NextResponse.json(
        { message: "No releases found for this repository." },
        { status: 404 }
      );
    }

    // ✅ Save to DB
    for (const release of releasesData) {
      await prisma.release.upsert({
        where: { release_id: release.id },
        update: {
          tag_name: release.tag_name,
          name: release.name,
          html_url: release.html_url,
          created_at: release.created_at ? new Date(release.created_at) : null,
          published_at: release.published_at ? new Date(release.published_at) : null,
        },
        create: {
          release_id: release.id,
          tag_name: release.tag_name,
          name: release.name,
          html_url: release.html_url,
          created_at: release.created_at ? new Date(release.created_at) : null,
          published_at: release.published_at ? new Date(release.published_at) : null,
          repo_id: repo.id,
        },
      });
    }

    console.log(`✅ Saved ${releasesData.length} releases to DB for ${owner}/${name}`);

    return NextResponse.json({
      message: "Releases saved successfully",
      totalSaved: releasesData.length,
      releases: safeJson(releasesData),
    });
  } catch (error) {
    console.error("❌ Error saving releases:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
