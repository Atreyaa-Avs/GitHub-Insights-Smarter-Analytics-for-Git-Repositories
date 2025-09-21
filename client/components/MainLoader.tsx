"use client";

import React, { useState, useEffect } from "react";
import { NumberTicker } from "./magicui/number-ticker";
import { Ripple } from "./magicui/ripple";
import { motion } from "motion/react";
import Image from "next/image";

interface MainLoaderProps {
  setDeleteLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const MainLoader = ({ setDeleteLoading }: MainLoaderProps) => {
  // Synchronously check sessionStorage before component renders
  const shouldShowLoader = (() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("loaderShown");
    }
    return true;
  })();

  // If loader shouldn't show, we start as hidden to avoid rendering it at all
  const [hideNow, setHideNow] = useState(false);
  const [hidden, setHidden] = useState(!shouldShowLoader);

  useEffect(() => {
    if (!shouldShowLoader) {
      setDeleteLoading(true);
    }
  }, [shouldShowLoader, setDeleteLoading]);

  useEffect(() => {
    document.body.style.overflow = hidden ? "auto" : "hidden";
  }, [hidden]);

  if (hidden) return null;

  const handleAnimationComplete = () => {
    if (hideNow) {
      setHidden(true);
      setDeleteLoading(true);
      sessionStorage.setItem("loaderShown", "true");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white"
      initial={{ y: 0 }}
      animate={{ y: hideNow ? "-100%" : 0 }}
      transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
      onAnimationComplete={handleAnimationComplete}
    >
      <div className="flex items-center justify-center min-h-dvh">
        <div className="z-10 text-center text-2xl xl:text-4xl font-medium tracking-tight text-gray-700">
          <Image
            src="/onlyLogo.png"
            alt="Gitlytics"
            width={1550}
            height={1550}
            className="w-full h-auto max-w-[180px]"
          />
        </div>
        <div className="block md:hidden">
          <Ripple mainCircleSize={150} numCircles={4} />
        </div>
        <div className="hidden md:block">
          <Ripple mainCircleSize={250} />
        </div>
      </div>

      <NumberTicker
        className="absolute right-5 md:right-12 bottom-5 md:bottom-0 font-bold text-7xl xl:text-[10rem] tracking-tighter"
        value={100}
        setHideNow={setHideNow}
      />
    </motion.div>
  );
};

export default MainLoader;
