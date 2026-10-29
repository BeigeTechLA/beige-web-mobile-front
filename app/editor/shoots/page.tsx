"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/src/components/landing/ui/button";
import { ShootsCalendarView } from "@/components/admin/ShootsCalendarView";
import { ShootsGlobeView } from "@/components/admin/ShootsGlobeView";
import EditorShootsWorkspace, { type EditorType } from "@/components/editor/EditorShootsWorkspace"; // adjust path

/**
 * Editor shoots page (dummy data, no API calls).
 *
 * Editor type: comes from the logged-in user later. For now it defaults to
 * "internal"; preview the external layout with `?editor=external`.
 */
const DEFAULT_EDITOR_TYPE: EditorType = "internal";

export default function ShootsPage() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [editorType, setEditorType] = useState<EditorType>(DEFAULT_EDITOR_TYPE);
  const [viewMode, setViewMode] = useState<"workspace" | "calendar" | "globe">("workspace");
  const [calendarOpenDate, setCalendarOpenDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    // Read ?editor= on the client (avoids a Suspense boundary for useSearchParams)
    const param = new URLSearchParams(window.location.search).get("editor");
    if (param === "internal" || param === "external") setEditorType(param);
  }, []);

  const isDark = !mounted || theme === "dark";

  const viewButton = (active: boolean) =>
    `h-9 lg:h-10 min-w-[118px] lg:min-w-[126px] px-4 lg:px-5 text-xs lg:text-sm font-medium rounded-lg border transition-colors ${active
      ? isDark ? "border-white bg-white text-black hover:bg-white/90" : "border-[#1F1F1F] bg-[#1F1F1F] text-white hover:bg-[#2A2A2A]"
      : isDark ? "border-[#3A3A3A] bg-[#171717] text-white/75 hover:bg-[#202020] hover:text-white" : "border-[#DADADA] bg-white text-black/70 hover:bg-[#F7F7F7] hover:text-black"}`;

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className="overflow-hidden p-4 pb-10 lg:p-6 lg:px-10 lg:py-9 space-y-5 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        {viewMode === "workspace" && (
          <>
            {/* Header */}
            <div className="flex justify-between items-start lg:items-end">
              <div>
                <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
                  Shoots Management
                </h1>
                <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
                  Track and manage your photography and videography project
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => setViewMode("globe")}
                  className={`h-9 lg:h-10 min-w-[118px] lg:min-w-[126px] px-4 lg:px-5 text-xs lg:text-sm font-medium rounded-lg border transition-colors ${
                    isDark
                      ? "border-[#3A3A3A] bg-[#171717] text-white/75 hover:bg-[#202020] hover:text-white"
                      : "border-[#DADADA] bg-white text-black/70 hover:bg-[#F7F7F7] hover:text-black"
                  }`}
                >
                  Globe View
                </Button>

                <Button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`h-9 lg:h-10 min-w-[118px] lg:min-w-[126px] px-4 lg:px-5 text-xs lg:text-sm font-medium rounded-lg border transition-colors ${
                    isDark
                      ? "border-white bg-white text-black hover:bg-white/90"
                      : "border-[#1F1F1F] bg-[#1F1F1F] text-white hover:bg-[#2A2A2A]"
                  }`}
                >
                  Calendar View
                </Button>
              </div>
            </div>

            <EditorShootsWorkspace isDark={isDark} editorType={editorType} />
          </>
        )}

        {viewMode === "calendar" && (
          <>
            <button
              type="button"
              onClick={() => setViewMode("workspace")}
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"}`}
            >
              <ArrowLeft size={20} strokeWidth={1.7} />
              Back
            </button>
            <div className={`overflow-hidden rounded-2xl border ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}>
              <ShootsCalendarView
                isDark={isDark}
                initialOpenDate={calendarOpenDate}
                onInitialOpenDateHandled={() => setCalendarOpenDate(null)}
                searchQuery=""
                categoryFilter="all"
                statusFilter="all"
                paymentFilter="all"
                productionFilter="all"
                cpAssignmentFilter="all"
              />
            </div>
          </>
        )}

        {viewMode === "globe" && (
          <ShootsGlobeView
            isDark={isDark}
            onBack={() => setViewMode("workspace")}
            onOpenCalendarDay={(date) => {
              setCalendarOpenDate(date);
              setViewMode("calendar");
            }}
          />
        )}
      </div>
    </>
  );
}
