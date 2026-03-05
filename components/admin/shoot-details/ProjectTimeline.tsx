"use client";

import React, { useState, useEffect } from "react";
import { User, Folder, Calendar, FolderOpen, FileEdit, CheckCircle, FileCheck } from "lucide-react";
import { useTheme } from "next-themes";

const steps = [
    { id: 1, label: "Initiated", icon: User, status: "completed", line: true },
    { id: 2, label: "Pre_Production", icon: Folder, status: "current", line: true },
    { id: 3, label: "Shoot Day", icon: Calendar, status: "pending", line: true },
    { id: 4, label: "Post_Production", icon: FolderOpen, status: "pending", line: true },
    { id: 5, label: "Revision", icon: FileEdit, status: "pending", line: true },
    { id: 6, label: "Completed", icon: CheckCircle, status: "pending", line: true },
    { id: 7, label: "Assets Delivered", icon: FileCheck, status: "pending", line: false },
];

export default function ProjectTimeline() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    if (!mounted) return null;

    return (
        <div className={`h-full w-80 shrink-0 mt-1 pt-8 lg:pt-6 transition-colors duration-300 border-l ${isDark ? "bg-[#111111] border-[#222222]" : "bg-[#FFFFFF] border-[#D8D8D8]"
            }`}>
            <h3 className={`px-6 py-3 text-lg font-bold lg:my-8 border-y transition-colors duration-300 ${isDark
                    ? "text-white bg-[#101010] border-[#3A3A3A]"
                    : "text-black bg-[#F4F5F7] border-[#D8D8D8]"
                }`}>
                Project Timeline
            </h3>

            <div className="p-6 flex flex-col gap-0.5">
                {steps.map((step) => {
                    const isActive = step.status === 'completed' || step.status === 'current';

                    return (
                        <div key={step.id} className="relative flex gap-4">
                            {/* Icon Column */}
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${isActive
                                        ? (isDark ? 'bg-[#E5D5B8] border-[#E5D5B8] text-black' : 'bg-[#000000] border-[#000000] text-[#E8D1AB]')
                                        : (isDark ? 'bg-transparent border-[#333333] text-[#666666]' : 'bg-[#F4F5F7] border-[#F4F5F7] text-[#A1A1A1]')
                                    }`}>
                                    <step.icon size={18} />
                                </div>
                                {step.line && (
                                    <div className={`h-10 w-px border-l border-dashed my-2 transition-colors duration-300 ${isDark ? "border-[#444444]" : "border-[#CCCCCC]"
                                        }`} />
                                )}
                            </div>

                            {/* Label Column */}
                            <div className="pt-2">
                                <p className={`text-base font-medium leading-none transition-colors duration-300 ${isActive
                                        ? (isDark ? 'text-white' : 'text-black')
                                        : (isDark ? 'text-[#666666]' : 'text-[#999]')
                                    }`}>
                                    {step.label.replace("_", " ")}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}