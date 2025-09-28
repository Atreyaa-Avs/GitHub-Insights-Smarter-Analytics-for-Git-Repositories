"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

  const topCommittersQuery = useQuery({
    queryKey: ["top-committers", decodedRepo],
    queryFn: () => fetchData("get-top-committers", decodedRepo),
    enabled: !!decodedRepo,
  });

  const weeklyCommitsQuery = useQuery({
    queryKey: ["weekly-commits", decodedRepo],
    queryFn: () => fetchData("get-weekly-commits", decodedRepo),
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

            {repoQuery.isPending ? (
              <Skeleton className="h-6 w-full" />
            ) : repoQuery.isError ? (
              <p className="text-red-500">
                {(repoQuery.error as Error)?.message ??
                  "Failed to load repository"}
              </p>
            ) : (
              (() => {
                const data = repoQuery.data ?? {};

                const name = data.name ?? "N/A";
                const description = data.description ?? "—";
                const stars = data.stargazers_count ?? 0;
                const watchers =
                  data.subscribers_count ?? data.watchers_count ?? 0;
                const forks = data.forks_count ?? 0;
                const branches = data.branch_count ?? 0;
                const tags = data.tag_count ?? 0;
                const language = data.language ?? "—";
                const sizeKB = typeof data.size === "number" ? data.size : 0;
                const sizeMB = (sizeKB / 1024).toFixed(1);

                const licenseName =
                  data.license?.name ?? data.license_name ?? "N/A";
                const defaultBranch = data.default_branch ?? "—";

                const createdAt = data.created_at
                  ? new Date(data.created_at).toLocaleDateString()
                  : "—";
                const updatedAt = data.updated_at
                  ? new Date(data.updated_at).toLocaleDateString()
                  : "—";
                const lastCommit = data.last_commit
                  ? new Date(data.last_commit).toLocaleDateString()
                  : "N/A";

                const topics: string[] = Array.isArray(data.topics)
                  ? data.topics
                  : [];
                const openIssues = data.open_issues_count ?? 0;
                const openPRs = data.open_prs_count ?? 0;
                const homepage = data.homepage ?? "";

                return (
                  <div>
                    <p>
                      <strong>Name:</strong> {name}
                    </p>
                    <p>
                      <strong>Description:</strong> {description}
                    </p>
                    <p>
                      <strong>Stars:</strong> {stars}
                    </p>
                    <p>
                      <strong>Watchers:</strong> {watchers}
                    </p>
                    <p>
                      <strong>Forks:</strong> {forks}
                    </p>
                    <p>
                      <strong>Branches:</strong> {branches}
                    </p>
                    <p>
                      <strong>Tags:</strong> {tags}
                    </p>
                    <p>
                      <strong>Main Language:</strong> {language}
                    </p>
                    <p>
                      <strong>Size:</strong> {sizeMB} MB
                    </p>
                    <p>
                      <strong>License:</strong> {licenseName}
                    </p>
                    <p>
                      <strong>Default Branch:</strong> {defaultBranch}
                    </p>
                    <p>
                      <strong>Created:</strong> {createdAt}
                    </p>
                    <p>
                      <strong>Last Updated:</strong> {updatedAt}
                    </p>
                    <p>
                      <strong>Last Commit:</strong> {lastCommit}
                    </p>

                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {topics.map((topic: string) => (
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
                      <strong>Open Issues:</strong> {openIssues}
                    </p>
                    <p>
                      <strong>Open PRs:</strong> {openPRs}
                    </p>

                    {homepage && (
                      <p>
                        <strong>Homepage:</strong>{" "}
                        <a
                          href={homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600"
                        >
                          {homepage}
                        </a>
                      </p>
                    )}
                  </div>
                );
              })()
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
                  {commitsQuery.data.recentCommits.map(
                    (commit: any, idx: number) => (
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
                    )
                  )}
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
                  {pullsQuery.data?.pulls.map((pr: any, idx: number) => {
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
                  {issuesQuery.data.issues.map((issue: any, idx: number) => {
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
                {contributorsQuery.data
                  .slice(0, 10)
                  .map((contrib: any, idx: number) => (
                    <li key={idx}>
                      {contrib.login ? contrib.login : "Unknown"} –{" "}
                      {contrib.contributions ?? "Unknown"} commits
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Top Committers</h2>
            {topCommittersQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : topCommittersQuery.error ? (
              <p className="text-red-600">Error loading data.</p>
            ) : (
              <div className="relative w-full h-52">
                <Bar
                  data={{
                    labels: topCommittersQuery.data.map((c: any) => c.login),
                    datasets: [
                      {
                        label: "Commits",
                        data: topCommittersQuery.data.map(
                          (c: any) => c.contributions
                        ),
                        backgroundColor: "#0ea5e9",
                        borderRadius: 6,
                        maxBarThickness: 26,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y",
                    plugins: { legend: { display: false } },
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { beginAtZero: true, grid: { display: false } },
                      y: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Row 4 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Languages</h2>
            {languagesQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <ul>
                {(Object.entries(languagesQuery.data) as [string, number][])
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
                  {participationQuery.data.all.map(
                    (count: any, idx: number) => (
                      <li key={idx}>
                        Week {idx + 1}: {count} commits
                      </li>
                    )
                  )}
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
                  {releasesQuery.data.releases.map(
                    (release: any, idx: number) => (
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
                    )
                  )}
                </ul>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-[400px] mx-auto">
            <h2 className="text-xl font-bold mb-2">Commits This Year</h2>
            {weeklyCommitsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : weeklyCommitsQuery.error ? (
              <p className="text-red-600">Error loading weekly commit stats.</p>
            ) : weeklyCommitsQuery.data?.message ? (
              <p>{weeklyCommitsQuery.data.message}</p>
            ) : (
              <div className="relative w-full h-72">
                <Bar
                  data={{
                    labels: weeklyCommitsQuery.data.map(
                      (entry: any) => entry.week
                    ),
                    datasets: [
                      {
                        label: "Commits",
                        data: weeklyCommitsQuery.data.map(
                          (entry: any) => entry.total
                        ),
                        backgroundColor: "#22c55e", // nice green
                        borderRadius: 4,
                        maxBarThickness: 18,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: (context) => `Commits: ${context.parsed.y}`,
                          title: (items) => `Week of ${items[0].label}`,
                        },
                      },
                      title: {
                        display: true,
                        text: "Commits per Week (Hover for details)",
                        font: { size: 18 },
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          autoSkip: true,
                          maxTicksLimit: 12,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { display: true, color: "#e5e7eb" },
                        title: { display: true, text: "Commits" },
                      },
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
