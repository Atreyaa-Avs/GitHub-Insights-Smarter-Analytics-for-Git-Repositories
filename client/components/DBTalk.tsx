"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Streamdown } from "streamdown";

export default function DBTalk() {
  const [userQuery, setUserQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userQuery) return;

    setLoading(true);
    setSqlQuery(null);
    setQueryResult(null);
    setGeminiResult(null);

    try {
      const res = await fetch("/api/ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });
      const data = await res.json();

      if (data.error) {
        setGeminiResult(data.error);
        return;
      }

      setSqlQuery(data.sqlQuery);
      setQueryResult(data.queryResult);
      setGeminiResult(data.geminiResult);
    } catch (err) {
      console.error(err);
      setGeminiResult("Error processing your query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-white text-black rounded-xl py-5 px-10 font-bold hover:bg-gray-200 cursor-pointer">
          ✨ AI SQL Explorer
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col p-0 sm:min-h-[90vh] sm:max-w-7xl [&>button:last-child]:hidden">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-bold">AI SQL Explorer</DialogTitle>
          </DialogHeader>

          {/* Split layout */}
          <div className="flex flex-1 overflow-hidden gap-4">
            {/* Left: User query input */}
            <div className="w-1/2 p-6 border-r border-muted-foreground overflow-auto">
              <label className="block mb-2 font-semibold">Enter your query:</label>
              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="E.g., Fetch me the recent 5 commits of this repo"
                className="w-full h-32 p-2 border rounded-md"
              />
            </div>

            {/* Right: Results */}
            <div className="w-1/2 p-6 overflow-auto bg-gray-50 flex flex-col gap-4">
              <div>
                <h3 className="font-bold mb-1">Generated SQL:</h3>
                <pre className="p-2 bg-white rounded-md border">{sqlQuery || (loading ? "Generating..." : "SQL will appear here")}</pre>
              </div>

              <div>
                <h3 className="font-bold mb-1">Query Result:</h3>
                <pre className="p-2 bg-white rounded-md border">{queryResult ? JSON.stringify(queryResult, null, 2) : (loading ? "Fetching results..." : "Results will appear here")}</pre>
              </div>

              <div>
                <h3 className="font-bold mb-1">Gemini Explanation / Context:</h3>
                {geminiResult ? <Streamdown>{geminiResult}</Streamdown> : <p className="text-muted-foreground">{loading ? "Waiting for explanation..." : "Explanation will appear here"}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4 inline-flex justify-end items-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Run Query"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
