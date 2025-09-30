"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import Repo from "./Repo";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";
import Commits from "./Commits";

// Simple fetch for repo GET → POST fallback
const fetchRepo = async (repoUrl: string) => {
  let res = await fetch(`/api/get-repo?repoUrl=${encodeURIComponent(repoUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch repo GET");

  let data = await res.json();

  // If empty, fallback to POST
  if (!data || Object.keys(data).length === 0 || "message" in data) {
    res = await fetch(`/api/get-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });
    if (!res.ok) throw new Error("Failed to fetch repo POST");
    data = await res.json();
  }

  return data;
};

const fetchCommits = async (repoUrl: string) => {
  let res = await fetch(
    `/api/get-commits?repoUrl=${encodeURIComponent(repoUrl)}`
  );
  if (!res.ok) throw new Error("Failed to fetch repo GET");

  let data = await res.json();

  // If empty, fallback to POST
  if (!data || Object.keys(data).length === 0 || "message" in data) {
    res = await fetch(`/api/get-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });
    if (!res.ok) throw new Error("Failed to fetch repo POST");
    data = await res.json();
  }

  return data;
};

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const repoQuery = useQuery({
    queryKey: ["nav", decodedRepo],
    queryFn: () => fetchRepo(decodedRepo),
    enabled: !!decodedRepo,
  });

  const commitsQuery = useQuery({
    queryKey: ["repo", decodedRepo],
    queryFn: () => fetchCommits(decodedRepo),
    enabled: !!decodedRepo,
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-200 dark:bg-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between w-full py-4 px-6 bg-white dark:bg-black border-b-[3px]">
        <Button
          onClick={() => router.back()}
          className="cursor-pointer dark:bg-white font-bold"
        >
          <ArrowLeft />
          Go Back
        </Button>
        <Link
          href={`${repoQuery.data?.html_url}` || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-4 hover:underline"
        >
          <div className="flex items-center">
            <div className="flex items-center">
              {repoQuery.isLoading ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : (
                <Image
                  src={repoQuery.data?.avatar_url!}
                  alt="avatar-url"
                  height={30}
                  width={30}
                  className="rounded-full"
                />
              )}
              <h1 className="font-bold text-2xl capitalize ml-1">
                {repoQuery.isLoading ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  repoQuery.data?.name
                )}
              </h1>
            </div>

            {!repoQuery.isLoading && (
              <ExternalLink className="ml-2 text-neutral-400" size={15} />
            )}
          </div>
        </Link>
        <div>
          <AnimatedThemeToggler />
        </div>
      </div>

      <div className="grid grid-cols-3 mx-20">
        {/* Repository Overview */}
        <Repo />
        {/* Recent Commits */}
        <div className="col-span-2">
          <Commits />
        </div>
      </div>
    </div>
  );
};

export default Page;
