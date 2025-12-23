import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface EditTypeSelectProps {
  id: string;
  label?: string;
  value: string | null;
  options: string[];
  onChange: (value: string) => void;
}

export const BlackDropdownSelect = ({
  id,
  label = "Select",
  value,
  options,
  onChange,
}: EditTypeSelectProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close when click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      {/* Floating Label */}
      <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60 z-10">
        {label}
      </label>

      {/* Trigger */}
      <div
        className={`h-14 lg:h-[82px] w-full rounded-[12px] px-4 flex items-center justify-between cursor-pointer transition-all duration-200 bg-[#101010] 
          ${open
            ? "border border-[#E8D1AB]" // Focus/Open state
            : "border-[0.5px] border-white/30" // Default state
          }
        `}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`text-base ${value ? "text-white" : "text-white/40"}`}>
          {value || `Select ${label}`}
        </span>

        <ChevronDown
          className={`text-white/60 transition-transform duration-200 ${open ? "rotate-180 text-[#E8D1AB]" : ""
            }`}
          size={20}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-16 lg:top-[90px] left-0 w-full bg-[#101010] border-[0.5px] border-white/30 rounded-[12px] shadow-2xl z-40 py-2 overflow-hidden">
          {options.map((opt) => {
            const selected = opt === value;

            return (
              <div
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors
                  ${selected
                    ? "bg-white/5"
                    : "hover:bg-white/10"
                  }
                `}
              >
                <span className={`text-sm lg:text-base ${selected ? "text-[#E8D1AB]" : "text-white"}`}>
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};