import React, { useState, useEffect, useRef } from "react";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Trash2 } from "lucide-react";
import { getEquipmentSuggestions } from "@/lib/api";
import { cn } from "@/lib/utils"; // Ensure you have this utility

export default function AddEquipments({ value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedMap, setSelectedMap] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getEquipmentSuggestions({ query: trimmed });
        const list = res?.data?.data ?? res?.data ?? [];
        const uniqueSuggestions = list.filter(
          (item) => !value.includes(item.equipment_id)
        );
        setSuggestions(uniqueSuggestions);
        setOpen(uniqueSuggestions.length > 0);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [inputValue, value]);

  const handleSelectSuggestion = (equipment) => {
    if (!value.includes(equipment.equipment_id)) {
      onChange([...value, equipment.equipment_id]);
      setSelectedMap((prev) => ({
        ...prev,
        [equipment.equipment_id]: equipment.equipment_name,
      }));
    }
    setInputValue("");
    setSuggestions([]);
    setOpen(false);
  };

  const removeEquipment = (id) => {
    onChange(value.filter((v) => v !== id));
    setSelectedMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  return (
    <div className="w-full">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!inputValue.trim()) return;
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Input
            type="text"
            placeholder="Please type the equipment name to search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            // MATCHING SELECT TRIGGER STYLING
            className="h-12 w-full bg-[#111111] border-[#333333] text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#BEA784] focus-visible:ring-offset-0"
          />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          // MATCHING SELECT CONTENT STYLING
          className="p-0 w-[var(--radix-popover-trigger-width)] bg-[#111111] border-[#333333] text-white shadow-md overflow-hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="bg-transparent text-white">
            <CommandList className="max-h-64 border-none">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No equipment found.
              </CommandEmpty>
              {suggestions.map((equipment) => (
                <CommandItem
                  key={equipment.equipment_id}
                  onSelect={() => handleSelectSuggestion(equipment)}
                  // MATCHING SELECT ITEM STYLING
                  className="px-3 py-2 cursor-pointer text-white aria-selected:bg-neutral-800 aria-selected:text-white"
                >
                  {equipment.equipment_name}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Items List Styled to match */}
      <div className="flex flex-col gap-3 mt-4">
        {value.map((id, i) => (
          <div
            key={`${i}_${id}`}
            className="border border-[#333333] bg-[#111111] rounded-md px-3 py-3 flex justify-between items-center text-sm text-white shadow-sm"
          >
            <span>{selectedMap[id] || "Equipment Not Found"}</span>
            <Trash2
              className="cursor-pointer text-red-500 hover:text-red-400 w-4 h-4 transition-colors"
              onClick={() => removeEquipment(id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}