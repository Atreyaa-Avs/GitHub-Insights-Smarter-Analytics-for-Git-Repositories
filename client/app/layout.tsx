"use client";

import metadata from "./metadata";
import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import PageTransition from "./PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

const gilroy = localFont({
  src: [
    {
      path: "../public/fonts/Gilroy-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Gilroy-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Gilroy-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-gilroy",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html
      lang="en"
      className={`${gilroy.className} ${inter.variable} ${poppins.variable}`}
    >
      <head>
        <title>{String(metadata.title ?? "")}</title>
        <link rel="preload" href="/onlyLogo.png" as="image" />
        <meta name="description" content={metadata.description ?? ""} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className="antialiased">
        <QueryClientProvider client={queryClient}>
          <PageTransition>{children}</PageTransition>
        </QueryClientProvider>
      </body>
    </html>
  );
}
