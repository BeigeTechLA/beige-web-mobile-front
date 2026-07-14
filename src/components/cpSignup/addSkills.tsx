'use client';

import React, { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { X, Plus, Check } from "lucide-react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SkillOption = {
  value: string;
  label: string;
  description?: string;
};

type AddSkillsProps = {
  value?: string[];
  onChange: (val: string[]) => void;
  options: SkillOption[];
  isDark?: boolean;
  bg?: string;
};

const AddSkills = ({
  value = [],
  onChange,
  options,
  isDark = true,
  bg = "bg-black",
}: AddSkillsProps) => {
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && options.length === 0) {
      toast.error("Please select a role first", {
        description: "You need to select at least one role to see relevant skills.",
      });
      return;
    }
    setOpen(newOpen);
  };

  const toggleTempSkill = (id: string) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddSkills = () => {
    if (!tempSelected.length) return;
    const newSkills = tempSelected.filter((id) => !value.includes(id));
    onChange([...value, ...newSkills]);
    setTempSelected([]);
    setOpen(false);
  };

  const removeSkill = (id: string) => {
    onChange(value.filter((s) => s !== id));
  };

  const getLabel = (id: string) => {
    const found = options.find((opt) => opt.value === id);
    return found ? found.label : id;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-12 justify-between font-normal shadow-none transition-colors border",
                isDark
                  ? `${bg} border-white/10 text-white hover:bg-black hover:text-white focus:ring-1 focus:ring-[#E8D1AB]/50`
                  : "bg-neutral-50 border-black/10 text-black hover:bg-neutral-50 hover:text-black focus:ring-1 focus:ring-[#cbb38b]/50",
                "focus:ring-offset-0 transition-none",
                !tempSelected.length && (isDark ? "text-white/50" : "text-black/50")
              )}
            >
              {tempSelected.length
                ? `${tempSelected.length} skills selected`
                : "Select skills..."}
              <Plus className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className={cn(
              "z-50 w-[320px] rounded-md border p-1 shadow-md outline-none transition-colors",
              isDark ? "border-white/10 bg-[#111111] text-white" : "border-black/10 bg-white text-black",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <div className={cn(
              "max-h-[300px] overflow-y-auto p-1 scrollbar-thin",
              isDark ? "scrollbar-thumb-neutral-700 scrollbar-track-neutral-900" : "scrollbar-thumb-neutral-300 scrollbar-track-neutral-100"
            )}>
              {options.map((opt) => {
                const isSelected = tempSelected.includes(opt.value);
                const isAlreadyAdded = value.includes(opt.value);

                return (
                  <div
                    key={opt.value}
                    onClick={() => !isAlreadyAdded && toggleTempSkill(opt.value)}
                    className={cn(
                      "relative flex items-start justify-between gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors",
                      isDark
                        ? "hover:bg-neutral-800 text-white"
                        : "hover:bg-neutral-100 text-black",
                      isSelected && (isDark ? "bg-neutral-800" : "bg-neutral-100"),
                      isAlreadyAdded && "opacity-40 cursor-not-allowed grayscale"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{opt.label}</span>
                      {opt.description && (
                        <span className={cn(
                          "text-xs leading-snug",
                          isDark ? "text-white/40" : "text-black/40"
                        )}>
                          {opt.description}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {isAlreadyAdded && (
                        <span className={cn(
                          "text-[10px] font-bold",
                          isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"
                        )}>ADDED</span>
                      )}
                      {isSelected && <Check className={cn("w-4 h-4", isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]")} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverPrimitive.Content>
        </Popover>

        <Button
          type="button"
          onClick={handleAddSkills}
          disabled={!tempSelected.length}
          className={cn(
            "h-12 px-6 font-semibold shadow-none border-0 disabled:opacity-50 transition-colors",
            isDark
              ? "bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
              : "bg-[#cbb38b] hover:bg-[#bfa57c] text-white"
          )}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add {tempSelected.length ? `(${tempSelected.length})` : ""}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((id) => (
          <div
            key={id}
            className={cn(
              "px-3 py-1.5 border text-sm font-medium rounded-md flex items-center gap-2 transition-colors",
              isDark
                ? "border-white/10 bg-[#111111] text-white"
                : "border-black/10 bg-neutral-100 text-black"
            )}
          >
            {getLabel(id)}
            <button
              type="button"
              onClick={() => removeSkill(id)}
              className={cn(
                "transition-colors",
                isDark ? "text-white/40 hover:text-red-400" : "text-black/40 hover:text-red-500"
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddSkills;