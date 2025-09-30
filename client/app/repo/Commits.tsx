"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Commit {
  sha: string;
  message?: string;
  committed_at?: string;
  author?: { name?: string };
  committer?: { name?: string };
}

interface CommitsApiResponse {
  totalCommits: number;
  recentCommits: Commit[];
}

const fetchCommits = async (repoUrl: string): Promise<CommitsApiResponse> => {
  const res = await fetch(
    `/api/get-commits?repoUrl=${encodeURIComponent(repoUrl)}`
  );
  if (!res.ok) throw new Error("Failed to fetch commits");
  const data = await res.json();

  return {
    totalCommits: data.totalCommits,
    recentCommits: data.recentCommits.map((c: any) => ({
      sha: c.sha,
      message: c.message || c.commit?.message || "No message",
      committed_at:
        c.committed_at || c.commit?.committer?.date || new Date().toISOString(),
      author: {
        name:
          c.author?.name ||
          c.author_login ||
          c.commit?.author?.name ||
          "Unknown",
      },
      committer: {
        name:
          c.committer?.name ||
          c.committer_login ||
          c.commit?.committer?.name ||
          "Unknown",
      },
    })),
  };
};

const Commits = () => {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const [page, setPage] = useState(1);
  const commitsPerPage = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["commits", decodedRepo],
    queryFn: () => fetchCommits(decodedRepo),
    enabled: !!decodedRepo,
  });

  const totalPages = data
    ? Math.ceil(data.recentCommits.length / commitsPerPage)
    : 0;
  const paginatedCommits = data
    ? data.recentCommits.slice(
        (page - 1) * commitsPerPage,
        page * commitsPerPage
      )
    : [];

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="flex flex-col bg-white dark:bg-black p-4 rounded-2xl shadow-acternity size-full mt-3">
      <h2 className="text-xl font-bold mb-2">Commit History</h2>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-6 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-red-500">{(error as Error)?.message}</p>
      ) : (
        <>
          <p>Total Commits: {formatIndianNumber(data?.totalCommits || 0)}</p>
          <ul className="mt-4 space-y-2">
            {paginatedCommits.map((commit: Commit) => (
              <li
                key={commit.sha}
                className="border-b border-gray-200 pb-2 dark:border-gray-700"
              >
                <p className="font-semibold mb-2">
                  {commit.message
                    ? commit.message.split(" ").slice(0, 20).join(" ") +
                      (commit.message.split(" ").length > 20 ? "..." : "")
                    : "No message"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {commit.author?.name || "Unknown"} →{" "}
                  {commit.committer?.name || "Unknown"} on{" "}
                  {commit.committed_at
                    ? new Date(commit.committed_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </li>
            ))}
          </ul>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Commits;


function formatIndianNumber(num: number | string): string {
  return new Intl.NumberFormat('en-IN').format(Number(num));
}