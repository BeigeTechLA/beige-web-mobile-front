"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Camera, LogOut, FolderOpen, CalendarClock, MessageCircle, Users, ChevronDown, X, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useAppSelector } from '@/lib/redux/hooks';
import { hasModulePermission } from '@/lib/permissions';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, link: '/production-manager/dashboard', permissionKeys: ['production_manager_dashboard', 'dashboard'] },
    { name: 'Creative Partners', icon: Users, link: '/production-manager/creative-partners', permissionKeys: ['production_manager_creative_partner', 'users'] },
    { name: 'Shoots', icon: Camera, link: '/production-manager/shoots', permissionKeys: ['production_manager_shoots', 'shoots'] },
    { name: 'File Manager', icon: FolderOpen, link: '/production-manager/file-manager', permissionKeys: ['production_manager_file_manager', 'file_manager'] },
    { name: 'Meetings', icon: CalendarClock, link: '/production-manager/meetings', permissionKeys: ['production_manager_meetings', 'meetings'] },
    { name: 'Messages', icon: MessageCircle, link: '/production-manager/messages', permissionKeys: ['production_manager_messages', 'messages'] },
    { name: 'Availability', icon: CalendarClock, link: '/production-manager/availability', permissionKeys: ['production_manager_availability', 'availability'] },
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
    const permissions = useAppSelector((state) => state.auth.permissions);
    const initialPath = useRef(pathname);
    const [mounted, setMounted] = useState(false);
    const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (onClose && pathname !== initialPath.current) {
      onClose();
    }
  }, [pathname, onClose]);

  const isDark = !mounted || theme === "dark";

  const handleNavigation = (link: string) => {
    if (link && link !== "#") {
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
      (link !== "/production-manager/dashboard" && pathname?.startsWith(link))
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
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const canView = item.permissionKeys?.length
              ? hasModulePermission(permissions, item.permissionKeys, "view")
              : true;
            if (!canView) return null;

            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded.includes(item.name);
            const active = isParentActive(item);
            const isDisabled = item.isDisabled;

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
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : isDisabled ? (
                  <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed select-none opacity-30 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.link || '#')}
                    className={`${baseClass} ${active ? activeClass : inactiveClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </button>
                )}

                {/* Submenu */}
                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-zinc-800 pl-4 space-y-1">
                    {item.children!.map((child) => {
                      const canViewChild = child.permissionKeys?.length
                        ? hasModulePermission(permissions, child.permissionKeys, "view")
                        : true;
                      if (!canViewChild) return null;
                      const isChildActive = isActiveLink(child.link);
                      return (
                        <button
                          key={child.name}
                          onClick={() => handleNavigation(child.link)}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors ${isChildActive
                            ? (isDark ? "text-white font-medium" : "text-[#101010] font-bold")
                            : (isDark ? "text-zinc-500 hover:text-gray-300" : "text-[#00000066] hover:text-[#101010]")
                            }`}
                        >
                          {child.name}
                        </button>
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
            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#101010]"}`}>{user?.name || "Production Manager"}</p>
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
