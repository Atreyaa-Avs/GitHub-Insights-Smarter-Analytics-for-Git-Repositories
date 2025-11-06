// /app/api/trigger-sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  try {
    const { owner, name } = await req.json();

    const functions = [
      "sync-overview",
      "sync-commits",
      "sync-contributors",
      "sync-issues",
      "sync-languages",
      "sync-participation",
      "sync-pulls",
      "sync-releases",
      "sync-weekly-commits",
    ];

    await Promise.all(
      functions.map((fn) =>
        inngest.send({
          name: fn,
          data: { owner, name },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
