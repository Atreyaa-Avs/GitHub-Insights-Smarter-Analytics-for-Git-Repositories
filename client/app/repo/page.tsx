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
import Contributors from "./Contributors";
import Issues from "./Issues";
import PullRequests from "./PullRequests";
import Releases from "./Releases";
import TopCommitters from "./TopCommits";
import WeeklyCommits from "./WeeklyCommits";
import { Card } from "@/components/ui/card";
import ContributorMomentumTracker from "./ContributorMomentumTracker";
import PRLifecycleDashboard from "./PRLifecycleDashboard";
import ReleaseImpactTimeline from "./ReleaseImpactTimeline";
import CodeRhythmHeatmap from "./CodeRhythmHeatmap";
import ContributorImpactLeaderboard from "./ContributorImpactLeaderboard";
import AIResume from "@/components/AIResume";
import DBTalk from "@/components/DBTalk";
import { TriggerSyncButton } from "./TriggerWorkflow";

// ---------------- SafeImage Helper ----------------
interface SafeImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
}) => {
  if (!src)
    return (
      <Skeleton className={`h-[${height}px] w-[${width}px] ${className}`} />
    );
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

// ---------------- API Fetchers ----------------
const fetchRepo = async (repoUrl: string) => {
  let res = await fetch(`/api/get-repo?repoUrl=${encodeURIComponent(repoUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch repo GET");

  let data = await res.json();

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
  if (!res.ok) throw new Error("Failed to fetch commits GET");

  let data = await res.json();

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

// ---------------- Page Component ----------------
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
          href={`${repoQuery.data?.html_url || "#"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-4 hover:underline"
        >
          <div className="flex items-center">
            <div className="flex items-center">
              {repoQuery.isLoading ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : (
                <SafeImage
                  src={repoQuery.data?.avatar_url}
                  alt="avatar-url"
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              )}
              <h1 className="font-bold text-2xl capitalize ml-1">
                {repoQuery.isLoading ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  repoQuery.data?.name || "Unknown Repo"
                )}
              </h1>
            </div>

            {!repoQuery.isLoading && (
              <ExternalLink className="ml-2 text-neutral-400" size={15} />
            )}
          </div>
        </Link>

        <div className="flex items-center">
          <TriggerSyncButton />
          <DBTalk />
          <AIResume />
          <AnimatedThemeToggler />
        </div>
      </div>

      <div className="grid grid-cols-3 mx-20">
        {/* Repository Overview */}
        <Repo />

        {/* Recent Commits */}
        <div className="col-span-2 ml-4">
          <Commits />
        </div>

        <div className="col-span-3 mt-8">
          <Card>
            <WeeklyCommits />
          </Card>
        </div>

        <div className="col-span-3 mt-12">
          <Card>
            <Contributors />
          </Card>
        </div>

        <div className="grid grid-cols-2 col-span-3">
          <div className="mt-12 mr-4">
            <Card>
              <Issues />
            </Card>
          </div>
          <div className="mt-12 mr-4">
            <Card>
              <PullRequests />
            </Card>
          </div>
        </div>

        <div className="mt-12 col-span-3">
          <Card>
            <Releases />
          </Card>
        </div>
        {/* <TopCommitters /> */}
        <ContributorMomentumTracker />
        <PRLifecycleDashboard />
        <ReleaseImpactTimeline />
        <CodeRhythmHeatmap />
        <ContributorImpactLeaderboard />
      </div>

      {/* Footer Section */}
      <div className="flex justify-between items-center bg-gradient-to-r from-purple-700 to-zinc-700 shadow-2xl mx-20 my-4 rounded-xl px-4">
        <div className="ml-12">
          <SafeImage
            src="/logo.svg"
            alt="Gitlytics"
            width={1550}
            height={1550}
            className="w-full h-auto max-w-[250px]"
          />
          <div className="mt-5 text-white font-inter">
            <p>221B Data Street</p>
            <p>Suite 404 (Not Found)</p>
            <p>R V University, BLR 560059</p>
            <p>Banglore, India</p>
          </div>
        </div>
        <p className="text-center ml-48 bg-white shadow-md py-3 px-8 text-lg rounded-xl">
          Github Pipeline Dashboard for FDE Project
        </p>
        <SafeImage
          src="/photos/footerPhoto1.png"
          width={520}
          height={500}
          alt="FooterPhoto"
        />
      </div>
    </div>
  );
};

export default Page;
