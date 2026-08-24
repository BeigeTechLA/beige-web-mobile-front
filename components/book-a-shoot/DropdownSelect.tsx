"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type Option = {
  key: string;
  value: string;
};

type DropdownSelectProps = {
  title: string;
  options: Option[];
  value: string | null;
  bgColour: string;
  onChange: (key: string) => void;
  icon?: React.ReactNode;
  isDark?: boolean;
  floatingTitle?: boolean;
};

export default function DropdownSelect({
  title,
  options,
  value,
  bgColour,
  onChange,
  icon,
  isDark = true,
  floatingTitle = false,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.key === value);
  const hasValue = open || !!selectedOption;

  const filteredOptions = options.filter((option) =>
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    // Attach listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = dropdownRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuMaxHeight = 300;
      const gap = 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openAbove = spaceBelow < menuMaxHeight && spaceAbove > spaceBelow;
      if (openAbove) {
        setMenuStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + gap,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
        });
        return;
      }

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className={`relative w-full ${floatingTitle ? "mt-2.5" : ""}`} ref={dropdownRef}>
      {/* External Label (rendered when floatingTitle is false) */}
      {!floatingTitle && (
        <div
          className={`text-sm font-medium font-bold capitalize tracking-wider absolute -top-3 left-4 z-20 px-2 ${isDark ? `${bgColour} text-white/60` : "text-black/40"
            }`}
        >
          {title}
        </div>
      )}

      <div
        className={`h-14 lg:h-[82px] relative ${bgColour} rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer border transition-colors ${isDark ? "border-white/40" : "border-[#0000004D]"
          }`}
        onClick={() => {
          if (!open) {
            setOpen(true);
            setSearchTerm("");
          }
        }}
      >
        {/* Floating Border Label (rendered when floatingTitle is true) */}
        {floatingTitle && (
          <span
            className={`absolute left-5 -top-2.5 px-1.5 text-xs font-normal pointer-events-none rounded-sm transition-colors ${bgColour} ${isDark ? "text-white/60" : "text-black/60"
              }`}
          >
            {title}
          </span>
        )}

        {/* Input or Selected value pill */}
        {open ? (
          <input
            autoFocus
            type="text"
            className={`bg-transparent border-none outline-none w-full text-sm lg:text-base mr-2 ${isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"
              }`}
            placeholder={`Search ${title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        ) : selectedOption ? (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm lg:text-base max-w-full ${isDark ? "bg-[#2A2A2A] text-white" : "bg-black/5 text-black"
              }`}
          >
            <span className="truncate">{selectedOption.value}</span>
            <X
              size={18}
              className="cursor-pointer opacity-70 hover:opacity-100 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          </div>
        ) : (
          <span className={`text-sm lg:text-base ${isDark ? "text-white/40" : "text-black/40"}`}>
            Select {title}
          </span>
        )}

        {/* Controls / Icons */}
        {icon ? (
          <div className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`}>{icon}</div>
        ) : open ? (
          <ChevronUp
            className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
        ) : (
          <ChevronDown className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} />
        )}
      </div>

      {/* Dropdown */}
      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className={`max-h-[300px] overflow-y-auto overscroll-contain rounded-lg border shadow-2xl ${isDark ? `${bgColour} border-white/10` : "bg-white border-gray-200"
              }`}
          >
            {filteredOptions.length === 0 ? (
              <div className={`px-6 py-4 text-center text-sm ${isDark ? "text-white/50" : "text-black/40"}`}>
                No options found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.key === value;

                return (
                  <div
                    key={option.key}
                    onClick={() => {
                      onChange(option.key);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-6 py-3 transition ${isSelected
                        ? "bg-[#FFFCE8] text-black"
                        : isDark
                          ? "text-white/50 hover:bg-white/5"
                          : "text-black/60 hover:bg-black/5"
                      }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${isSelected
                          ? "border-[#E8D1AB] bg-[#E8D1AB]"
                          : isDark
                            ? "border-white/50"
                            : "border-black/20"
                        }`}
                    >
                      {isSelected ? <div className="h-1 w-1 rounded-full bg-black" /> : null}
                    </div>

                    <span className="text-sm lg:text-base">{option.value}</span>
                  </div>
                );
              })
            )}
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}