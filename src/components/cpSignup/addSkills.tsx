'use client';

import React, { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { X, Plus, Check } from "lucide-react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SkillOption = {
  value: string;
  label: string;
  description?: string;
};

type AddSkillsProps = {
  value?: string[];
  onChange: (val: string[]) => void;
  options: SkillOption[];
};

const AddSkills = ({
  value = [],
  onChange,
  options
}: AddSkillsProps) => {
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

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
        {/* Added modal={false} to ensure it doesn't lock background scroll */}
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-12 justify-between bg-[#111111] border-[#333333] text-white font-normal",
                "hover:bg-[#111111] hover:text-white",
                "focus:ring-1 focus:ring-[#BEA784] focus:ring-offset-0 transition-none",
                !tempSelected.length && "text-muted-foreground"
              )}
            >
              {tempSelected.length
                ? `${tempSelected.length} skills selected`
                : "Select skills..."}
              <Plus className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          {/* 
            FIX: We use PopoverPrimitive.Content DIRECTLY without PopoverPrimitive.Portal.
            This keeps the dropdown inside the local DOM tree, making it scroll
            naturally with the field.
          */}
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className={cn(
              "z-50 w-[320px] rounded-md border border-[#333333] bg-[#111111] p-1 text-white shadow-md outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <div className="max-h-[300px] overflow-y-auto p-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
              {options.map((opt) => {
                const isSelected = tempSelected.includes(opt.value);
                const isAlreadyAdded = value.includes(opt.value);

                return (
                  <div
                    key={opt.value}
                    onClick={() => !isAlreadyAdded && toggleTempSkill(opt.value)}
                    className={cn(
                      "relative flex items-start justify-between gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors",
                      "hover:bg-neutral-800",
                      isSelected && "bg-neutral-800",
                      isAlreadyAdded && "opacity-40 cursor-not-allowed grayscale"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs text-muted-foreground leading-snug">
                          {opt.description}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {isAlreadyAdded && (
                        <span className="text-[10px] font-bold text-[#BEA784]">ADDED</span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[#BEA784]" />}
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
          className="bg-[#BEA784] hover:bg-[#a38d6b] h-12 px-6 font-semibold text-black disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add {tempSelected.length ? `(${tempSelected.length})` : ""}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((id) => (
          <div
            key={id}
            className="px-3 py-1.5 border border-[#333333] bg-[#111111] text-sm text-white font-medium rounded-md flex items-center gap-2"
          >
            {getLabel(id)}
            <button
              type="button"
              onClick={() => removeSkill(id)}
              className="hover:text-red-500 transition-colors"
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