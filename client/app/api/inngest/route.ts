import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";

import {
  fetchRepoData,
  syncCommits,
  syncContributors,
  syncIssues,
  syncLanguages,
  syncParticipation,
  syncPulls,
  syncReleases,
  syncWeeklyCommits,
} from "@/inngest/functions";

// export const { GET, POST, PUT } = serve({
//   client: inngest,
//   functions: [
//     fetchRepoData,
//     syncCommits,
//     fetchContributors,
//     syncIssues,
//     syncLanguages,
//     syncParticipation,
//     syncPulls,
//     syncReleases,
//     syncWeeklyCommits,
//   ],
// });

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    fetchRepoData,
    syncCommits,
    syncWeeklyCommits,
    syncContributors,
    syncIssues,
    syncPulls,
    syncReleases,
  ],
});
