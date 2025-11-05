import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

// Fetch GitHub repo metadata and return it
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl || !repoUrl.includes("/")) {
    return NextResponse.json({ error: "Valid repoUrl is required" }, { status: 400 });
  }

  const [owner, name] = repoUrl.split("/");

  try {
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });

    if (repo) {
      return NextResponse.json(repo);
    }

    // If repo doesn't exist in DB, return queued status
    return NextResponse.json({ status: "queued" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
