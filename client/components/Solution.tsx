import { cn } from "@/lib/utils";
import React from "react";
import { Highlighter } from "./magicui/highlighter";
import { Brain, Zap, Shield } from "lucide-react";
import Image from "next/image";
import { Safari } from "./magicui/safari";

const items = [
  {
    icon: Brain,
    title: "Data Overload",
    description:
      "Businesses struggle to make sense of vast amounts of complex data, missing out on valuable insights that could drive growth and innovation.",
    imageUrl: "/photos/problem.png",
  },
  {
    icon: Zap,
    title: "Slow Decision-Making",
    description:
      "Traditional data processing methods are too slow, causing businesses to lag behind market changes and miss crucial opportunities.",
    imageUrl: "/photos/problem.png",
  },
  {
    icon: Shield,
    title: "Data Security Concerns",
    description:
      "With increasing cyber threats, businesses worry about the safety of their sensitive information when adopting new technologies.",
    imageUrl: "/photos/problem.png",
  },
  {
    icon: Shield,
    title: "Data Security Concerns",
    description:
      "With increasing cyber threats, businesses worry about the safety of their sensitive information when adopting new technologies.",
    imageUrl: "/photos/problem.png",
  },
];

const Solution = () => {
  return (
    <div className="bg-neutral-200 dark:bg-neutral-800 py-24 mt-28">
      <div className="max-w-7xl mx-auto">
        <h2
          className={cn(
            "text-center my-6",
            "font-semibold text-[#EA1A24]",
            "uppercase"
          )}
        >
          Solution
        </h2>
        <h2
          className={cn(
            "text-3xl md:text-5xl xl:text-6xl text-center",
            "font-bold",
            "text-balance"
          )}
        >
          Empower Your{" "}
          <Highlighter action="box" color="#FF9800">
            Business
          </Highlighter>{" "}
          with{" "}
          <Highlighter action="highlight" color="#FF9800">
            AI Workflows
          </Highlighter>
        </h2>
        <p
          className={cn(
            "text-lg md:text-xl xl:text-xl text-center",
            "text-balance text-gray-900 dark:text-gray-100/80",
            "max-w-2xl mx-auto mt-12",
            "font-inter",
          )}
        >
          Generic AI tools won't suffice. Our platform is purpose-built to
          provide exceptional AI-driven solutions for your unique business
          needs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-16 px-6 md:px-12 lg:px-16">
          <div
            id="problem-1"
            className="group relative flex flex-col bg-neutral-100 dark:bg-neutral-700 p-5 rounded-2xl overflow-hidden mask-b-from-48 to-40% hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors duration-300 ease-in-out"
          >
            <h2 className="font-bold text-lg text-[#EA1A24]">
              Advanced AI Algorithms
            </h2>
            <p className="mt-2 dark:text-white font-inter">
              Our platform utilizes cutting-edge AI algorithms to provide
              accurate and efficient solutions for your business needs.
            </p>
            <div className="mx-5 z-0 relative">
              <Image
                src={"/photos/problem.png"}
                alt="problem"
                width={1200}
                height={700}
                className="w-full relative -bottom-10 transition-all duration-500 ease-in-out group-hover:-bottom-7"
              />
            </div>
          </div>

          <div
            id="problem-2"
            className="group relative flex flex-col bg-neutral-100 dark:bg-neutral-700 p-5 rounded-2xl overflow-hidden mask-b-from-48 to-40% hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors duration-300 ease-in-out"
          >
            <h2 className="font-bold text-lg text-[#EA1A24]">
              Secure Data Handling
            </h2>
            <p className="mt-2 dark:text-white font-inter">
              Our platform utilizes cutting-edge AI algorithms to provide
              accurate and efficient solutions for your business needs.
            </p>
            <div className="mx-5 z-0 relative">
              <Image
                src={"/photos/problem.png"}
                alt="problem"
                width={1200}
                height={700}
                className="w-full relative -bottom-10 transition-all duration-500 ease-in-out group-hover:-bottom-7"
              />
            </div>
          </div>
          <div
            id="problem-3"
            className="group relative flex flex-col bg-neutral-100 dark:bg-neutral-700 p-5 rounded-2xl overflow-hidden row-span-2 mask-b-from-96 to-15% dark:text-black hover:bg-red-100/50 dark:hover:bg-red-500/10 transition-colors duration-300 ease-in-out"
          >
            <h2 className="font-bold text-lg text-[#EA1A24]">
              Seamless Integration
            </h2>
            <p className="mt-2 dark:text-white font-inter">
              Easily integrate our AI solutions into your existing workflows and
              systems for a smooth and efficient operation.
            </p>
            <div className="mx-5 z-0 relative mt-10">
              {/* <Image
                src={"/photos/problem.png"}
                alt="problem"
                width={1200}
                height={700}
                className="w-full relative top-3/4 scale-[2.5] left-62 transition-all duration-500 ease-in-out group-hover:left-60"
              /> */}
              <Safari
                url="https://finsmart.com/awesome"
                className="size-full w-full relative top-3/4 scale-[2.5] left-62 transition-all duration-500 ease-in-out group-hover:left-60"
                imageSrc="/photos/problem.png"
              />
            </div>
          </div>
          <div
            id="problem-4"
            className="group relative flex flex-col bg-neutral-100 dark:bg-neutral-700 p-5 rounded-2xl overflow-hidden col-span-2 mask-b-from-48 to-40% hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors duration-300 ease-in-out"
          >
            <h2 className="font-bold text-lg text-[#EA1A24]">
              Customizable Solutions
            </h2>
            <p className="mt-2 dark:text-white font-inter">
              Tailor our AI services to your specific needs with flexible
              customization options, allowing you to get most out of our
              platform.
            </p>
            <div className="z-0 relative">
              <Image
                src={"/photos/problem.png"}
                alt="problem"
                width={1200}
                height={700}
                className="w-1/2 mx-auto relative -bottom-5 transition-all duration-500 ease-in-out group-hover:-bottom-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solution;
