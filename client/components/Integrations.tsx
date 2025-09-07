import React from "react";
import { Highlighter } from "./magicui/highlighter";
import { cn } from "@/lib/utils";
import { IntegrationBeam } from "./IntegrationBeam";

const Integrations = () => {
  return (
    <div className="pt-32">
      <div className="max-w-7xl mx-auto">
        <h2
          className={cn(
            "text-center my-6",
            "font-semibold text-[#EA1A24]",
            "uppercase"
          )}
        >
          Integrations
        </h2>
        <h2 className="font-inter text-center text-6xl max-w-3xl mx-auto font-bold">
          Connect. Sync.{" "}
          <Highlighter action="highlight" color="#FF9800">
            Amplify.
          </Highlighter>{" "}
        </h2>
        <p
          className={cn(
            "text-lg md:text-xl xl:text-xl text-center",
            "text-balance text-gray-900 dark:text-gray-100/80",
            "max-w-3xl mx-auto mt-12",
            "font-inter"
          )}
        >
          Easily connect your tools, automate tasks, and streamline workflows —
          all from one dashboard to help your team work smarter and grow faster.
        </p>
        <div className="p-2 mt-12 bg-white dark:bg-neutral-900 border border-[#ccc] dark:border-[#555] max-w-2xl mx-auto pb-16 shadow-acternity rounded-2xl">
          <IntegrationBeam />
        </div>
      </div>
    </div>
  );
};

export default Integrations;
