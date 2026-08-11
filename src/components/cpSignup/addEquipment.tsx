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

// Added 'names' to props
export default function AddEquipments({ value = [], names = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const getSuggestionList = (response) => {
    const payload = response?.data ?? response;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.suggestions)) return payload.suggestions;
    return [];
  };

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      setIsSearching(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setOpen(true);
    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getEquipmentSuggestions({ query: trimmed });
        const list = getSuggestionList(res);
        const uniqueSuggestions = list.filter(
          (item) => item?.equipment_id && !value.map(String).includes(String(item.equipment_id))
        );
        setSuggestions(uniqueSuggestions);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [inputValue, value]);

  const handleSelectSuggestion = (equipment) => {
    if (!value.includes(equipment.equipment_id)) {
      // Create new arrays for both IDs and Names
      const nextIds = [...value, equipment.equipment_id];
      const nextNames = [...names, equipment.equipment_name];
      
      // Pass both to parent
      onChange(nextIds, nextNames);
    }
    setInputValue("");
    setSuggestions([]);
    setOpen(false);
  };

  const removeEquipment = (index) => {
    // Filter both arrays by index to keep them in sync
    const nextIds = value.filter((_, i) => i !== index);
    const nextNames = names.filter((_, i) => i !== index);
    onChange(nextIds, nextNames);
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
            onFocus={() => {
              if (inputValue.trim()) setOpen(true);
            }}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value.trim()) setOpen(true);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            className="h-12 w-full bg-[#111111] border-[#333333] text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#BEA784] focus-visible:ring-offset-0"
          />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="z-[130] p-0 w-[var(--radix-popover-trigger-width)] bg-[#111111] border-[#333333] text-white shadow-xl overflow-hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="bg-transparent text-white">
            <CommandList className="max-h-64 border-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {isSearching ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Searching equipment...
                </div>
              ) : suggestions.length === 0 ? (
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  No equipment found.
                </CommandEmpty>
              ) : (
                suggestions.map((equipment) => (
                  <CommandItem
                    key={equipment.equipment_id}
                    value={equipment.equipment_name}
                    onSelect={() => handleSelectSuggestion(equipment)}
                    className="px-3 py-2 cursor-pointer text-white aria-selected:bg-neutral-800 aria-selected:text-white"
                  >
                    {equipment.equipment_name}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Items List: Now uses the 'names' array directly */}
      <div className="flex flex-col gap-3 mt-4">
        {names.map((name, i) => (
          <div
            key={`${i}_${value[i]}`}
            className="border border-[#333333] bg-[#111111] rounded-md px-3 py-3 flex justify-between items-center text-sm text-white shadow-sm"
          >
            <span>{name}</span>
            <Trash2
              className="cursor-pointer text-red-500 hover:text-red-400 w-4 h-4 transition-colors"
              onClick={() => removeEquipment(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
