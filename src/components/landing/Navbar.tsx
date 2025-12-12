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

  const handleNavClick = (href: string, label: string) => {
    console.log(`Navigation: ${label} clicked (href: ${href})`);
    setMobileOpen(false);
  };

  const handleLogin = () => {
    console.log('Navigation: Login clicked');
    setMobileOpen(false);
  };

  const handleInvestor = () => {
    console.log('Navigation: Become an Investor clicked');
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[108px] transition-all duration-300 ${
        isScrolled
          ? "bg-[#050505]/80 backdrop-blur-[10px] border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-8 md:px-12 h-full flex items-center justify-between max-w-[1600px]">
        {/* Left Side: Logo + Nav */}
        <div className="flex items-center gap-12">
          {/* Logo */}
          <button onClick={() => handleNavClick("/", "Logo")} className="flex items-center">
            <div className="relative w-[100px] h-[28px]">
              <Image
                src="/images/logos/beige_logo_vb.png"
                alt="BEIGE"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href, link.label)}
                className={`
                  text-sm font-medium transition-all px-4 py-2 rounded-full
                  ${link.isButton
                    ? "bg-white text-black hover:bg-white/90"
                    : "text-white hover:text-[#ECE1CE] opacity-70 hover:opacity-100"}
                `}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={handleLogin}
            className="text-white text-sm font-medium hover:text-[#ECE1CE] transition-colors px-6 py-3 border border-white/20 rounded-[8px] hover:bg-white/5"
          >
            Login
          </button>
          <Button
            onClick={handleInvestor}
            className="bg-[#ECE1CE] text-[#030303] hover:bg-[#dcb98a] h-[48px] px-6 rounded-[8px] text-sm font-medium"
          >
            Become a Investor
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden text-white z-50"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[375px] bg-[#050505] border-l border-white/10 lg:hidden z-40 overflow-y-auto"
          >
            <div className="flex flex-col gap-8 p-8 pt-32">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href, link.label)}
                  className={`
                    text-2xl font-medium transition-colors text-left
                    ${link.isButton ? "text-[#ECE1CE]" : "text-white hover:text-[#ECE1CE]"}
                  `}
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-4 mt-8">
                <button
                  onClick={handleLogin}
                  className="text-white hover:text-[#ECE1CE] transition-colors text-xl font-medium text-left"
                >
                  Login
                </button>
                <Button
                  variant="beige"
                  className="w-full h-[60px] text-lg"
                  onClick={handleInvestor}
                >
                  Become a Investor
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
    </nav>
  );
};
