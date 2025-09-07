import React from "react";
import { Button } from "./ui/button";
import { MoveRight } from "lucide-react";
import { Highlighter } from "./magicui/highlighter";

const Experience = () => {
  return (
    <div className="mt-40">
      <div className="flex flex-col max-w-7xl mx-auto">
        <h2 className="text-center text-6xl font-bold tracking-tight">
          Get the{" "}
          <Highlighter action="highlight" color="#FF9800">
            Best
          </Highlighter>{" "}
          user experience today.
        </h2>
        <p className="text-center text-2xl mt-10 max-w-xl mx-auto">
          Increase user adoption, engagement and retention with the best user
          experience.
        </p>
        <div className="group mx-auto mt-14">
          <Button className="p-0 text-xl py-7 !px-12 cursor-pointer">
            Try Now{" "}
            <span className="group-hover:pl-1 transition-all duration-75 ease-in">
              <MoveRight />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Experience;
