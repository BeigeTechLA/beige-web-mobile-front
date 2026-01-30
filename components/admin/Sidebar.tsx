"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Grid2x2X, Camera, LogOut, FolderOpen, CalendarClock, MessageCircle, Users, ChevronDown, CircleDollarSign } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth";

const menuItems = [
  { name: 'Dashboard', icon: Grid2x2X, link: '/admin/dashboard' },
  { name: 'Shoots', icon: Camera, link: '/admin/shoots' },
  { name: 'File Manager', icon: FolderOpen, link: '/admin/file-manager' },
  { name: 'Messages', icon: MessageCircle, link: '/admin/messages' },
  { name: 'Availability', icon: CalendarClock, link: '#' },
  { name: 'Sales Representative', icon: CircleDollarSign, link: '/admin/sales-representative' },
  {
    name: 'Users',
    icon: Users,
    children: [
      { name: 'All Users', link: '#' },
      { name: 'Clients', link: '#' },
      { name: 'Creative Partners', link: '/admin/users/creative-partners' },
    ]
  },
];

type MenuItem = {
  name: string;
  icon: any;
  link?: string;
  children?: { name: string; link: string }[];
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState<string[]>(["Users"]);

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
    router.push("/");
  };

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col justify-between py-9 px-5 bg-[#0A0A0A] h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto mb-6 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Navigation Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded.includes(item.name);
            const active = isParentActive(item);

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm ${active ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
                      }`}
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
                ) : (
                  <Link
                    href={item.link || '#'}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${active ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
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
                      return (
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
