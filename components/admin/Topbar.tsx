"use client";
import React from "react";
import { Upload, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/context/SidebarContext";

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
  const { setIsOpen } = useSidebar();

  // Keep the breadcrumb logic for the left side
  const paths = pathname
    .split("/")
    .filter((path) => path)
    .filter((path) => path !== "admin");

  const isShootsPage = pathname.includes("shoots");

  return (
    <header className="border-b border-zinc-800 bg-[#0f0f0f]">

      {/* ==========================================
          MOBILE VIEW
          ========================================== */}
      <div className="flex lg:hidden flex-col p-4 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="p-1 text-white hover:bg-zinc-800 rounded-md transition-colors"
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
              <span className="absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-xs overflow-hidden">
                Beta
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Theme Mockup (from screenshot) */}
            {/* <div className="flex items-center bg-black rounded-full p-1 border border-zinc-800">
              <div className="p-1 rounded-full bg-[#E5D5B8] text-black">
                <Moon size={14} />
              </div>
            </div> */}
            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              <Image width={32} height={32} src="/images/avatar.png" alt="User" />
            </div>
          </div>
        </div>

        {/* Bottom Row: Breadcrumbs & Counts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {isShootsPage ? (
            <h1 className="text-white font-semibold text-sm whitespace-nowrap">
              {title}
            </h1>
          ) : (
            <nav className="flex items-center gap-2 text-xs text-white/40 whitespace-nowrap">
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const displayText = breadcrumbOverrides?.[path] || path.split("-").join(" ");
                return (
                  <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? "text-white font-bold" : ""}`}>
                      {displayText}
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
        {/* Left: Title */}
        <div className="flex items-center gap-6 shrink-0">
          {isShootsPage ? (
            <h1 className="text-white font-semibold text-lg">{title || "Shoots Management"}</h1>
          ) : (
            <nav className="flex items-center gap-4 text-sm text-white/40">
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const displayText = breadcrumbOverrides?.[path] || path.split("-").join(" ");
                return (
                  <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? "text-white font-bold" : ""}`}>
                      {displayText}
                    </span>
                    {!isLast && <span className="mx-2">/</span>}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center: Search Bar (Desktop only) */}
        {/* {isShootsPage && (
          <div className="flex-1 max-w-xl ml-auto mr-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input
                placeholder="Search shoots, Clients, or IDs..."
                className="bg-[#1A1A1A] border-zinc-800 pl-10 text-white placeholder:text-zinc-500 rounded-lg h-10 w-full focus-visible:ring-offset-0 focus-visible:ring-zinc-700"
              />
            </div>
          </div>
        )} */}

        {/* Right: Desktop Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {actions}

          {pathname.includes("dashboard") && (
            <div className="relative shrink-0 w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 ml-2">
              <Image width={40} height={40} className="object-contain" src="/images/avatar.png" alt="User" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}