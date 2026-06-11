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

export default function ProjectTimeline({ status = 0 }: { status?: number }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || (resolvedTheme === "dark" || theme === "dark");

  // Timeline status mapping (0-7):
  // 0 Initiated, 1 Pre Production, 2 Shoot Day, 3 Post Production,
  // 4 Revision, 5 Completed, 6 Assets Delivered, 7 Cancelled.
  // Backward compatible with legacy booking.status values (0-5).

  const getCurrentStep = () => {
    if (status === 7) return 1;
    if (status === 0) return 1;
    if (status === 1) return 2;
    if (status === 2) return 3;
    if (status === 3) return 4;
    if (status === 4) return 5;
    if (status === 5) return 6;
    if (status >= 6) return 7;
    return 1;
  };

  if (!mounted) return null;

  const currentStepId = getCurrentStep();

  return (
    <div className={`h-full lg:w-80 shrink-0 mt-1 pt-8 lg:pt-6 transition-colors duration-300 border-l ${isDark ? "bg-[#111111] border-[#222222]" : "bg-[#FFFFFF] border-[#D8D8D8]"}`}>
      <h3 className={`px-6 py-3 text-lg font-bold lg:my-8 border-y transition-colors duration-300 ${isDark ? "text-white bg-[#101010] border-[#3A3A3A]" : "text-black bg-[#F4F5F7] border-[#D8D8D8]"}`}>
        Project Timeline
      </h3>

      <div className="p-6 flex flex-col gap-0.5">
        {steps.map((step) => {
          const isCompleted = step.id < currentStepId;
          const isCurrent = step.id === currentStepId;
          const isPending = step.id > currentStepId;
          const isActive = isCompleted || isCurrent;

          return (
            <div key={step.id} className="relative flex gap-4">
              {/* Icon Column */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${isActive
                  ? 'bg-[#E8D1AB] border-[#E8D1AB] text-black scale-110 shadow-lg shadow-[#E8D1AB]/10'
                  : isDark
                    ? 'bg-transparent border-[#333333] text-[#666666]'
                    : 'bg-transparent border-[#CCCCCC] text-[#999999]'
                  }`}>
                  <step.icon size={18} />
                </div>
                {
                  step.line && (
                    <div className={`h-10 w-px border-l border-dashed my-2 transition-colors duration-300 ${isDark ? "border-[#444444]" : "border-[#CCCCCC]"
                      }`} />
                  )}
              </div>

              {/* Label Column */}
              <div className="pt-2">
                <p className={`text-base font-medium leading-none transition-colors ${isActive
                  ? (isDark ? 'text-white' : 'text-black')
                  : 'text-[#666666]'
                  }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
