import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ------------------- GET: fetch repo languages from DB -------------------
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
    // Find repo first
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    // Fetch repo languages from DB
    const languages = await prisma.repoLanguage.findMany({
      where: { repo_id: repo.id },
      orderBy: { bytes_of_code: "desc" },
    });

    return NextResponse.json(languages);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------- POST: fetch languages from GitHub & save to DB -------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (owner/repo)" },
      { status: 400 }
    );
  }

  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!githubAccessToken) {
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });
  }

  const [owner, name] = repoUrl.split("/");

  try {
    // Get repo
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repo not found in DB" }, { status: 404 });
    }

    // Fetch languages from GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}/languages`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub API error", status: response.status });
    }

    const data = await response.json(); // e.g., { "TypeScript": 12345, "JavaScript": 6789 }

    // Upsert each language into RepoLanguage table
    for (const [language, bytes] of Object.entries(data)) {
      const bytesNumber = typeof bytes === "number" ? bytes : Number(bytes);
      await prisma.repoLanguage.upsert({
        where: { repo_id_language: { repo_id: repo.id, language } },
        update: { bytes_of_code: BigInt(bytesNumber) },
        create: { repo_id: repo.id, language, bytes_of_code: BigInt(bytesNumber) },
      });
    }

    return NextResponse.json({ message: "Languages saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
