"use client";
import {
  Grid2x2X,
  Camera,
  LogOut,
  CopyPlus,
  FolderOpen,
  CalendarClock,
  MessageCircle,
  Users,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type MenuItem = {
  name: string;
  icon: any;
  link?: string;
  children?: { name: string; link: string }[];
};

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: Grid2x2X, link: "/admin/dashboard" },
  { name: "Shoots", icon: Camera, link: "/admin/shoots" },
  { name: "File Manager", icon: FolderOpen, link: "/admin/file-manager" },
  { name: "Messages", icon: MessageCircle, link: "/admin/messages" },
  { name: "Availability", icon: CalendarClock, link: "#" },
  { name: "Sales Representative", icon: CopyPlus, link: "#" },
  {
    name: "Users",
    icon: Users,
    children: [
      { name: "All Users", link: "#" },
      { name: "Clients", link: "#" },
      { name: "Creative Partners", link: "/admin/users/creative-partners" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
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

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col justify-between py-9 px-5 bg-[#0A0A0A] h-screen overflow-y-auto">
      <div>
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-[#E5D5B8] text-black"
                        : "text-zinc-500 hover:text-white"
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
                    href={item.link || "#"}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-[#E5D5B8] text-black"
                        : "text-zinc-500 hover:text-white"
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
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                            isChildActive
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

      {/* Logout Button */}
      <button className="flex items-center gap-3 bg-white text-black px-4 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors mt-auto">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
