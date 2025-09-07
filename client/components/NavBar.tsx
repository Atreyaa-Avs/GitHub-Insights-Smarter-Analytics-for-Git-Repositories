import { ChartNoAxesCombined } from "lucide-react";
import React, { useState, useEffect } from "react";
import { AnimatedThemeToggler } from "./magicui/animated-theme-toggler";
import { motion, useAnimation } from "framer-motion";

const NavBar = () => {
  const controls = useAnimation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setScrolled(true);
      else setScrolled(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    controls.start({
      width: scrolled ? "60%" : "80%",
      padding: scrolled ? "0.25rem 1rem" : "0.5rem 1.5rem", // reduced vertical padding
      borderRadius: scrolled ? "1rem" : "1.5rem",
      boxShadow: scrolled
        ? "0 8px 20px rgba(0,0,0,0.2)"
        : "var(--shadow-acternity)",
      transition: { type: "spring", stiffness: 120, damping: 20 },
    });
  }, [scrolled, controls]);

  return (
    <motion.nav
      className="
        fixed z-50 
        bg-white dark:bg-neutral-800 
        left-1/2 transform -translate-x-1/2 
        border border-[#ccc] dark:border-gray-600 
        my-2 md:my-4   /* reduced vertical margin on small screens */
      "
      animate={controls}
    >
      <div className="flex justify-between items-center md:py-1 px-3">
        <div className="flex items-center md:gap-1 text-xl xl:text-3xl">
          <motion.div
            animate={{ scale: scrolled ? 0.9 : 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            <div className="md:hidden"><ChartNoAxesCombined size={20} /></div>
            <div className="max-md:hidden"><ChartNoAxesCombined /></div>
          </motion.div>
          <motion.h1
            className="dark:text-white font-bold text-xl md:text-2xl"
            animate={{ scale: scrolled ? 0.9 : 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            FinSmart.
          </motion.h1>
        </div>
        <div className="mt-1 md:mt-2 scale-75 md:scale-100">
          <AnimatedThemeToggler />
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
