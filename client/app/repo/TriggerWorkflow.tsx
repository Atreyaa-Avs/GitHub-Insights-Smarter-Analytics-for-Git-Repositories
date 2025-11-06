"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export const TriggerSyncButton: React.FC = () => {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") ?? "";

  // Extract owner and repo name from repoUrl
  const [owner, name] = repoUrl.split("/");

  const [loading, setLoading] = useState(false);
  const [lastUpdatedOn, setLastUpdatedOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError("Failed to fetch repo data");
    }
  };

  useEffect(() => {
    fetchRepoData();
  }, [repoUrl]);

  const triggerSync = async () => {
    if (!owner || !name) {
      setError("Invalid repo URL");
      console.error("Invalid repo URL:", repoUrl);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Triggering sync for:", { owner, name });

      const res = await fetch("/api/trigger-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, name }),
      });

      const data = await res.json();
      console.log("API response:", data);

      if (data.success) {
        console.log("Sync completed successfully");
        await fetchRepoData();
      } else {
        console.error("Sync failed:", data.error);
        setError(data.error || "Sync failed");
      }
    } catch (err) {
      console.error("Error triggering sync:", err);
      setError("Error triggering sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-4">
        {lastUpdatedOn && (
          <span className="text-sm text-gray-500">Last updated: {lastUpdatedOn}</span>
        )}
        <Button onClick={triggerSync} disabled={loading}>
          {loading ? "Syncing..." : "Sync Repository"}
        </Button>
      </div>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
};
