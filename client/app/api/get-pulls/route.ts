import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------- Helper: Safe JSON serialization ----------------
function safeJson(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// ---------------- GET: Pull Requests with Pagination ----------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get("repoUrl");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!repoUrl || !repoUrl.includes("/")) {
      return NextResponse.json(
        { error: "Valid repoUrl is required (format: owner/repo)" },
        { status: 400 }
      );
    }

    const [owner, name] = repoUrl.split("/");

    // Check if repo exists
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      await inngest.send({
        name: "repo/sync.pulls",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Pull request sync started for ${owner}/${name}`,
      });
    }

    // Compute pagination params
    const skip = (page - 1) * limit;

    // Fetch PRs with pagination
    const pulls = await prisma.pull.findMany({
      where: { repo_id: repo.id },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    // If no data found → trigger Inngest sync
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
    const totalPages = Math.ceil(totalCount / limit);

    // Return paginated result
    return NextResponse.json({
      totalCount,
      totalPages,
      currentPage: page,
      perPage: limit,
      pulls: safePulls,
      source: "Database",
    });
  } catch (error) {
    console.error("[GET /pulls] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
