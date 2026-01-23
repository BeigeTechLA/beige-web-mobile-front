"use client";

import React from "react";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
