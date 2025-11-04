"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Contributor = {
  login: string;
  avatar_url: string;
  type: string;
  contributions: number;
};

export default function Contributors() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl"); // ?repoUrl=owner/repo

  const [loading, setLoading] = useState(true);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!repoUrl) return;

    async function fetchContributors() {
      try {
        setLoading(true);
        const res = await fetch(`/api/get-contributors?repoUrl=${repoUrl}`);
        const data = await res.json();
        console.log(data);

        if (!res.ok) throw new Error(data.error || "Failed to fetch");

        setContributors(data.topContributors);
        setTotal(data.totalContributors);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchContributors();
  }, [repoUrl]);

  // ------------------- Pagination logic -------------------
  const totalPages = Math.ceil(contributors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContributors = contributors.slice(startIndex, endIndex);

  // ------------------- Skeleton Loading UI -------------------
  if (loading) {
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

  // ------------------- Error UI -------------------
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <p>⚠️ Error: {error}</p>
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
        Top Contributors ({total ?? contributors.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {currentContributors.map((c) => (
          <Link
            href={`https://github.com/${c.login}`}
            target="_blank"
            key={c.login}
          >
            <div
              key={c.login}
              className="flex items-center gap-4 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
            >
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
