"use client";
import React from "react";
import { Upload, Search, Menu, Moon, Sun, ChevronDown, SlidersHorizontal, Download, } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function Topbar({
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
    .filter((path) => path !== "admin");
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
            <Image
              src="/images/logos/beige_logo_vb.png"
              alt="BEIGE"
              width={100}
              height={20}
              className="object-contain"
              priority
            />
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
          <a href="https://beige.app" target="_blank" rel="noopener noreferrer" className="flex items-center shrink-0">
            <Image
              src="/images/logos/beige_logo_vb.png"
              alt="BEIGE"
              width={158}
              height={32}
              className="w-[158px] h-[32px] object-contain"
              priority
            />
          </a>

          {isShootsPage ? (
            <h1 className="text-white font-semibold text-lg">Shoots Management</h1>
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
          <div className="flex-1 max-w-xl ml-auto mr-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input
                placeholder="Search shoots, Clients, or IDs..."
                className="bg-[#1A1A1A] border-zinc-800 pl-10 text-white placeholder:text-zinc-500 rounded-lg h-10 w-full focus-visible:ring-offset-0 focus-visible:ring-zinc-700"
              />
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
              <div className="relative shrink-0 w-12 h-12 rounded-full bg-zinc-800 overflow-hidden cursor-pointer border border-zinc-700">
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