import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------------- Normalize contributor for frontend ----------------
function normalizeContributor(c: any) {
  return {
    login: c.user?.login || c.login || "Unknown",
    avatar_url: c.user?.avatar_url || c.avatar_url || "",
    type: c.user?.type || c.type || "User",
    contributions: c.contributions || 0,
  };
}

// ---------------------- Unified GET ----------------
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
    // 1️⃣ Check repo in DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // 2️⃣ If repo missing → trigger Inngest background sync
    if (!repo) {
      console.log(`GET: Repo ${owner}/${name} not found, triggering sync...`);
      await inngest.send({
        name: "repo/fetch.contributors",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Contributor sync started for ${owner}/${name}`,
      });
    }

    // 3️⃣ Fetch contributors from DB
    const contributorsRaw = await prisma.contributorRank.findMany({
      where: { repo_id: repo.id },
      include: { user: true },
      orderBy: { contributions: "desc" },
      take: 50,
    });

    // 4️⃣ If contributors empty → trigger Inngest background sync
    if (!contributorsRaw.length) {
      console.log(
        `GET: No contributors found in DB for ${owner}/${name}, triggering sync...`
      );
      await inngest.send({
        name: "repo/fetch.contributors",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Contributor sync started for ${owner}/${name}`,
      });
    }

    // 5️⃣ Return normalized contributors
    const topContributors = contributorsRaw.map(normalizeContributor);
    const totalContributors = await prisma.contributorRank.count({
      where: { repo_id: repo.id },
    });

    return NextResponse.json({
      totalContributors,
      topContributors,
      source: "Database",
    });
  } catch (error) {
    console.error("GET /get-contributors error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
