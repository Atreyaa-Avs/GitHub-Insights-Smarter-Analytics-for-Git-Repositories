"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { inngest } from "@/inngest/client";

export const TriggerSyncButton: React.FC = () => {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") ?? "";
  const owner = searchParams.get("owner") ?? "";
  const name = searchParams.get("name") ?? "";

  const [loading, setLoading] = useState(false);
  const [lastUpdatedOn, setLastUpdatedOn] = useState<string | null>(null);

  // Fetch repo data to get lastUpdatedOn
  const fetchRepoData = async () => {
    if (!repoUrl) return;
    try {
      const res = await fetch(`/api/get-repo?repoUrl=${encodeURIComponent(repoUrl)}`);
      if (!res.ok) throw new Error("Failed to fetch repo data");
      const data = await res.json();
      if (data.lastUpdatedOn) {
        setLastUpdatedOn(new Date(data.lastUpdatedOn).toLocaleString());
      }
    } catch (err) {
      console.error("Error fetching repo data:", err);
    }
  };

  useEffect(() => {
    fetchRepoData();
  }, [repoUrl]);

  const triggerSync = async () => {
    if (!owner || !name) return;
    setLoading(true);
    try {
      const functions = [
        "sync-overview",
        "sync-commits",
        "sync-contributors",
        "sync-issues",
        "sync-languages",
        "sync-participation",
        "sync-pulls",
        "sync-releases",
        "sync-weekly-commits",
      ];

      await Promise.all(
        functions.map((fn) =>
          inngest.send({
            name: fn,
            data: { owner, name },
          })
        )
      );

      console.log("Sync completed");
      fetchRepoData();
    } catch (err) {
      console.error("Error triggering sync:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {lastUpdatedOn && (
        <span className="text-sm text-gray-500">Last updated: {lastUpdatedOn}</span>
      )}
      <Button onClick={triggerSync} disabled={loading}>
        {loading ? "Syncing..." : "Sync Repository"}
      </Button>
    </div>
  );
};
