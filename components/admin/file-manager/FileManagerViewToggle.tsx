"use client";

import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/hooks/useViewMode";
import { Grid3X3, LayoutDashboard, List } from "lucide-react";

type FileManagerViewToggleProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  isDark: boolean;
};

const VIEW_OPTIONS: Array<{
  mode: ViewMode;
  label: string;
  icon: typeof Grid3X3;
}> = [
    { mode: "grid", label: "Grid View", icon: Grid3X3 },
    { mode: "list", label: "List View", icon: List },
    // { mode: "board", label: "Board View", icon: LayoutDashboard },
  ];

export function FileManagerViewToggle({
  isOpen,
  setIsOpen,
  viewMode,
  setViewMode,
  isDark = true
}: FileManagerViewToggleProps) {
  const ActiveIcon = VIEW_OPTIONS.find((option) => option.mode === viewMode)?.icon || Grid3X3;

  return (
    <>
      <div className="md:hidden relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 p-2 h-8 rounded-lg border transition-colors ${isDark
              ? "bg-[#202020] border-white/10 text-white hover:bg-[#2c2c2c]"
              : "bg-white border-[#D7D7D7] text-black hover:bg-[#F4F5F7]"
            }`}
        >
          <ActiveIcon size={20} />
        </Button>

        {isOpen && (
          <div className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl z-[50] overflow-hidden transition-colors ${isDark ? "bg-[#171717] border-white/10" : "bg-white border-[#D7D7D7]"
            }`}>
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = viewMode === option.mode;

              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => {
                    setViewMode(option.mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${isSelected
                      ? isDark
                        ? "bg-white/10 text-white"
                        : "bg-black/5 text-black font-medium"
                      : isDark
                        ? "text-white/60 hover:bg-white/5"
                        : "text-[#727272] hover:bg-black/5"
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

      {/* Large Desktop Horizontal Layout Control Grid */}
      <div className={`hidden lg:flex flex-wrap items-center rounded-lg w-full md:w-fit border transition-colors ${isDark ? "bg-[#202020] border-white/5" : "bg-white border-white"
        }`}>
        {VIEW_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = viewMode === option.mode;

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
              className={`px-5 py-2.5 ${roundedClass} transition-colors ${isSelected
                  ? isDark
                    ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"
                  : isDark
                    ? "bg-transparent text-white/40 hover:text-white"
                    : "bg-transparent text-black hover:text-black/80"
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