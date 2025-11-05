"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";

interface Commit {
  committed_at: string;
}

interface HeatmapData {
  day: string; // Mon, Tue, ...
  week: string; // ISO week or date string
  commits: number;
}

export default function CodeRhythmHeatmap() {
  const searchParams = useSearchParams();
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoUrl) return;

    const fetchData = async () => {
      try {
        const commitsRes = await fetch(`/api/get-commits?repoUrl=${encodeURIComponent(repoUrl)}`);
        const commitsData = await commitsRes.json();
        if (!commitsRes.ok) throw new Error(commitsData.error || "Failed to fetch commits");

        const commits: Commit[] = commitsData.commits || [];

        // ---------------- Aggregate commits by day + week ----------------
        const heatmapMap = new Map<string, number>();
        commits.forEach((c) => {
          const date = new Date(c.committed_at);
          const day = date.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue, ...
          const week = `${date.getFullYear()}-W${getISOWeek(date)}`; // e.g. 2025-W45
          const key = `${day}-${week}`;
          heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
        });

        const heatmapArray: HeatmapData[] = Array.from(heatmapMap.entries()).map(([key, commits]) => {
          const [day, week] = key.split("-");
          return { day, week, commits };
        });

        setData(heatmapArray);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed fetching data");
        setLoading(false);
      }
    };

    fetchData();
  }, [repoUrl]);

  // Helper to get ISO week number
  const getISOWeek = (date: Date) => {
    const tmpDate = new Date(date.getTime());
    tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - (tmpDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tmpDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo.toString().padStart(2, "0");
  };

  if (loading) return <Skeleton className="h-[350px] w-full" />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data.length) return <p className="text-gray-500 text-center">No commit data available.</p>;

  // ---------------- Chart ----------------
  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Rhythm Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="week" name="Week" />
              <YAxis type="category" dataKey="day" name="Day" />
              <Tooltip
                formatter={(value: any, name: string, props: any) => [`${value}`, "Commits"]}
              />
              <Scatter name="Commits" data={data}>
                {data.map((entry, index) => {
                  const intensity = Math.min(255, entry.commits * 15);
                  const color = `rgb(${255 - intensity}, ${255 - intensity}, 255)`; // lighter = fewer commits
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
