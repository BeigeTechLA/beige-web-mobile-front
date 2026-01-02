"use client";

import { Button } from "@/src/components/landing/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Separator } from "./Separator";
import { CartIcon } from "@/components/ui/CartIcon";
import { useAuth } from "@/lib/hooks/useAuth";

const navLinks = [
  { label: "Home", href: "/", isButton: true },
  { label: "About", href: "#about" },
  { label: "Find Creative Work", href: "#find-work" },
  { label: "Press", href: "#press" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [localUser, setLocalUser] = useState<any>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  // Show cart icon only on search-results pages
  const showCartIcon = pathname?.startsWith("/search-results");

  useEffect(() => {
    // Check for user in localStorage on mount
    const storedUser = localStorage.getItem("revure_user");
    if (storedUser) {
      try {
        setLocalUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

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
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
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

  const handleLogout = () => {
    logout();
    localStorage.clear();
    setLocalUser(null);
    setMobileOpen(false);
    router.push("/");
  };

  const goToDashboard = () => {
    setMobileOpen(false);
    setShowProfileDropdown(false);
    if (localUser?.user_type_id === 1) {
      router.push("/affiliate/dashboard");
    } else if (localUser?.user_type_id === 2) {
      router.push("/creator/dashboard/request");
    }
  };

  return (
    <nav className="fixed top-6 left-2 right-2 lg:left-0 lg:right-0 z-50 pointer-events-none">
      <div
        className={`
          pointer-events-auto mx-auto max-w-[1600px] px-6 transition-all duration-300
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
          <a href="https://book.beige.app" target="_blank" rel="noopener noreferrer" className="flex items-center">
            <Image
              src="/images/logos/beige_logo_vb.png"
              alt="BEIGE"
              width={158}
              height={32}
              className="w-[120px] h-[24px] md:w-[158px] md:h-[32px] object-contain"
              priority
            />
          </a>

          {/* Right Buttons / Profile */}
          <div className="hidden lg:flex items-center gap-4">
            {showCartIcon && <CartIcon />}

            {!localUser ? (
              <>
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
              </>
            ) : (
              <div className="relative group">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E8D1AB] flex items-center justify-center text-black">
                    <User size={20} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white text-sm font-medium leading-none">{localUser.name}</span>
                    {/* <span className="text-white/50 text-[10px] mt-1 uppercase tracking-wider">
                      {localUser.role || "User"}
                    </span> */}
                  </div>
                  <ChevronDown size={16} className={`text-white/50 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[60]"
                    >
                      <button 
                        onClick={goToDashboard}
                        className="w-full flex items-center gap-3 px-4 py-4 text-white hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        <LayoutDashboard size={18} className="text-[#E8D1AB]" />
                        <span className="font-medium">Go To Dashboard</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 text-red-400 hover:bg-red-400/5 transition-colors"
                      >
                        <LogOut size={18} />
                        <span className="font-medium">Log out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile: Cart Icon + Hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            {showCartIcon && <CartIcon className="scale-90" />}
            <button className="text-white p-2" onClick={() => setMobileOpen(true)}>
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden pointer-events-auto"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-[#050505] z-[70] lg:hidden pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-8 ">
                <Image src="/images/logos/beige_logo_vb.png" alt="BEIGE" width={120} height={24} className="object-contain" />
                <button onClick={() => setMobileOpen(false)} className="text-white p-2 hover:bg-white/10 bg-[#171717] rounded-full">
                  <X size={28} />
                </button>
              </div>
              <Separator />

              <div className="flex flex-col gap-8 p-5 overflow-y-auto">
                {/* Mobile Links */}
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className={`text-lg font-normal text-left ${link.isButton ? "text-[#ECE1CE]" : "text-[#B8ACAC]"}`}
                  >
                    {link.label}
                  </button>
                ))}
                
                <Separator />

                {/* Mobile Auth/Profile Actions */}
                {!localUser ? (
                  <div className="flex flex-col gap-4">
                    <button onClick={handleLogin} className="text-white py-6 border border-white/30 rounded-[10px] text-base font-medium">
                      Login
                    </button>
                    <button onClick={handleInvestor} className="bg-[#E8D1AB] text-black py-6 rounded-[10px] text-base font-medium">
                      Become a Investor
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                       <div className="w-12 h-12 rounded-full bg-[#E8D1AB] flex items-center justify-center text-black">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">{localUser.name}</p>
                        <p className="text-white/50 text-sm">{localUser.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={goToDashboard} 
                      className="flex items-center justify-center gap-2 bg-white text-black py-4 rounded-[10px] font-medium mt-2"
                    >
                      <LayoutDashboard size={20} /> Go To Dashboard
                    </button>
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center justify-center gap-2 text-red-400 py-4 border border-red-400/20 rounded-[10px] font-medium"
                    >
                      <LogOut size={20} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};