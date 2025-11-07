import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------------- Normalize issue for frontend ----------------
function normalizeIssue(i: any) {
  return {
    number: i.issue_number || i.number,
    title: i.title || "No title",
    state: i.state || "open",
    created_at:
      i.created_at instanceof Date
        ? i.created_at.toISOString()
        : new Date(i.created_at).toISOString(),
    updated_at:
      i.updated_at instanceof Date
        ? i.updated_at.toISOString()
        : new Date(i.updated_at).toISOString(),
    closed_at: i.closed_at ? new Date(i.closed_at).toISOString() : null,
    author: i.author_login
      ? { login: i.author_login }
      : i.user
      ? { login: i.user.login }
      : { login: "Unknown" },
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
    // Check repo in DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // If repo missing → trigger Inngest background sync
    if (!repo) {
      console.log(`GET: Repo ${owner}/${name} not found, triggering sync...`);
      await inngest.send({
        name: "repo/sync.issues",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Issue sync started for ${owner}/${name}`,
      });
    }

    // Fetch open issues from DB
    const issuesRaw = await prisma.issue.findMany({
      where: { repo_id: repo.id, state: "open" },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    // If no issues → trigger Inngest background sync
    if (!issuesRaw.length) {
      console.log(
        `GET: No open issues in DB for ${owner}/${name}, triggering sync...`
      );
      await inngest.send({
        name: "repo/sync.issues",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Issue sync started for ${owner}/${name}`,
      });
    }

    const totalCount = await prisma.issue.count({
      where: { repo_id: repo.id, state: "open" },
    });

    const issues = issuesRaw.map(normalizeIssue);

    return NextResponse.json({
      totalCount,
      issues,
      source: "Database",
    });
  } catch (error) {
    console.error("GET /get-issues error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
