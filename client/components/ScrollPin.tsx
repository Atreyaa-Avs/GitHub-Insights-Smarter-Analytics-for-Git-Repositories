"use client";

import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Highlighter } from "./magicui/highlighter";
import { Brain, Zap, Shield, Server } from "lucide-react";
import Image from "next/image";
import { FlickeringGrid } from "./magicui/flickering-grid";
import { cn } from "@/lib/utils";

const items = [
  {
    icon: Brain,
    title: "Data Overload",
    description:
      "Businesses struggle to make sense of vast amounts of complex data, missing out on valuable insights that could drive growth and innovation.",
    imageUrl: "/photos/problem.png",
    color: "hover:bg-red-100",
    darkModeColor: "dark:hover:bg-red-100/30",
  },
  {
    icon: Zap,
    title: "Slow Decision-Making",
    description:
      "Traditional data processing methods are too slow, causing businesses to lag behind market changes and miss crucial opportunities.",
    imageUrl: "/photos/problem2.png",
    color: "hover:bg-blue-100",
    darkModeColor: "dark:hover:bg-blue-100/30",
  },
  {
    icon: Shield,
    title: "Data Security Concerns",
    description:
      "With increasing cyber threats, businesses worry about the safety of their sensitive information when adopting new technologies.",
    imageUrl: "/photos/problem3.png",
    color: "hover:bg-green-100",
    darkModeColor: "dark:hover:bg-green-100/30",
  },
  {
    icon: Server,
    title: "Infrastructure Scalability",
    description:
      "As data volumes grow, businesses face challenges in scaling their infrastructure efficiently without compromising performance or driving up costs.",
    imageUrl: "/photos/problem2.png",
    color: "hover:bg-neutral-400",
    darkModeColor: "dark:hover:bg-neutral-400/30",
  },
].map((s, i) => ({ ...s, id: i }));

const ScrollPin = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const refs = items.map(() => useRef(null));

  // Track which section is in view
  refs.forEach((ref, idx) => {
    const inView = useInView(ref, { margin: "-50% 0px -50% 0px" });
    useEffect(() => {
      if (inView) setActiveIndex(idx);
    }, [inView, idx]);
  });

  return (
    <div className="mt-32 bg-neutral-200 dark:bg-neutral-800 py-32">
      <div className="max-w-7xl mx-auto">
        <h2
          className={cn(
            "text-center my-6",
            "font-semibold text-[#EA1A24]",
            "uppercase"
          )}
        >
          Experience
        </h2>
        <h2 className="font-inter text-center text-6xl max-w-3xl mx-auto font-bold">
          Design, Build, and Launch Tours in{" "}
          <Highlighter action="underline" color="#FF9800">
            Minutes
          </Highlighter>{" "}
        </h2>
      </div>

      <div className="relative flex max-w-8xl mx-auto mt-12">
        {/* RIGHT SCROLL CONTENT */}
        <div className="w-2/3">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <section
                key={item.id}
                ref={refs[idx]}
                className="h-screen flex p-12 max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-center gap-5 h-fit my-auto bg-white p-10 rounded-xl shadow-acternity">
                  <div className="text-[#EA1A24]">
                    <Icon size={60} />
                  </div>
                  <div className="border-l-2 border-neutral-400 pl-5 dark:text-black">
                    <h2 className="text-3xl font-semibold mb-4">{item.title}</h2>
                    <p className="font-inter">{item.description}</p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* LEFT FIXED BOX */}
        <div className="sticky top-0 h-screen w-1/3 flex items-center justify-center overflow-x-hidden rounded-xl">
          <div
            className={cn(`relative rounded-2xl transition-colors duration-500 flex items-center justify-center min-h-screen group`,
              items[activeIndex].color,
              items[activeIndex].darkModeColor,
            )}
          >
            <FlickeringGrid
              className="relative inset-0 z-0 [mask-image:radial-gradient(650px_circle_at_center,white,transparent)]"
              squareSize={4}
              gridGap={6}
              color="#60A5FA"
              maxOpacity={1}
              flickerChance={0.1}
              height={800}
              width={800}
            />
            <Image
              src={items[activeIndex].imageUrl}
              alt={items[activeIndex].title}
              width={1200}
              height={700}
              className="absolute z-10 w-full top-1/4 left-1/2 group-hover:left-[48%] scale-[1.5] transition-all duration-500 ease-in-out rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollPin;
