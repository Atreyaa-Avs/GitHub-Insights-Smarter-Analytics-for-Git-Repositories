"use client";

import ChatLayout from "@/components/ChatComponents/ChatLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const page = () => {
  const router = useRouter();

  return (
    <div>
      <div className="relative flex items-center w-full py-4 px-3 border-b-[3px]">
        <Button onClick={() => router.back()} className="cursor-pointer">
          <ArrowLeft />
          Go Back
        </Button>

        <h1 className="absolute left-1/2 transform -translate-x-1/2 font-bold text-2xl">
          Chat
        </h1>
      </div>
      <ChatLayout />
    </div>
  );
};

export default page;
