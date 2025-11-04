import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------------- Helper: Normalize Language Data ----------------------
function normalizeLanguages(languages: any[]) {
  const totalBytes = languages.reduce(
    (sum, lang) => sum + Number(lang.bytes_of_code),
    0
  );

  return languages.map((lang) => ({
    language: lang.language,
    bytes: Number(lang.bytes_of_code),
    percentage: totalBytes
      ? ((Number(lang.bytes_of_code) / totalBytes) * 100).toFixed(2)
      : "0.00",
  }));
}

// ---------------------- POST: Fetch from GitHub & upsert ----------------------
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json(
      { error: "Valid repoUrl is required (owner/repo)" },
      { status: 400 }
    );
  }

  const [owner, name] = repoUrl.split("/");
  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    // 🗃 Ensure repo exists or create
    const repo = await prisma.repo.upsert({
      where: { owner_name: { owner, name } },
      update: {},
      create: { owner, name },
    });

    // 🌐 Fetch from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}/languages`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data: Record<string, number> = await response.json();
    // e.g., { "TypeScript": 1200, "JavaScript": 800 }

    // 🪄 Upsert each language
    const upsertOps = Object.entries(data).map(async ([language, bytes]) =>
      prisma.repoLanguage.upsert({
        where: { repo_id_language: { repo_id: repo.id, language } },
        update: { bytes_of_code: BigInt(bytes) },
        create: {
          repo_id: repo.id,
          language,
          bytes_of_code: BigInt(bytes),
        },
      })
    );

    await Promise.all(upsertOps);

    // ✅ Return normalized response
    const updatedLanguages = await prisma.repoLanguage.findMany({
      where: { repo_id: repo.id },
      orderBy: { bytes_of_code: "desc" },
    });

    const normalized = normalizeLanguages(updatedLanguages);

    return NextResponse.json({
      totalLanguages: normalized.length,
      languages: normalized,
    });
  } catch (error) {
    console.error("POST error (languages):", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------------------- GET: Fetch from DB (fallback to POST) ----------------------
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
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    // 🔁 Fallback to POST if no repo
    if (!repo) {
      return POST(request);
    }

    const languagesRaw = await prisma.repoLanguage.findMany({
      where: { repo_id: repo.id },
      orderBy: { bytes_of_code: "desc" },
    });

    // 🔁 Fallback to POST if no language data
    if (!languagesRaw.length) {
      return POST(request);
    }

    const normalized = normalizeLanguages(languagesRaw);

    return NextResponse.json({
      totalLanguages: normalized.length,
      languages: normalized,
    });
  } catch (error) {
    console.error("GET error (languages):", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
