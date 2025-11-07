import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------- Normalize contributor for frontend ----------------
function normalizeContributor(c: any) {
  return {
    login: c.user?.login || c.login || "Unknown",
    avatar_url: c.user?.avatar_url || c.avatar_url || "",
    type: c.user?.type || c.type || "User",
    contributions: c.contributions || 0,
  };
}

// ---------------- Main GET Handler ----------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl)
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });

  const [owner, name] = repoUrl.split("/");
  if (!owner || !name)
    return NextResponse.json({ error: "Invalid repoUrl format" }, { status: 400 });

  try {
    // Try fetching repo from DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // If repo not found → trigger background sync
    if (!repo) {
      console.log(`GET: Repo not found for ${owner}/${name}, triggering Inngest sync`);
      await inngest.send({
        name: "repo/sync.contributors",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Contributor sync started for ${owner}/${name}`,
      });
    }

    // Try fetching top contributors from DB
    const contributorsFromDb = await prisma.contributorRank.findMany({
      where: { repo_id: repo.id },
      include: { user: true },
      orderBy: { contributions: "desc" },
      take: 50,
    });

    // If no contributors in DB → trigger background sync
    if (!contributorsFromDb.length) {
      console.log(`GET: No contributors found for ${owner}/${name}, triggering Inngest sync`);
      await inngest.send({
        name: "repo/sync.contributors",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Contributor sync started for ${owner}/${name}`,
      });
    }

    // Count total contributors
    const totalContributors = await prisma.contributorRank.count({
      where: { repo_id: repo.id },
    });

    // Return normalized contributors + total count
    const topContributors = contributorsFromDb.map(normalizeContributor);

    return NextResponse.json({
      totalContributors,
      topContributors,
      source: "Database",
    });
  } catch (error) {
    console.error("GET /get-contributors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
