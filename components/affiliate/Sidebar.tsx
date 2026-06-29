"use client";
import React, { useState, useEffect, MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Camera, LogOut, FolderOpen, CalendarClock, MessageCircle, Users, ChevronDown, X, Settings, Calendar, Search, type LucideIcon, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import { useTheme } from "next-themes";
import { pushToDataLayer } from "@/lib/gtm";
import { Button } from "../ui/button";

const CustomQuotesIcon = ({ size = 24, isActive = false, ...props }) => {
  const inactiveIcon = '/images/misc/Quotes.svg';
  const activeIcon = '/images/misc/QuotesActive.svg';

  return (
    <div
      {...props}
      style={{
        width: size,
        height: size,
        ...(isActive
          ? {
            // ACTIVE STATE: Normal background image (shows original SVG colors)
            backgroundImage: `url('${activeIcon}')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
          }
          : {
            // INACTIVE STATE: Masking effect (inherits currentColor/gray)
            backgroundColor: 'currentColor',
            WebkitMaskImage: `url('${inactiveIcon}')`,
            maskImage: `url('${inactiveIcon}')`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }),
      }}
    />
  );
};

import { useAppSelector } from '@/lib/redux/hooks';
import { hasModulePermission } from '@/lib/permissions';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, link: '/affiliate/dashboard', permissionKeys: ['dashboard'] },
  { name: 'Affiliate Overview', icon: Users, link: '/affiliate/overview', permissionKeys: ['users'] },
  { name: 'File Manager', icon: FolderOpen, link: '/affiliate/file-manager', permissionKeys: ['file_manager'] },
  { name: 'Find Yourself', icon: Search, link: '/affiliate/find-yourself', permissionKeys: ['shoots'] },
  { name: 'Meetings', icon: Calendar, link: '/affiliate/meetings', permissionKeys: ['meetings'] },
  { name: 'Messages', icon: MessageCircle, link: '/affiliate/messages', permissionKeys: ['messages'] },
  { name: 'Shoots', icon: Camera, link: '/affiliate/shoots', permissionKeys: ['shoots'] },
  { name: 'Quotes', icon: CustomQuotesIcon, link: '/affiliate/quotes', permissionKeys: ['quotes'] },
  { name: 'Book A Shoot', icon: CalendarClock, link: '/book-a-shoot', permissionKeys: ['shoots'] },
  { name: 'Finances', icon: DollarSign, link: '/affiliate/finances', permissionKeys: ['invoices'] },
  { name: 'Profile', icon: Settings, link: '/affiliate/profile', permissionKeys: ['settings'] },
];

type MenuItem = {
  name: string;
  icon: LucideIcon;
  link?: string;
  children?: { name: string; link: string; isDisabled?: boolean }[];
  isDisabled?: boolean;
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { permissions, permissionsVersion } = useAppSelector((state) => ({
    permissions: state.auth.permissions,
    permissionsVersion: state.auth.permissionsVersion,
  }));
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(["Users"]);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  const handleLinkClick = (link: string) => {
    if (link !== "#") {
      if (onClose) onClose();
      router.push(link);
    }
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };

  const isActiveLink = (link?: string) => {
    if (!link || link === "#") return false;
    return (
      pathname === link ||
      (link !== "/affiliate/dashboard" && pathname?.startsWith(link))
    );
  };

  const isParentActive = (item: MenuItem) => {
    if (item.children) {
      return item.children.some((child) => isActiveLink(child.link));
    }
    return isActiveLink(item.link);
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    if (onClose) onClose();
    router.push("/");
  };

  const handleBookAShoot = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    pushToDataLayer("book_shoot_started", {
      type: "Action Tracking",
      page_name: "Dashboard",
      location_in_website: "menubar",
      duration_on_page: performance.now() / 1000,
    });
    router.push('/book-a-shoot')
  }

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

      <div className="flex-1 overflow-y-auto mb-6 pr-2 no-scrollbar">
        <nav className="space-y-2" key={`affiliate-nav-${permissionsVersion}`}>
          {menuItems.map((item) => {
            // Role and permissions checks are disabled for client/affiliate
            /*
            if (item.permissionKeys && item.permissionKeys.length > 0) {
              const canView = hasModulePermission(permissions, item.permissionKeys, "view");
              if (!canView) return null;
            }
            */
            const hasChildren = item?.children && item?.children.length > 0;
            const isExpanded = expanded.includes(item.name);
            const active = isParentActive(item);
            const isDisabled = item.isDisabled;
            const bookingClicked = item.name === "Book A Shoot";

            const baseClass = `w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium`;
            const activeClass = "bg-[#E5D5B8] text-[#171717]";
            const inactiveClass = isDark ? "text-[#676767] hover:text-white" : "text-[#676767] hover:text-[#101010]";

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => !isDisabled && toggleExpand(item.name)}
                    className={`${baseClass} ${active ? activeClass : inactiveClass} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <item.icon size={20} {...(item.name === 'Quotes' ? { isActive: active } : {})} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : isDisabled ? (
                  <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed select-none opacity-30 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                    <item.icon size={20} {...(item.name === 'Quotes' ? { isActive: active } : {})} />
                    <span>{item.name}</span>
                  </div>
                ) : bookingClicked ? (
                  <Link
                    href={item.link || '#'}
                    onClick={handleBookAShoot}
                    className={`${baseClass} ${active ? activeClass : inactiveClass}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <item.icon size={20} {...(item.name === 'Quotes' ? { isActive: active } : {})} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href={item.link || '#'}
                    className={`${baseClass} ${active ? activeClass : inactiveClass}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <item.icon size={20} {...(item.name === 'Quotes' ? { isActive: active } : {})} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-zinc-800 pl-4 space-y-1">
                    {item.children!.map((child) => {
                      const isChildActive = isActiveLink(child.link);
                      return (
                        <Link
                          key={child.name}
                          href={child.link}
                          onClick={() => handleLinkClick(child.link)}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors ${isChildActive
                            ? (isDark ? "text-white font-medium" : "text-[#101010] font-bold")
                            : (isDark ? "text-zinc-500 hover:text-gray-300" : "text-[#00000066] hover:text-[#101010]")
                            }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile and Logout */}
      <div className={`pt-6 border-t flex-shrink-0 transition-colors ${isDark ? "border-white/10 bg-[#0A0A0A]" : "border-zinc-200 bg-white"}`}>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E5D5B8] to-[#C4A470] flex items-center justify-center text-black font-bold text-lg shrink-0">
            {user?.name?.[0] || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#101010]"}`}>{user?.name || "Affiliate"}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg ${isDark ? "text-[#171717] bg-[#FFFFFF]" : "text-[#FFFFFF] bg-[#171717]"} transition-colors text-sm font-medium`}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
