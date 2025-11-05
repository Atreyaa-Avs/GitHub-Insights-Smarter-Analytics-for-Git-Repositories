"use client";

import * as React from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ------------------- Types -------------------
type Contributor = {
  login: string;
  avatar_url: string;
  type: string;
  contributions: number;
};

interface ContributorsApiResponse {
  topContributors: Contributor[];
  totalContributors: number;
}

// ------------------- Fetch Function -------------------
const fetchContributors = async (repoUrl: string): Promise<ContributorsApiResponse> => {
  const res = await fetch(`/api/get-contributors?repoUrl=${encodeURIComponent(repoUrl)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch contributors");
  }

  const data = await res.json();

  return {
    topContributors: (data.topContributors || []).map((c: any) => ({
      login: c.login || "unknown",
      avatar_url: c.avatar_url || "/default-avatar.png",
      type: c.type || "User",
      contributions: c.contributions ?? 0,
    })),
    totalContributors: data.totalContributors ?? data.topContributors?.length ?? 0,
  };
};

// ------------------- Component -------------------
export default function Contributors() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ------------------- React Query -------------------
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["contributors", decodedRepo],
    queryFn: () => fetchContributors(decodedRepo),
    enabled: !!decodedRepo,
  });

  const contributors = data?.topContributors || [];
  const totalContributors = data?.totalContributors || contributors.length;

  // ------------------- Pagination -------------------
  const totalPages = Math.ceil(contributors.length / itemsPerPage);
  const currentContributors = contributors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ------------------- Loading -------------------
  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border rounded-2xl p-4 shadow-sm"
            >
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------- Error -------------------
  if (isError) {
    return (
      <div className="p-6 text-red-500">
        <p>⚠️ Error: {(error as Error)?.message}</p>
      </div>
    );
  }

  // ------------------- Empty State -------------------
  if (!contributors.length) {
    return (
      <div className="p-6 text-muted-foreground">
        <p>No contributors found for this repository.</p>
      </div>
    );
  }

  // ------------------- Contributors List -------------------
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Top Contributors ({totalContributors})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {currentContributors.map((c) => (
          <Link
            href={`https://github.com/${c.login}`}
            target="_blank"
            key={c.login}
          >
            <div className="flex items-center gap-4 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <Image
                src={c.avatar_url || "/default-avatar.png"}
                alt={c.login}
                width={50}
                height={50}
                className="rounded-full"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{c.login}</p>
                <p className="text-sm text-muted-foreground">
                  {c.contributions} contributions
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ------------------- Pagination Controls ------------------- */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === index + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(index + 1);
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
