"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Camera, LogOut, FolderOpen, CalendarClock, MessageCircle, Users, ChevronDown, CircleDollarSign, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, link: '/admin/dashboard' },
  { name: 'Shoots', icon: Camera, link: '/admin/shoots' },
  { name: 'File Manager', icon: FolderOpen, link: '/admin/file-manager', isDisabled: true },
  { name: 'Messages', icon: MessageCircle, link: '/admin/messages', isDisabled: true },
  // { name: 'Availability', icon: CalendarClock, link: '/admin/availability', isDisabled: true },
  { name: 'Availability', icon: CalendarClock, link: '/admin/availability' },
  { name: 'Sales Representative', icon: CircleDollarSign, link: '/admin/sales-representative' },
  {
    name: 'Users',
    icon: Users,
    children: [
      { name: 'All Users', link: '/admin/users/all' },
      { name: 'Users', link: '/admin/users/clients' },
      { name: 'Creative Partners', link: '/admin/users/creative-partners' },
    ]
  },
];

type MenuItem = {
  name: string;
  icon: any;
  link?: string;
  children?: { name: string; link: string }[];
  isDisabled?: boolean;
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState<string[]>(["Users"]);

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
      (link !== "/admin/dashboard" && pathname?.startsWith(link))
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
    <aside className="w-full lg:w-64 border-r border-zinc-800 flex flex-col justify-between py-6 lg:py-9 px-5 bg-[#0A0A0A] h-full overflow-hidden">
      {/* Mobile Header with Logo and Close Button */}
      <div className="flex lg:hidden items-center justify-between mb-8">
        <Link href="/" className="relative flex items-center">
          <Image
            src="https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/assets/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={100}
            height={20}
          />
          <span className="absolute right-0 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
            Beta
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
          </span>
        </Link>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-white">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto mb-6 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Navigation Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded.includes(item.name);
            const active = isParentActive(item);
            const isDisabled = item.isDisabled; // Get disabled state

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => !isDisabled && toggleExpand(item.name)} // Prevent toggle if disabled
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm ${active ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : isDisabled ? (
                  /* Render a DIV instead of a LINK if disabled */
                  <div
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-zinc-700 cursor-not-allowed select-none group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.link || '#'}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${active ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
                      }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-zinc-800 pl-4 space-y-1">
                    {item.children!.map((child) => {
                      const isChildActive = isActiveLink(child.link);
                      const isChildDisabled = child.isDisabled;

                      return isChildDisabled ? (
                        <div
                          key={child.name}
                          className="block px-4 py-2 text-sm text-zinc-700 cursor-not-allowed italic"
                        >
                          {child.name}
                        </div>
                      ) : (
                        <Link
                          key={child.name}
                          href={child.link}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors ${isChildActive
                            ? "text-white font-medium"
                            : "text-zinc-500 hover:text-gray-300"
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

      {/* User Profile and Logout Button */}
      <div className="pt-6 border-t border-white/10 flex-shrink-0 bg-[#0A0A0A]">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E5D5B8] to-[#C4A470] flex items-center justify-center text-black font-bold text-lg shrink-0">
            {user?.name?.[0] || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
