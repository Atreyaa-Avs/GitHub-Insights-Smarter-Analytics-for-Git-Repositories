import React from "react";
import { BorderBeam } from "./magicui/border-beam";
import { MoveRight } from "lucide-react";
import { Button } from "./ui/button";

import { Safari } from "./magicui/safari";
import { Highlighter } from "./magicui/highlighter";
import { AnimatedShinyText } from "./magicui/animated-shiny-text";
import { cn } from "@/lib/utils";
import CTA from "./CTA";

const Hero = () => {
  return (
    <div className="flex flex-col pt-24 sm:pt-28 lg:pt-32 xl:pt-40">
      <Button
        className={cn(
          "mb-10 flex items-center gap-2",
          "w-fit mx-auto rounded-full",
          "bg-gray-200 dark:bg-gray-800 ",
          "border border-white/30 dark:border-black/30",
          "backdrop-blur-md",
          "ring-1 ring-neutral-400 dark:ring-neutral-800",
          "hover:cursor-pointer hover:bg-gray-300",
          "transition-all duration-200 ease-in-out"
        )}
      >
        <span className="">✨</span>
        <AnimatedShinyText className="font-bold text-xs md:text-sm">
          Introducing FinSmart Template
        </AnimatedShinyText>
        <MoveRight size={15} className="text-black dark:text-white" />
      </Button>
      <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl text-center leading-tight">
        Your{" "}
        <Highlighter action="circle" color="#FF9800">
          Wealth
        </Highlighter>
        , decoded. <br />
        Financial Analysis, made{" "}
        <Highlighter action="underline" color="#FF9800">
          simple
        </Highlighter>
        .
      </h1>
      <h2 className="text-base sm:text-lg md:text-xl text-center max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto pt-8 pb-6 font-medium">
        Your finances, decoded — real-time insights and an AI assistant built on
        Fi's MCP server.
      </h2>

      <CTA />

      <HeroImage />
    </div>
  );
};

export default Hero;

const HeroImage = () => {
  return (
    <div className="relative mx-auto w-fit rounded-2xl overflow-hidden scale-[0.9] lg:scale-90 xl:scale-100 mt-8">
      <BorderBeam duration={6} size={400} borderWidth={2} />
      <BorderBeam duration={6} delay={3} size={400} borderWidth={2} />

      <Safari
        url="https://finsmart.com/awesome"
        className="size-full"
        imageSrc="/Backgrounds/HeroImage_Bg.png"
      />
    </div>
  );
};
