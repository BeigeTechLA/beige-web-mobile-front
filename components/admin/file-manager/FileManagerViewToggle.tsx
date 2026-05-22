"use client";

import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/hooks/useViewMode";
import { Grid3X3, LayoutDashboard, List } from "lucide-react";

type FileManagerViewToggleProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
};

const VIEW_OPTIONS: Array<{
  mode: ViewMode;
  label: string;
  icon: typeof Grid3X3;
}> = [
  { mode: "grid", label: "Grid View", icon: Grid3X3 },
  { mode: "list", label: "List View", icon: List },
  { mode: "board", label: "Board View", icon: LayoutDashboard },
];

export function FileManagerViewToggle({
  isOpen,
  setIsOpen,
  viewMode,
  setViewMode,
}: FileManagerViewToggleProps) {
  const ActiveIcon = VIEW_OPTIONS.find((option) => option.mode === viewMode)?.icon || Grid3X3;

  return (
    <>
      <div className="md:hidden relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
        >
          <ActiveIcon size={20} />
        </Button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.mode}
                  onClick={() => {
                    setViewMode(option.mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    viewMode === option.mode ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="hidden lg:flex flex-wrap items-center bg-[#202020] rounded-lg w-full md:w-fit border border-white/5">
        {VIEW_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const roundedClass =
            index === 0
              ? "rounded-l-lg"
              : index === VIEW_OPTIONS.length - 1
                ? "rounded-r-lg"
                : "";

          return (
            <Button
              key={option.mode}
              onClick={() => setViewMode(option.mode)}
              className={`px-5 py-2.5 ${roundedClass} transition-colors ${
                viewMode === option.mode
                  ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                  : "bg-transparent text-white/40 hover:text-white"
              }`}
              aria-label={option.label}
              title={option.label}
            >
              <Icon size={20} />
            </Button>
          );
        })}
      </div>
    </>
  );
}
