import { CircleUserRound, Store } from "lucide-react";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

const NavBar = () => {
  const links = [
    { name: "Projects", href: "/chatbot" },
    { name: "Ask Me", href: "/chatbot" },
    { name: "Contribute", href: "/chatbot" },
  ];

  const dropDownLinks = [
    {
      icon: <CircleUserRound size={16} className="opacity-60" />,
      name: "As User",
      href: "/login",
    },
    {
      icon: <Store size={16} className="opacity-60" />,
      name: "As Admin",
      href: "/seller/login",
    },
  ];

  return (
    <nav
      className="
        bg-white dark:bg-neutral-800
        border-b border-[#ccc] dark:border-gray-600 py-2
      "
    >
      <div className="flex justify-between items-center px-10 mx-auto w-full">
        <div className="flex items-center md:gap-1 text-xl xl:text-2xl">
          <Link href={"/"}>
              <Image
                src="/logo1.svg"
                alt="Gitlytics"
                width={1550}
                height={1550}
                className="w-full h-auto max-w-[120px] 2xl:max-w-[150px]"
              />
          </Link>
        </div>

        {/* Links */}
        <div>
          {links.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="mx-2 text-gray-800 dark:text-gray-200 hover:underline font-semibold 2xl:text-lg"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <div className="mt-1 md:mt-2 scale-75 md:scale-100">
            <AnimatedThemeToggler />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
