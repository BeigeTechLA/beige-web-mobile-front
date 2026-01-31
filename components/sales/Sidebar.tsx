"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Camera, LogOut, FolderOpen, MessageSquare, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth";

const salesMenuItems = [
    { name: 'Sales', icon: LayoutDashboard, link: '/sales/dashboard' },
    { name: 'Shoots', icon: Camera, link: '/sales/shoots' },
    { name: 'File Manager', icon: FolderOpen, link: '/sales/file-manager' },
    { name: 'Messages', icon: MessageSquare, link: '/sales/messages' },
];

type SalesMenuItem = {
    name: string;
    icon: any;
    link?: string;
};

export default function SalesSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

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
        router.push("/");
    };

    return (
        <aside className="w-64 border-r border-zinc-800 flex flex-col justify-between py-9 px-5 bg-[#0A0A0A] h-full overflow-hidden">
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
