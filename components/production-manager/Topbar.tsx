"use client";
import React, { useState, useEffect } from "react";
import { Upload, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import { ModeToggle } from "../generic/ModeToggle";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

interface TopbarProps {
  pathname: string;
  /** Custom buttons or components passed from the page */
  actions?: React.ReactNode;
  /** Optional override for the title (defaults to breadcrumb logic) */
  title?: string;
  /** Optional overrides for specific breadcrumb path segments */
  breadcrumbOverrides?: Record<string, string>;
}

export default function Topbar({ pathname, actions, title, breadcrumbOverrides }: TopbarProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const { user } = useAuth();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setProfileImageError(false);
  }, [user?.profile_image]);

  const { setIsOpen } = useSidebar();

  // Keep the breadcrumb logic for the left side
  const paths = pathname
    .split("/")
    .filter((path) => path)
    .filter((path) => path !== "admin");

  const pathSegments = pathname.replace(/\/$/, "").split("/");
  const isDashboardRoot = pathSegments[pathSegments.length - 1] === "dashboard";

  const isShootsPage = pathname.includes("shoots");

  const isDark = !mounted || theme === "dark";
  const profileImageSrc = !profileImageError && user?.profile_image
    ? user.profile_image
    : "/images/avatar.png";

  return (
    <header className={`
      border-b transition-colors duration-300
      ${isDark
        ? "border-[#3A3A3A] bg-[#171717] shadow-none"
        : "border-[#D8D8D8] bg-white shadow-[0_8px_24px_0_rgba(149,157,165,0.10)]"
      }
    `}>

      {/* ==========================================
          MOBILE VIEW
          ========================================== */}
      <div className="flex lg:hidden flex-col p-4 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className={`p-1 rounded-md transition-colors ${isDark ? "text-white hover:bg-zinc-800" : "text-[#101010] hover:bg-zinc-100"}`}
            >
              <Menu size={28} />
            </button>
            <Link href="/" className="relative flex items-center">
              <Image
                src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
                alt="BEIGE"
                width={100}
                height={20}
              />
              <span className={`absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full border backdrop-blur-xs overflow-hidden ${isDark ? "text-white border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)]" : "text-black border-black/20 shadow-sm"}`}>
                Beta
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <div className={`w-8 h-8 rounded-full overflow-hidden border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}>
              <Image
                width={32}
                height={32}
                src={profileImageSrc}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
                unoptimized
                onError={() => setProfileImageError(true)}
              />
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
                // CHANGED: Specific check for create-new-deal to show as "create new lead"
                const displayText = breadcrumbOverrides?.[path] ||
                  (path === "create-new-deal" ? "create new lead" : path.split("-").join(" "));

                return (
                  <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? (isDark ? "text-white font-bold" : "text-[#101010] font-bold") : ""}`}>
                      {displayText}
                    </span>
                    {!isLast && <span className="mx-1">/</span>}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </div>

        {/* <div>
          {actions}
        </div> */}
      </div>

      {/* ==========================================
          DESKTOP VIEW
          ========================================== */}
      <div className="hidden lg:flex items-center justify-between px-9 py-6 gap-4">
        {/* Left: Logo & Breadcrumbs/Title */}
        <div className="flex items-center gap-6 shrink-0">
          {/* <a href="https://beige.app" target="_blank" rel="noopener noreferrer" className="relative flex items-center shrink-0">
                        <Image
                            src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
                            alt="BEIGE"
                            width={158}
                            height={32}
                            className="w-[158px] h-[32px] object-contain"
                            priority
                        />
                        <span className="absolute right-4 md:right-5 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
                            Beta
                            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
                        </span>
                    </a> */}

          {isShootsPage ? (
            <h1 className="text-white font-semibold text-lg">Shoots Management</h1>
          ) : (
            <nav className="flex items-center gap-4 text-sm text-white/40">
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                // CHANGED: Specific check for create-new-deal to show as "create new lead"
                const displayText = breadcrumbOverrides?.[path] ||
                  (path === "create-new-deal" ? "create new lead" : path.split("-").join(" "));

                return (
                  <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? "text-white font-bold" : ""}`}>
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
        < div className="flex flex-nowrap items-center justify-end gap-3 min-w-0 max-w-full overflow-x-auto no-scrollbar" >
          {actions}


          {
            (isDashboardRoot) && (
              <ModeToggle />
            )
          }
        </div>
        {/* <div className="flex items-center gap-3 shrink-0">
                    {isShootsPage && (
                        <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-10 px-5 font-semibold">
                            Book a Shoot
                        </Button>
                    )}

                    {pathname.includes("dashboard") && (
                        <>
                            <div className="relative shrink-0 w-12 h-12 rounded-full bg-zinc-800 overflow-hidden cursor-pointer border border-zinc-700">
                                <Image width={48} height={48} className="object-contain" src="/images/avatar.png" alt="User" />
                            </div>
                            <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                                Book a Shoot
                            </Button>
                        </>
                    )}

          {
            pathname.includes("file-manager") && (
              <>
                <Button className="bg-[#202020] text-white px-5 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#202020]/70 transition-opacity border border-white/20 flex gap-2">
                  <Upload size={24} /> Upload Files
                </Button>
                <Button className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                  Create Folder
                </Button>
              </>
            )
          }
        </div > */}
      </div >
    </header >
  );
}