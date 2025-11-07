import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

interface ParticipationStats {
  repo_id: number;
  week_start: Date;
  all_commits: number;
  owner_commits: number;
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

    // Find repo
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // If repo missing → trigger Inngest background sync
    if (!repo) {
      await inngest.send({
        name: "repo/sync.participation",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Participation stats sync started for ${owner}/${name}`,
      });
    }

    // Fetch participation stats from DB
    const rawStats = await prisma.participationStats.findMany({
      where: { repo_id: repo.id },
      orderBy: { week_start: "asc" },
    });

    // If no stats → trigger Inngest background sync
    if (!rawStats.length) {
      await inngest.send({
        name: "repo/sync.participation",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Participation stats sync started for ${owner}/${name}`,
      });
    }

    // Normalize stats
    const stats: ParticipationStats[] = rawStats.map((r:any) => ({
      repo_id: Number(r.repo_id),
      week_start: r.week_start,
      all_commits: Number(r.all_commits),
      owner_commits: Number(r.owner_commits),
    }));

    const totalAllCommits = stats.reduce((sum, s) => sum + s.all_commits, 0);
    const totalOwnerCommits = stats.reduce((sum, s) => sum + s.owner_commits, 0);

    return NextResponse.json({
      totalWeeks: stats.length,
      totalAllCommits,
      totalOwnerCommits,
      weeklyStats: stats,
      source: "Database",
    });
  } catch (error: unknown) {
    console.error("GET /participation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
