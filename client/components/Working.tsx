"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { Highlighter } from "./magicui/highlighter";
import { Upload, Zap, Sparkles } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

const items = [
  {
    icon: Upload,
    title: "Upload your data",
    description:
      "Simply upload your data to our secure platform. We support various file formats and data types to ensure a seamless integration with your existing systems.",
    imageUrl: "/photos/problem.png",
  },
  {
    icon: Zap,
    title: "Click Start",
    description:
      "Our advanced AI algorithms automatically process and analyze your data, extracting valuable insights and patterns that would be difficult to identify manually.",
    imageUrl: "/photos/problem2.png",
  },
  {
    icon: Sparkles,
    title: "Get actionable insights",
    description:
      "Receive clear, actionable insights and recommendations based on the AI analysis. Use these insights to make data-driven decisions and improve your business strategies.",
    imageUrl: "/photos/problem3.png",
  },
];

const Working = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const animationTime = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => (prevStep + 1) % items.length);
    }, animationTime * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-28">
      <div className="max-w-7xl mx-auto">
        <h2
          className={cn(
            "text-center my-6",
            "font-semibold text-[#EA1A24]",
            "uppercase"
          )}
        >
          How It Works
        </h2>
        <h2
          className={cn(
            "text-3xl md:text-5xl xl:text-6xl text-center",
            "font-bold",
            "text-balance"
          )}
        >
          Just{" "}
          <Highlighter action="circle" color="#FF9800">
            3 steps
          </Highlighter>{" "}
          to get started
        </h2>
        <p
          className={cn(
            "text-lg md:text-xl xl:text-xl text-center",
            "text-balance text-gray-900 dark:text-gray-100/80",
            "max-w-2xl mx-auto mt-12",
            "font-inter"
          )}
        >
          Create your account in minutes, connect your financial data securely,
          and instantly unlock powerful insights to plan, track, and grow
          smarter.
        </p>
        <div className="flex items-center mx-12 mt-20">
          {/* Left: Text */}
          <div className="flex flex-col gap-9 max-w-2xl px-6 lg:px-12">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex gap-5">
                  <div className="w-[6px] bg-neutral-200">
                    <motion.div
                      className="h-full w-full origin-top"
                      initial={{ scaleY: 0 }}
                      animate={{
                        scaleY: currentStep === index ? 1 : 0,
                        backgroundColor:
                          currentStep === index
                            ? "#EA1A24"
                            : "var(--bg-neutral-200)",
                      }}
                      exit={{ scaleY: 0 }}
                      transition={{ duration: animationTime }}
                    />
                  </div>
                  <div className="grid place-items-center p-3 bg-red-200 h-fit my-auto w-fit rounded-full dark:bg-red-600 text-[#EA1A24]dark:text-white">
                    <Icon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl capitalize mb-1">
                      {index + 1}. {item.title}
                    </h3>
                    <p className="text-base xl:text-base font-inter">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Image */}
          <div className="flex-1 flex justify-center items-center h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={items[currentStep].imageUrl}
                initial={{ scale: 0.98, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full flex justify-center"
              >
                <Image
                  src={items[currentStep].imageUrl}
                  alt={items[currentStep].title}
                  width={1200}
                  height={700}
                  className="h-full w-auto object-contain rounded-sm shadow-acternity dark:shadow-acternity-dark"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Working;
