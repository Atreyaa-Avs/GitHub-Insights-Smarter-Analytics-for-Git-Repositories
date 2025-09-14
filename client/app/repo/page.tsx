"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import { Card } from "your-shadcn-ui-path"; // replace with actual import
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

const fetchData = async (endpoint: string, repoUrl: string) => {
  const res = await fetch(
    `/api/${endpoint}?repoUrl=${encodeURIComponent(repoUrl)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return res.json();
};

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const repoQuery = useQuery({
    queryKey: ["repo", decodedRepo],
    queryFn: () => fetchData("get-repo", decodedRepo),
    enabled: !!decodedRepo,
  });

  const commitsQuery = useQuery({
    queryKey: ["commits", decodedRepo],
    queryFn: () => fetchData("get-commits", decodedRepo),
    enabled: !!decodedRepo,
  });

  const pullsQuery = useQuery({
    queryKey: ["pulls", decodedRepo],
    queryFn: () => fetchData("get-pulls", decodedRepo),
    enabled: !!decodedRepo,
  });

  const issuesQuery = useQuery({
    queryKey: ["issues", decodedRepo],
    queryFn: () => fetchData("get-issues", decodedRepo),
    enabled: !!decodedRepo,
  });

  const contributorsQuery = useQuery({
    queryKey: ["contributors", decodedRepo],
    queryFn: () => fetchData("get-contributors", decodedRepo),
    enabled: !!decodedRepo,
  });

  const codeFreqQuery = useQuery({
    queryKey: ["code-frequency", decodedRepo],
    queryFn: () => fetchData("get-code-frequency", decodedRepo),
    enabled: !!decodedRepo,
  });

  const languagesQuery = useQuery({
    queryKey: ["languages", decodedRepo],
    queryFn: () => fetchData("get-languages", decodedRepo),
    enabled: !!decodedRepo,
  });

  const participationQuery = useQuery({
    queryKey: ["participation", decodedRepo],
    queryFn: () => fetchData("get-participation", decodedRepo),
    enabled: !!decodedRepo,
  });

  const releasesQuery = useQuery({
    queryKey: ["releases", decodedRepo],
    queryFn: () => fetchData("get-releases", decodedRepo),
    enabled: !!decodedRepo,
  });

  const topicsQuery = useQuery({
    queryKey: ["topics", decodedRepo],
    queryFn: () => fetchData("get-topics", decodedRepo),
    enabled: !!decodedRepo,
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-200 dark:bg-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between w-full py-4 px-6 bg-white dark:bg-black border-b-[3px]">
        <Button
          onClick={() => router.back()}
          className="cursor-pointer dark:bg-white font-bold"
        >
          <ArrowLeft />
          Go Back
        </Button>
        <h1 className="font-bold text-2xl">
          {repoQuery.isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            repoQuery.data?.name
          )}
        </h1>
        <div className="mt-1 md:mt-2 scale-75 md:scale-100">
          <AnimatedThemeToggler />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="grid grid-cols-2 gap-4 px-8">
          {/* Row 1 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Repository Overview</h2>
            {repoQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <div>
                <p>
                  <strong>Name:</strong> {repoQuery.data.name}
                </p>
                <p>
                  <strong>Description:</strong> {repoQuery.data.description}
                </p>
                <p>
                  <strong>Stars:</strong> {repoQuery.data.stargazers_count}
                </p>
                <p>
                  <strong>Watchers:</strong>{" "}
                  {repoQuery.data.subscribers_count ||
                    repoQuery.data.watchers_count}
                </p>
                <p>
                  <strong>Forks:</strong> {repoQuery.data.forks_count}
                </p>
                <p>
                  <strong>Branches:</strong> {repoQuery.data.branch_count}
                </p>
                <p>
                  <strong>Tags:</strong> {repoQuery.data.tag_count}
                </p>
                <p>
                  <strong>Main Language:</strong> {repoQuery.data.language}
                </p>
                <p>
                  <strong>Size:</strong>{" "}
                  {(repoQuery.data.size / 1024).toFixed(1)} MB
                </p>
                <p>
                  <strong>License:</strong>{" "}
                  {repoQuery.data.license?.name || "N/A"}
                </p>
                <p>
                  <strong>Default Branch:</strong>{" "}
                  {repoQuery.data.default_branch}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(repoQuery.data.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(repoQuery.data.updated_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Last Commit:</strong>{" "}
                  {repoQuery.data.last_commit
                    ? new Date(repoQuery.data.last_commit).toLocaleDateString()
                    : "N/A"}
                </p>
                {repoQuery.data.topics && repoQuery.data.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {repoQuery.data.topics.map((topic) => (
                      <span
                        key={topic}
                        className="bg-blue-100 text-blue-700 rounded-full px-2 text-xs font-semibold"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
                <p>
                  <strong>Open Issues:</strong>{" "}
                  {repoQuery.data.open_issues_count}
                </p>
                <p>
                  <strong>Open PRs:</strong> {repoQuery.data.open_prs_count}
                </p>
                {repoQuery.data.homepage && (
                  <p>
                    <strong>Homepage:</strong>{" "}
                    <a
                      href={repoQuery.data.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600"
                    >
                      {repoQuery.data.homepage}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Commit History</h2>
            {commitsQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <>
                <p>Total Commits: {commitsQuery.data.totalCommits}</p>
                <ul className="mt-4 space-y-2">
                  {commitsQuery.data.recentCommits.map((commit, idx) => (
                    <li
                      key={idx}
                      className="border-b border-gray-200 pb-2 dark:border-gray-700"
                    >
                      <p className="font-semibold">
                        {commit.commit.message
                          .split(" ")
                          .slice(0, 10)
                          .join(" ")}
                        {commit.commit.message.split(" ").length > 10
                          ? "..."
                          : ""}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {commit.commit.author.name} on{" "}
                        {new Date(
                          commit.commit.author.date
                        ).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Row 2 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Pull Requests</h2>
            {pullsQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <>
                <p>Total PRs: {pullsQuery.data.totalCount}</p>{" "}
                {/* Use totalCount */}
                <ul className="mt-4 space-y-2">
                  {pullsQuery.data?.pulls.map((pr, idx) => {
                    const shortTitle =
                      pr.title.split(" ").slice(0, 10).join(" ") +
                      (pr.title.split(" ").length > 10 ? "..." : "");
                    return (
                      <li
                        key={idx}
                        className="border-b border-gray-200 pb-2 dark:border-gray-700"
                      >
                        <p className="font-semibold">{shortTitle}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pr.user.login} opened on{" "}
                          {new Date(pr.created_at).toLocaleDateString()}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto mt-6">
            <h2 className="text-xl font-bold mb-2">Issues</h2>
            {issuesQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <>
                <p>Total Issues: {issuesQuery.data.totalCount}</p>{" "}
                {/* Use totalCount */}
                <ul className="mt-4 space-y-2">
                  {issuesQuery.data.issues.map((issue, idx) => {
                    const shortTitle =
                      issue.title.split(" ").slice(0, 10).join(" ") +
                      (issue.title.split(" ").length > 10 ? "..." : "");
                    return (
                      <li
                        key={idx}
                        className="border-b border-gray-200 pb-2 dark:border-gray-700"
                      >
                        <p className="font-semibold">{shortTitle}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {issue.user.login} opened on{" "}
                          {new Date(issue.created_at).toLocaleDateString()}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {/* Row 3 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Top Contributors</h2>
            {contributorsQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <ul>
                {contributorsQuery.data.slice(0, 5).map((contrib, idx) => (
                  <li key={idx}>
                    {contrib.login ? contrib.login : "Unknown"} –{" "}
                    {contrib.contributions ?? "Unknown"} commits
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Code Frequency</h2>
            {codeFreqQuery.isLoading || !codeFreqQuery.data ? (
              <Skeleton className="h-6 w-full" />
            ) : codeFreqQuery.data.message ? (
              <p>{codeFreqQuery.data.message}</p> // Shows generation message
            ) : Array.isArray(codeFreqQuery.data) ? (
              <p>Weeks of activity: {codeFreqQuery.data.length}</p> // Valid array here
            ) : (
              <p>No code frequency data available</p> // Fallback for unexpected shape
            )}
          </div>

          {/* Row 4 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Languages</h2>
            {languagesQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <ul>
                {Object.entries(languagesQuery.data)
                  .sort((a, b) => b[1] - a[1]) // sort descending by bytes
                  .slice(0, 15) // take top 15
                  .map(([lang, bytes]) => (
                    <li key={lang}>
                      {lang}: {bytes} bytes
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-96 mx-auto flex flex-col overflow-auto scrollbar-hide">
            <h2 className="text-xl font-bold mb-2 flex-shrink-0">
              Participation
            </h2>
            {participationQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : participationQuery.data.message ? (
              <p>{participationQuery.data.message}</p>
            ) : (
              <>
                <p>Total weeks: {participationQuery.data.all.length}</p>
                <ul className="mt-2 flex-1 overflow-auto scrollbar-hide">
                  {participationQuery.data.all.map((count, idx) => (
                    <li key={idx}>
                      Week {idx + 1}: {count} commits
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Row 5 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Releases</h2>
            {releasesQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <>
                <p>Total Releases: {releasesQuery.data.totalCount}</p>
                <ul className="mt-4 space-y-2">
                  {releasesQuery.data.releases.map((release, idx) => (
                    <li
                      key={idx}
                      className="border-b border-gray-200 pb-2 dark:border-gray-700"
                    >
                      <p className="font-semibold">
                        {release.name || release.tag_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Published on{" "}
                        {new Date(release.published_at).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Topics</h2>
            {topicsQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <ul>
                {topicsQuery.data.names.map((topic: string, idx: number) => (
                  <li key={idx}>{topic}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
