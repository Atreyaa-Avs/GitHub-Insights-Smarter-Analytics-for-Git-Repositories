"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Github, Trophy } from "lucide-react";

type Committer = {
  user_login: string;
  contributions: number;
  user: {
    avatar_url: string | null;
  };
};

export default function TopCommitters() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl"); // expects ?repoUrl=owner/repo
  const [loading, setLoading] = useState(true);
  const [committers, setCommitters] = useState<Committer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // ------------------- Fetch top committers from DB -------------------
  const fetchTopCommitters = async () => {
    if (!repoUrl) {
      setError("No repoUrl provided in query params");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/get-top-commiters?repoUrl=${encodeURIComponent(repoUrl)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch committers");

      setCommitters(data.topCommitters || []);
      setTotal(data.totalContributors || 0);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Sync top committers from GitHub -------------------
  const syncTopCommitters = async () => {
    if (!repoUrl) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/get-top-commiters?repoUrl=${encodeURIComponent(repoUrl)}`, {
        method: "POST",
      });
      const data = await res.json();
      console.log("POST result:", data);
      await fetchTopCommitters(); // refresh UI
    } catch (err) {
      console.error("Error syncing top committers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopCommitters();
  }, [repoUrl]);

  // ------------------- UI -------------------
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🧑‍💻 Top Committers
        </h1>
        <Button onClick={syncTopCommitters} disabled={loading || !repoUrl}>
          Sync with GitHub
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : committers.length === 0 ? (
        <p className="text-gray-500 text-center">No committers found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {committers.map((committer, index) => (
            <Card
              key={committer.user_login}
              className="hover:shadow-md transition border border-border/60"
            >
              <CardHeader className="flex flex-col items-center text-center">
                <div className="relative">
                  <Image
                    src={committer.user.avatar_url || "/github-mark.png"}
                    alt={committer.user_login}
                    width={64}
                    height={64}
                    className="rounded-full border mb-2"
                  />
                  {index < 3 && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1">
                      <Trophy size={14} />
                    </div>
                  )}
                </div>
                <CardTitle className="text-base font-semibold flex items-center gap-1">
                  <Github size={16} /> {committer.user_login}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center text-sm text-muted-foreground">
                <p>Contributions: {committer.contributions}</p>
                <p className="text-xs mt-1">
                  Rank #{index + 1}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-6 text-right text-sm text-muted-foreground">
        Showing {committers.length} of {total} top committers
      </div>
    </div>
  );
}
