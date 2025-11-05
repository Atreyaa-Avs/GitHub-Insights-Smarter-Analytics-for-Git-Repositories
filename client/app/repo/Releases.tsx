"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CalendarDays, Github, ExternalLink } from "lucide-react";

// ------------------- Types -------------------
type Release = {
  id: number;
  tag_name: string;
  name: string;
  published_at: string | null;
  html_url: string | null;
};

interface ReleasesApiResponse {
  releases: Release[];
  totalCount: number;
}

// ------------------- Fetch Function -------------------
const fetchReleases = async (repoUrl: string): Promise<ReleasesApiResponse> => {
  const res = await fetch(`/api/get-releases?repoUrl=${encodeURIComponent(repoUrl)}`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch releases");

  return {
    releases: (data.releases || []).map((r: any) => ({
      id: r.id ?? 0,
      tag_name: r.tag_name || "N/A",
      name: r.name || r.tag_name || "Unnamed release",
      published_at: r.published_at ?? null,
      html_url: r.html_url ?? null,
    })),
    totalCount: data.totalCount ?? data.releases?.length ?? 0,
  };
};

// ------------------- Component -------------------
export default function Releases() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ------------------- React Query -------------------
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["releases", decodedRepo],
    queryFn: () => fetchReleases(decodedRepo),
    enabled: !!decodedRepo,
  });

  const releases = data?.releases || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(releases.length / itemsPerPage);

  const currentReleases = releases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ------------------- Loading UI -------------------
  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ------------------- Error UI -------------------
  if (isError) {
    return (
      <div className="p-6 text-red-500">
        ⚠️ Error loading releases: {(error as Error)?.message}
      </div>
    );
  }

  // ------------------- Empty State -------------------
  if (!releases.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No releases found for this repository.
      </div>
    );
  }

  // ------------------- Releases Grid -------------------
  return (
    <div className="px-6 py-2">
      <h2 className="text-xl font-semibold mb-6">
        🚀 Releases ({totalCount})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentReleases.map((release) => (
          <Card
            key={release.id}
            className="hover:shadow-lg hover:bg-gray-50 transition border border-gray-200"
          >
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Github size={18} />
                <span className="truncate">
                  {release.name || release.tag_name}
                </span>
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {release.published_at
                  ? new Date(release.published_at).toLocaleDateString()
                  : "Unpublished"}
              </span>
            </CardHeader>

            <CardContent className="text-sm text-gray-600 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} />
                <span>Tag: {release.tag_name}</span>
              </div>

              {release.html_url && (
                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline mt-2"
                >
                  View Release <ExternalLink size={14} />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ------------------- Pagination ------------------- */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
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

              {Array.from({ length: totalPages }).map((_, i) => (
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
