"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [blur, setBlur] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState("");

  useEffect(() => {
    // Determine the text based on pathname
    let text = "";

    if (pathname === "/") {
      text = "";
    } else if (pathname === "/chat") {
      text = "Chat";
    } else if (pathname === "/repo") {
      const repoUrl = searchParams.get("repoUrl") || "";
      const parts = repoUrl.split("/");
      if (parts.length === 2) {
        text = `${capitalize(parts[0])}: ${capitalize(parts[1])}`;
      } else {
        text = "Repository";
      }
    } else {
      // Default fallback: capitalize path
      text = capitalize(pathname.replace("/", ""));
    }

    setOverlayText(text);

    if (pathname === "/") {
      setBlur(false);
      setShowOverlay(false);
      return;
    }

    setBlur(true);
    setShowOverlay(true);

    const timer = setTimeout(() => {
      setBlur(false);
      setShowOverlay(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <div className="relative">
      <div
        className={`transition-all duration-300 ${
          blur ? "blur-sm opacity-50" : "blur-0 opacity-100"
        }`}
      >
        {children}
      </div>

      {/* Overlay screen */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden">
          <div className="flex flex-col justify-center items-center gap-4 overflow-hidden">
            <img
              src="/onlyLogo.png"
              alt="Gitlytics"
              width={300}
              height={300}
              className="w-full h-auto max-w-[180px]"
            />
            <p className="text-4xl font-bold ">{overlayText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to capitalize words
function capitalize(str: string) {
  if (!str) return "";
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
