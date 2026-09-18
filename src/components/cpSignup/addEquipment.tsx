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

type EquipmentOption = {
  equipment_id: string | number;
  equipment_name: string;
  [key: string]: unknown;
};

type AddEquipmentsProps = {
  value?: Array<string | number>;
  names?: string[];
  onChange: (ids: Array<string | number>, names: string[]) => void;
};

// Added 'names' to props
export default function AddEquipments({ value = [], names = [], onChange }: AddEquipmentsProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<EquipmentOption[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getSuggestionList = (response: any): EquipmentOption[] => {
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

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setOpen(true);
    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getEquipmentSuggestions({
          query: trimmed,
        });

        const list = getSuggestionList(res);

        const selectedIds = value.map((id) => String(id));

        const uniqueSuggestions = list.filter(
          (item) =>
            item?.equipment_id !== undefined &&
            item?.equipment_id !== null &&
            !selectedIds.includes(String(item.equipment_id)),
        );

        setSuggestions(uniqueSuggestions);
      } catch (err) {
        console.error(err);

        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, value]);

  const handleSelectSuggestion = (equipment: EquipmentOption) => {
    const alreadySelected = value.some(
      (id) => String(id) === String(equipment.equipment_id),
    );

    if (!alreadySelected) {
      const nextIds = [...value, equipment.equipment_id];

      const currentNames = value.map((_, index) => names[index] || "");

      const nextNames = [...currentNames, equipment.equipment_name];

      onChange(nextIds, nextNames);
    }

    setInputValue("");
    setSuggestions([]);
    setOpen(false);
  };

  const removeEquipment = (index: number) => {
    const nextIds = value.filter((_, i) => i !== index);

    const nextNames = value
      .map((_, i) => names[i] || "")
      .filter((_, i) => i !== index);

    onChange(nextIds, nextNames);
  };

  return (
    <div className="w-full">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!inputValue.trim()) {
            return;
          }

          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Input
            type="text"
            placeholder="Please type the equipment name to search"
            value={inputValue}
            onFocus={() => {
              if (inputValue.trim()) {
                setOpen(true);
              }
            }}
            onChange={(event) => {
              const nextValue = event.target.value;

              setInputValue(nextValue);

              if (nextValue.trim()) {
                setOpen(true);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
              }
            }}
            className="h-12 w-full border-[#333333] bg-[#111111] text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#BEA784] focus-visible:ring-offset-0"
          />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="z-[130] w-[var(--radix-popover-trigger-width)] overflow-hidden border-[#333333] bg-[#111111] p-0 text-white shadow-xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
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
                    className="cursor-pointer px-3 py-2 text-white aria-selected:bg-neutral-800 aria-selected:text-white"
                  >
                    {equipment.equipment_name}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="mt-4 flex flex-col gap-3">
        {value.map((equipmentId, index) => {
          const name = String(names[index] || "").trim();

          if (!name) {
            return null;
          }

          return (
            <div
              key={String(equipmentId)}
              className="flex items-center justify-between rounded-md border border-[#333333] bg-[#111111] px-3 py-3 text-sm text-white shadow-sm"
            >
              <span>{name}</span>

              <Trash2
                className="h-4 w-4 cursor-pointer text-red-500 transition-colors hover:text-red-400"
                onClick={() => removeEquipment(index)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
