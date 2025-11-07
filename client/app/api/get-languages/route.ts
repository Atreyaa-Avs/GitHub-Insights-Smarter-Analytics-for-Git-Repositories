import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

// ---------------------- Helper: normalize languages ----------------
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
      console.log(`GET: Repo ${owner}/${name} not found, triggering language sync...`);
      await inngest.send({
        name: "repo/sync.languages",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Language sync started for ${owner}/${name}`,
      });
    }

    // Fetch languages from DB
    const languagesRaw = await prisma.repoLanguage.findMany({
      where: { repo_id: repo.id },
      orderBy: { bytes_of_code: "desc" },
    });

    // If no languages → trigger Inngest background sync
    if (!languagesRaw.length) {
      console.log(`GET: No languages in DB for ${owner}/${name}, triggering sync...`);
      await inngest.send({
        name: "repo/sync.languages",
        data: { owner, name },
      });
      return NextResponse.json({
        status: "queued",
        message: `Language sync started for ${owner}/${name}`,
      });
    }

    const normalized = normalizeLanguages(languagesRaw);

    return NextResponse.json({
      totalLanguages: normalized.length,
      languages: normalized,
      source: "Database",
    });
  } catch (error) {
    console.error("GET /languages error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
