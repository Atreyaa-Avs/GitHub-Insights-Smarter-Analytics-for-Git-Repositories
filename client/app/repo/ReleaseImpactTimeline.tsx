"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Commit {
  committed_at: string;
}

interface Issue {
  created_at: string;
}

interface Release {
  tag_name: string;
  published_at: string;
  html_url?: string;
}

interface ReleaseImpactData {
  release: string;
  date: string;
  commits: number;
  issues: number;
}

export default function ReleaseImpactTimeline() {
  const searchParams = useSearchParams();
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  const [chartData, setChartData] = useState<ReleaseImpactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoUrl) return;

    const fetchData = async () => {
      try {
        // 1️⃣ Fetch releases
        const releasesRes = await fetch(`/api/get-releases?repoUrl=${encodeURIComponent(repoUrl)}`);
        const releasesData = await releasesRes.json();
        if (!releasesRes.ok) throw new Error(releasesData.error || "Failed to fetch releases");
        const releases: Release[] = releasesData.releases || [];

        // 2️⃣ Fetch commits
        const commitsRes = await fetch(`/api/get-commits?repoUrl=${encodeURIComponent(repoUrl)}`);
        const commitsData = await commitsRes.json();
        if (!commitsRes.ok) throw new Error(commitsData.error || "Failed to fetch commits");
        const commits: Commit[] = commitsData.commits || [];

        // 3️⃣ Fetch issues
        const issuesRes = await fetch(`/api/get-issues?repoUrl=${encodeURIComponent(repoUrl)}`);
        const issuesData = await issuesRes.json();
        if (!issuesRes.ok) throw new Error(issuesData.error || "Failed to fetch issues");
        const issues: Issue[] = issuesData.issues || [];

        // ---------------- Compute release impact ----------------
        const data: ReleaseImpactData[] = releases.map((r) => {
          const releaseDate = new Date(r.published_at).toISOString().slice(0, 10);

          // Count commits +/- 7 days around release
          const commitsCount = commits.filter((c) => {
            const date = new Date(c.committed_at);
            const diff = Math.abs(date.getTime() - new Date(r.published_at).getTime());
            return diff <= 7 * 24 * 60 * 60 * 1000; // ±7 days
          }).length;

          // Count issues +/- 7 days around release
          const issuesCount = issues.filter((i) => {
            const date = new Date(i.created_at);
            const diff = Math.abs(date.getTime() - new Date(r.published_at).getTime());
            return diff <= 7 * 24 * 60 * 60 * 1000;
          }).length;

          return {
            release: r.tag_name,
            date: releaseDate,
            commits: commitsCount,
            issues: issuesCount,
          };
        });

        setChartData(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed fetching data");
        setLoading(false);
      }
    };

    fetchData();
  }, [repoUrl]);

  if (loading) return <Skeleton className="h-[350px] w-full" />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!chartData.length) return <p className="text-gray-500 text-center">No release data available.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Release Impact Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="date" name="Release Date" />
              <YAxis type="number" dataKey="commits" name="Commits / Issues" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: any, name: string, props: any) => [`${value}`, name]}
              />
              <Legend />
              <Scatter name="Commits" data={chartData} fill="#8884d8" line shape="circle" />
              <Scatter name="Issues" data={chartData} fill="#82ca9d" line shape="triangle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
