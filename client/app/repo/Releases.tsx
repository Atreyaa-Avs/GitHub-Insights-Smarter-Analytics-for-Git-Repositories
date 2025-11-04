"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Release = {
  id: number;
  tag_name: string;
  name: string;
  published_at: string | null;
  html_url: string | null;
};

export default function Releases() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl");

  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState<Release[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const fetchReleases = async () => {
    if (!repoUrl) {
      setError("No repoUrl provided in query params");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/get-releases?repoUrl=${encodeURIComponent(repoUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch releases");

      setReleases(data.releases || []);
      setTotalCount(data.totalCount || data.releases?.length || 0);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, [repoUrl]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReleases = releases.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="px-6 py-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🚀 Releases ({totalCount})</h1>
      </div>

      {loading ? (
        // 🔹 Grid Skeleton Loader
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : releases.length === 0 ? (
        <p className="text-gray-500 text-center">No releases found.</p>
      ) : (
        <>
          {/* 🔹 Grid of Cards */}
          <div className="grid grid-cols-4 gap-6">
            {currentReleases.map((release) => (
              <Card
                key={release.id}
                className="hover:shadow-lg hover:bg-gray-50 transition border border-gray-200"
              >
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Github size={18} />
                    <span className="truncate">{release.name || release.tag_name}</span>
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

          {/* 🔹 Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={`${currentPage === 1 ? "pointer-events-none opacity-50" : ""} cursor-pointer`}
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
                      className={
                        `${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} cursor-pointer`
                      }
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
}
