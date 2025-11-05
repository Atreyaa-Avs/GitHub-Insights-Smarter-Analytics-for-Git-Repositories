import { inngest } from "@/inngest/client";
import { prisma } from "@/utils/prisma";

export const syncAllRepos = inngest.createFunction(
  {
    id: "sync-all-repos",
    name: "Sync All Repos",
  },
  {
    cron: "0 0 * * *", // cron trigger at midnight
  },
  async ({ event }) => {
    // Fetch all repos
    const repos = await prisma.repo.findMany({ select: { owner: true, name: true } });

    // Trigger all sync functions for each repo
    for (const repo of repos) {
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

      for (const fn of functions) {
        await inngest.send({ name: fn, data: { owner: repo.owner, name: repo.name } });
      }
    }

    console.log("All repos synced at midnight");
  }
);
