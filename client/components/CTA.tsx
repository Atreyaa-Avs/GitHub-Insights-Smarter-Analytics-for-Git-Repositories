"use client";

import React, { useState } from "react";
import { Input } from "./ui/input";
import { ArrowUpFromDot, Atom, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { BorderBeam } from "./magicui/border-beam";

const CTA = () => {
  const router = useRouter();

  const extractRepoOwnerAndName = (repoUrl: string) => {
    const regex = /github\.com[\/:](.+?\/.+?)(?:\/|\.git|$)/;
    const match = repoUrl.match(regex);
    if (!match) {
      return "invalid";
    }
    return match[1];
  };

  const [input, setInput] = useState("");

  const repoLinks = [
    {
      name: "React",
      url: "https://github.com/facebook/react"
    },
    {
      name: "freeCodeCamp",
      url: "https://github.com/freeCodeCamp/freeCodeCamp"
    },
    {
      name: "Tensorflow",
      url: "https://github.com/tensorflow/tensorflow"
    },
    {
      name: "CrewAI",
      url: "https://github.com/crewAIInc/crewAI"
    }
  ];

  return (
    <>
      <div className="flex items-center gap-2 max-lg:w-full px-6 lg:min-w-4xl mx-auto mb-8">
        <Input
          placeholder="Enter Github Link here.."
          type="text"
          className="py-6 text-xl font-inter"
          onChange={(e) => setInput(e.target.value)}
          value={input}
        />
        <Button
          className="dark:bg-white dark:text-black rounded-full cursor-pointer shadow-acternity transition-all duration-200 ease-in-out h-[calc(theme(spacing.6)*2+theme(borderWidth.DEFAULT)*2+theme(fontSize.base)[1])] aspect-square flex items-center justify-center"
          onClick={() =>
            router.push(
              `/repo?repoUrl=${encodeURIComponent(
                extractRepoOwnerAndName(input)
              )}`
            )
          }
        >
          <ArrowUpFromDot size={24} />
        </Button>
      </div>

      <div className="max-lg:w-full px-6 lg:min-w-4xl flex flex-col md:flex-row gap-4 md:gap-0 mx-auto items-center justify-between">
        <Button
          className="relative py-5 overflow-hidden hover:cursor-pointer"
          size="lg"
          variant="outline"
          onClick={() => router.push("/chatbot")}
        >
          <SquareArrowOutUpRight />
          Go to Chatbot
          <BorderBeam
            size={40}
            initialOffset={20}
            className="from-transparent via-yellow-500 to-transparent"
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 20
            }}
          />
        </Button>
        <div className="flex flex-col md:flex-row items-center">
          <h2 className="text-base font-medium">Popular Repos:</h2>
          <div className="flex flex-wrap justify-center md:justify-start mt-2 md:mt-0">
            {repoLinks.map((repo, index) => (
              <Button
                key={index}
                variant="link"
                className="ml-2 hover:underline bg-black dark:bg-neutral-700 text-white cursor-pointer"
                onClick={() =>
                  router.push(
                    `/repo?repoUrl=${encodeURIComponent(
                      extractRepoOwnerAndName(repo.url)
                    )}`
                  )
                }
              >
                <Atom />
                {repo.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CTA;
