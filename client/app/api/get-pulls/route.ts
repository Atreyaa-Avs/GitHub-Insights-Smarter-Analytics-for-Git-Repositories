import { inngest } from "@/inngest/client";
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
    // 1️⃣ Check if repo exists in DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      // Trigger Inngest sync if repo is missing
      await inngest.send({
        name: "repo/sync.pulls",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Pull request sync started for ${owner}/${name}`,
      });
    }

    // 2️⃣ Fetch latest 50 PRs from DB
    const pulls = await prisma.pull.findMany({
      where: { repo_id: repo.id },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    // Trigger Inngest if no PRs found
    if (!pulls.length) {
      await inngest.send({
        name: "repo/sync.pulls",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Pull request sync started for ${owner}/${name}`,
      });
    }

    const totalCount = await prisma.pull.count({ where: { repo_id: repo.id } });
    const safePulls = safeJson(pulls);

    return NextResponse.json({
      totalCount,
      latestCount: safePulls.length,
      pulls: safePulls,
      source: "Database",
    });
  } catch (error) {
    console.error("❌ GET /pulls error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
