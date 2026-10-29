"use client";

import React from "react";
import { Calendar, FolderSymlink, Link } from "lucide-react";
import { fmTheme, formatDate } from "./theme";

/** "Edits (3 Folders)" card with the "Linked to" box, shown at the top of a folder. */
export default function FolderInfoCard({
  isDark,
  title,
  badge,
  linkedTo,
  linkedOn,
}: {
  isDark: boolean;
  title: string;
  /** Right of the title (e.g. <LatestBadge/>) or far right on wide screens */
  badge?: React.ReactNode;
  linkedTo?: string;
  linkedOn?: string;
}) {
  const t = fmTheme(isDark);
  return (
    <section className={`rounded-2xl border p-4 lg:p-5 space-y-4 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-[#2F2D2D] text-white" : "bg-[#F0F0F0] text-black/70"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5.83464 5.41927H13.9596C15.7152 5.41927 16.593 5.41927 17.2236 5.8406C17.4965 6.02299 17.7309 6.25737 17.9133 6.53035C18.2995 7.10839 18.3317 7.71911 18.3344 9.16927M10.0013 5.41927L9.47344 4.36354C9.03613 3.48892 8.63649 2.60853 7.66735 2.24511C7.24288 2.08594 6.75799 2.08594 5.7882 2.08594C4.27447 2.08594 3.5176 2.08594 2.94969 2.40287C2.54486 2.62879 2.21082 2.96283 1.9849 3.36766C1.66797 3.93557 1.66797 4.69244 1.66797 6.20616V8.7526C1.66797 12.681 1.66797 14.6452 2.88836 15.8655C3.9718 16.949 5.64147 17.0706 8.7513 17.0842H9.16797" stroke="white" strokeWidth="1.33" strokeLinecap="round" />
              <path d="M14.6309 17.9141H15.3717C16.7684 17.9141 17.4668 17.9141 17.9007 17.4747C18.3346 17.0354 18.3346 16.3283 18.3346 14.9141V14.6567C18.3346 14.0436 18.3346 13.737 18.2219 13.4614C18.1091 13.1857 17.895 12.9689 17.4668 12.5354L16.3753 11.4302C16.0282 11.0788 15.8547 10.9031 15.6552 10.7729C15.4306 10.6263 15.1818 10.522 14.9206 10.4648C14.6886 10.4141 14.4432 10.4141 13.9523 10.4141C13.2037 10.4141 12.8293 10.4141 12.5377 10.5479C12.2106 10.6981 11.9485 10.9635 11.8002 11.2947C11.668 11.5899 11.668 11.9689 11.668 12.727V14.9141C11.668 16.3283 11.668 17.0354 12.1019 17.4747C12.5358 17.9141 13.2342 17.9141 14.6309 17.9141Z" stroke="white" strokeWidth="1.33" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className={`truncate text-sm lg:text-base font-semibold ${t.gold}`}>{title}</h2>
          {badge}
        </div>
      </div>
      {linkedTo && (
        <div className={`flex items-center gap-3 rounded-xl border p-3 lg:p-4 ${t.panel}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-black">
            <Link size={16} />
          </span>
          <div className="min-w-0 text-sm lg:text-base">
            <p className={`truncate ${t.strong}`}>Linked to: {linkedTo}</p>
            {linkedOn && (
              <p className={`mt-0.5 flex items-center gap-1 ${t.strong}`}>
                <Calendar size={12} /> {formatDate(linkedOn)}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
