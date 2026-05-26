"use client";
import React, { useState, useEffect } from "react";
import { Bell, CircleDot, Menu, UsersRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ModeToggle } from "../generic/ModeToggle";
import { useSidebar } from "@/context/SidebarContext";
import { adminApi } from "@/lib/api";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!pathname.includes("dashboard")) return;

    const loadUnreadCount = () => adminApi.getUnreadNotificationCount().then((response) => {
      if (!response?.error) {
        setUnreadNotifications(Number(response.unread_count || 0));
      }
    });

    loadUnreadCount();
  }, [pathname]);

  const { setIsOpen } = useSidebar();

  // Keep the breadcrumb logic for the left side
  const paths = pathname
    .split("/")
    .filter((path) => path)
    .filter((path) => path !== "admin");

  const isShootsPage = pathname.includes("shoots");

  const isDark = !mounted || theme === "dark";

  const iconButtonClass = `relative grid h-12 w-12 place-items-center rounded-full border transition-colors ${
    isDark
      ? "border-white/10 bg-[#151515] text-white hover:bg-[#202020]"
      : "border-[#D8D8D8] bg-white text-[#171717] hover:bg-[#F5F5F5]"
  }`;

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className={`p-1 rounded-md transition-colors ${isDark ? "text-white hover:bg-zinc-800" : "text-[#101010] hover:bg-zinc-100"
                }`}
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
        {/* Left: Title */}
        <div className="flex items-center gap-6 shrink-0">
          {
            isShootsPage ? (
              <h1 className={`font-semibold text-lg ${isDark ? "text-white" : "text-[#101010]"}`}>{title || "Shoots Management"}</h1>
            ) : (
              <nav className={`flex items-center gap-4 text-sm ${isDark ? "text-white/40" : "text-[#00000066]"}`}>
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
                      {!isLast && <span className="mx-2">/</span>}
                    </React.Fragment>
                  );
                })}
              </nav>
            )
          }
        </div >

        {/* Right: Desktop Actions */}
        < div className="flex items-center gap-3 shrink-0" >
          {actions}

          {
            pathname.includes("dashboard") && (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/admin/notifications")}
                  className={iconButtonClass}
                  aria-label="Open notifications"
                >
                  <Bell size={19} />
                  {unreadNotifications > 0 ? (
                    <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#E5D5B8] px-1 text-[10px] font-semibold text-black">
                      {unreadNotifications}
                    </span>
                  ) : null}
                </button>
                <ModeToggle />
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className={iconButtonClass}
                  aria-label="Open settings"
                >
                  <CircleDot size={22} />
                </button>
                <div className={`relative shrink-0 w-12 h-12 rounded-full overflow-hidden cursor-pointer border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"
                  }`}>
                  <Image width={48} height={48} className="object-contain" src="/images/avatar.png" alt="User" />
                </div>
              </>
            )
          }

        </div >
      </div >
      {settingsOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[72px] backdrop-blur-[2px]">
          <div className="w-full max-w-[720px] overflow-hidden rounded-[14px] border border-white/20 bg-black text-white shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
            <div className="flex items-center justify-between border-b border-white/25 px-6 py-6">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label="Close settings"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <button
                type="button"
                className="flex w-full items-center gap-5 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#111] text-[#E5D5B8]">
                  <UsersRound size={26} />
                </span>
                <span>
                  <span className="block text-xl font-semibold leading-6">General Settings</span>
                  <span className="mt-1 block text-base text-white/45">Manage Language, Time Zone and other Personal Preferences</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  router.push("/admin/notifications/preferences");
                }}
                className="mt-4 flex w-full items-center gap-5 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#111] text-[#E5D5B8]">
                  <Bell size={24} />
                </span>
                <span>
                  <span className="block text-xl font-semibold leading-6">Notification Preferences</span>
                  <span className="mt-1 block text-base text-white/45">Manage how and when you receive notifications</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header >
  );
}
