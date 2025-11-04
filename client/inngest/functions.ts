import { inngest } from "@/inngest/client";

export const getRepo = inngest.createFunction(
  { id: "getReaction" },
  { event: "repo/get" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);
