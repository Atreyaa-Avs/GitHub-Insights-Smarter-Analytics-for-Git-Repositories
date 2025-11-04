import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * safeSerialize: JSON-safe conversion for objects containing BigInt and Date.
 * - BigInt -> Number (if too big for Number you'll lose precision; adjust if needed)
 * - Date -> ISO string
 */
function safeSerialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === "bigint") {
        // convert BigInt to number (or toString() if you prefer string)
        try {
          return Number(value);
        } catch {
          return value.toString();
        }
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    })
  );
}

async function fetchFromGitHub(owner: string, name: string, repoId: number) {
  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) throw new Error("GitHub token not configured");

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/stats/commit_activity`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
      },
    }
  );

  if (response.status === 202) {
    throw new Error("GitHub stats are still being generated, try again soon.");
  }

  if (!response.ok) {
    throw new Error(`GitHub API failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("📊 Weekly commits data from GitHub:", data);

  // Upsert all weekly entries
  for (const entry of data) {
    await prisma.weeklyCommit.upsert({
      where: {
        repo_id_week: {
          repo_id: repoId,
          week: new Date(entry.week * 1000),
        },
      },
      update: { total: entry.total },
      create: {
        repo_id: repoId,
        week: new Date(entry.week * 1000),
        total: entry.total,
      },
    });
  }

  // return sanitized version of what we inserted
  return data.map((e: any) => ({
    week: new Date(e.week * 1000).toISOString(),
    total: e.total,
  }));
}

// ------------------- GET -------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl required (owner/repo)" },
      { status: 422 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // If repo missing, fallback to POST (which will also return sanitized data)
    if (!repo) {
      console.log(`GET: repo ${owner}/${name} not found in DB — invoking POST fallback`);
      return await POST(request);
    }

    // Fetch weekly commits from DB
    const weeklyCommits = await prisma.weeklyCommit.findMany({
      where: { repo_id: repo.id },
      orderBy: { week: "asc" },
    });

    // If DB empty, fallback to POST
    if (!weeklyCommits || weeklyCommits.length === 0) {
      console.log(`GET: no weeklyCommits for ${owner}/${name} — invoking POST fallback`);
      return await POST(request);
    }

    // sanitize for JSON (handle BigInt / Date)
    const safe = safeSerialize(
      weeklyCommits.map((w) => ({
        id: w.id,
        repo_id: // ensure repo_id becomes Number if BigInt
          typeof w.repo_id === "bigint" ? Number(w.repo_id) : w.repo_id,
        week: w.week instanceof Date ? w.week.toISOString() : String(w.week),
        total: w.total,
      }))
    );

    console.log(`GET: returning ${safe.length} weeklyCommits for ${owner}/${name}`);
    return NextResponse.json({ weeklyCommits: safe });
  } catch (error) {
    console.error("Error in GET /get-weekly-commits:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST -------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl required (owner/repo)" },
      { status: 422 }
    );
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      console.log(`POST: repo ${owner}/${name} not found in DB`);
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    const data = await fetchFromGitHub(owner, name, Number(repo.id));

    // sanitize and return
    const safe = safeSerialize(
      data.map((d: any) => ({
        week: d.week instanceof Date ? d.week.toISOString() : String(d.week),
        total: d.total,
      }))
    );

    console.log(`POST: fetched ${safe.length} weekly commits from GitHub for ${owner}/${name}`);
    return NextResponse.json({
      message: "Fetched and saved from GitHub",
      weeklyCommits: safe,
    });
  } catch (error: any) {
    console.error("Error in POST /get-weekly-commits:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
