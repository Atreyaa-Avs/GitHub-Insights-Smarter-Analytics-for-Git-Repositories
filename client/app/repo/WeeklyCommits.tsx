"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ------------------- Type Definitions -------------------
interface WeeklyCommit {
  week: string | Date;
  total: number;
}

interface WeeklyCommitsApiResponse {
  weeklyCommits: WeeklyCommit[];
}

// ------------------- API Fetch Function -------------------
const fetchWeeklyCommits = async (repoUrl: string): Promise<WeeklyCommitsApiResponse> => {
  const res = await fetch(`/api/get-weekly-commits?repoUrl=${encodeURIComponent(repoUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch weekly commits");

  const data = await res.json();

  return {
    weeklyCommits: (data.weeklyCommits || data.cached || []).map((c: any) => ({
      week: c.week ? new Date(c.week.replace(" ", "T")) : new Date(),
      total: c.total ?? 0,
    })),
  };
};

// ------------------- WeeklyCommits Component -------------------
export default function WeeklyCommits() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const decodedRepo = decodeURIComponent(repoUrl);

  // ------------------- React Query -------------------
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["weeklyCommits", decodedRepo],
    queryFn: () => fetchWeeklyCommits(decodedRepo),
    enabled: !!decodedRepo,
  });

  const weeklyCommits = data?.weeklyCommits || [];

  // ------------------- POST Sync Function -------------------
  // const syncWeeklyCommits = async () => {
  //   if (!decodedRepo) return;
  //   try {
  //     await fetch(`/api/get-weekly-commits?repoUrl=${encodeURIComponent(decodedRepo)}`, {
  //       method: "POST",
  //     });
  //     refetch(); // re-fetch after syncing
  //   } catch (err) {
  //     console.error("Error syncing weekly commits:", err);
  //   }
  // };

  // ------------------- Chart Data Formatting -------------------
  const chartData = weeklyCommits.map((item) => ({
    week:
      item.week instanceof Date
        ? item.week.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : new Date(item.week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    total: item.total,
  }));

  // ------------------- UI -------------------
  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Weekly Commits</h1>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </Card>
      ) : isError ? (
        <Card className="p-6">
          <p className="text-red-500 text-center">{(error as Error)?.message}</p>
        </Card>
      ) : weeklyCommits.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-gray-500">No commit data available.</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Weekly Commit Activity ({chartData.length} weeks)
            </CardTitle>
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
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="blue"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Commits"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && weeklyCommits.length > 0 && (
        <div className="text-sm text-muted-foreground text-right mt-4">
          Showing {weeklyCommits.length} weeks of data for{" "}
          <span className="font-medium">{decodedRepo}</span>
        </div>
      )}
    </div>
  );
}
