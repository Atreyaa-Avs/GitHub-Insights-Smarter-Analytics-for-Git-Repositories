"use client";

import React, { useEffect, useState } from "react";
import { NumberTicker } from "./magicui/number-ticker";
import { Ripple } from "./magicui/ripple";
import { motion } from "motion/react";

interface MainLoaderProps {
  setDeleteLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const MainLoader = ({ setDeleteLoading }: MainLoaderProps) => {
  const [hideNow, setHideNow] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Lock scroll while loader is visible
  useEffect(() => {
    document.body.style.overflow = hidden ? "auto" : "hidden";
  }, [hidden]);

  // Unmount loader after animation completes
  if (hidden) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white"
      initial={{ y: 0 }}
      animate={{ y: hideNow ? "-100%" : 0 }}
      transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
      onAnimationComplete={() => {
        if (hideNow) {
          setHidden(true);
          setDeleteLoading(true);
        }
      }}
    >
      <div className="flex items-center justify-center min-h-dvh">
        <p className="z-10 text-center text-2xl xl:text-4xl font-medium tracking-tight text-gray-700">
          Loading...
        </p>
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
