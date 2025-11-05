import { prisma } from "@/utils/prisma";
import { inngest } from "@/inngest/client";
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
    // 1️⃣ Check if repo exists
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      await inngest.send({
        name: "repo/sync.releases",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Release sync started for ${owner}/${name} as repo was missing`,
      });
    }

    // 2️⃣ Fetch releases from DB
    const releases = await prisma.release.findMany({
      where: { repo_id: repo.id },
      orderBy: { published_at: "desc" },
      take: 50,
    });

    // Trigger Inngest if no releases found
    if (!releases.length) {
      await inngest.send({
        name: "repo/sync.releases",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Release sync started for ${owner}/${name} as no releases were found`,
      });
    }

    const totalCount = await prisma.release.count({ where: { repo_id: repo.id } });

    return NextResponse.json({
      totalCount,
      latestCount: releases.length,
      releases: safeJson(releases),
      source: "Database",
    });
  } catch (error) {
    console.error("❌ GET /releases error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
