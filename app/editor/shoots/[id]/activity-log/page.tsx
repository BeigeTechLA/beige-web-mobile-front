"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Topbar from "@/components/admin/Topbar";

/**
 * Editor – Shoot activity log (dummy data, no API calls).
 * Opened from "View Activity" on the editor shoot details page.
 */

type ActivityTone = "success" | "info" | "neutral";

interface ActivityItem {
  id: string;
  title: string;
  /** Detail parts, joined with " · " */
  meta: string[];
  /** ISO timestamp */
  at: string;
  tone: ActivityTone;
}

const DUMMY_ACTIVITY: ActivityItem[] = [
  { id: "a4", title: "Alex Morgan accepted the assignment.", meta: ["External Editor", "Agreement v1 accepted"], at: "2026-10-01T09:20:00", tone: "success" },
  { id: "a3", title: "Assignment sent to Editor.", meta: ["Email notification and agreement delivered"], at: "2026-09-30T14:25:00", tone: "info" },
  { id: "a2", title: "Compensation updated to $250.", meta: ["Editor compensation only", "CP compensation unchanged"], at: "2026-09-30T14:10:00", tone: "neutral" },
  { id: "a1", title: "Sam assigned Alex Morgan as External Editor.", meta: ["Previous Editor: Unassigned"], at: "2026-09-30T13:42:00", tone: "neutral" },
];

const DOT: Record<ActivityTone, string> = {
  success: "bg-[#3DD68C]",
  info: "bg-[#3BA7F5]",
  neutral: "bg-[#D9C08F]",
};

/** "01 Oct, 9:20 AM" */
const formatActivityTime = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
};

export default function EditorShootActivityPage({ activity = DUMMY_ACTIVITY }: { activity?: ActivityItem[] }) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  // Newest first
  const items = [...activity].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className="p-4 pb-10 lg:p-6 lg:px-10 lg:py-8 space-y-5 lg:space-y-6"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className={`inline-flex items-center gap-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "text-white/85 hover:text-white" : "text-black/70 hover:text-black"}`}
        >
          <ArrowLeft size={20} strokeWidth={1.7} />
          Back
        </button>

        <section className={`rounded-2xl border ${isDark ? "bg-[#0C0C0C] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
          {/* Header */}
          <div className={`p-5 border-b space-y-1 ${isDark ? "border-[#242422]" : "border-[#EEEEEE]"}`}>
            <h1 className={`text-xs lg:text-sm font-semibold ${isDark ? "text-[#F0F0EF]" : "text-[#111]"}`}>
              Editor Assignment &amp; Activity
            </h1>
            <p className={`text-xs lg:text-sm ${isDark ? "text-[#848484]" : "text-black/55"}`}>
              Preserved assignment, work, agreement, and payment history.
            </p>
          </div>

          {/* Timeline */}
          {items.length === 0 ? (
            <p className={`px-6 py-14 text-center text-sm ${isDark ? "text-[#D0D0CB]" : "text-black/50"}`}>No activity yet.</p>
          ) : (
            <ol className="p-5 lg:pt-6">
              {items.map((item, i) => {
                const last = i === items.length - 1;
                return (
                  <li key={item.id} className="relative flex gap-2.5">
                    {/* Dot + connector */}
                    <div className="relative flex flex-col items-center shrink-0 w-2.5">
                      <span className={`mt-1.5 lg:mt-2 w-2.5 h-2.5 rounded-full ${DOT[item.tone]}`} aria-hidden="true" />
                      {!last && <span className={`mt-1 w-px flex-1 ${isDark ? "bg-[#343431]" : "bg-black/10"}`} aria-hidden="true" />}
                    </div>

                    {/* Content */}
                    <div className={`min-w-0 flex-1 flex flex-row items-start justify-between gap-1 sm:gap-6 ${last ? "" : "pb-7 lg:pb-9"}`}>
                      <div className="min-w-0">
                        <p className={`text-sm lg:text-base font-semibold leading-snug ${isDark ? "text-[#D0D0CB]" : "text-[#111]"}`}>{item.title}</p>
                        <p className={`mt-1 text-[10px] lg:text-xs ${isDark ? "text-[#777772]" : "text-black/55"}`}>{item.meta.join(" · ")}</p>
                      </div>
                      <time
                        dateTime={item.at}
                        className={`shrink-0 text-[10px] lg:text-xs whitespace-nowrap ${isDark ? "text-[#555550]" : "text-black/45"}`}
                      >
                        {formatActivityTime(item.at)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
