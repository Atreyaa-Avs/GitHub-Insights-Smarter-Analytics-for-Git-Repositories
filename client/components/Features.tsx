"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { ChartColumn, Brain, ChartLine, FileSpreadsheet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { BorderBeam } from "./magicui/border-beam";

const items = [
  {
    icon: ChartColumn,
    title: "AI-Powered Dashboard",
    description: "Visualize trends and gain insights at a glance.",
    imageUrl: "/photos/problem.png",
  },
  {
    icon: Brain,
    title: "Natural Language Processing",
    description: "Extract text and extract sentiment effortlessly.",
    imageUrl: "/photos/problem2.png",
  },
  {
    icon: ChartLine,
    title: "Predictive Analytics",
    description: "Forecast trends and make data-driven decisions.",
    imageUrl: "/photos/problem3.png",
  },
  {
    icon: FileSpreadsheet,
    title: "Automated Reporting",
    description: "Generate comprehensive reports with a one click.",
    imageUrl: "/photos/problem2.png",
  },
];

const Features = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const animationTime = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % items.length);
    }, animationTime * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-28">
      <h2
        className={cn(
          "text-center my-6",
          "font-semibold text-[#EA1A24]",
          "uppercase underline underline-offset-2"
        )}
      >
        Features
      </h2>
      <h2
        className={cn(
          "text-3xl md:text-5xl xl:text-6xl text-center",
          "font-bold",
          "text-balance"
        )}
      >
        User Flows and Navigational Structures
      </h2>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 mt-20 mx-auto max-w-7xl px-24 xl:px-12">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex flex-col h-full justify-between gap-4"
              >
                <div className="grid place-items-center p-4 bg-red-200 w-fit rounded-full mx-auto dark:bg-red-600">
                  <Icon className="text-[#EA1A24] dark:text-white" />
                </div>
                <h3 className="font-semibold text-xl xl:text-2xl text-center">
                  {item.title}
                </h3>
                <p className="text-sm xl:text-lg text-center font-light md:mt-2 leading-tight font-inter mb-4">
                  {item.description}
                </p>
                <div className="w-full h-0.5 bg-neutral-200">
                  <motion.div
                    className="h-full w-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: currentStep === index ? 1 : 0,
                      backgroundColor:
                        currentStep === index
                          ? "#EA1A24"
                          : "var(--bg-neutral-200)",
                    }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: animationTime }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="relative mx-auto w-full max-w-5xl rounded-lg overflow-hidden mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={items[currentStep].imageUrl}
              initial={{ scale: 0.98, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              layout
              className="w-full flex justify-center"
            >
              <div className="relative w-full aspect-[12/7]">
                <Image
                  src={items[currentStep].imageUrl}
                  alt={items[currentStep].title}
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Features;
