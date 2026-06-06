"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Camera,
    FolderOpen,
    LogOut,
    Wallet,
    Settings,
    Calendar,
    User,
    MessageCircle,
    CalendarClock,
    DollarSign,
    X,
    ChevronDown,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { CheckVerificationStatus } from "@/lib/api";

type MenuItem = {
    name: string;
    icon: LucideIcon;
    link?: string;
    isPublic?: boolean;
    isDisabled?: boolean;
    children?: { name: string; link: string; isDisabled?: boolean }[];
};

const menuItems: MenuItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, link: "/creator/dashboard", isPublic: true },
    { name: "Request & Shoots", icon: Camera, link: "/creator/dashboard/request" },
    { name: "File Manager", icon: FolderOpen, link: "/creator/dashboard/file-manager" },
    { name: "Meetings", icon: CalendarClock, link: "/creator/dashboard/meetings" },
    { name: "Messages", icon: MessageCircle, link: "/creator/dashboard/messages" },
    { name: "Affiliate", icon: LayoutDashboard, link: "/creator/dashboard/affiliate" },
    { name: "Availability", icon: Calendar, link: "/creator/dashboard/availability" },
    { name: "Profile", icon: User, link: "/creator/dashboard/profile", isPublic: true },
    {
        name: "Finances",
        icon: DollarSign,
        link: '/creator/dashboard/finance',
        isPublic: true,
        children: [
            // { name: 'Payouts', link: '/creator/dashboard/finance/payouts' },
            // { name: 'Transactions', link: '/creator/dashboard/finance/transactions' },
            // { name: 'Disputes', link: '/creator/dashboard/finance/disputes' },
            { name: 'My Earnings', link: '/creator/dashboard/finance/earnings' },
        ]
    },
    { name: "Payouts (Soon)", icon: Wallet, link: "#", isDisabled: true },
    { name: "Settings (Soon)", icon: Settings, link: "#", isDisabled: true },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isVerified, setIsVerified] = useState(false);
    const [expanded, setExpanded] = useState<string[]>([]);
    const initialPath = useRef(pathname);

    // Sync verification status
    useEffect(() => {
        const syncStatus = async () => {
            const userStr = typeof window !== 'undefined' ? localStorage.getItem("revure_user") : null;
            const localUser = userStr ? JSON.parse(userStr) : null;
            const crewId = user?.crew_member_id || localUser?.crew_member_id;

            if (!crewId) return;

            try {
                const response = await CheckVerificationStatus({ crew_member_id: crewId });
                if (response && !response.error && response.data?.data) {
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
    }, [pathname, user]);

    // Auto-expand parent when child route is active
    useEffect(() => {
        setExpanded((prev) => {
            const next = [...prev];
            menuItems.forEach((item) => {
                if (item.children && pathname?.startsWith(item.link || '')) {
                    if (!next.includes(item.name)) next.push(item.name);
                }
            });
            return next;
        });
    }, [pathname]);

    // Close mobile sidebar on navigation (if path changed)
    useEffect(() => {
        if (onClose && pathname !== initialPath.current) {
            onClose();
        }
    }, [pathname, onClose]);

    const handleLogout = useCallback(() => {
        logout();
        localStorage.clear();
        onClose?.();
        router.push("/login");
    }, [logout, onClose, router]);

    const toggleExpand = (name: string) => {
        setExpanded((prev) =>
            prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
        );
    };

    // Check if exact link matches
    const isActiveLink = (link?: string) => {
        if (!link || link === "#") return false;
        return pathname === link;
    };

    // Check if any child link is active
    const isChildActive = (children?: MenuItem['children']) => {
        if (!children) return false;
        return children.some((child) => isActiveLink(child.link));
    };

    // Parent is active if its link OR any child is active
    const isParentActive = (item: MenuItem) => {
        if (item.children) {
            return isChildActive(item.children) || isActiveLink(item.link);
        }
        return isActiveLink(item.link);
    };

    const handleNavigation = (link: string) => {
        if (link && link !== "#") {
            router.push(link);
        }
    };

    const NavLink = ({ item }: { item: MenuItem }) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expanded.includes(item.name);
        const active = isParentActive(item);
        const locked = !item.isPublic && !isVerified;

        // Disabled or locked state
        if (item.isDisabled || locked) {
            return (
                <div className={`flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${locked ? "text-white/20 cursor-not-allowed opacity-50" : "text-white/60 cursor-not-allowed opacity-50"
                    }`}>
                    <item.icon size={20} />
                    <span>{item.name}</span>
                </div>
            );
        }

        // Has children: button with toggle
        if (hasChildren) {
            return (
                <div className="space-y-1">
                    <button
                        onClick={() => toggleExpand(item.name)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg font-medium transition-colors ${active ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </div>
                        <ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {/* Submenu */}
                    {isExpanded && (
                        <div className="ml-4 border-l border-white/10 pl-4 space-y-1">
                            {item.children!.map((child) => {
                                const childActive = isActiveLink(child.link);
                                return (
                                    <Link
                                        key={child.name}
                                        href={child.link}
                                        onClick={() => onClose?.()}
                                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${childActive
                                            ? "text-[#E8D1AB] font-medium"
                                            : "text-white/40 hover:text-white"
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
        }

        // Simple link
        return (
            <Link
                href={item.link || "#"}
                onClick={() => { onClose?.(); }}
                className={`flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${active
                    ? "bg-[#E8D1AB]/10 text-[#E8D1AB]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
            >
                <item.icon size={20} />
                <span>{item.name}</span>
            </Link>
        );
    };

    return (
        <aside className="w-full lg:w-64 border-r border-white/10 bg-[#111] flex flex-col justify-between py-6 lg:py-9 px-5 h-full overflow-hidden">
            {/* Header with Logo */}
            <div className="flex items-center justify-between lg:justify-center mb-8">
                <Link href="/" className="relative flex items-center w-fit" onClick={onClose}>
                    <Image
                        src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
                        alt="BEIGE"
                        width={158}
                        height={32}
                    />
                    <span className="absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full text-white border border-white/40">
                        Beta
                    </span>
                </Link>
                <button onClick={onClose} className="lg:hidden p-2 text-white/60 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto mb-6 pr-2 space-y-1 no-scrollbar">
                {menuItems.map((item) => (
                    <NavLink key={item.name} item={item} />
                ))}
            </nav>

            {/* User Profile and Logout */}
            <div className="pt-6 border-t border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8D1AB] text-black font-bold flex items-center justify-center shrink-0">
                        {user?.name?.[0] || "A"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-white/40 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full gap-2 px-3 py-2 text-red-400 hover:bg-red-400/10 transition-colors text-sm rounded-lg"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}