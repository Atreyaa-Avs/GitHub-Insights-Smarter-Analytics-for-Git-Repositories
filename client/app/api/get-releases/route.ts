import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch releases from DB -------------------
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

    const releases = await prisma.release.findMany({
      where: { repo_id: repo.id },
      orderBy: { published_at: "desc" },
      take: 5,
    });

    const totalCount = await prisma.release.count({ where: { repo_id: repo.id } });

    return NextResponse.json({ totalCount, releases });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch releases from GitHub & save to DB -------------------
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

    // Fetch latest 5 releases from GitHub
    const releasesRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/releases?per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!releasesRes.ok) {
      return NextResponse.json(
        { error: "GitHub API error fetching releases" },
        { status: releasesRes.status }
      );
    }

    const releasesData = await releasesRes.json();

    // Upsert releases into DB
    for (const release of releasesData) {
      await prisma.release.upsert({
        where: { release_id: release.id },
        update: {
          tag_name: release.tag_name,
          name: release.name,
          created_at: release.created_at ? new Date(release.created_at) : null,
          published_at: release.published_at ? new Date(release.published_at) : null,
        },
        create: {
          release_id: release.id,
          tag_name: release.tag_name,
          name: release.name,
          created_at: release.created_at ? new Date(release.created_at) : null,
          published_at: release.published_at ? new Date(release.published_at) : null,
          repo_id: repo.id,
        },
      });
    }

    return NextResponse.json({ message: "Releases saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
