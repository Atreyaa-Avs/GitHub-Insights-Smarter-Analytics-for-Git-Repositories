import React from "react";
import { TextHoverEffect } from "./ui/text-hover-effect";

const Footer = () => {
  return (
    <div className="flex flex-col dark:bg-black">
      <div className="flex items-center justify-center">
        <TextHoverEffect text="FinSmart" textSize={"text-5xl"} duration={0.5} intensity={1.5} />
      </div>
      <div className="self-end w-full mb-3">
        <div className="flex flex-col xl:flex-row justify-between bg-neutral-300 dark:bg-gray-700 rounded-xl mx-6 p-6">
          <div>
            <h1 className="font-medium text-xl dark:text-white">FinSmart</h1>
          </div>
          <div>
            <p className="text-neutral-700 dark:text-neutral-300 text-lg pl-48 font-inter">
              Copyright &copy; 2025 FinSmart, Inc. All Rights Reserved.
            </p>
          </div>
          <div>
            <p className="font-medium text-xl dark:text-neutral-200">
              Made with ❤️ in India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
