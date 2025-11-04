"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const commitsPerPage = 7;

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

  return (
    <div className="flex flex-col bg-white dark:bg-black p-4 rounded-2xl shadow-acternity size-full mt-3">
      <h2 className="text-2xl font-bold mt-3 mb-4">Commit History</h2>

      {isLoading ? (
        <div className="space-y-2 h-full">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-6 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-red-500">{(error as Error)?.message}</p>
      ) : (
        <>
          <div className="h-full">
            <p className="mt-4 text-xl"><span className="font-bold text-lg">Total Commits:</span> <span className="bg-orange-500 py-1 px-4 rounded-xl text-white">{formatIndianNumber(data?.totalCommits || 0)}</span></p>
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
          </div>

          {/* ---------------- Full-Width Pagination ---------------- */}
          {totalPages > 1 && (
            <div className="w-full mt-6">
              <Pagination className="w-full flex justify-center">
                <PaginationContent className="flex flex-wrap justify-center">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      className={`${page === 1 ? "pointer-events-none opacity-50" : ""} cursor-pointer`}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink
                        onClick={() => setPage(idx + 1)}
                        isActive={page === idx + 1}
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      className={`${page === totalPages ? "pointer-events-none opacity-50" : ""} cursor-pointer`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Commits;

function formatIndianNumber(num: number | string): string {
  return new Intl.NumberFormat("en-IN").format(Number(num));
}
