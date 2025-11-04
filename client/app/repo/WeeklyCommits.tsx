"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

export default function WeeklyCommits() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl");

  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ------------------- GET weekly commits -------------------
  const fetchWeeklyCommits = async () => {
    if (!repoUrl) {
      setError("No repoUrl provided in query params.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/get-weekly-commits?repoUrl=${encodeURIComponent(repoUrl)}`
      );
      const data = await res.json();
      console.log(data);

      if (!res.ok)
        throw new Error(data.error || "Failed to fetch weekly commits.");

      setCommits(data.weeklyCommits || data.cached || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- POST to refresh weekly commits from GitHub -------------------
  const syncWeeklyCommits = async () => {
    if (!repoUrl) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/get-weekly-commits?repoUrl=${encodeURIComponent(repoUrl)}`,
        { method: "POST" }
      );
      const data = await res.json();
      console.log("Sync response:", data);
      await fetchWeeklyCommits();
    } catch (err) {
      console.error("Error syncing weekly commits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyCommits();
  }, [repoUrl]);

  // ------------------- Chart Data Formatting -------------------
  const chartData = commits.map((item) => {
    let date: Date;

    // 🧠 Handle both string and Date from Prisma
    if (item.week instanceof Date) {
      date = item.week;
    } else if (typeof item.week === "string") {
      // Normalize to ISO (handles "YYYY-MM-DD HH:mm:ss")
      date = new Date(item.week.replace(" ", "T"));
    } else {
      date = new Date(item.week);
    }

    const formatted =
      !isNaN(date.getTime()) &&
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return {
      week: formatted || "N/A",
      total: item.total ?? 0,
    };
  });

  // ------------------- UI -------------------
  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Weekly Commits</h1>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <p className="text-red-500 text-center">{error}</p>
        </Card>
      ) : commits.length === 0 ? (
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

      {!loading && commits.length > 0 && (
        <div className="text-sm text-muted-foreground text-right mt-4">
          Showing {commits.length} weeks of data for{" "}
          <span className="font-medium">{repoUrl}</span>
        </div>
      )}
    </div>
  );
}
