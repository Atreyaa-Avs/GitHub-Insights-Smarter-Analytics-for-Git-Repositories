"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Commit {
  author: string;
  date: string;
}

interface Contributor {
  login: string;
}

interface WeeklyCommit {
  week: string;
  contributor: string;
  commits: number;
}

export default function ContributorMomentumTracker() {
  const searchParams = useSearchParams();
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoUrl) return;

    const fetchAll = async () => {
      try {
        // Fetch commits
        const commitsRes = await fetch(`/api/get-commits?repoUrl=${encodeURIComponent(repoUrl)}`);
        const commitsData = await commitsRes.json();
        if (!commitsRes.ok) throw new Error(commitsData.error || "Failed to fetch commits");

        const commits: Commit[] = (commitsData.commits || []).map((c: any) => ({
          author: c.author?.login || "Unknown",
          date: c.committed_at || new Date().toISOString(),
        }));

        // Fetch contributors
        const contributorsRes = await fetch(`/api/get-contributors?repoUrl=${encodeURIComponent(repoUrl)}`);
        const contributorsData = await contributorsRes.json();
        if (!contributorsRes.ok) throw new Error(contributorsData.error || "Failed to fetch contributors");

        const contributors: Contributor[] = (contributorsData.contributors || []).map((c: any) => ({
          login: c.login,
        }));

        // Fetch weekly commits (repo-wide)
        const weeklyRes = await fetch(`/api/get-weekly-commits?repoUrl=${encodeURIComponent(repoUrl)}`);
        const weeklyData = await weeklyRes.json();
        if (!weeklyRes.ok) throw new Error(weeklyData.error || "Failed to fetch weekly commits");

        const weeks: string[] = (weeklyData.weeklyCommits || []).map((w: any) =>
          new Date(w.week).toISOString().slice(0, 10)
        );

        // Build chart data per contributor per week
        const data: any[] = weeks.map((week) => {
          const entry: any = { week };
          contributors.forEach((c) => {
            // Count commits by this contributor in this week
            const count = commits.filter(
              (cm) =>
                cm.author === c.login &&
                cm.date.slice(0, 10) >= week &&
                cm.date.slice(0, 10) < new Date(new Date(week).getTime() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 10)
            ).length;
            entry[c.login] = count;
          });
          return entry;
        });

        setChartData(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed fetching data");
        setLoading(false);
      }
    };

    fetchAll();
  }, [repoUrl]);

  if (loading) return <Skeleton className="h-[350px] w-full" />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!chartData.length) return <p className="text-gray-500 text-center">No data available.</p>;

  const contributors = Object.keys(chartData[0]).filter((k) => k !== "week");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributor Momentum Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
              {contributors.map((c, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={c}
                  stroke={`hsl(${idx * 60},70%,50%)`}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
