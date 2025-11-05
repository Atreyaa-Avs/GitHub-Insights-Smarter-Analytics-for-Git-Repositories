"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ------------------- Types -------------------
type Issue = {
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author: { login: string };
};

interface IssuesApiResponse {
  issues: Issue[];
  totalCount: number;
}

// ------------------- Fetch Function -------------------
const fetchIssues = async (repoUrl: string): Promise<IssuesApiResponse> => {
  const res = await fetch(`/api/get-issues?repoUrl=${encodeURIComponent(repoUrl)}`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch issues");

  return {
    issues: (data.issues || []).map((i: any) => ({
      number: i.number ?? 0,
      title: i.title || "Untitled Issue",
      state: i.state || "open",
      created_at: i.created_at || new Date().toISOString(),
      updated_at: i.updated_at || new Date().toISOString(),
      closed_at: i.closed_at ?? null,
      author: { login: i.author?.login || "Unknown" },
    })),
    totalCount: data.totalCount ?? data.issues?.length ?? 0,
  };
};

// ------------------- Component -------------------
export default function Issues() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const [currentPage, setCurrentPage] = useState(1);
  const issuesPerPage = 5;

  // ------------------- React Query -------------------
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["issues", decodedRepo],
    queryFn: () => fetchIssues(decodedRepo),
    enabled: !!decodedRepo,
  });

  const issues = data?.issues || [];
  const totalCount = data?.totalCount || 0;

  // ------------------- Pagination -------------------
  const totalPages = Math.ceil(issues.length / issuesPerPage);
  const currentIssues = issues.slice(
    (currentPage - 1) * issuesPerPage,
    currentPage * issuesPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ------------------- Loading UI -------------------
  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-2xl p-4 shadow-sm flex flex-col gap-2"
            >
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------- Error UI -------------------
  if (isError) {
    return (
      <div className="p-6 text-red-500">
        ⚠️ Error loading issues: {(error as Error)?.message}
      </div>
    );
  }

  // ------------------- Empty State -------------------
  if (!issues.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No open issues found for this repository.
      </div>
    );
  }

  // ------------------- Issues List -------------------
  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold mb-6">
        Open Issues ({totalCount})
      </h2>

      <div className="space-y-7">
        {currentIssues.map((issue) => (
          <div
            key={issue.number}
            className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col gap-2">
              <a
                href={`https://github.com/${decodedRepo}/issues/${issue.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-medium hover:underline"
              >
                #{issue.number} — {issue.title}
              </a>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground items-center">
                <Badge
                  variant={issue.state === "open" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {issue.state}
                </Badge>
                <span>by {issue.author?.login}</span>
                <span>• created {new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------- Pagination ------------------- */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  } cursor-pointer`}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`${
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  } cursor-pointer`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
