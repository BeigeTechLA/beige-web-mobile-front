"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Camera, LogOut, FolderOpen, CalendarClock, MessageCircle, Calendar, User, Wallet, Settings, X, type LucideIcon, CircleDollarSign, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

import { CheckVerificationStatus, CheckCPStatus } from "@/lib/api";

const SHOOTS_CURRENT_PAGE_KEY = "admin-shoots-current-page-v1";

interface SidebarProps {
  onClose?: () => void;
}

type MenuItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  isPublic?: boolean;
  children?: { label: string; href: string; isPublic?: boolean }[];
};

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark } = useResolvedTheme();

  const initialPath = useRef(pathname);

  const [isVerified, setIsVerified] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(["Finances"]);

  // Auto-expand dynamic parent routes on load/change
  useEffect(() => {
    setExpanded((prev) => {
      const next = [...prev];
      if (pathname?.startsWith("/creator/finances") && !next.includes("Finances")) {
        next.push("Finances");
      }
      return next;
    });
  }, [pathname]);

  const handleLogout = useCallback(() => {
    logout();
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    if (onClose) onClose();
    router.push("/");
  }, [logout, onClose, router]);

  // LOGIC TO SYNC SIDEBAR LOCKS AND CHECK STATUS
  useEffect(() => {
    const syncStatus = async () => {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem("revure_user") : null;
      const localUser = userStr ? JSON.parse(userStr) : null;
      const crewId = user?.crew_member_id || localUser?.crew_member_id;

      if (!crewId) return;

      try {
        const statusResponse = await CheckCPStatus();
        if (statusResponse && (statusResponse.error || statusResponse.success === false || statusResponse.is_deleted)) {
          handleLogout();
          return;
        }

        const response = await CheckVerificationStatus({ crew_member_id: crewId });
        if (response && !response?.error && response.data?.data) {
          const status = Number(response.data.data.is_crew_verified);
          setIsVerified(status === 1);

          const updatedUser = { ...localUser, is_crew_verified: status };
          localStorage.setItem("revure_user", JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("Sidebar sync error", err);
      }
    };

    syncStatus();
  }, [handleLogout, pathname, user]);

  useEffect(() => {
    if (onClose && pathname !== initialPath.current) {
      onClose();
    }
  }, [pathname, onClose]);

  const handleNavigation = (link: string) => {
    if (link && link !== "#") {
      if (link === "/creator/dashboard") {
        try {
          window.localStorage.removeItem(SHOOTS_CURRENT_PAGE_KEY);
        } catch (error) {
          console.error("Failed to clear shoots current page state:", error);
        }
      }
      router.push(link);
    }
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isActiveLink = (link?: string) => {
    if (!link) return false;
    return pathname === link;
  };

  const isChildActive = (link?: string) => {
    if (!link) return false;
    return isActiveLink(link);
  };

  const isParentActive = (item: MenuItem) => {
    if (item.children) {
      return item.children.some((child) => isChildActive(child.href)) || isActiveLink(item.href);
    }
    return isActiveLink(item.href);
  };

  const menuItems: MenuItem[] = [
    { href: "/creator/dashboard", icon: LayoutDashboard, label: "Dashboard", isPublic: true },
    { href: "/creator/dashboard/request", icon: Camera, label: "Request & Shoots", isPublic: false },
    { href: "/creator/dashboard/file-manager", icon: FolderOpen, label: "File Manager", isPublic: true },
    { href: "/creator/dashboard/meetings", icon: CalendarClock, label: "Meetings", isPublic: false },
    { href: "/creator/dashboard/messages", icon: MessageCircle, label: "Messages", isPublic: false },
    { href: "/creator/dashboard/affiliate", icon: LayoutDashboard, label: "Affiliate", isPublic: false },
    { href: "/creator/dashboard/availability", icon: Calendar, label: "Availability", isPublic: false },
    { href: "/creator/dashboard/profile", icon: User, label: "Profile", isPublic: true },
    {
      label: 'Finances',
      icon: CircleDollarSign,
      isPublic: false,
      children: [
        { label: 'My Earnings', href: '/creator/dashboard/finances/earnings', isPublic: false },
      ],
    },
  ];

  return (
    <aside className={`
      w-full lg:w-64 border-r flex flex-col justify-between py-6 lg:py-9 px-5 h-full overflow-hidden transition-colors duration-100
      ${isDark
        ? "border-zinc-800 bg-[#0A0A0A]"
        : "border-[#D8D8D8] bg-white shadow-[0_8px_24px_0_rgba(149,157,165,0.10)]"
      }
    `}>
      {/* Mobile Header with Logo and Close Button */}
      <div className="flex items-center justify-between lg:justify-center mb-8">
        <Link href="/" className="relative flex items-center">
          <Image
            src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={100}
            height={20}
          />
          {/* Beta Tag */}
          <span className={`absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full border backdrop-blur-xs overflow-hidden ${isDark ? "text-white border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)]" : "text-black border-black/20 shadow-sm"
            }`}>
            Beta
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
          </span>
        </Link>
        <button onClick={onClose} className={`lg:hidden p-2 rounded-full ${isDark ? "bg-zinc-900 text-white" : "bg-zinc-100 text-black"}`}>
          <X size={20} />
        </button>
      </div>

      {/* Main Navigation items */}
      <div className="flex-1 overflow-y-auto mb-6 pr-2 no-scrollbar">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded.includes(item.label);
            const active = isParentActive(item);
            const locked = !isVerified && !item.isPublic;

            const baseClass = `w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium`;
            const activeClass = "bg-[#E5D5B8] text-[#171717]";
            const inactiveClass = isDark ? "text-[#676767] hover:text-white" : "text-[#676767] hover:text-[#101010]";

            if (locked) {
              return (
                <div key={item.label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed select-none opacity-30 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={`${baseClass} ${active ? activeClass : inactiveClass}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <item.icon size={20} />
                      <span className="min-w-0 truncate text-left font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.href || '#')}
                    className={`${baseClass} ${active ? activeClass : inactiveClass}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <item.icon size={20} />
                      <span className="min-w-0 truncate text-left font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                  </button>
                )}

                {/* Submenu Expansion container */}
                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-zinc-800 pl-4 space-y-1">
                    {item.children!.map((child) => {
                      const childActive = isChildActive(child.href);
                      const childLocked = !isVerified && !child.isPublic;

                      if (childLocked) {
                        return (
                          <div key={child.label} className="block px-4 py-2 text-sm select-none opacity-30 text-zinc-500 cursor-not-allowed">
                            {child.label}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={child.label}
                          onClick={() => handleNavigation(child.href)}
                          className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${childActive
                              ? (isDark ? "text-white font-medium bg-zinc-900" : "text-[#101010] font-bold bg-zinc-100")
                              : (isDark ? "text-zinc-500 hover:text-gray-300" : "text-[#00000066] hover:text-[#101010]")
                            }`}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Upcoming Disabled features */}
          <div className={`text-sm font-medium w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed select-none opacity-30 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
            <Wallet size={20} />
            <span>Payouts (Soon)</span>
          </div>
          <div className={`text-sm font-medium w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed select-none opacity-30 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
            <Settings size={20} />
            <span>Settings (Soon)</span>
          </div>
        </nav>
      </div>

      {/* User Profile and Logout Footer */}
      <div className={`pt-6 border-t flex-shrink-0 transition-colors ${isDark ? "border-white/10 bg-[#0A0A0A]" : "border-zinc-200 bg-white"}`}>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E5D5B8] to-[#C4A470] flex items-center justify-center text-black font-bold text-lg shrink-0">
            {user?.name?.[0] || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#101010]"}`}>{user?.name || "Creator"}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDark ? "text-[#171717] bg-[#FFFFFF]" : "text-[#FFFFFF] bg-[#171717]"}`}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
