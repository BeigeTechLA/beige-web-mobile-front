"use client";

import React from "react";
import { fmTheme } from "./theme";

/** Required / Uploaded / Remaining progress card for the Edited Deliverables folder. */
export default function DeliverableProgress({
  isDark,
  label,
  required,
  uploaded,
  status,
}: {
  isDark: boolean;
  label: string;
  required: number;
  uploaded: number;
  status: string;
}) {
  const t = fmTheme(isDark);
  const pct = required > 0 ? Math.min(100, Math.round((uploaded / required) * 100)) : 0;
  const stats = [
    { label: "Required", value: required },
    { label: "Uploaded", value: uploaded },
    { label: "Remaining", value: Math.max(0, required - uploaded) },
    { label: "Status", value: status },
  ];

  return (
    <section className={`rounded-2xl border p-4 lg:p-5 ${t.panel}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={`text-[10px] font-medium uppercase tracking-wider ${t.gold}`}>Deliverable Progress</p>
          <p className={`mt-1 text-sm font-medium ${t.strong}`}>{label}</p>
        </div>
        <p className={`text-xl lg:text-2xl ${t.gold}`}>{pct}%</p>
      </div>

      <div
        className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
      >
        <div className="h-full rounded-full bg-[#E8D1AB] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-0 sm:px-3 ${i > 0 ? `sm:border-l ${t.divider}` : "sm:pl-0"}`}>
            <dt className={`text-[10px] uppercase tracking-wider ${t.faint}`}>{s.label}</dt>
            <dd className={`mt-0.5 text-xs lg:text-sm ${t.strong}`}>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
