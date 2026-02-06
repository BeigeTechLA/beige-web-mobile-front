"use client";
import React from "react";
import { Upload, Search, ChevronDown, SlidersHorizontal, Download, Menu } from 'lucide-react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Link from "next/link";

export default function SalesTopbar({
  pathname,
  onMenuClick
}: {
  pathname: string;
  onMenuClick?: () => void
}) {
  const router = useRouter();
  const paths = pathname
    .split("/")
    .filter((path) => path)
    .filter((path) => path !== "sales");
  const isShootsPage = pathname.includes("shoots");

  return (
    <header className="border-b border-zinc-800 bg-[#0f0f0f]">

      {/* ==========================================
          MOBILE VIEW (Hidden on Desktop)
          ========================================== */}
      <div className="flex lg:hidden flex-col p-4 gap-4">
        {/* Top Row: Menu, Logo, Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-1 text-white hover:bg-zinc-800 rounded-md transition-colors"
            >
              <Menu size={28} />
            </button>
            <Link href="/" className="relative flex items-center">
              <Image
                src="/images/logos/beige_logo_vb.png"
                alt="BEIGE"
                width={100}
                height={20}
              />
              <span className="absolute right-0 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
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
              Shoots Management
            </h1>
          ) : (
            <nav className="flex items-center gap-2 text-xs text-white/40 whitespace-nowrap">
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                return (
                  <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? "text-white font-bold" : ""}`}>
                      {path.split("-").join(" ")}
                    </span>
                    {isLast && path === "messages" && (
                      <span className="ml-1 px-2 py-0.5 bg-[#202020] text-zinc-500 text-[10px] rounded-full border border-zinc-800">
                        04 Chats
                      </span>
                    )}
                    {!isLast && <span className="mx-1">/</span>}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* ==========================================
          DESKTOP VIEW (Hidden on Mobile)
          ========================================== */}
      <div className="hidden lg:flex items-center justify-between px-9 py-6 gap-4">
      {/* Left: Logo & Breadcrumbs/Title */}
      <div className="flex items-center gap-6 shrink-0">
        <a href="https://beige.app" target="_blank" rel="noopener noreferrer" className="relative flex items-center shrink-0">
          <Image
            src="/images/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={158}
            height={32}
            className="w-[120px] h-[24px] md:w-[158px] md:h-[32px] object-contain"
            priority
          />
            <span className="absolute right-4 md:right-5 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
              Beta
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
            </span>
        </a>

        {isShootsPage ? (
          <div className="flex items-center gap-3">
            <h1 className="text-white font-semibold text-lg">Sales Shoots Management</h1>
            {/* <span className="bg-[#202020] text-[#9CA3AF] text-xs px-2.5 py-1 rounded-full border border-zinc-800">
                            10 Shoots
                        </span> */}
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-sm text-white/40">
            {paths.map((path, index) => {
              const isLast = index === paths.length - 1;
              return (
                <React.Fragment key={index}>
                    <span className={`capitalize ${isLast ? "text-white font-bold" : ""}`}>
                    {path.split("-").join(" ")}
                  </span>
                  {isLast && path === "messages" && (
                    <span className="ml-2 px-2 py-0.5 bg-[#202020] text-zinc-500 text-[10px] rounded-full border border-zinc-800">
                      04 Chats
                    </span>
                  )}
                    {!isLast && <span className="mx-2">/</span>}
                </React.Fragment>
                );
            })}
          </nav>
        )}
      </div>

        {/* Center: Search Bar (Desktop only) */}
      {isShootsPage && (
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <Input
              placeholder="Search shoots, Clients, or IDs..."
              className="bg-[#1A1A1A] border-zinc-800 pl-10 text-white placeholder:text-zinc-500 rounded-lg h-10 w-full focus-visible:ring-offset-0 focus-visible:ring-zinc-700"
            />
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {isShootsPage && (
          <>
            {/* Status Dropdown */}
            <Button variant="outline" className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 hover:bg-[#252525] hover:text-white h-10 px-4 gap-2 font-normal">
              All Status
              <ChevronDown size={16} className="opacity-50" />
            </Button>

            {/* Filters */}
            <Button variant="outline" className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 hover:bg-[#252525] hover:text-white h-10 px-4 gap-2 font-normal">
              <SlidersHorizontal size={16} />
              Filters
            </Button>

            {/* Export */}
            <Button variant="outline" className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 hover:bg-[#252525] hover:text-white h-10 px-4 gap-2 font-normal">
              <Download size={16} />
              Export
            </Button>

            {/* Book a Shoot */}
            <Button
              onClick={() => router.push("/book-a-shoot")}
              className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-10 px-5 font-semibold"
            >
              Book a Shoot
            </Button>
          </>
        )}

        {
          pathname.includes("messages") &&
          <Button className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            Create Messages
          </Button>
        }
        {/* Dashboard elements */}
        {
          pathname.includes("dashboard") &&

          <>
            {/* Theme Toggle */}
            {/* <div className="flex items-center bg-zinc-900 rounded-full p-1 border border-zinc-800">
                            <Button className="p-1.5 rounded-full bg-[#E5D5B8] text-black">
                                <Moon size={18} />
                            </Button>
                            <Button className="p-1.5 text-zinc-500">
                                <Sun size={18} />
                            </Button>
                        </div> */}
            <div className="relative shrink-0 w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-zinc-800 overflow-hidden cursor-pointer border border-zinc-700">
              <Image
                width={48}
                height={48}
                className="object-contain"
                src={"/images/avatar.png"}
                alt={"User"}
              />
            </div>

            {/* Action Button */}
            <Button
              onClick={() => router.push("/book-a-shoot")}
              className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Book a Shoot
            </Button>
          </>
        }

        {
          pathname.includes("file-manager") &&
          <>
            <Button
              className="bg-[#202020] text-white px-5 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#202020]/70 transition-opacity border border-white/20 flex gap-2"
            >
              <Upload size={24} />
              Upload Files
            </Button>
            <Button
              className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Create Folder
            </Button>
          </>
        }

      </div>
      </div>
    </header>
  );
}