import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface EditTypeSelectProps {
  label?: string;
  value: string | null;
  options: string[];
  onChange: (value: string) => void;
}

export const DropdownSelect = ({
  label = "Select",
  value,
  options,
  onChange,
}: EditTypeSelectProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // close when click outside
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
      <label className="absolute -top-3 left-4 bg-[#FAFAFA] px-2 text-base text-black/60">
        {label}
      </label>

      {/* Trigger */}
      <div
        className="h-[82px] w-full rounded-[12px] border border-[#E5E5E5] bg-[#FAFAFA] px-4 flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-black text-base">
          {value || `Select ${label}`}
        </span>

        <ChevronDown
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[90px] left-0 w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-[12px] shadow-lg z-40 py-2">
          {options.map((opt) => {
            const selected = opt === value;

            return (
              <div
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-black
                  ${
                    selected
                      ? "bg-[#FFF8E6]" // similar to your sample design
                      : "hover:bg-gray-100"
                  }
                `}
              >
                {/* Checkbox indicator */}
                <div
                  className={`h-5 w-5 rounded border border-gray-400 flex items-center justify-center ${
                    selected ? "bg-black border-black" : ""
                  }`}
                >
                  {selected && <Check size={14} stroke="white" />}
                </div>

                <span className="text-sm">{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
