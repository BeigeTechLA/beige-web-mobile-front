/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Home, Sparkles, DoorOpen, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/src/components/landing/Separator";

const sanitizeText = (value: string) => value.replace(/[^a-zA-Z\s.,'()-]/g, "");
const timeOptions = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

interface Props {
  isDark?: boolean;
  value?: {
    is24Hrs: boolean;
    selectedDays: string[];
    schedule: Record<string, { isOpen: boolean; setHours: boolean }>;
    rules: Record<string, boolean | null>;
    customRule: string;
    studio: string;
    openingTime: string;
    closingTime: string;
  };
  onChange?: (next: NonNullable<Props["value"]>) => void;
}

type DayConfig = {
  isOpen: boolean;
  setHours: boolean;
};

const RULES_LIST = [
  { id: "smoking", label: "Smoking and Drugs Allowed" },
  { id: "alcohol", label: "Alcohol Allowed" },
  { id: "cooking", label: "Cooking Allowed" },
  { id: "electricity", label: "Electricity usage Allowed" },
  { id: "externalFood", label: "External Food /Catering Allowed" },
  { id: "pets", label: "Pets Allowed" },
]
// --- Custom Radio Component using your SVG ---
const CustomRadio = ({ selected }: { selected: boolean }) => {
  if (selected) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none" className="shrink-0">
        <rect x="0.40625" y="0.40625" width="25.1875" height="25.1875" rx="12.5938" fill="url(#paint0_linear_1658_9687)" stroke="url(#paint1_linear_1658_9687)" strokeWidth="0.8125" />
        <circle cx="13" cy="13" r="3.25" fill="black" />
        <circle cx="13" cy="13" r="3.25" fill="url(#paint2_linear_1658_9687)" />
        <circle cx="13" cy="13" r="3.25" fill="#101010" />
        <defs>
          <linearGradient id="paint0_linear_1658_9687" x1="4.0625" y1="4.875" x2="21.125" y2="21.5312" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8D1AB" />
            <stop offset="0.913132" stopColor="#F6CC86" />
          </linearGradient>
          <linearGradient id="paint1_linear_1658_9687" x1="4.0625" y1="4.875" x2="21.125" y2="21.5312" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8D1AB" />
            <stop offset="0.913132" stopColor="#F6CC86" />
          </linearGradient>
          <linearGradient id="paint2_linear_1658_9687" x1="10.7656" y1="10.9688" x2="15.0312" y2="15.1328" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8D1AB" />
            <stop offset="0.913132" stopColor="#E6AA46" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  return (
    <div className="w-[26px] h-[26px] rounded-full border border-[#DDDDDD] shrink-0" />
  );
};

export default function OperatingHoursForm({ isDark = true, value, onChange }: Props) {
  // --- Operating Hours State ---
  const [is24Hrs, setIs24Hrs] = useState(value?.is24Hrs ?? false);
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const [selectedDays, setSelectedDays] = useState<string[]>(value?.selectedDays || []);
  const [schedule, setSchedule] = useState<Record<string, { isOpen: boolean; setHours: boolean }>>(
    value?.schedule || {}
  );

  // --- Space Rules State ---
  const [rules, setRules] = useState<Record<string, boolean | null>>({
    smoking: false,
    alcohol: true,
    cooking: true,
    electricity: true,
    externalFood: false,
    pets: null,
  });

  const [customRule, setCustomRule] = useState(value?.customRule || "");
  const [studio, setStudio] = useState(value?.studio || "");
  const [openingTime, setOpeningTime] = useState(value?.openingTime || "");
  const [closingTime, setClosingTime] = useState(value?.closingTime || "");
  const [timeError, setTimeError] = useState("");
  const hasHydratedValueRef = useRef(false);

  useEffect(() => {
    if (!value || hasHydratedValueRef.current) return;
    setIs24Hrs(value.is24Hrs ?? false);
    setSelectedDays(value.selectedDays || []);
    setSchedule(value.schedule || {});
    setRules(value.rules || {
      smoking: null,
      alcohol: null,
      cooking: null,
      electricity: null,
      externalFood: null,
      pets: null,
    });
    setCustomRule(value.customRule || "");
    setStudio(value.studio || "");
    setOpeningTime(value.openingTime || "");
    setClosingTime(value.closingTime || "");
    setTimeError("");
    hasHydratedValueRef.current = true;
  }, [value]);

  // Save to local storage on changes
  useEffect(() => {
    const data = {
      is24Hrs,
      selectedDays,
      schedule,
      rules,
      customRule,
      studio,
      openingTime,
      closingTime
    };
    onChange?.(data);
    localStorage.setItem("add_studio_operations", JSON.stringify(data));
  }, [is24Hrs, selectedDays, schedule, rules, customRule, studio, openingTime, closingTime, onChange]);

  useEffect(() => {
    if (!openingTime || !closingTime) {
      setTimeError("");
      return;
    }
    setTimeError(openingTime >= closingTime ? "Opening time must be before closing time." : "");
  }, [openingTime, closingTime]);

  const toggleCheckbox = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Helpers
  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day]?.isOpen }
    }));
  };

  // Toggle All Days (Header Checkbox)
  const toggleAllDays = () => {
    if (selectedDays.length === DAYS.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays(DAYS);
    }
  };

  const toggleSetHours = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], setHours: !prev[day]?.setHours }
    }));
  };

  const getDayConfig = (day: string) => schedule[day] || { isOpen: false, setHours: false };

  const updateRule = (key: string, val: boolean) => {
    setRules(prev => ({ ...prev, [key]: val }));
  };

  // Theme Styles
  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#D3D3D3]" : "text-[#71717B]";
  const cardBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#FFFFFF33]" : "border-[#D7D7D7]";
  const inputBg = isDark ? "bg-[#171717]" : "bg-gray-50";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";

  return (
    <div className="space-y-12 transition-colors duration-200">

      {/* 1. Operating Hours Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Day Selection */}
        <div className={`lg:col-span-5 border ${borderColor} rounded-2xl overflow-hidden ${cardBg}`}>
          {/* Header */}
          <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#171717] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
            }`}>
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <p className={isDark ? "text-white" : "text-[#323232]"}>Test Studio - Los Angeles</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIs24Hrs(!is24Hrs)}
                className="flex items-center gap-2 group"
              >
                <CustomRadio selected={is24Hrs} />
                <span className={`text-sm lg:text-base ${textColor}`}>Set as 24 hrs</span>
              </button>
            </div>
          </div>

          {/* All Days */}
          <div className={`p-5 ${isDark ? "bg-[#171717]" : "bg-[#FFFCF6]"} rounded-b-2xl border-b border-b-[#3D3D3D]`}>
            <div className="flex items-center gap-3">
              <div
                onClick={toggleAllDays}
                className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center transition-all shrink-0 ${selectedDays.length === DAYS.length
                  ? "bg-[#E8D1AB] border-[#E8D1AB]"
                  : isDark ? "border-[#DDDDDD]" : "border-[#D7D7D7]"
                  }`}
              >
                {selectedDays.length === DAYS.length && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium text-[#E8D1AB]`}>Days</span>
            </div>
          </div>

          <div className="p-5 space-y-4 lg:space-y-8">
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-3 gap-4 items-center w-full">
                <div className="flex items-center gap-3 w-full">
                  <div
                    onClick={() => toggleCheckbox(day)}
                    className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center transition-all shrink-0 ${selectedDays.includes(day)
                      ? "bg-[#E8D1AB] border-[#E8D1AB]"
                      : isDark ? "border-[#DDDDDD]" : "border-[#D7D7D7]"
                      }`}
                  >
                    {selectedDays.includes(day) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm lg:text-base ${textColor}`}>{day}</span>
                </div>

                <div className="flex items-center gap-6 w-full">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-7 rounded-lg transition-colors relative ${getDayConfig(day).isOpen ? "bg-[#E8D1AB]" : "bg-[#484646]"
                      }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-md transition-transform ${getDayConfig(day).isOpen ? "translate-x-3.5" : ""
                      }`} />
                  </button>
                  <span className={`text-sm lg:text-base ${textColor}`}>{getDayConfig(day).isOpen ? "Open" : "Close"}</span>
                </div>

                <div className="flex items-center gap-6 w-full">
                  {/* Set Hours Radio */}
                  {
                    getDayConfig(day).isOpen && (
                      <div className="flex items-center gap-2 cursor-pointer w-full" onClick={() => toggleSetHours(day)}>
                        <CustomRadio selected={getDayConfig(day).setHours} />
                        <span className={`text-sm lg:text-base ${textColor}`}>Set Hours</span>
                      </div>
                    )
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Custom Hours Form */}
        <div className={`lg:col-span-7 border ${borderColor} rounded-2xl ${cardBg}`}>
          <div className={` p-5 flex flex-row items-center transition-colors duration-300 gap-2 border-b  rounded-2xl ${isDark ? "bg-[#171717] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
            }`}>
            <div className="w-[3px] h-6 bg-[#E5D5B8]" />
            <p className={isDark ? "text-white" : "text-[#323232]"}>Set Custom Hours</p>
          </div>

          <div className="space-y-5 lg:space-y-9 p-5 pt-9">
            <div className="relative">
              <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                <span className={`text-sm font-medium ${subTextColor}`}>Select Studios</span>
              </div>
              <Select value={studio || undefined} onValueChange={(val) => setStudio(val)}>
                <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all }`}>
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="studio1">Studio 1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                <span className={`text-sm font-medium ${subTextColor}`}>Select Opening Time</span>
              </div>
              <Select value={openingTime || undefined} onValueChange={(val) => setOpeningTime(val)}>
                <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all }`}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                <span className={`text-sm font-medium ${subTextColor}`}>Select Closing Time</span>
              </div>
              <Select value={closingTime || undefined} onValueChange={(val) => setClosingTime(val)}>
                <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all }`}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {timeError && <p className="text-sm text-red-500">{timeError}</p>}

            <button
              className="bg-[#E8D1AB] text-black text-lg lg:text-xl font-medium px-8 py-2.5 rounded-lg hover:bg-[#d9c39e] transition-colors"
              onClick={() => {
                if (timeError) return;
              }}
            >
              Save
            </button>
          </div>
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 2. Space Rules Section */}
      <section className="space-y-6">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium ${textColor}`}>Set your space rules</h2>
          <p className={`text-xs lg:text-sm ${subTextColor}`}>Specify the rules that must be followed in your space.</p>
        </div>

        <div className={`border ${borderColor} rounded-xl p-4 lg:p-8 space-y-1 ${cardBg}`}>
          {RULES_LIST.map((rule, idx) => (
            <div key={rule.id} >
              <div className="flex items-center justify-between">
                <span className={`lg:text-lg font-light ${textColor}`}>{rule.label}</span>
                <div className="flex gap-4">

                  {/* Yes Button */}
                  <button
                    onClick={() => updateRule(rule.id, true)}
                    className={`h-10 w-18 rounded-md border px-3 flex items-center justify-between transition-colors duration-300 ease-in-out ${rules[rule.id] === true ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-[#FFFFFF4D] hover:border-white/20 text-[#A9A9A9]"}`}
                  >
                    <span className="font-medium text-xs pr-2">Yes</span>
                    <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${rules[rule.id] === true ? "bg-black" : "border border-[#E5E5E5]"}`}>
                      {rules[rule.id] === true && (
                        <div className="w-1 h-1 rounded-full bg-[#E8D1AB]" />
                      )}
                    </div>
                  </button>

                  {/* No Button */}
                  <button
                    onClick={() => updateRule(rule.id, false)}
                    className={`h-10 w-18 rounded-md border px-3 flex items-center justify-between transition-colors duration-300 ease-in-out ${rules[rule.id] === false ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-[#FFFFFF4D] hover:border-white/20 text-[#A9A9A9]"}`}
                  >
                    <span className="font-medium text-xs pr-2">No</span>
                    <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${rules[rule.id] === false ? "bg-black" : "border border-[#E5E5E5]"}`}>
                      {rules[rule.id] === false && <div className="w-1 h-1 rounded-full bg-[#E8D1AB]" />}
                    </div>
                  </button>
                </div>
              </div>
              <div className="py-6">
                <Separator />
              </div>
            </div>
          ))}

          {/* Add Custom Rule Input */}
          <div className="mt-4 relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>Add Custom Rule</span>
            </div>
            <textarea
              value={customRule}
              onChange={(e) => setCustomRule(sanitizeText(e.target.value))}
              inputMode="text"
              pattern="[A-Za-z\s.,'()-]*"
              className={`w-full h-[82px] rounded-xl p-6 pt-8 text-sm lg:text-base border transition-all resize-none focus:outline-none ${isDark
                ? "bg-[#101010] border-[#FFFFFF80] text-white focus:border-[#E8D1AB]/50"
                : "bg-white border-[#D7D7D7] text-black focus:border-[#E8D1AB]"
                }`}
            />
          </div>
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}
