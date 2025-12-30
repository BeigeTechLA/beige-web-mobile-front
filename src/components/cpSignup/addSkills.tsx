'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const AddSkills = ({ value = [], onChange, options }) => {
  const [tempSelected, setTempSelected] = useState([]);
  const [open, setOpen] = useState(false);

  const toggleTempSkill = (id) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddSkills = () => {
    if (tempSelected.length === 0) return;
    const newSkills = tempSelected.filter((id) => !value.includes(id));
    onChange([...value, ...newSkills]);
    setTempSelected([]);
    setOpen(false);
  };

  const removeSkill = (id) => {
    onChange(value.filter((s) => s !== id));
  };

  const getLabel = (id) => {
    const found = options.find((opt) => opt.value === id);
    return found ? found.label : id;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {/* STYLED TO MATCH SELECT TRIGGER */}
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-12 justify-between bg-[#111111] border-[#333333] text-white font-normal hover:bg-[#111111] hover:text-white focus:ring-1 focus:ring-[#BEA784] focus:ring-offset-0 transition-none",
                !tempSelected.length && "text-muted-foreground"
              )}
            >
              {tempSelected.length > 0
                ? `${tempSelected.length} skills selected`
                : "Select skills..."}
              <Plus className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          
          {/* STYLED TO MATCH SELECT CONTENT */}
          <PopoverContent 
            className="w-[300px] p-0 bg-[#111111] border-[#333333] text-white shadow-md" 
            align="start"
          >
            <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
              {options.map((opt) => {
                const isSelected = tempSelected.includes(opt.value);
                const isAlreadyAdded = value.includes(opt.value);

                return (
                  <div
                    key={opt.value}
                    onClick={() => !isAlreadyAdded && toggleTempSkill(opt.value)}
                    className={cn(
                      "relative flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer text-sm transition-colors",
                      "hover:bg-neutral-800 hover:text-white", // Hover effect only on items
                      isSelected && "bg-neutral-800",
                      isAlreadyAdded && "opacity-40 cursor-not-allowed grayscale"
                    )}
                  >
                    <span className="flex-1">{opt.label}</span>
                    <div className="flex items-center gap-2">
                        {isAlreadyAdded && <span className="text-[10px] font-bold text-[#BEA784]">ADDED</span>}
                        {isSelected && <Check className="w-4 h-4 text-[#BEA784]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* ADD BUTTON STYLED TO MATCH THEME */}
        <Button
          type="button"
          onClick={handleAddSkills}
          disabled={tempSelected.length === 0}
          className="bg-[#BEA784] hover:bg-[#a38d6b] h-12 px-6 font-semibold text-black disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add {tempSelected.length > 0 && `(${tempSelected.length})`}
        </Button>
      </div>

      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2">
        {value.map((id) => (
          <div
            key={id}
            className="px-3 py-1.5 border border-[#333333] bg-[#111111] shadow-sm text-sm text-white font-medium rounded-md flex items-center gap-2"
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