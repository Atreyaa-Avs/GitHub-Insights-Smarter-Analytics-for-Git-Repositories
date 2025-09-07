import React from "react";
import { Brain, Zap, Shield, Server, MoveRight } from "lucide-react";
import { div } from "motion/react-client";
import { Button } from "./ui/button";
import { Highlighter } from "./magicui/highlighter";

const ZigZagLayout = () => {
  const items = [
    {
      title: "Create Tours in Seconds with Jimo AI",
      description:
        "Record a user flow or highlight key features and Jimo AI does the rest. Edit, preview, and launch your onboarding in minutes.",
      steps: [
        {
          icon: Brain,
          content: "Jimo AI builds your tour with your selection or flow",
        },
        { icon: Zap, content: "Onboard and guide users from day one" },
        {
          icon: Shield,
          content: "Customize design for a native look and feel",
        },
      ],
      videoUrl: "/videos/ZVideo1.mp4",
    },
    {
      title: "Target it to the right users at the right time",
      description:
        "Target specific & segmented groups of users based on attributes, behavioral data, and momentum. Without bugging your dev team.",
      steps: [
        {
          icon: Brain,
          content:
            "Segment your audience using user data and tailor tours for specific user groups.",
        },
        {
          icon: Zap,
          content:
            "Make sure users get the right tour on the right page—no mismatched tours here!",
        },
        {
          icon: Shield,
          content:
            "Strike when the iron is hot—show tours based on user actions.",
        },
      ],
      videoUrl: "/videos/ZVideo2.mp4",
    },
    {
      title: "Analyze your published experiences metrics",
      description:
        "Understand user behavior and make data-driven decisions that drive growth. Generate engaging reports to share with your team.",
      steps: [
        {
          icon: Brain,
          content: "Capture feature usage automatically",
        },
        { icon: Zap, content: "Identify why & where users drop off" },
        {
          icon: Shield,
          content: "Create actions based on your product analytics",
        },
      ],
      videoUrl: "/videos/ZVideo3.mp4",
    },
  ].map((s, i) => ({ ...s, id: i }));

  return (
    <div className="py-24 mt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold text-center mb-10">
          <Highlighter action="highlight" color="#FF9800">
            Effortless
          </Highlighter>{" "}
          User Onboarding Powered by AI
        </h2>
        <p className="text-center max-w-2xl mx-auto text-lg text-gray-600 mb-24 font-inter dark:text-gray-300">
          Jimo AI helps you create intuitive, step-by-step user tours in
          seconds. Simply record interactions or highlight features, and let AI
          handle the rest—designing, previewing, and launching engaging
          onboarding experiences in minutes.
        </p>

        <div className="flex flex-col gap-20">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex justify-between gap-10 ${
                idx % 2 === 1 ? "flex-row-reverse" : ""
              }`}
            >
              <div>
                <h1 className="font-bold text-5xl mt-15">{item.title}</h1>
                <p className="my-6 font-inter mb-12">{item.description}</p>
                {item.steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 mb-4">
                      <p className="p-2 bg-yellow-100 text-[#EA1A24] rounded-lg">
                        <StepIcon size={20} />
                      </p>
                      <p className="font-inter">{step.content}</p>
                    </div>
                  );
                })}
                <Button className="group p-0 text-xl py-7 !px-12 cursor-pointer mt-10">
                  Try Now{" "}
                  <span className="group-hover:pl-1 transition-all duration-75 ease-in">
                    <MoveRight />
                  </span>
                </Button>
              </div>
              <div>
                <video
                  src={item.videoUrl}
                  loop
                  autoPlay
                  muted
                  className="rounded-2xl"
                ></video>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ZigZagLayout;
