import { cn } from "@/lib/utils";
import React from "react";
import { Highlighter } from "./magicui/highlighter";
import { Brain, Zap, Shield } from "lucide-react";

const items = [
  {
    icon: Brain,
    title: "Data Overload",
    description:
      "Businesses struggle to make sense of vast amounts of complex data, missing out on valuable insights that could drive growth and innovation.",
  },
  {
    icon: Zap,
    title: "Slow Decision-Making",
    description:
      "Traditional data processing methods are too slow, causing businesses to lag behind market changes and miss crucial opportunities.",
  },
  {
    icon: Shield,
    title: "Data Security Concerns",
    description:
      "With increasing cyber threats, businesses worry about the safety of their sensitive information when adopting new technologies.",
  },
];

const Problem = () => {
  return (
    <div className="mt-28">
      <h2
        className={cn(
          "text-center my-6",
          "font-semibold text-[#EA1A24]",
          "uppercase underline underline-offset-2"
        )}
      >
        Problem
      </h2>
      <h2
        className={cn(
          "text-3xl md:text-5xl xl:text-6xl text-center",
          "font-bold",
          "text-balance"
        )}
      >
        Manually entering your data is a{" "}
        <Highlighter action="highlight" color="#FF9800">
          hassle
        </Highlighter>
        .
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 xl:gap-32 mt-20 xl:mt-32 mx-auto max-w-7xl px-24 xl:px-12">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col gap-4">
              <div className="grid place-items-center p-3 bg-red-200 w-fit rounded-xl dark:bg-red-600 text-[#EA1A24] dark:text-white">
                <Icon />
              </div>
              <h3 className="font-semibold text-xl xl:text-2xl">{item.title}</h3>
              <p className="text-base xl:text-lg font-inter">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Problem;
