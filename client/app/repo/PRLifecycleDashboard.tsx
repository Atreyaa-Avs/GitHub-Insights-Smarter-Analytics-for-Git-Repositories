"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Pull {
  number: number;
  state: string;
  created_at: string;
  merged_at?: string | null;
  closed_at?: string | null;
}

interface Issue {
  number: number;
  state: string;
  created_at: string;
  closed_at?: string | null;
}

interface Commit {
  sha: string;
  committed_at: string;
}

interface PRData {
  week: string;
  openPRs: number;
  mergedPRs: number;
  closedPRs: number;
}

export default function PRLifecycleDashboard() {
  const searchParams = useSearchParams();
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  const [chartData, setChartData] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoUrl) return;

    const fetchData = async () => {
      try {
        // 1️⃣ Fetch PRs
        const pullsRes = await fetch(`/api/get-pulls?repoUrl=${encodeURIComponent(repoUrl)}`);
        const pullsData = await pullsRes.json();
        if (!pullsRes.ok) throw new Error(pullsData.error || "Failed to fetch pulls");
        const pulls: Pull[] = pullsData.pulls || [];

        // 2️⃣ Fetch issues (optional, for extra efficiency insights)
        const issuesRes = await fetch(`/api/get-issues?repoUrl=${encodeURIComponent(repoUrl)}`);
        const issuesData = await issuesRes.json();
        if (!issuesRes.ok) throw new Error(issuesData.error || "Failed to fetch issues");
        const issues: Issue[] = issuesData.issues || [];

        // ------------------- Group by week -------------------
        const weeklyMap = new Map<string, PRData>();

        pulls.forEach((pr) => {
          const week = new Date(pr.created_at).toISOString().slice(0, 10);
          if (!weeklyMap.has(week)) {
            weeklyMap.set(week, { week, openPRs: 0, mergedPRs: 0, closedPRs: 0 });
          }
          const entry = weeklyMap.get(week)!;
          entry.openPRs += pr.state === "open" ? 1 : 0;
          entry.mergedPRs += pr.merged_at ? 1 : 0;
          entry.closedPRs += pr.closed_at && !pr.merged_at ? 1 : 0;
        });

        const dataArr = Array.from(weeklyMap.values()).sort(
          (a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()
        );

        setChartData(dataArr);
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
  if (!chartData.length) return <p className="text-gray-500 text-center">No PR data available.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>PR Lifecycle & Efficiency Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "lightgray",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="openPRs" fill="#8884d8" name="Open PRs" />
              <Bar dataKey="mergedPRs" fill="#82ca9d" name="Merged PRs" />
              <Bar dataKey="closedPRs" fill="#ffc658" name="Closed PRs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
