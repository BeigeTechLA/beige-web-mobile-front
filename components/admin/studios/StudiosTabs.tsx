"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const tabs = [
    { name: "Operations", path: "/admin/studios/operations" },
    { name: "My Studios", path: "/admin/studios/my-studios" },
    { name: "Studio Requests", path: "/admin/studios/studio-requests" },
];

export default function StudiosTabs() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className={`flex gap-1 p-1 rounded-lg w-fit ${isDark ? "bg-[#1a1a1a]" : "bg-[#F4F5F7]"}`}>
            {tabs.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                    <button
                        key={tab.name}
                        onClick={() => router.push(tab.path)}
                        className={`text-sm px-4 py-2 rounded-md transition-colors font-medium ${isActive
                                ? "bg-[#E5D5B8] text-[#171717]"
                                : isDark
                                    ? "text-white/50 hover:text-white"
                                    : "text-black/50 hover:text-black"
                            }`}
                    >
                        {tab.name}
                    </button>
                );
            })}
        </div>
    );
}