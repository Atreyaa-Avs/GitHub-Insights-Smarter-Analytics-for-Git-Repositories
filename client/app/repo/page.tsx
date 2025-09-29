"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// Simple fetch for repo GET → POST fallback
const fetchRepo = async (repoUrl: string) => {
  let res = await fetch(`/api/get-repo?repoUrl=${encodeURIComponent(repoUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch repo GET");

  let data = await res.json();

  // If empty, fallback to POST
  if (!data || Object.keys(data).length === 0 || "message" in data) {
    res = await fetch(`/api/get-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });
    if (!res.ok) throw new Error("Failed to fetch repo POST");
    data = await res.json();
  }

  return data;
};

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const repoQuery = useQuery({
    queryKey: ["repo", decodedRepo],
    queryFn: () => fetchRepo(decodedRepo),
    enabled: !!decodedRepo,
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-200 dark:bg-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between w-full py-4 px-6 bg-white dark:bg-black border-b-[3px]">
        <Button onClick={() => router.back()} className="cursor-pointer dark:bg-white font-bold">
          <ArrowLeft />
          Go Back
        </Button>
        <h1 className="font-bold text-2xl">
          {repoQuery.isLoading ? <Skeleton className="h-8 w-48" /> : repoQuery.data?.name}
        </h1>
      </div>

      {/* Repository Overview */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="grid grid-cols-1 gap-4 px-8">
          <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
            <h2 className="text-xl font-bold mb-2">Repository Overview</h2>
            {repoQuery.isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : repoQuery.isError ? (
              <p className="text-red-500">{(repoQuery.error as Error)?.message}</p>
            ) : (
              (() => {
                const data = repoQuery.data ?? {};

                return (
                  <div className="space-y-1">
                    <p><strong>Name:</strong> {data.name ?? "N/A"}</p>
                    <p><strong>Description:</strong> {data.description ?? "—"}</p>
                    <p><strong>Visibility:</strong> {data.visibility ?? "—"}</p>
                    <p><strong>Default Branch:</strong> {data.default_branch ?? "—"}</p>
                    <p><strong>Created At:</strong> {data.created_at ? new Date(data.created_at).toLocaleDateString() : "—"}</p>
                    <p><strong>Updated At:</strong> {data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "—"}</p>
                    <p><strong>Last Pushed:</strong> {data.pushed_at ? new Date(data.pushed_at).toLocaleDateString() : "—"}</p>
                    <p><strong>Stars:</strong> {data.stargazers_count ?? 0}</p>
                    <p><strong>Watchers:</strong> {data.watchers_count ?? 0}</p>
                    <p><strong>Subscribers:</strong> {data.subscribers_count ?? 0}</p>
                    <p><strong>Forks:</strong> {data.forks_count ?? 0}</p>
                    <p><strong>Branches:</strong> {data.branch_count ?? 0}</p>
                    <p><strong>Tags:</strong> {data.tag_count ?? 0}</p>
                    <p><strong>Open PRs:</strong> {data.open_prs_count ?? 0}</p>
                    <p><strong>Open Issues:</strong> {data.open_issues_count ?? 0}</p>
                    <p><strong>Size:</strong> {((data.size_kb ?? 0) / 1024).toFixed(1)} MB</p>
                    <p><strong>Main Language:</strong> {data.language ?? "—"}</p>
                    <p><strong>License:</strong> {data.license_name ?? "—"}</p>
                    <p><strong>Homepage:</strong> {data.homepage ? <a href={data.homepage} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{data.homepage}</a> : "—"}</p>
                    <p><strong>Last Commit:</strong> {data.last_commit ? new Date(data.last_commit).toLocaleDateString() : "N/A"}</p>
                    {Array.isArray(data.topics) && data.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {data.topics.map((topic: string) => (
                          <span key={topic} className="bg-blue-100 text-blue-700 rounded-full px-2 text-xs font-semibold">{topic}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
