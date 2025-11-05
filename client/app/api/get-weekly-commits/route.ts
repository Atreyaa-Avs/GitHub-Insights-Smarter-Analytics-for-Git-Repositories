import { prisma } from "@/utils/prisma";
import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * safeSerialize: JSON-safe conversion for objects containing BigInt and Date.
 */
function safeSerialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      if (typeof value === "bigint") return Number(value);
      if (value instanceof Date) return value.toISOString();
      return value;
    })
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json({ error: "Valid repoUrl required (owner/repo)" }, { status: 422 });
  }

  const [owner, name] = repoUrl.split("/");

  try {
    // 1️⃣ Check if repo exists
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      await inngest.send({
        name: "repo/sync.weeklyCommits",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Weekly commits sync started for ${owner}/${name} as repo was missing`,
      });
    }

    // 2️⃣ Fetch weekly commits from DB
    const weeklyCommits = await prisma.weeklyCommit.findMany({
      where: { repo_id: repo.id },
      orderBy: { week: "asc" },
    });

    // Trigger Inngest if DB empty
    if (!weeklyCommits.length) {
      await inngest.send({
        name: "repo/sync.weeklyCommits",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Weekly commits sync started for ${owner}/${name} as no data was found`,
      });
    }

    return NextResponse.json({
      weeklyCommits: safeSerialize(weeklyCommits),
      source: "Database",
    });
  } catch (error) {
    console.error("❌ GET /weekly-commits error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
