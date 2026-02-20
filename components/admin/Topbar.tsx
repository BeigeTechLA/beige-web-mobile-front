"use client";
import React, { useState, useEffect } from "react";
import { Upload, Menu } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ModeToggle } from "../generic/ModeToggle";

export default function Topbar({
  pathname,
  onMenuClick
}: {
  pathname: string;
  onMenuClick?: () => void
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const paths = pathname
    .split("/")
    .filter((path) => path)
    .filter((path) => path !== "admin");
  const isShootsPage = pathname.includes("shoots");

  const isDark = !mounted || theme === "dark";

  return (
    <header className={`
      border-b transition-colors duration-300
      ${isDark
        ? "border-zinc-800 bg-[#0f0f0f] shadow-none"
        : "border-[#D8D8D8] bg-white shadow-[0_8px_24px_0_rgba(149,157,165,0.10)]"
      }
    `}>

      {/* ==========================================
          MOBILE VIEW
          ========================================== */}
      <div className="flex lg:hidden flex-col p-4 gap-4">
        {/* Top Row: Menu, Logo, Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className={`p-1 rounded-md transition-colors ${isDark ? "text-white hover:bg-zinc-800" : "text-[#101010] hover:bg-zinc-100"
                }`}
            >
              <Menu size={28} />
            </button>
            <Link href="/" className="relative flex items-center">
              <Image
                src="https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/assets/logos/beige_logo_vb.png"
                alt="BEIGE"
                width={100}
                height={20}
              />
              {/* Beta Tag - Preserved */}
              <span className={`absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full border backdrop-blur-xs overflow-hidden ${isDark ? "text-white border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)]" : "text-black border-black/20 shadow-sm"
                }`}>
                Beta
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <div className={`w-8 h-8 rounded-full overflow-hidden border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"
              }`}>
              <Image width={32} height={32} src="/images/avatar.png" alt="User" />
            </div>
          </div>
        </div>

        {/* Bottom Row: Breadcrumbs & Counts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {isShootsPage ? (
            <h1 className={`font-semibold text-sm whitespace-nowrap ${isDark ? "text-white" : "text-[#101010]"}`}>
              Shoots Management
            </h1>
          ) : (
            <nav className={`flex items-center gap-2 text-xs whitespace-nowrap ${isDark ? "text-white/40" : "text-[#00000066]"}`}>
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                return (
                  <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? (isDark ? "text-white font-bold" : "text-[#101010] font-bold") : ""}`}>
                      {path.split("-").join(" ")}
                    </span>
                    {!isLast && <span className="mx-1">/</span>}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* ==========================================
          DESKTOP VIEW
          ========================================== */}
      <div className="hidden lg:flex items-center justify-between px-9 py-6 gap-4">
        {/* Left: Logo & Breadcrumbs/Title */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="relative flex items-center shrink-0">
            <Image
              src="https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/assets/logos/beige_logo_vb.png"
              alt="BEIGE"
              width={158}
              height={32}
              className="w-[158px] h-[32px] object-contain"
              priority
            />
            {/* Beta Tag - Preserved */}
            <span className={`absolute right-4 md:right-5 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full border backdrop-blur-xs overflow-hidden ${isDark ? "text-white border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)]" : "text-black border-black/20 shadow-sm"
              }`}>
              Beta
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
            </span>
          </Link>

          {isShootsPage ? (
            <h1 className={`font-semibold text-lg ${isDark ? "text-white" : "text-[#101010]"}`}>Shoots Management</h1>
          ) : (
            <nav className={`flex items-center gap-4 text-sm ${isDark ? "text-white/40" : "text-[#00000066]"}`}>
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                return (
                  <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? (isDark ? "text-white font-bold" : "text-[#101010] font-bold") : ""}`}>
                      {path.split("-").join(" ")}
                    </span>
                    {!isLast && <span className="mx-2">/</span>}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center: Search Bar (Desktop only) */}
        {isShootsPage && (
          <div className="flex-1 max-w-xl ml-auto mr-8">
            <div className="relative">
              {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input
                placeholder="Search shoots, Clients, or IDs..."
                className="bg-[#1A1A1A] border-zinc-800 pl-10 text-white placeholder:text-zinc-500 rounded-lg h-10 w-full focus-visible:ring-offset-0 focus-visible:ring-zinc-700"
              /> */}
            </div>
          </div>
        )}

        {/* Right: Desktop Actions (Kept exactly as original) */}
        <div className="flex items-center gap-3 shrink-0">
          {isShootsPage && (
            <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-10 px-5 font-semibold">
              Book a Shoot
            </Button>
          )}

          {pathname.includes("messages") && (
            <Button className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              Create Messages
            </Button>
          )}

          {pathname.includes("dashboard") && (
            <>
              <ModeToggle />
              <div className={`relative shrink-0 w-12 h-12 rounded-full overflow-hidden cursor-pointer border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"
                }`}>
                <Image width={48} height={48} className="object-contain" src="/images/avatar.png" alt="User" />
              </div>
              <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                Book a Shoot
              </Button>
            </>
          )}

          {pathname.includes("file-manager") && (
            <>
              <Button className="bg-[#202020] text-white px-5 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#202020]/70 transition-opacity border border-white/20 flex gap-2">
                <Upload size={24} /> Upload Files
              </Button>
              <Button className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                Create Folder
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}