"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface RepoData {
  id: number;
  name: string;
  description?: string;
  visibility?: string;
  default_branch?: string;
  created_at?: string;
  updated_at?: string;
  pushed_at?: string;
  stargazers_count?: number;
  watchers_count?: number;
  subscribers_count?: number;
  forks_count?: number;
  branch_count?: number;
  tag_count?: number;
  open_prs_count?: number;
  open_issues_count?: number;
  size_kb?: number;
  language?: string;
  license_name?: string;
  homepage?: string;
  last_commit?: string;
  topics?: string[];
}

const fetchRepo = async (repoUrl: string): Promise<RepoData | null> => {
  const res = await fetch(`/api/get-repo?repoUrl=${encodeURIComponent(repoUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch repository");
  const data = await res.json();

  if (!data.name) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    visibility: data.visibility,
    default_branch: data.default_branch,
    created_at: data.created_at,
    updated_at: data.updated_at,
    pushed_at: data.pushed_at,
    stargazers_count: data.stargazers_count,
    watchers_count: data.watchers_count,
    subscribers_count: data.subscribers_count,
    forks_count: data.forks_count,
    branch_count: data.branch_count,
    tag_count: data.tag_count,
    open_prs_count: data.open_prs_count,
    open_issues_count: data.open_issues_count,
    size_kb: data.size_kb,
    language: data.language,
    license_name: data.license_name,
    homepage: data.homepage,
    last_commit: data.last_commit,
    topics: Array.isArray(data.topics) ? data.topics : [],
  };
};

function formatIndianNumber(num: number | string): string {
  return new Intl.NumberFormat("en-IN").format(Number(num));
}

const Repo = () => {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["repo", decodedRepo],
    queryFn: () => fetchRepo(decodedRepo),
    enabled: !!decodedRepo,
    refetchInterval: 3000, // keeps retrying every 3s
  });

  const renderField = (value?: string | number, isNumber = false) => {
    if (isLoading || !value) return <Skeleton className="h-5 w-32" />;
    // if (!value) return <span className="text-gray-500">—</span>;
    return isNumber ? formatIndianNumber(value) : value;
  };

  const renderDateField = (dateStr?: string) => {
    if (isLoading || !dateStr) return <Skeleton className="h-5 w-32" />;
    // if (!dateStr) return <span className="text-gray-500">—</span>;
    return new Date(dateStr).toLocaleDateString();
  };

  const renderLinkField = (url?: string) => {
    if (isLoading || !url) return <Skeleton className="h-5 w-32" />;
    // if (!url) return <span className="text-gray-500">—</span>;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
        {url}
      </a>
    );
  };

  if (isError) return <p className="text-red-500">Failed to load repository data.</p>;

  return (
    <div className="flex-1 mt-4 overflow-auto">
      <div className="grid grid-cols-1">
        <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full h-auto">
          <h2 className="text-2xl font-bold mt-3 mb-4">Repository Overview</h2>

          <div className="flex flex-col gap-3">
            <p className="inline-flex items-center gap-2">
              <strong>Name:</strong> {renderField(data?.name)}
            </p>
            <p className="inline-flex items-start gap-2">
              <strong>Description:</strong> {renderField(data?.description)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Visibility:</strong> {renderField(data?.visibility)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Default Branch:</strong> {renderField(data?.default_branch)}
            </p>
            {/* <p className="inline-flex items-center gap-2">
              <strong>Created At:</strong> {renderDateField(data?.created_at)}
            </p> */}
            <p className="inline-flex items-center gap-2">
              <strong>Updated At:</strong> {renderDateField(data?.updated_at)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Last Pushed:</strong> {renderDateField(data?.pushed_at)}
            </p>

            <p className="inline-flex items-center gap-2">
              <strong>Stars:</strong> {renderField(data?.stargazers_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Watchers:</strong> {renderField(data?.watchers_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Subscribers:</strong> {renderField(data?.subscribers_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Forks:</strong> {renderField(data?.forks_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Branches:</strong> {renderField(data?.branch_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Tags:</strong> {renderField(data?.tag_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Open PRs:</strong> {renderField(data?.open_prs_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Open Issues:</strong> {renderField(data?.open_issues_count, true)}
            </p>

            <p className="inline-flex items-center gap-2">
              <strong>Size:</strong>{" "}
              {data?.size_kb ? `${formatIndianNumber((data.size_kb / 1024).toFixed(1))} MB` : <Skeleton className="h-5 w-32" />}
            </p>

            <p className="inline-flex items-center gap-2">
              <strong>Main Language:</strong> {renderField(data?.language)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>License:</strong> {renderField(data?.license_name)}
            </p>
            <p className="inline-flex items-start gap-2">
              <strong>Homepage:</strong> {renderLinkField(data?.homepage)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Last Commit:</strong> {renderDateField(data?.last_commit)}
            </p>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {(isLoading ? Array(3).fill(null) : data?.topics || []).map((topic, idx) => (
              <span
                key={topic || idx}
                className="bg-blue-100 text-blue-700 rounded-full px-2 text-xs font-semibold"
              >
                {topic || <Skeleton className="h-4 w-10 inline-block" />}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Repo;
