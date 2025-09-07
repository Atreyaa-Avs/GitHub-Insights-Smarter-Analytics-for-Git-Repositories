import React from "react";
import { ChartColumn, Brain, ChartLine, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Highlighter } from "./magicui/highlighter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pointer } from "./magicui/pointer";
import { motion } from "motion/react";
import Image from "next/image";

const KeyCapabilities = () => {
  const items = [
    {
      icon: ChartColumn,
      title: "AI-Powered Dashboard",
      description: "Visualize trends and gain insights at a glance.",
      color: "from-orange-50 to-orange-100",
      textColor: "text-orange-700 dark:text-orange-300",
      pointerContent: "Explore Dashboard",
      pointerStyle: "dark:text-orange-500",
      imageUrl: "/photos/problem.png",
    },
    {
      icon: Brain,
      title: "Natural Language Processing",
      description: "Extract text and extract sentiment effortlessly.",
      color: "from-blue-50 to-blue-100",
      textColor: "text-blue-700 dark:text-blue-300",
      pointerContent: "Try NLP",
      pointerStyle: "dark:text-blue-500",
      imageUrl: "/photos/problem2.png",
    },
    {
      icon: ChartLine,
      title: "Predictive Analytics",
      description: "Forecast trends and make data-driven decisions.",
      color: "from-purple-50 to-purple-100",
      textColor: "text-purple-700 dark:text-purple-300",
      pointerContent: "Analyze here",
      pointerStyle: "dark:text-purple-500",
      imageUrl: "/photos/problem3.png",
    },
    {
      icon: FileSpreadsheet,
      title: "Automated Reporting",
      description: "Generate comprehensive reports with a one click.",
      color: "from-green-50 to-green-100",
      textColor: "text-green-700 dark:text-green-300",
      pointerContent: "Check this out",
      pointerStyle: "dark:text-green-500",
      imageUrl: "/photos/problem2.png",
    },
  ];

  return (
    <div className="dark:bg-neutral-800 py-24 mt-20">
      <h2
        className={cn(
          "text-center my-6",
          "font-semibold text-[#EA1A24]",
          "uppercase"
        )}
      >
        Key Capabilities
      </h2>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold text-center mb-10">
          Power Your{" "}
          <Highlighter action="highlight" color="#FF9800">
            Insights
          </Highlighter>{" "}
          with Smart Data Tools
        </h2>
        <p
          className={cn(
            "text-lg md:text-xl xl:text-xl text-center",
            "text-balance text-gray-900 dark:text-gray-100/80",
            "max-w-2xl mx-auto mt-12",
            "font-inter"
          )}
        >
          Transform raw numbers into actionable intelligence — from trends to
          reports, all at your fingertips.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2 max-w-7xl mx-auto mt-12">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className={cn(
                "col-span-1 row-span-1 overflow-hidden border transition-all shadow-none relative",
                `bg-gradient-to-br ${item.color} dark:from-gray-800 dark:to-gray-700`,
                "group flex flex-col p-5 rounded-2xl overflow-hidden shadow-sm dark:hover:bg-red-800/30 transition-colors duration-300 ease-in-out"
              )}
            >
              <CardHeader className="relative pb-2 mt-6">
                <CardTitle className="text-3xl font-bold">
                  {item.title}
                </CardTitle>
                <CardDescription
                  className={cn("text-base font-inter", item.textColor)}
                >
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "pointer-events-none text-center text-xl font-medium",
                    item.textColor
                  )}
                >
                  {item.pointerContent}
                </span>
                <div className="mx-5 z-0 relative">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={1200}
                    height={700}
                    className="w-full relative -bottom-10 transition-all duration-500 ease-in-out group-hover:-bottom-7 dark:brightness-90"
                  />
                </div>
              </CardContent>
              <Pointer>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon
                    size={40}
                    className={cn(
                      "text-current",
                      item.textColor,
                      item.pointerStyle
                    )}
                  />
                </motion.div>
              </Pointer>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default KeyCapabilities;
