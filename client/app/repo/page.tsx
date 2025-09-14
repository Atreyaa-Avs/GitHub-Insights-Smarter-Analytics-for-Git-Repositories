"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import React from "react";
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
                  <strong>Forks:</strong> {repoQuery.data.forks_count}
                </p>
                <p>
                  <strong>Language:</strong> {repoQuery.data.language}
                </p>
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Commit History</h2>
            {commitsQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <p>Total Commits: {commitsQuery.data.length}</p>
            )}
          </div>
          {/* Row 2 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Pull Requests</h2>
            {pullsQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <p>Total PRs: {pullsQuery.data.length}</p>
            )}
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Issues</h2>
            {issuesQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <p>Total Issues: {issuesQuery.data.length}</p>
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
                  .slice(0, 5)
                  .map((contrib: any, idx: number) => (
                    <li key={idx}>
                      {contrib.author ? contrib.author.login : "Unknown"} -{" "}
                      {contrib.total} commits
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Code Frequency</h2>
            {codeFreqQuery.isLoading || !codeFreqQuery.data ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <p>Weeks of activity: {codeFreqQuery.data.length}</p>
            )}
          </div>
          {/* Row 4 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Languages</h2>
            {languagesQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <ul>
                {Object.keys(languagesQuery.data).map((lang) => (
                  <li key={lang}>
                    {lang}: {languagesQuery.data[lang]} bytes
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Participation</h2>
            {participationQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <p>Total weeks: {participationQuery.data.all.length}</p>
            )}
          </div>
          {/* Row 5 */}
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Releases</h2>
            {releasesQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <p>Total Releases: {releasesQuery.data.length}</p>
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
