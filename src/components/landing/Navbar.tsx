"use client";

import { Button } from "@/src/components/landing/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Separator } from "./Separator";

const navLinks = [
  { label: "Home", href: "/", isButton: true },
  { label: "About", href: "#about" },
  { label: "Find Creative Work", href: "#find-work" },
  { label: "Press", href: "#press" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);

    if (href.startsWith("#")) {
      if (pathname !== "/") {
        router.push("/" + href);
      } else {
        // Smooth scroll to section
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      // Navigate to page
      router.push(href);
    }
  };

  const handleLogin = () => {
    setMobileOpen(false);
    router.push("/login");
  };

  const handleInvestor = () => {
    setMobileOpen(false);
    router.push("/investors");
  };

  return (
    <nav className="fixed top-6 left-2 right-2 lg:left-0 lg:right-0 z-50 pointer-events-none">
      {/* FLOATING BAR */}
      <div
        className={`
          pointer-events-auto
          mx-auto max-w-[1600px]
          px-6
          transition-all duration-300
          ${isScrolled
            ? "bg-[#050505]/80 backdrop-blur-[12px] border-[0.5px] border-[#E8D1AB]/30"
            : "bg-[#050505]/60 backdrop-blur-[8px] border-[0.5px] border-[#E8D1AB]/30"
          }
          rounded-[10px] lg:rounded-[20px]
        `}
      >
        <div className="h-13 md:h-[88px] flex items-center justify-between lg:px-6">
          {/* Left: Links */}
          <div className="hidden lg:flex items-center gap-12">
            {/* Desktop Links */}
            <div className="flex items-center gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
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
          <button
            onClick={() => handleNavClick("/")}
            className="flex items-center"
          >
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
            <button
              onClick={handleLogin}
              className="text-white hover:text-[#ECE1CE] text-lg font-medium transition-colors px-6 py-3 border border-white/30 hover:border-[#ECE1CE]/50 rounded-[10px]"
            >
              Login
            </button>
            <Button
              onClick={handleInvestor}
              className="bg-[#ECE1CE] text-black hover:bg-[#dcb98a] h-[48px] px-6 rounded-[10px] text-lg font-medium"
            >
              Become a Investor
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden pointer-events-auto"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-[#050505] z-[70] lg:hidden pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-8 ">
                <Image
                  src="/images/logos/beige_logo_vb.png"
                  alt="BEIGE"
                  width={120}
                  height={24}
                  className="object-contain"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white p-2 hover:bg-white/10 bg-[#171717] rounded-full transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
              <Separator />

              {/* Mobile Links */}
              <div className="flex flex-col gap-10 p-5 overflow-y-auto">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className={`
                      text-lg font-normal transition-all text-left
                      ${link.isButton ? "text-[#ECE1CE]" : "text-[#B8ACAC]"}
                    `}
                  >
                    {link.label}
                  </button>
                ))}
                <Separator />

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleLogin}
                    className="text-white hover:text-[#ECE1CE] text-base font-medium transition-colors py-6 border border-white/30 hover:border-[#ECE1CE]/50 rounded-[10px]"
                  >
                    Login
                  </button>

                  <button
                    onClick={handleInvestor}
                    className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] py-6 rounded-[10px] text-base font-medium mt-4"
                  >
                    Become a Investor
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
