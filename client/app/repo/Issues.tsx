"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Issue = {
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author: { login: string };
};

export default function Issues() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl");

  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const issuesPerPage = 5;

  useEffect(() => {
    if (!repoUrl) return;

    async function fetchIssues() {
      try {
        setLoading(true);
        const res = await fetch(`/api/get-issues?repoUrl=${repoUrl}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch issues");

        setIssues(data.issues || []);
        setTotalCount(data.totalCount || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchIssues();
  }, [repoUrl]);

  const totalPages = Math.ceil(issues.length / issuesPerPage);
  const startIndex = (currentPage - 1) * issuesPerPage;
  const currentIssues = issues.slice(startIndex, startIndex + issuesPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ---------------------- Skeleton Loading ----------------------
  if (loading) {
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

  // ---------------------- Error UI ----------------------
  if (error) {
    return (
      <div className="p-6 text-red-500">
        ⚠️ Error loading issues: {error}
      </div>
    );
  }

  // ---------------------- Empty UI ----------------------
  if (!issues.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No open issues found for this repository.
      </div>
    );
  }

  // ---------------------- Issues List ----------------------
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
                href={`https://github.com/${repoUrl}/issues/${issue.number}`}
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
                <span>by {issue.author?.login || "Unknown"}</span>
                <span>• created {new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- Pagination ---------------- */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`${currentPage === 1 ? "pointer-events-none opacity-50" : ""} cursor-pointer`}
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
                  className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} cursor-pointer`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
