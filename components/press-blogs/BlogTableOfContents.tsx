"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BlogHeading } from "@/lib/utils/blogUtils";

interface BlogTableOfContentsProps {
  headings: BlogHeading[];
}

export const BlogTableOfContents: React.FC<BlogTableOfContentsProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id || "");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!headings || headings.length === 0) return null;

  // Determine which headings to display based on expand state
  const visibleHeadings = isExpanded ? headings : headings.slice(0, 3);
  const hasMoreContent = headings.length > 3;

  const scrollToHeading = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120; // Clearance offset for fixed headers/navbars
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-28 w-full rounded-2xl border border-white/10 bg-[#0C0C0C]/80 p-6 backdrop-blur-md">
      <div className="relative pl-4">
        {/* Left Vertical Active Indicator Track */}
        <div className="absolute left-0 top-0 h-full w-[2px] bg-white/10 rounded-full" />

        <div className="space-y-6">
          {visibleHeadings.map((heading) => {
            const isActive = activeId === heading.id;
            const headingClean = heading.text.replace(/&amp;/g, "&"); // Remove any HTML tags for display
            return (
              <div
                key={heading.id}
                className="relative group cursor-pointer"
                onClick={() => scrollToHeading(heading.id)}
              >
                {/* Active Golden Bar */}
                {isActive && (
                  <div className="absolute -left-4 top-0 h-full w-[3px] rounded-full bg-[#E8D1AB]" />
                )}

                <p
                  className={`text-sm lg:text-base leading-snug transition-colors duration-200 truncate ${
                    isActive
                      ? "text-white font-medium"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {headingClean}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expand/Collapse Trigger (only render if there are more than 3 headings) */}
      {hasMoreContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-8 flex items-center justify-center gap-2 w-full text-xs lg:text-sm text-[#E8D1AB] hover:text-[#d2bb95] transition-colors"
        >
          <span>{isExpanded ? "Show less" : "Discover more content"}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
};