import React from "react";
import { TextHoverEffect } from "./ui/text-hover-effect";
import { Button } from "./ui/button";
import { MoveRight } from "lucide-react";
import Image from "next/image";
import { Input } from "./ui/input";
import Link from "next/link";
import { motion } from "framer-motion";

const Footer = () => {
  const footerLinks = [
    {
      title: "Quick Links",
      links: [
        { title: "Pricing", href: "/" },
        { title: "Resources", href: "/" },
        { title: "About Us", href: "/" },
        { title: "FAQ", href: "/" },
        { title: "Contact Us", href: "/" },
      ],
    },
    {
      title: "Social",
      links: [
        { title: "Facebook", href: "/" },
        { title: "Instagram", href: "/" },
        { title: "LinkedIn", href: "/" },
        { title: "Twitter", href: "/" },
        { title: "Youtube", href: "/" },
      ],
    },
    {
      title: "Legal",
      links: [
        { title: "Terms of Service", href: "/" },
        { title: "Privacy Policy", href: "/" },
        { title: "Cookie Policy", href: "/" },
      ],
    },
  ];
  return (
    <div className="relative flex flex-col dark:bg-black">
      {/* Footer Main */}
      <div className="flex items-center justify-center">
        <TextHoverEffect
          text="GitLytics"
          textSize={"text-5xl"}
          duration={0.5}
          intensity={1.5}
        />
      </div>

      <div className="self-end w-full mb-3 relative">
        {/* Floating Card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1/5 w-[90%] max-w-6xl z-20">
          <div className="flex rounded-xl bg-gradient-to-r from-purple-700 to-zinc-700 shadow-2xl">
            <div className="p-8 pb-0">
              <h2 className="text-3xl font-bold text-white max-w-xl">
                Experience powerful github analytics with Gitlytics.
              </h2>
              <p className="text-gray-300 mt-2 max-w-xl">
                Dive deeper into public projects with over 3+ repository
                metrics, giving you a complete view of activity, contributions,
                and growth—all in just minutes.
              </p>
              <Button className="group p-0 text-xl py-6 !px-8 cursor-pointer mt-24 bg-white text-black hover:bg-gray-200 transition-all duration-200 ease-in-out">
                Try Now{" "}
                <span className="group-hover:pl-1 transition-all duration-75 ease-in">
                  <MoveRight />
                </span>
              </Button>
            </div>
            <div>
              <Image
                src={"/photos/footerPhoto1.png"}
                width={720}
                height={500}
                alt="FooterPhoto"
              />
            </div>
          </div>
        </div>

        {/* Footer Content */}
        <div className=" bg-neutral-300 dark:bg-gray-700 rounded-xl mx-6 pt-6 pb-2 pr-6 relative z-10">
          <div className="flex flex-col xl:flex-row justify-between mt-54 px-44">
            <div className="">
              <Image
                src="/logo1.svg"
                alt="Gitlytics"
                width={1550}
                height={1550}
                className="w-full h-auto max-w-[250px]"
              />
              <div className="my-10 font-inter">
                <p>221B Data Street</p>
                <p>Suite 404 (Not Found)</p>
                <p>R V University, BLR 560059</p>
                <p>Banglore, India</p>
              </div>

              <div className="flex gap-20 font-inter mt-16">
                <div>
                  <h3>Phone Number</h3>
                  <p className="font-bold">+91 12345 67890</p>
                </div>
                <div>
                  <h3>Email</h3>
                  <p className="font-bold">support@gitlytics.com</p>
                </div>
              </div>
            </div>

            <div className="flex-col">
              <div className="flex gap-32">
                {footerLinks.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-bold mb-3">{section.title}</h3>
                    <div className="flex flex-col">
                      {section.links.map((link, linkIdx) => (
                        <span key={linkIdx}>
                          <HoverLinkStyle
                            linkTitle={link.title}
                            linkHref={link.href}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-black text-white font-inter p-4 rounded-md mt-8">
                <p className="mb-2 font-semibold">
                  Don't miss out on GitLytics updates!
                </p>
                <Input
                  type="email"
                  placeholder="Your email address..."
                  className="border-neutral-500"
                />
                <Button className="bg-white text-black hover:bg-neutral-200 hover:cursor-pointer mt-2 w-full">
                  Keep Me Posted 🚀
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-between pl-52 mt-20">
            <div></div>
            <div>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm font-inter pt-2">
                &copy; 2025 Gitlytics, Inc. All Rights Reserved.
              </p>
            </div>
            <div>
              <p className="font-medium text-lg dark:text-neutral-200">
                Made with ❤️ in India
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;

interface HoverLinkProps {
  linkTitle: string;
  linkHref: string;
}

const HoverLinkStyle = ({ linkTitle, linkHref }: HoverLinkProps) => {
  return (
    <Link href={linkHref} className="text-neutral-700 font-medium">
      <motion.span
        initial="rest"
        whileHover="hover"
        animate="rest"
        className="relative inline-block"
      >
        {linkTitle}

        <motion.span
          className="absolute left-0 bottom-0 block h-[2px] bg-neutral-700 origin-left"
          style={{ width: "100%" }} // matches text width
          variants={{
            rest: { scaleX: 0 },
            hover: { scaleX: 1 },
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </motion.span>
    </Link>
  );
};
