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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

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

// ---------------- Fetcher ----------------
async function fetchPullRequests(repoUrl: string, page: number, limit: number) {
  const res = await fetch(
    `/api/get-pulls?repoUrl=${encodeURIComponent(
      repoUrl
    )}&page=${page}&limit=${limit}`
  );

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch pull requests");

  return {
    pulls: (data.pulls || []).map((p: any) => ({
      pr_number: p.pr_number ?? 0,
      title: p.title || "Untitled PR",
      state: p.state || "open",
      author_login: p.author_login || "Unknown",
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
      closed_at: p.closed_at ?? null,
      merged_at: p.merged_at ?? null,
    })),
    totalCount: data.totalCount ?? data.pulls?.length ?? 0,
  };
}

export default function PullRequests() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl");

  // 👇 User-controllable number of PRs per page
  const [prsPerPage, setPrsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // ---------------- React Query ----------------
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pulls", repoUrl, currentPage, prsPerPage],
    queryFn: () => fetchPullRequests(repoUrl!, currentPage, prsPerPage),
    enabled: !!repoUrl,
  });

  const pulls: PullRequest[] = data?.pulls || [];
  const totalCount: number = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / prsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ---------------------- Skeleton Loading ----------------------
  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: prsPerPage }).map((_, i) => (
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
  if (isError) {
    return (
      <div className="p-6 text-red-500">
        ⚠️ Error loading pull requests: {(error as Error).message}
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Latest Pull Requests ({totalCount})
        </h2>

        {/* 👇 Per-page selector */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show per page:</span>
          <Select
            value={prsPerPage.toString()}
            onValueChange={(v) => {
              setPrsPerPage(Number(v));
              setCurrentPage(1); // reset to page 1
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-8">
        {pulls.map((pr) => (
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
                <span>
                  • opened {new Date(pr.created_at).toLocaleDateString()}
                </span>
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
                    `${currentPage === 1 ? "pointer-events-none opacity-50" : ""} cursor-pointer`
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
                    `${currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""} cursor-pointer`
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
