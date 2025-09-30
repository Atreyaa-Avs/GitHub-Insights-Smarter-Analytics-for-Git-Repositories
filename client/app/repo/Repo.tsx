"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface RepoData {
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

function formatIndianNumber(num: number | string): string {
  return new Intl.NumberFormat("en-IN").format(Number(num));
}

const Repo = () => {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const [data, setData] = useState<RepoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!decodedRepo) return;

    const fetchRepo = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const res = await fetch(
          `/api/get-repo?repoUrl=${encodeURIComponent(decodedRepo)}`
        );
        if (!res.ok) throw new Error("Failed to fetch repo GET");

        const result = await res.json();
        if (
          !result ||
          Object.keys(result).length === 0 ||
          "message" in result
        ) {
          setData(null);
        } else {
          setData({
            name: result.name,
            description: result.description,
            visibility: result.visibility,
            default_branch: result.default_branch,
            created_at: result.created_at,
            updated_at: result.updated_at,
            pushed_at: result.pushed_at,
            stargazers_count: result.stargazers_count,
            watchers_count: result.watchers_count,
            subscribers_count: result.subscribers_count,
            forks_count: result.forks_count,
            branch_count: result.branch_count,
            tag_count: result.tag_count,
            open_prs_count: result.open_prs_count,
            open_issues_count: result.open_issues_count,
            size_kb: result.size_kb,
            language: result.language,
            license_name: result.license_name,
            homepage: result.homepage,
            last_commit: result.last_commit,
            topics: Array.isArray(result.topics) ? result.topics : [],
          });
        }
      } catch (err) {
        setIsError(true);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepo();
  }, [decodedRepo]);

  const renderField = (value: any, isNumber = false) => {
    if (isLoading) return <Skeleton className="h-5 w-32" />;
    if (!value) return null;
    return isNumber ? formatIndianNumber(value) : value;
  };

  const renderDateField = (dateStr?: string) => {
    if (isLoading) return <Skeleton className="h-5 w-32" />;
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  const renderLinkField = (url?: string) => {
    if (isLoading) return <Skeleton className="h-5 w-32" />;
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-600"
      >
        {url}
      </a>
    );
  };

  if (isError) {
    return <p className="text-red-500">Failed to load repository data.</p>;
  }

  if (!data && !isLoading) {
    return <p className="text-gray-500">No data available</p>;
  }

  return (
    <div className="flex-1 p-3 overflow-auto">
      <div className="grid grid-cols-1 gap-4 px-8">
        <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-acternity w-full max-w-md h-auto mx-auto">
          <h2 className="text-xl font-bold mb-2">Repository Overview</h2>

          <div className="flex flex-col gap-2">
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
              <strong>Default Branch:</strong>{" "}
              {renderField(data?.default_branch)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Created At:</strong> {renderDateField(data?.created_at)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Updated At:</strong> {renderDateField(data?.updated_at)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Last Pushed:</strong> {renderDateField(data?.pushed_at)}
            </p>

            <p className="inline-flex items-center gap-2">
              <strong>Stars:</strong>{" "}
              {renderField(data?.stargazers_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Watchers:</strong>{" "}
              {renderField(data?.watchers_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Subscribers:</strong>{" "}
              {renderField(data?.subscribers_count, true)}
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
              <strong>Open PRs:</strong>{" "}
              {renderField(data?.open_prs_count, true)}
            </p>
            <p className="inline-flex items-center gap-2">
              <strong>Open Issues:</strong>{" "}
              {renderField(data?.open_issues_count, true)}
            </p>

            <p className="inline-flex items-center gap-2">
              <strong>Size:</strong>{" "}
              {data?.size_kb ? (
                formatIndianNumber((data.size_kb / 1024).toFixed(1)) + " MB"
              ) : isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : null}
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

          {data?.topics && data.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.topics.map((topic) => (
                <span
                  key={topic}
                  className="bg-blue-100 text-blue-700 rounded-full px-2 text-xs font-semibold"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Repo;
