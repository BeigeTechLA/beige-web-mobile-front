"use client";

import React from "react";
import { fmTheme } from "./theme";

export interface InfoField {
  label: string;
  value: React.ReactNode;
  /** Gold value (e.g. due date) */
  highlight?: boolean;
  truncate?: boolean;
}

export default function InfoGridCard({
  isDark,
  title,
  fields,
  columns = 2,
}: {
  isDark: boolean;
  title: string;
  fields: InfoField[];
  columns?: 2 | 3;
}) {
  const t = fmTheme(isDark);
  return (
    <section className={`rounded-2xl border ${isDark ? "bg-[#111110] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
      <h2 className={`border-b p-4 lg:px-5 text-sm font-semibold ${ isDark ? "text-[#F0F0EF] border-[#242422]" : "text-[#111111] border-[#E5E5E5]"}`}>{title}</h2>
      <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 p-4 lg:p-5 ${columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className={`text-[10px] lg:text-xs uppercase tracking-wider ${t.faint}`}>{f.label}</dt>
            <dd
              className={`mt-1 text-xs lg:text-sm font-medium ${f.truncate ? "truncate" : ""} ${f.highlight ? `${t.gold} font-semibold` : t.strong}`}
              title={f.truncate && typeof f.value === "string" ? f.value : undefined}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
