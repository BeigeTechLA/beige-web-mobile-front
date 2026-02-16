"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Camera, LogOut, FolderOpen, CalendarClock, MessageCircle, Users, ChevronDown, CircleDollarSign, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";

const salesMenuItems = [
  { name: 'Sales', icon: LayoutDashboard, link: '/sales/dashboard' },
  { name: 'Shoots', icon: Camera, link: '/sales/shoots' },
  { name: 'File Manager', icon: FolderOpen, link: '/sales/file-manager' },
  { name: 'Messages', icon: MessageCircle, link: '/sales/messages' },
];

type SalesMenuItem = {
  name: string;
  icon: any;
  link?: string;
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
      (link !== "/sales/dashboard" && pathname?.startsWith(link))
    );
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
          {salesMenuItems.map((item) => {
            const active = isActiveLink(item.link);

            return (
              <div key={item.name}>
                <Link
                  href={item.link || '#'}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${active ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
                    }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile and Logout Button */}
      <div className="pt-6 border-t border-white/10 flex-shrink-0 bg-[#0A0A0A]">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E5D5B8] to-[#C4A470] flex items-center justify-center text-black font-bold text-lg shrink-0">
            {user?.name?.[0] || "S"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name || "Sales User"}</p>
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