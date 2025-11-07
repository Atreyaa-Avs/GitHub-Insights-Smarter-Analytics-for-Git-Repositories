import { prisma } from "@/utils/prisma";
import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";

// Utility: safely handle BigInt in JSON responses
function safeJson(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get("repoUrl");

    if (!repoUrl || !repoUrl.includes("/")) {
      return NextResponse.json(
        { error: "Valid repoUrl is required (format: owner/repo)" },
        { status: 400 }
      );
    }

    const [owner, name] = repoUrl.split("/");

    // Ensure the repo exists (create if missing)
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {},
      create: { owner, name },
    });

    const repoId = BigInt(repo.id);

    // Try to fetch releases from DB
    const releases = await prisma.release.findMany({
      where: { repo_id: repoId },
      orderBy: { published_at: "desc" },
      take: 50,
    });

    // If no releases found, trigger Inngest sync
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

    // Count total releases
    const totalCount = await prisma.release.count({ where: { repo_id: repoId } });

    // Return the data
    return NextResponse.json({
      status: "ok",
      repoId: repoId.toString(),
      totalCount,
      latestCount: releases.length,
      releases: safeJson(releases),
      source: "Database",
    });
  } catch (error) {
    console.error("Unified GET /releases error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
