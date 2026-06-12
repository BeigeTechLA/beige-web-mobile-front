"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  Minus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  isDark?: boolean;
  studioData: any;
  setStudioData: (data: any) => void;
}

const CATEGORIES_DATA = [
  { id: "production", name: "Production", price: 50.0, includes: ["Photo Shoots", "Video Shoots", "Product Shoots"] },
  { id: "audio", name: "Audio", price: 40.0, includes: ["Recording", "Mixing"] },
  { id: "events", name: "Events", price: 120.0, includes: ["Live Setup", "Lighting"] },
];

const minimumBookingOptions = [
  { value: "1", label: "1 hour" },
  { value: "2", label: "2 hours" },
  { value: "3", label: "3 hours" },
];
const bufferTimeOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
];

export default function BudgetForm({ isDark = true, studioData, setStudioData }: Props) {
  // --- State Syncing ---
  const hourlyRate = String(studioData.hourly_rate || "");
  const overtimeRate = String(studioData.overtime_rate || "");
  const minimumBooking = String(studioData.minimum_booking_hours || "");
  const bufferTime = String(studioData.buffer_time_minutes || "");

  const pricingSettings = studioData.pricing_settings || { categories: [], equipment: [] };
  const selectedCategories: string[] = pricingSettings.categories?.map((c: any) => c.id) || [];
  const equipmentList: { name: string; cost: number }[] = pricingSettings.equipment || [];

  const [openCategory, setOpenCategory] = useState<string | null>("production");
  const [equipmentEnabled, setEquipmentEnabled] = useState(equipmentList.length > 0);

  const setHourlyRate = (v: string) => setStudioData({ ...studioData, hourly_rate: Number(v) });
  const setOvertimeRate = (v: string) => setStudioData({ ...studioData, overtime_rate: Number(v) });
  const setMinimumBooking = (v: string) => setStudioData({ ...studioData, minimum_booking_hours: Number(v) });
  const setBufferTime = (v: string) => setStudioData({ ...studioData, buffer_time_minutes: Number(v) });

  // --- Category configured pricing helpers ---
  const updateCategoryField = (catId: string, field: string, value: number) => {
    const cats: any[] = pricingSettings.categories || [];
    const existing = cats.find((c: any) => c.id === catId);
    const updated = existing
      ? cats.map((c: any) => c.id === catId ? { ...c, [field]: value } : c)
      : [...cats, { id: catId, [field]: value }];
    setStudioData({
      ...studioData,
      pricing_settings: { ...pricingSettings, categories: updated }
    });
  };

  // --- Equipment helpers ---
  const [equipmentName, setEquipmentName] = useState("");
  const [cost, setCost] = useState("");

  const addEquipment = () => {
    if (!equipmentName.trim() || !cost.trim()) return;
    const updated = [...equipmentList, { name: equipmentName.trim(), cost: Number(cost) }];
    setStudioData({
      ...studioData,
      pricing_settings: { ...pricingSettings, equipment: updated }
    });
    setEquipmentName("");
    setCost("");
  };

  const removeEquipment = (idx: number) => {
    const updated = equipmentList.filter((_: any, i: number) => i !== idx);
    setStudioData({
      ...studioData,
      pricing_settings: { ...pricingSettings, equipment: updated }
    });
  };

  // Theme Constants
  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#FFFFFFB2]" : "text-[#71717B]";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";
  const accentColor = "text-[#E8D1AB]";

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">
      {/* Top Rates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
            <span className={`text-sm font-medium ${subTextColor}`}>Hourly Rate ($)*</span>
          </div>
          <Input
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
        </div>
        <div className="relative">
          <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
            <span className={`text-sm font-medium ${subTextColor}`}>Overtime Rate ($)*</span>
          </div>
          <Input
            value={overtimeRate}
            onChange={(e) => setOvertimeRate(e.target.value)}
            className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
        </div>
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Booking Settings */}
      <section className="space-y-5 lg:space-y-9">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>Booking Settings</h2>
          <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Set minimum booking duration and buffer time to manage scheduling and prevent time conflicts between shoots.</p>
        </div>
        <div className="space-y-5 lg:space-y-9">
          <SelectGroup label="Minimum Booking (hours)*" subTextColor={subTextColor} borderColor={borderColor} labelBg={labelBg} value={minimumBooking} setValue={setMinimumBooking} isDark={isDark} textColor={textColor} options={minimumBookingOptions} />
          <SelectGroup label="Buffer Time (minutes)*" subTextColor={subTextColor} borderColor={borderColor} labelBg={labelBg} value={bufferTime} setValue={setBufferTime} isDark={isDark} textColor={textColor} options={bufferTimeOptions} />
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Categories Section */}
      <section className="space-y-3 lg:space-y-6">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>Categories</h2>
          <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Set minimum booking duration and buffer time to manage scheduling and prevent time conflicts between shoots.</p>
        </div>

        <div className="space-y-3 lg:space-y-6">
          {CATEGORIES_DATA.map((cat) => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              isOpen={openCategory === cat.id}
              isSelected={selectedCategories.includes(cat.id)}
              toggle={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
              isDark={isDark}
              subTextColor={subTextColor}
              borderColor={borderColor}
              textColor={textColor}
              labelBg={labelBg}
              accentColor={accentColor}
              onSelect={(catId: string) => {
                const isAlreadySelected = selectedCategories.includes(catId);
                const updatedCats = isAlreadySelected
                  ? (pricingSettings.categories || []).filter((c: any) => c.id !== catId)
                  : [...(pricingSettings.categories || []), { id: catId, hourly_price: 0, min_hours: 0, max_people: 0 }];
                setStudioData({ ...studioData, pricing_settings: { ...pricingSettings, categories: updatedCats } });
              }}
            />
          ))}
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Configure Selected Categories */}
      <section className={`space-y-6`}>
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>Configure Selected Categories</h2>
        </div>

        <div className="space-y-4">
          {CATEGORIES_DATA.filter(cat => {
            const catEntry = pricingSettings.categories?.find((c: any) => c.id === cat.id);
            return catEntry !== undefined || openCategory === cat.id;
          }).length === 0 ? (
            <p className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>Select categories above to configure their pricing.</p>
          ) : (
            CATEGORIES_DATA.filter(cat => pricingSettings.categories?.find((c: any) => c.id === cat.id)).map((cat) => {
              const catEntry = pricingSettings.categories?.find((c: any) => c.id === cat.id) || {};
              const catHourlyPrice = catEntry.hourly_price || 0;
              const catMinHours = catEntry.min_hours || 0;
              const catMaxPeople = catEntry.max_people || 0;
              return (
                <div key={cat.id} className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[18px] p-6 lg:px-7 lg:py-6 relative overflow-hidden">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className={`flex flex-wrap items-center gap-1.5 break-words text-base font-medium leading-snug ${isDark ? "text-white" : "text-[#000]"}`}>
                        {cat.name}
                      </h3>
                      <p className={`text-xs lg:text-sm ${isDark ? "text-[#9F9FA9]" : "text-[#000000B2]"}`}>
                        Base: ${cat.price.toFixed(2)} per hour
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                      <div className="hidden lg:flex flex-col items-end">
                        <span className="text-[#7B7B85] text-xs">Total</span>
                        <span className="lg:text-lg font-semibold text-[#E8D1AB] tracking-tight leading-none">
                          ${catHourlyPrice.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = (pricingSettings.categories || []).filter((c: any) => c.id !== cat.id);
                          setStudioData({ ...studioData, pricing_settings: { ...pricingSettings, categories: updated } });
                        }}
                        className="w-10 h-10 rounded-full bg-[#323232] border border-transparent flex items-center justify-center text-[#FF6467] hover:bg-red-500/10 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <hr className={`border-t my-3 lg:my-6 ${isDark ? "border-[#FFFFFF33]" : "border-[#00000080]"}`} />

                  <div className="flex lg:hidden justify-between items-center gap-1 mb-4">
                    <span className="text-[#71717B] text-sm">Total</span>
                    <span className="font-semibold text-[#E8D1AB] tracking-tight leading-none">${catHourlyPrice.toFixed(2)}</span>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6`}>
                    {/* Hourly Price */}
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-[#9F9FA9] font-medium">Hourly Price</span>
                      <div className="flex items-center gap-2 h-9">
                        <button
                          onClick={() => updateCategoryField(cat.id, 'hourly_price', Math.max(0, catHourlyPrice - 5))}
                          className="w-10 h-9 flex items-center justify-center bg-[#E8D1AB] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <Input
                          value={catHourlyPrice}
                          onChange={(e) => updateCategoryField(cat.id, 'hourly_price', Number(e.target.value) || 0)}
                          inputMode="decimal"
                          className="flex-1 h-9 bg-[#18181B] border border-[#3F3F47] rounded-lg text-white text-sm text-center"
                        />
                        <button
                          onClick={() => updateCategoryField(cat.id, 'hourly_price', catHourlyPrice + 5)}
                          className="w-10 h-9 flex items-center justify-center bg-[#E8D1AB] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Min Hours */}
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-[#9F9FA9] font-medium">Min Hours</span>
                      <div className="flex items-center gap-2 h-9">
                        <button
                          onClick={() => updateCategoryField(cat.id, 'min_hours', Math.max(0, catMinHours - 1))}
                          className="w-10 h-9 flex items-center justify-center bg-[#E8D1AB] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <Input
                          value={catMinHours}
                          onChange={(e) => updateCategoryField(cat.id, 'min_hours', Number(e.target.value) || 0)}
                          inputMode="decimal"
                          className="flex-1 h-9 bg-[#18181B] border border-[#3F3F47] rounded-lg text-white text-sm text-center"
                        />
                        <button
                          onClick={() => updateCategoryField(cat.id, 'min_hours', catMinHours + 1)}
                          className="w-10 h-9 flex items-center justify-center bg-[#E8D1AB] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Max People Allowed */}
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-[#9F9FA9] font-medium">Max People Allowed</span>
                      <div className="flex items-center gap-2 h-9">
                        <button
                          onClick={() => updateCategoryField(cat.id, 'max_people', Math.max(0, catMaxPeople - 1))}
                          className="w-10 h-9 flex items-center justify-center bg-[#E8D1AB] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <Input
                          value={catMaxPeople}
                          onChange={(e) => updateCategoryField(cat.id, 'max_people', Number(e.target.value) || 0)}
                          inputMode="decimal"
                          className="flex-1 h-9 bg-[#18181B] border border-[#3F3F47] rounded-lg text-white text-sm text-center"
                        />
                        <button
                          onClick={() => updateCategoryField(cat.id, 'max_people', catMaxPeople + 1)}
                          className="w-10 h-9 flex items-center justify-center bg-[#E8D1AB] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Equipment Section */}
      <section className={`space-y-5 lg:space-y-9 `}>
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>What would u like to add Equipment's?</h2>
          <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>List the equipment you provide to help users understand what&apos;s included.</p>
        </div>

        <div className="flex gap-4">
          <ToggleButton active={equipmentEnabled} onClick={() => setEquipmentEnabled(true)} label="Yes" borderColor={borderColor} textColor={textColor} />
          <ToggleButton active={!equipmentEnabled} onClick={() => setEquipmentEnabled(false)} label="No" borderColor={borderColor} textColor={textColor} />
        </div>

        {equipmentEnabled && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                    <span className={`text-sm font-medium ${subTextColor}`}>Equipment Name</span>
                  </div>
                  <Input
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="Eg: Green Screen, Lightning..."
                    className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
                  />
                </div>
              </div>

              <div className="relative">
                <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                  <span className={`text-sm font-medium ${subTextColor}`}>Cost ($)</span>
                </div>
                <Input
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
                />
              </div>
            </div>
            <button
              onClick={addEquipment}
              className="flex items-center gap-2 bg-[#E8D1AB] text-black px-5 py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={18} /> Add New Equipment
            </button>

            {equipmentList.length > 0 && (
              <div className="space-y-3">
                {equipmentList.map((eq: any, idx: number) => (
                  <div key={idx} className={`border ${borderColor} rounded-xl p-4 lg:p-6 flex justify-between items-center ${isDark ? "bg-[#171717]" : "bg-[#FDFBF7]"}`}>
                    <div>
                      <h4 className={`font-medium ${textColor}`}>{eq.name}</h4>
                      <p className={`font-bold ${accentColor}`}>${Number(eq.cost).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeEquipment(idx)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={18} className="text-[#FF6467]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}

function CategoryAccordion({ category, isOpen, toggle, isDark, subTextColor, borderColor, textColor, labelBg, onSelect, isSelected }: any) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors p-5 ${isOpen
      ? (isDark ? `border-[#E8D1AB] bg-[#1B1B1B]` : `border-[#E8D1AB] bg-[#FDFBF7]`)
      : (isDark ? `border-[#FFFFFF80]` : `border-[#D7D7D7]`)
      }`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggle}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className="accent-[#E8D1AB] h-4 w-4"
          />
          <p className={`font-medium text-lg lg:text-xl ${textColor}`}>
            {category.name} <span className={`text-[#E8D1AB]`}>({category.price.toFixed(2)}$)</span> <span className={`text-xs ${subTextColor}`}>per hour</span>
          </p>
          {isSelected && (
            <span className="bg-[#0DC752] text-[#09090B] text-[10px] lg:text-xs px-2 py-0.5 rounded-md font-medium capitalize w-21 text-center">
              Selected
            </span>
          )}
        </div>
        <div className={`${isDark ? "text-white bg-[#323232]" : "text-black bg-zinc-300"} flex items-center justify-center w-12 h-12 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={24} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <hr className={`border-t my-5 ${isDark ? "border-[#FFFFFF4D]" : "border-[#00000080]"}`} />

            <div className="">
              {/* Category Includes Section */}
              <div className="space-y-4 mb-5">
                <p className={`lg:text-lg ${isDark ? "text-[#C2C0C0]" : "text-black"}`}>Category Includes</p>
                <div className="flex flex-wrap gap-2.5">
                  {category.includes.map((item: string) => (
                    <div
                      key={item}
                      className={`h-9 flex items-center gap-2 border border-transparent px-3 py-1.5 rounded-md text-xs lg:text-sm ${isDark ? "bg-[#FFFFFF26] text-white" : "bg-[#E8D1AB] text-black"}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <hr className={`border-t my-5 ${isDark ? "border-[#FFFFFF4D]" : "border-[#00000080]"}`} />

              {/* Select / Deselect Button */}
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(category.id); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-opacity ${
                  isSelected
                    ? "bg-[#323232] text-white hover:opacity-80"
                    : "bg-[#E8D1AB] text-black hover:opacity-90"
                }`}
              >
                {isSelected ? "Remove Category" : <><Plus size={18} /> Select Category</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function InputGroup({ label, placeholder, subTextColor, borderColor, labelBg, textColor }: any) {
  return (
    <div className="relative group">
      <label className={`absolute -top-2 left-4 px-1 text-xs ${subTextColor} z-10 ${labelBg}`}>{label}</label>
      <input
        placeholder={placeholder}
        className={`w-full bg-transparent border ${borderColor} rounded-lg p-4 focus:border-[#E8D1AB] outline-none transition-all placeholder:text-neutral-500 ${textColor}`}
      />
    </div>
  );
}

function SelectGroup({ label, subTextColor, borderColor, labelBg, value, setValue, isDark, textColor, options }: any) {
  return (
    <div className="relative">
      <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
        <span className={`text-sm font-medium ${subTextColor}`}>{label}</span>
      </div>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all }`}>
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
          {options.map((opt: any) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleButton({ active, onClick, label, borderColor, textColor }: any) {
  return (
    <button
      onClick={onClick}
      className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${active ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
    >
      <span className="font-medium text-sm lg:text-lg pr-2">{label}</span>
      <div
        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${active ? "bg-black" : "border border-[#E5E5E5]"
          }`}
      >
        {active && (
          <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
        )}
      </div>
    </button>
  );
}