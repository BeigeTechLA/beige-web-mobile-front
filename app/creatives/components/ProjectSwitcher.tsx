"use client";

import React from "react";

interface TabsSwitcherProps<T extends string> {
  projects: string[];
  active: string;
  onChange: (project: string) => void;
  className?: string;
}

export function ProjectSwitcher<T extends string>({
  projects,
  active,
  onChange,
  className = "",
}: TabsSwitcherProps<T>) {
  return (
    <div
      className={`flex items-center gap-1 bg-[#171717] p-1 rounded-full w-fit h-14 lg:h-[78px] ${className}`}
    >
      {projects.map((project, index) => {
        const isActive = active === project;

        return (
          <button
            key={project}
            onClick={() => onChange(project)}
            className={`px-4 lg:px-6 py-2 lg:py-4 rounded-full text-lg lg:text-[22px] font-medium transition-all capitalize ${isActive
                ? "bg-[#E5D5B8] text-black shadow-lg"
                : "text-[#777] hover:text-white"
              }`}
          >
            {project}
          </button>
        );
      })}
    </div>
  );
}
