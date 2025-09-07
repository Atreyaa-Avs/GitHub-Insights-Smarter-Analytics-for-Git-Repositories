"use client";

import Marquee from "@/components/Marquee";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import NavBar from "@/components/NavBar";
import React, { useEffect, useState } from "react";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import Working from "@/components/Working";
import Features from "@/components/Features";
import Experience from "@/components/Experience";
import ScrollPin from "@/components/ScrollPin";
import ZigZagLayout from "@/components/ZigZagLayout";
import KeyCapabilities from "@/components/KeyCapabilities";
import Integrations from "@/components/Integrations";

const page = () => {
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-neutral-100 dark:bg-black">
      {/* <div className={`absolute inset-0 ${deleteLoading && "hidden"}`}>
        <MainLoader setDeleteLoading={setDeleteLoading} />
      </div> */}
      <NavBar />
      <div
        className="bg-cover bg-center bg-no-repeat bg-[url('/Backgrounds/Main_Bg.jpg')] 
             dark:bg-[url('/Backgrounds/Main_Dark_Bg.jpg')] mask-b-from-50% to-70%"
      >
        <Hero />
      </div>
      <Marquee />
      <Problem />
      <Solution />
      <Working />
      <Features />
      <Integrations />
      <ScrollPin />
      <ZigZagLayout />
      <KeyCapabilities />
      <Experience />
      <Footer />
    </div>
  );
};

export default page;
