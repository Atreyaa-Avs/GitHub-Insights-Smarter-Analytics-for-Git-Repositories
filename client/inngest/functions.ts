import { inngest } from "./inngest";

export const fetchGitHubData = inngest.createFunction(
  { id: "fetch-github-data" },
  { cron: "*/5 * * * *" }, // every 5 minutes
  async ({ step }) => {
    await step.run("Fetch Repos API", async () => {
      const res = await fetch("http://localhost:3000/api/get-repo");
      if (!res.ok) throw new Error("Failed to fetch repos");
      return res.json();
    });

    await step.run("Fetch Commits API", async () => {
      const res = await fetch("http://localhost:3000/api/get-commit");
      if (!res.ok) throw new Error("Failed to fetch commits");
      return res.json();
    });

    console.log("GitHub data fetched successfully");
  }
);
