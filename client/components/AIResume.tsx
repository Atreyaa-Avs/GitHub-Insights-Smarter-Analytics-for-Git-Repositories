"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Streamdown } from "streamdown";

import FileUploadComponent from "./FileUploadComponent";

export default function AIResume() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl") || "";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resumePdf", selectedFile);
      formData.append("repoUrl", repoUrl);

      const res = await fetch("/api/contribute", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data.matchedIssues || JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setResult("Failed to fetch suggestions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-white text-black rounded-xl py-5 px-10 font-bold hover:bg-gray-200 cursor-pointer">
          ✨AI: Find Issues to contribute
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col p-0 sm:min-h-[90vh] sm:max-w-7xl [&>button:last-child]:hidden">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-bold">
              Find Issues that you can Contribute
            </DialogTitle>
          </DialogHeader>

          {/* Split layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: File upload */}
            <div className="w-1/2 p-6 border-r border-muted-foreground overflow-auto">
              <FileUploadComponent onFileSelect={setSelectedFile} />
            </div>

            {/* Right: Result */}
            <div className="w-3/4 p-6 overflow-auto bg-gray-50">
              {result ? (
                <Streamdown>{result}</Streamdown>
              ) : (
                <p className="text-muted-foreground text-center mt-10">
                  Upload your resume to see matched issues here.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4 inline-flex justify-end items-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !selectedFile}>
              {loading ? "Analyzing..." : "Okay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
