import { prisma } from "@/utils/prisma";
import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";

// ---------------- BigInt-safe JSON ----------------
function safeJSON(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// ---------------- Main GET Handler ----------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl)
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });

  const [owner, name] = repoUrl.split("/");
  if (!owner || !name)
    return NextResponse.json(
      { error: "Invalid repoUrl format" },
      { status: 400 }
    );

  try {
    // 1️⃣ Try fetching repo from DB
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
      include: { commits: true },
    });

    // 2️⃣ If repo not found → trigger Inngest function
    if (!repo) {
      console.log(
        `GET: Repo not found for ${owner}/${name}, triggering Inngest sync`
      );

      // Trigger Inngest background function
      const event = await inngest.send({
        name: "repo/sync.overview",
        data: { owner, name },
      });

      return NextResponse.json({
        status: "queued",
        message: `Repo fetch started for ${owner}/${name}`,
      });
    }

    // 3️⃣ Repo exists → return DB data safely
    return NextResponse.json(safeJSON(repo));
  } catch (error) {
    console.error("GET /get-repo error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
