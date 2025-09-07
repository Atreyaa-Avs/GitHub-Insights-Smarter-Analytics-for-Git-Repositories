"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

const fetchRepo = async (repoUrl: string) => {
  const res = await fetch(
    `/api/get-repo?repoUrl=${encodeURIComponent(repoUrl)}`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch repo");
  }
  return res.json();
};

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  const { data, isLoading, error } = useQuery({
    queryKey: ["repo", decodedRepo],
    queryFn: () => fetchRepo(decodedRepo),
    enabled: !!decodedRepo,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-between w-full py-4 px-6 border-b-[3px]">
        <Button
          onClick={() => router.back()}
          className="cursor-pointer dark:bg-white font-bold"
        >
          <ArrowLeft />
          Go Back
        </Button>

        <h1 className="font-bold text-2xl">{data ? data.name : "Repo"}</h1>

        <div className="mt-1 md:mt-2 scale-75 md:scale-100">
          <AnimatedThemeToggler />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex-col p-3 bg-neutral-200 dark:bg-neutral-700 flex-grow overflow-auto">
        <h1 className="text-3xl text-center font-semibold">{decodedRepo}</h1>

        {isLoading && <p className="text-center mt-4">Loading...</p>}
        {error && (
          <p className="text-center mt-4 text-red-500">
            Error loading repo data
          </p>
        )}
        {data && (
          <div className="flex flex-col gap-2 mx-auto max-w-2xl space-y-4 mt-6 bg-white p-6 rounded-2xl shadow-acternity dark:bg-black">
            <h2 className="text-lg">
              <span className="text-xl font-bold">Name:</span> {data.name}
            </h2>
            <p className="text-lg">
              <span className="text-xl font-bold">Description:</span>{" "}
              {data.description}
            </p>
            <p className="text-lg">
              <span className="text-xl font-bold">Stars:</span>{" "}
              {data.stargazers_count}
            </p>
            <p className="text-lg">
              <span className="text-xl font-bold">Forks:</span>{" "}
              {data.forks_count}
            </p>
            <p className="text-lg">
              <span className="text-xl font-bold">Language:</span>{" "}
              {data.language}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
