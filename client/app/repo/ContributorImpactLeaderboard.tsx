"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ContributorImpact {
  login: string;
  commits: number;
  prs: number;
  issues: number;
  score: number; // weighted score
}

export default function ContributorImpactLeaderboard() {
  const searchParams = useSearchParams();
  const repoUrl = decodeURIComponent(searchParams.get("repoUrl") || "");

  const [data, setData] = useState<ContributorImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoUrl) return;

    const fetchData = async () => {
      try {
        // ---------------- Fetch contributors ----------------
        const contributorsRes = await fetch(`/api/get-contributors?repoUrl=${encodeURIComponent(repoUrl)}`);
        const contributorsData = await contributorsRes.json();
        if (!contributorsRes.ok) throw new Error(contributorsData.error || "Failed to fetch contributors");

        const contributors = contributorsData.contributors || [];

        // ---------------- Fetch commits ----------------
        const commitsRes = await fetch(`/api/get-commits?repoUrl=${encodeURIComponent(repoUrl)}`);
        const commitsData = await commitsRes.json();
        if (!commitsRes.ok) throw new Error(commitsData.error || "Failed to fetch commits");
        const commits = commitsData.commits || [];

        // ---------------- Fetch pulls ----------------
        const pullsRes = await fetch(`/api/get-pulls?repoUrl=${encodeURIComponent(repoUrl)}`);
        const pullsData = await pullsRes.json();
        if (!pullsRes.ok) throw new Error(pullsData.error || "Failed to fetch PRs");
        const pulls = pullsData.pulls || [];

        // ---------------- Fetch issues ----------------
        const issuesRes = await fetch(`/api/get-issues?repoUrl=${encodeURIComponent(repoUrl)}`);
        const issuesData = await issuesRes.json();
        if (!issuesRes.ok) throw new Error(issuesData.error || "Failed to fetch issues");
        const issues = issuesData.issues || [];

        // ---------------- Compute weighted score ----------------
        const leaderboard: ContributorImpact[] = contributors.map((c: any) => {
          const login = c.login;
          const commitCount = commits.filter((cm: any) => cm.author?.login === login).length;
          const prCount = pulls.filter((pr: any) => pr.author_login === login).length;
          const issueCount = issues.filter((i: any) => i.author_login === login).length;

          // Weighted scoring (example: commit=1, PR=2, issue=1.5)
          const score = commitCount * 1 + prCount * 2 + issueCount * 1.5;

          return { login, commits: commitCount, prs: prCount, issues: issueCount, score };
        });

        // ---------------- Sort by score descending ----------------
        leaderboard.sort((a, b) => b.score - a.score);

        setData(leaderboard);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed fetching data");
        setLoading(false);
      }
    };

    fetchData();
  }, [repoUrl]);

  if (loading) return <Skeleton className="h-[400px] w-full" />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data.length) return <p className="text-gray-500 text-center">No contributor data available.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributor Impact Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border border-gray-300">Rank</th>
                <th className="p-2 border border-gray-300">Contributor</th>
                <th className="p-2 border border-gray-300">Commits</th>
                <th className="p-2 border border-gray-300">PRs</th>
                <th className="p-2 border border-gray-300">Issues</th>
                <th className="p-2 border border-gray-300">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c, idx) => (
                <tr key={c.login} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-2 border border-gray-300 text-center">{idx + 1}</td>
                  <td className="p-2 border border-gray-300">{c.login}</td>
                  <td className="p-2 border border-gray-300 text-center">{c.commits}</td>
                  <td className="p-2 border border-gray-300 text-center">{c.prs}</td>
                  <td className="p-2 border border-gray-300 text-center">{c.issues}</td>
                  <td className="p-2 border border-gray-300 text-center font-bold">{c.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
