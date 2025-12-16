"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "/", isButton: true },
  { label: "About", href: "#about" },
  { label: "Find Creative Work", href: "#find-work" },
  { label: "Press", href: "#press" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 pointer-events-none">
      {/* FLOATING BAR */}
      <div
        className={`
          pointer-events-auto
          mx-auto max-w-[1600px]
          px-6
          transition-all duration-300
          ${isScrolled
            ? "bg-[#050505]/80 backdrop-blur-[12px] border border-white/10"
            : "bg-[#050505]/60 backdrop-blur-[8px] border border-white/10"
          }
          rounded-[20px]
        `}
      >
        <div className="h-16 md:h-[88px] flex items-center justify-between px-6">
          {/* Left: Links */}
          <div className="flex items-center gap-12">
            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  className={`
                    text-lg font-medium transition-all px-4 py-2 rounded-lg
                    ${link.isButton
                      ? "bg-white text-black hover:bg-white/90"
                      : "text-white/70 hover:text-[#ECE1CE]"
                    }
                  `}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <button className="flex items-center">
            <div className="relative">
              <Image
                src="/images/logos/beige_logo_vb.png"
                alt="BEIGE"
                width={158}
                height={32}
                className="w-[120px] h-[24px] md:w-[158px] md:h-[32px] object-contain"
                priority
              />
            </div>
          </button>

          {/* Right Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="text-white text-lg font-medium hover:text-[#ECE1CE] transition px-6 py-3 border border-white/20 rounded-[10px] hover:bg-white/5">
              Login
            </button>
            <Button className="bg-[#ECE1CE] text-black hover:bg-[#dcb98a] h-[48px] px-6 rounded-[10px] text-lg font-medium">
              Become a Investor
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[375px] bg-[#050505] border-l border-white/10 z-40 lg:hidden"
            >
              <div className="flex flex-col gap-8 p-8 pt-32">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    className="text-2xl text-white hover:text-[#ECE1CE] text-left"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="flex flex-col gap-4 mt-8">
                  <button className="text-xl text-white text-left">
                    Login
                  </button>
                  <Button className="w-full h-[60px] text-lg">
                    Become a Investor
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
