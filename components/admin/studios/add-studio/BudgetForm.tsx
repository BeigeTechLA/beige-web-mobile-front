"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Minus, Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BudgetCategory = {
  id: string;
  name: string;
  price: string;
  includes: string[];
  minHours: number;
  maxPeopleAllowed: number;
};

type EquipmentItem = {
  id: string;
  name: string;
  cost: string;
};

interface Props {
  isDark?: boolean;
  value?: {
    hourlyRate: string;
    overtimeRate: string;
    minimumBooking: string;
    bufferTime: string;
    categories?: BudgetCategory[];
    equipmentItems?: EquipmentItem[];
  };
  onChange?: (next: NonNullable<Props["value"]>) => void;
}

const sanitizeText = (value: string) => value.replace(/[^a-zA-Z0-9\s.,'()-]/g, "");
const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");
const formatMoney = (value: string) => {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next.toFixed(2) : "0.00";
};
const moneyInput = (value: string) => (value ? value : "");

const normalizeCategory = (
  category: Partial<BudgetCategory> & Pick<BudgetCategory, "id" | "name" | "price" | "includes">,
): BudgetCategory => ({
  ...category,
  minHours: Math.max(1, Number(category.minHours) || 2),
  maxPeopleAllowed: Math.max(1, Number(category.maxPeopleAllowed) || 6),
});

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: "production", name: "Production", price: "50", includes: ["Photo Shoots", "Video Shoots", "Product Shoots"], minHours: 2, maxPeopleAllowed: 6 },
  { id: "audio", name: "Audio", price: "40", includes: ["Recording", "Mixing"], minHours: 2, maxPeopleAllowed: 6 },
  { id: "events", name: "Events", price: "120", includes: ["Live Setup", "Lighting"], minHours: 2, maxPeopleAllowed: 6 },
];

const DEFAULT_EQUIPMENT: EquipmentItem[] = [{ id: "green-screen", name: "Green Screen", cost: "300" }];

const minimumBookingOptions = [
  { value: "1", label: "1 hour" },
  { value: "2", label: "2 hours" },
  { value: "3", label: "3 hours" },
  { value: "4", label: "4 hours" },
];

const bufferTimeOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
];

export default function BudgetForm({ isDark = true, value, onChange }: Props) {
  const hasHydratedValueRef = useRef(false);

  const [hourlyRate, setHourlyRate] = useState(value?.hourlyRate || "");
  const [overtimeRate, setOvertimeRate] = useState(value?.overtimeRate || "");
  const [minimumBooking, setMinimumBooking] = useState(value?.minimumBooking || "");
  const [bufferTime, setBufferTime] = useState(value?.bufferTime || "");
  const [categories, setCategories] = useState<BudgetCategory[]>(
    value?.categories && value.categories.length > 0
      ? value.categories.map(normalizeCategory)
      : DEFAULT_CATEGORIES
  );
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>(
    value?.equipmentItems && value.equipmentItems.length > 0 ? value.equipmentItems : DEFAULT_EQUIPMENT
  );

  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>(
    value?.categories?.map((category) => category.id).slice(0, 1) || ["production"]
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    value?.categories?.map((category) => category.id) || ["production", "audio", "events"]
  );

  const [addingCategoryFor, setAddingCategoryFor] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [equipmentEnabled, setEquipmentEnabled] = useState(true);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentCost, setNewEquipmentCost] = useState("");

  useEffect(() => {
    if (!value || hasHydratedValueRef.current) return;
    setHourlyRate(value.hourlyRate || "");
    setOvertimeRate(value.overtimeRate || "");
    setMinimumBooking(value.minimumBooking || "");
    setBufferTime(value.bufferTime || "");
    setCategories(
      value.categories && value.categories.length > 0
        ? value.categories.map(normalizeCategory)
        : DEFAULT_CATEGORIES
    );
    setEquipmentItems(value.equipmentItems && value.equipmentItems.length > 0 ? value.equipmentItems : DEFAULT_EQUIPMENT);
    hasHydratedValueRef.current = true;
  }, [value]);

  useEffect(() => {
    const next = {
      hourlyRate,
      overtimeRate,
      minimumBooking,
      bufferTime,
      categories,
      equipmentItems,
    };
    onChange?.(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("add_studio_budget", JSON.stringify(next));
    }
  }, [hourlyRate, overtimeRate, minimumBooking, bufferTime, categories, equipmentItems, onChange]);

  const textColor = isDark ? "text-white" : "text-black";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#8E8E8E]/20" : "border-[#D7D7D7]";
  const cardBg = isDark ? "bg-[#141414]" : "bg-white";
  const accentClass = "bg-[#E8D1AB] text-[#101010]";

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedCategoryIds.includes(category.id)),
    [categories, selectedCategoryIds]
  );

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setExpandedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const setCategoryIncludes = (categoryId: string, nextIncludes: string[]) => {
    setCategories((prev) => prev.map((category) => (category.id === categoryId ? { ...category, includes: nextIncludes } : category)));
  };

  const updateSelectedCategoryMetric = (categoryId: string, field: "price" | "minHours" | "maxPeopleAllowed", direction: "inc" | "dec") => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;

        if (field === "price") {
          const current = Number(category.price || 0);
          const next = direction === "inc" ? current + 1 : Math.max(current - 1, 0);
          return { ...category, price: String(next) };
        }

        const current = Number(category[field]) || 1;
        const next =
          direction === "inc"
            ? current + 1
            : Math.max(current - 1, 1);

        return {
          ...category,
          [field]: next,
        };
      })
    );
  };

  const addCategoryInclude = (categoryId: string) => {
    if (!newCategoryName.trim()) return;
    setCategoryIncludes(categoryId, [...(categories.find((category) => category.id === categoryId)?.includes || []), newCategoryName.trim()]);
    setNewCategoryName("");
    setAddingCategoryFor(null);
    setExpandedCategoryIds((prev) => (prev.includes(categoryId) ? prev : [...prev, categoryId]));
  };

  const addEquipmentItem = () => {
    if (!newEquipmentName.trim() || !newEquipmentCost.trim()) return;
    setEquipmentItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: newEquipmentName.trim(),
        cost: sanitizeNumber(newEquipmentCost),
      },
    ]);
    setNewEquipmentName("");
    setNewEquipmentCost("");
  };

  return (
    <div className="space-y-6 lg:space-y-9">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Hourly Rate ($)*" labelBg={labelBg}>
          <Input
            value={hourlyRate}
            onChange={(e) => setHourlyRate(sanitizeNumber(e.target.value))}
            inputMode="decimal"
            placeholder=""
            className={`h-14 lg:h-[82px] rounded-xl border ${borderColor} bg-transparent px-6 text-white placeholder:text-white/30 focus:border-[#E8D1AB]/60`}
          />
        </Field>
        <Field label="Overtime Rate ($)*" labelBg={labelBg}>
          <Input
            value={overtimeRate}
            onChange={(e) => setOvertimeRate(sanitizeNumber(e.target.value))}
            inputMode="decimal"
            placeholder=""
            className={`h-14 lg:h-[82px] rounded-xl border ${borderColor} bg-transparent px-6 text-white placeholder:text-white/30 focus:border-[#E8D1AB]/60`}
          />
        </Field>
      </div>

      <SectionTitle title="Booking Settings" subtitle="Set minimum booking duration and buffer time to manage scheduling and prevent time conflicts between shoots." />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Minimum Booking (hours)*" labelBg={labelBg}>
          <Select value={minimumBooking} onValueChange={setMinimumBooking}>
            <SelectTrigger className={`h-14 lg:h-[82px] rounded-xl border ${borderColor} bg-transparent px-6 text-white`}>
              <SelectValue placeholder="Select hours" />
            </SelectTrigger>
            <SelectContent className="border-[#8E8E8E]/20 bg-[#141414] text-white">
              {minimumBookingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Buffer Time (minutes)*" labelBg={labelBg}>
          <Select value={bufferTime} onValueChange={setBufferTime}>
            <SelectTrigger className={`h-14 lg:h-[82px] rounded-xl border ${borderColor} bg-transparent px-6 text-white`}>
              <SelectValue placeholder="Select minutes" />
            </SelectTrigger>
            <SelectContent className="border-[#8E8E8E]/20 bg-[#141414] text-white">
              {bufferTimeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <SectionTitle title="Categories" subtitle="Manage categories with pricing, minimum booking duration, and crew size limits." />

      <div className="space-y-4">
        {categories.map((category) => {
          const isSelected = selectedCategoryIds.includes(category.id);
          const isExpanded = expandedCategoryIds.includes(category.id);
          return (
            <div key={category.id} className={`rounded-2xl border ${borderColor} ${cardBg}`}>
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left lg:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-[5px] border ${
                      isSelected ? "border-[#E8D1AB] bg-[#E8D1AB]" : "border-white/30 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#101010]" />}
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium lg:text-base ${textColor}`}>
                      {category.name} ({formatMoney(category.price)}$) <span className="text-white/60">per hour</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isSelected && <span className={`rounded-full px-3 py-1 text-xs font-medium ${accentClass}`}>Selected</span>}
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border ${borderColor} text-white/80 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
              </button>

              {isSelected && isExpanded && (
                <div className="space-y-4 border-t border-white/10 px-4 py-4 lg:px-5">
                  <div>
                    <p className={`mb-2 text-sm font-medium ${textColor}`}>Category Includes</p>
                    <div className="flex flex-wrap gap-2">
                      {category.includes.map((include) => (
                        <span
                          key={include}
                          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80"
                        >
                          {include}
                          <button
                            type="button"
                            onClick={() => setCategoryIncludes(category.id, category.includes.filter((item) => item !== include))}
                            className="text-[#FF7D7D]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setAddingCategoryFor(category.id)}
                      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${accentClass}`}
                    >
                      <Plus className="h-4 w-4" />
                      Add Category
                    </button>
                  </div>

                  {addingCategoryFor === category.id && (
                    <div className="space-y-4 rounded-xl border border-white/10 bg-[#101010] p-4">
                      <Field label="Category Name" labelBg={labelBg}>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(sanitizeText(e.target.value))}
                          placeholder="Eg : Portrait, Commercial Video..."
                          className={`h-14 rounded-xl border ${borderColor} bg-transparent px-6 text-white placeholder:text-white/30`}
                        />
                      </Field>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCategoryFor(null);
                            setNewCategoryName("");
                          }}
                          className="rounded-md border border-white/20 px-4 py-2 text-sm text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => addCategoryInclude(category.id)}
                          className={`rounded-md px-4 py-2 text-sm font-medium ${accentClass}`}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SectionTitle title="Configure Selected Categories" subtitle="" />

      <div className="space-y-4">
        {selectedCategories.map((category) => (
          <div key={category.id} className={`rounded-2xl border ${borderColor} ${cardBg} p-4 lg:p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-sm font-medium lg:text-base ${textColor}`}>{category.name}</h3>
                <p className="mt-1 text-xs text-white/60">Base: ${formatMoney(category.price)} per hour</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-white/50">Total</p>
                  <p className="text-sm font-medium text-[#E8D1AB]">${formatMoney(category.price)}</p>
                </div>
                <button type="button" className="rounded-md border border-white/10 p-2 text-[#FF7D7D]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <StepperField
                label="Hourly Price"
                value={`$${moneyInput(category.price)}`}
                onDec={() => updateSelectedCategoryMetric(category.id, "price", "dec")}
                onInc={() => updateSelectedCategoryMetric(category.id, "price", "inc")}
              />
              <StepperField
                label="Min Hours"
                value={`${category.minHours} ${category.minHours === 1 ? "hr" : "hrs"}`}
                onDec={() => updateSelectedCategoryMetric(category.id, "minHours", "dec")}
                onInc={() => updateSelectedCategoryMetric(category.id, "minHours", "inc")}
              />
              <StepperField
                label="Max People Allowed"
                value={String(category.maxPeopleAllowed).padStart(2, "0")}
                onDec={() => updateSelectedCategoryMetric(category.id, "maxPeopleAllowed", "dec")}
                onInc={() => updateSelectedCategoryMetric(category.id, "maxPeopleAllowed", "inc")}
              />
            </div>
          </div>
        ))}
      </div>

      <SectionTitle
        title="What would u like to add Equipment's?"
        subtitle="List the equipment you provide to help users understand what's included."
      />

      <div className="flex gap-3">
        <TogglePill active={equipmentEnabled} label="Yes" onClick={() => setEquipmentEnabled(true)} />
        <TogglePill active={!equipmentEnabled} label="No" onClick={() => setEquipmentEnabled(false)} />
      </div>

      {equipmentEnabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Equipment Name" labelBg={labelBg}>
              <Input
                value={newEquipmentName}
                onChange={(e) => setNewEquipmentName(sanitizeText(e.target.value))}
                placeholder="Eg : Green Screen, lightning..."
                className={`h-14 lg:h-[82px] rounded-xl border ${borderColor} bg-transparent px-6 text-white placeholder:text-white/30`}
              />
            </Field>
            <Field label="Cost" labelBg={labelBg}>
              <Input
                value={newEquipmentCost}
                onChange={(e) => setNewEquipmentCost(sanitizeNumber(e.target.value))}
                inputMode="decimal"
                placeholder="$0.00"
                className={`h-14 lg:h-[82px] rounded-xl border ${borderColor} bg-transparent px-6 text-white placeholder:text-white/30`}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={addEquipmentItem}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${accentClass}`}
          >
            <Plus className="h-4 w-4" />
            Add New Equipment
          </button>

          <div className="space-y-3">
            {equipmentItems.map((item) => (
              <div key={item.id} className={`rounded-2xl border ${borderColor} ${cardBg} px-4 py-4 lg:px-5`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-sm font-medium ${textColor}`}>{item.name}</p>
                    <p className="text-xs text-white/70">${formatMoney(item.cost)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm text-white/70">$</span>
                      <input
                        value={item.cost}
                        onChange={(e) =>
                          setEquipmentItems((prev) =>
                            prev.map((entry) =>
                              entry.id === item.id ? { ...entry, cost: sanitizeNumber(e.target.value) } : entry
                            )
                          )
                        }
                        className="w-24 bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEquipmentItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                      className="rounded-md border border-white/10 p-2 text-[#FF7D7D]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-[#1F7A41]/30 p-2 text-[#4ADE80]"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function Field({
  label,
  labelBg,
  children,
}: {
  label: string;
  labelBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
        <span className="text-sm font-medium text-white/70">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-medium text-white lg:text-xl">{title}</h2>
      {subtitle ? <p className="text-sm text-white/70">{subtitle}</p> : null}
    </div>
  );
}

function StepperField({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/70">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDec} className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8D1AB] text-[#101010]">
          <Minus className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-white">
          {value}
        </div>
        <button type="button" onClick={onInc} className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8D1AB] text-[#101010]">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TogglePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 w-24 items-center justify-between rounded-2xl border px-4 text-sm font-medium transition-colors ${
        active ? "border-transparent bg-[#E8D1AB] text-[#101010]" : "border-white/10 bg-transparent text-white/70"
      }`}
    >
      <span>{label}</span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-[#101010]" : "border border-white/30"}`}>
        {active ? <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
      </span>
    </button>
  );
}