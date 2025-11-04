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

type PullRequest = {
  pr_number: number;
  title: string;
  state: string;
  author_login: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
};

export default function PullRequests() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl");

  const [loading, setLoading] = useState(true);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const prsPerPage = 5;

  useEffect(() => {
    if (!repoUrl) return;

    async function fetchPRs() {
      try {
        setLoading(true);
        const res = await fetch(`/api/get-pulls?repoUrl=${repoUrl}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch pull requests");

        setPulls(data.pulls || []);
        setTotalCount(data.totalCount || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPRs();
  }, [repoUrl]);

  // ---------------- Pagination Logic ----------------
  const totalPages = Math.ceil(pulls.length / prsPerPage);
  const startIndex = (currentPage - 1) * prsPerPage;
  const currentPRs = pulls.slice(startIndex, startIndex + prsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // removed scrollTo for smoother UX
    }
  };

  // ---------------------- Skeleton Loading ----------------------
  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-2xl p-4 shadow-sm flex flex-col gap-3"
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
        ⚠️ Error loading pull requests: {error}
      </div>
    );
  }

  // ---------------------- Empty UI ----------------------
  if (!pulls.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No pull requests found for this repository.
      </div>
    );
  }

  // ---------------------- Pull Requests List ----------------------
  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold mb-6">
        Latest Pull Requests ({totalCount})
      </h2>

      <div className="space-y-4">
        {currentPRs.map((pr) => (
          <div
            key={pr.pr_number}
            className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col gap-2">
              <a
                href={`https://github.com/${repoUrl}/pull/${pr.pr_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-medium hover:underline"
              >
                #{pr.pr_number} — {pr.title}
              </a>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground items-center">
                <Badge
                  variant={
                    pr.state === "open"
                      ? "default"
                      : pr.merged_at
                      ? "secondary"
                      : "outline"
                  }
                  className="capitalize"
                >
                  {pr.state === "open"
                    ? "Open"
                    : pr.merged_at
                    ? "Merged"
                    : "Closed"}
                </Badge>
                <span>by {pr.author_login || "Unknown"}</span>
                <span>• opened {new Date(pr.created_at).toLocaleDateString()}</span>
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
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
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
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
