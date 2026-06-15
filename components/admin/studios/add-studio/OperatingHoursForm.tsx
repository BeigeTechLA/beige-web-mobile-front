"use client";

import React, { useRef, useState } from "react";
import { ChevronDown, Home, Sparkles, DoorOpen, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/src/components/landing/Separator";

interface Props {
  isDark?: boolean;
  studioData: any;
  setStudioData: (data: any) => void;
}

const RULES_LIST = [
  { id: "smoking_and_drugs_allowed", label: "Smoking and Drugs Allowed" },
  { id: "alcohol_allowed", label: "Alcohol Allowed" },
  { id: "cooking_allowed", label: "Cooking Allowed" },
  { id: "electricity_usage_allowed", label: "Electricity usage Allowed" },
  { id: "external_food_allowed", label: "External Food /Catering Allowed" },
  { id: "pets_allowed", label: "Pets Allowed" },
]

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

export default function OperatingHoursForm({ isDark = true, studioData, setStudioData }: Props) {
  // --- State Syncing ---
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const studioName = studioData.studio_name ?? "Studio";
  const timeToMinutes = (timeStr: string) => {
    const [hours = "0", minutes = "0"] = String(timeStr).split(":");
    const h = Number(hours);
    const m = Number(minutes);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  };

  const is24HourRange = (opens: string, closes: string) =>
    opens === "00:00:00" && closes === "23:45:00";
  
  const operatingHours = studioData.operating_hours || [];
  const schedule: Record<string, { isOpen: boolean; setHours: boolean }> = DAYS.reduce((acc, day, idx) => {
    const existing = operatingHours.find((h: any) => h.day_of_week === idx);
    return {
      ...acc,
      [day]: {
        isOpen: existing ? existing.is_open : true,
        setHours: existing ? !!(existing.opens_at || existing.closes_at) : false
      }
    };
  }, {});

  const handleSaveHours = (opens: string, closes: string) => {
    // Optional: Add logic here to prevent closes < opens if desired
    
    const hours = [...(studioData.operating_hours || [])];
    const existingIdx = hours.findIndex((h: any) => h.day_of_week === activeDayIdx);

    const updatedDay = {
      day_of_week: activeDayIdx,
      is_open: true,
      opens_at: opens,
      closes_at: closes
    };

    if (existingIdx > -1) {
      hours[existingIdx] = updatedDay;
    } else {
      hours.push(updatedDay);
    }
    setStudioData({ ...studioData, operating_hours: hours });
  };

  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const hh = i.toString().padStart(2, "0"), mm = j.toString().padStart(2, "0");
        options.push({ 
          key: `${hh}:${mm}:00`, 
          value: `${i % 12 === 0 ? 12 : i % 12}:${mm} ${i >= 12 ? "PM" : "AM"}` 
        });
      }
    }
    return options;
  }, []);

  const [activeDayIdx, setActiveDayIdx] = useState(1); 
  const [draftOpens, setDraftOpens] = useState("10:00:00");
  const [draftCloses, setDraftCloses] = useState("22:00:00");
  const [is24HoursSelected, setIs24HoursSelected] = useState(false);
  const hasInitialized24Hours = useRef(false);
  const previousOperatingHoursRef = useRef<any[] | null>(null);
  const openingTimeMinutes = timeToMinutes(draftOpens);
  const closingTimeOptions = React.useMemo(() => {
    return timeOptions.filter((option) => timeToMinutes(option.key) > openingTimeMinutes);
  }, [openingTimeMinutes, timeOptions]);
  const isActually24Hrs = 
    studioData.operating_hours?.length === 7 &&
    studioData.operating_hours.every(
      (h: any) => h.is_open && h.opens_at === "00:00:00" && h.closes_at === "23:45:00"
    );

  // Load saved data into draft when switching days
  React.useEffect(() => {
    const currentSaved = studioData.operating_hours?.find((h: any) => h.day_of_week === activeDayIdx);
    if (currentSaved) {
      setDraftOpens(currentSaved.opens_at || "10:00:00");
      setDraftCloses(currentSaved.closes_at || "22:00:00");
    }
  }, [activeDayIdx, studioData.operating_hours]);

  React.useEffect(() => {
    if (is24HoursSelected) return;

    if (!closingTimeOptions.length) {
      if (draftCloses !== "") {
        setDraftCloses("");
      }
      return;
    }

    const hasValidSelection = closingTimeOptions.some((option) => option.key === draftCloses);
    if (!hasValidSelection) {
      setDraftCloses(closingTimeOptions[0].key);
    }
  }, [closingTimeOptions, draftCloses, is24HoursSelected]);

  React.useEffect(() => {
    if (hasInitialized24Hours.current) return;
    if (!Array.isArray(studioData.operating_hours) || studioData.operating_hours.length === 0) return;

    setIs24HoursSelected(isActually24Hrs);
    hasInitialized24Hours.current = true;
  }, [isActually24Hrs, studioData.operating_hours]);

  const commitSelectionToMainState = () => {
  const hours = [...(studioData.operating_hours || [])];
  const existingIdx = hours.findIndex((h: any) => h.day_of_week === activeDayIdx);

  const updatedDay = {
    day_of_week: activeDayIdx,
    is_open: true,
    opens_at: draftOpens,
    closes_at: draftCloses
  };

  if (existingIdx > -1) {
    hours[existingIdx] = updatedDay;
  } else {
    hours.push(updatedDay);
  }
  setStudioData({ ...studioData, operating_hours: hours });
};


const getActiveDayData = () => {
  return studioData.operating_hours?.find((h: any) => h.day_of_week === activeDayIdx) || 
         { day_of_week: activeDayIdx, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" };
};
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS.filter(d => schedule[d].isOpen));

  const rules = studioData.house_rules || {};
  const updateRule = (key: string, val: boolean) => {
    setStudioData({
      ...studioData,
      house_rules: {
        ...studioData.house_rules,
        [key]: val
      }
    });
  };

  const customRule = (studioData.house_rules?.custom_rules || [])[0] || "";
  const setCustomRule = (v: string) => {
    setStudioData({
      ...studioData,
      house_rules: {
        ...studioData.house_rules,
        custom_rules: [v]
      }
    });
  };

 
  const toggleCheckbox = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleDay = (idx: number) => {
  const hours = [...(studioData.operating_hours || [])];
  const existingIdx = hours.findIndex((h: any) => h.day_of_week === idx);

  if (existingIdx > -1) {
    // Toggle existing entry
    hours[existingIdx] = { 
      ...hours[existingIdx], 
      is_open: !hours[existingIdx].is_open 
    };
  } else {
    // Add new entry as open
    hours.push({ 
      day_of_week: idx, 
      is_open: true, 
      opens_at: "10:00:00", 
      closes_at: "22:00:00" 
    });
  }
  setStudioData({ ...studioData, operating_hours: hours });
}; 

 // Toggle all days Open/Closed
  const toggleAllDays = () => {
    const allOpened = DAYS.every((_, idx) => 
      studioData.operating_hours?.find((h: any) => h.day_of_week === idx)?.is_open
    );

    const newHours = DAYS.map((_, idx) => ({
      day_of_week: idx,
      is_open: !allOpened,
      opens_at: "10:00:00",
      closes_at: "22:00:00"
    }));

    setStudioData({ ...studioData, operating_hours: newHours });
  };

  const isAllDaysSelected = studioData.operating_hours?.length === 7 && 
    studioData.operating_hours.every((h: any) => h.is_open);

  const handleToggle24Hours = () => {
    if (is24HoursSelected) {
      const restoredHours = previousOperatingHoursRef.current?.length
        ? previousOperatingHoursRef.current
        : DAYS.map((_, idx) => ({
            day_of_week: idx,
            is_open: true,
            opens_at: "10:00:00",
            closes_at: "22:00:00",
          }));

      previousOperatingHoursRef.current = null;
      setStudioData({ ...studioData, operating_hours: restoredHours });
      setIs24HoursSelected(false);
    } else {
      previousOperatingHoursRef.current = [...(studioData.operating_hours || [])];

      const all24 = DAYS.map((_, idx) => ({
        day_of_week: idx,
        is_open: true,
        opens_at: "00:00:00",
        closes_at: "23:45:00",
      }));
      setStudioData({ ...studioData, operating_hours: all24 });
      setIs24HoursSelected(true);
    }
  };

  const getTimeLabel = (value?: string) => {
    if (!value) return "";
    const match = timeOptions.find((t) => t.key === value);
    return match?.value || value;
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
              <p className={isDark ? "text-white" : "text-[#323232]"}>{studioName}</p>
            </div>

           {/* Inside the Header part of Operating Hours section */}
            <div className="flex gap-3">
              <button
                onClick={handleToggle24Hours} // Changed from local state toggle to the logic above
                className="flex items-center gap-2 group cursor-pointer"
              >
                {/* Use the derived state isActually24Hrs for the radio selection */}
                <CustomRadio selected={is24HoursSelected} />
                <span className={`text-sm lg:text-base ${textColor}`}>Set as 24 hrs</span>
              </button>
            </div>
            </div>
          {/* All Days Checkbox */}
          <div className={`p-5 ${isDark ? "bg-[#171717]" : "bg-[#FFFCF6]"} rounded-b-2xl border-b border-b-[#3D3D3D]`}>
            <div className="flex items-center gap-3">
              <div
                onClick={toggleAllDays}
                className={`w-5 h-5 border rounded flex items-center justify-center transition-all shrink-0 ${
                  isAllDaysSelected // Use the new helper here
                    ? "bg-[#E8D1AB] border-[#E8D1AB]"
                    : isDark ? "border-[#DDDDDD]" : "border-[#D7D7D7]"
                } cursor-pointer`}
              >
                {isAllDaysSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium text-[#E8D1AB]`}>Select All Days</span>
            </div>
          </div>

          <div className="p-5 space-y-4 lg:space-y-8">
             {DAYS.map((day, idx) => {
              const dayData = studioData.operating_hours?.find((h: any) => h.day_of_week === idx);
              const isOpen = dayData?.is_open ?? false; // Default to closed if not in array

              return (
                <div key={day} className="grid grid-cols-3 gap-4 items-center w-full">
                  {/* 1. The Checkbox (Now toggles Open/Close status) */}
                  <div className="flex items-center gap-3 w-full">
                    <div
                      onClick={() => toggleDay(idx)} // Clicking the checkbox toggles the day
                      className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center transition-all shrink-0 ${
                        isOpen ? "bg-[#E8D1AB] border-[#E8D1AB]" : "border-[#DDDDDD]"
                      }`}
                    >
                      {isOpen && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm lg:text-base ${textColor}`}>{day}</span>
                  </div>

                  {/* 2. The Toggle Switch */}
                  <div className="flex items-center gap-6 w-full">
                    <button
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-7 rounded-lg transition-colors relative ${
                        isOpen
                          ? "bg-[#E8D1AB]"
                          : "bg-[#484646]"
                      }`}
                    >
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-md transition-transform ${
                        isOpen ? "translate-x-3.5" : ""
                      }`} />
                    </button>
                    <span className={`text-sm lg:text-base ${textColor}`}>{isOpen ? "Open" : "Close"}</span>
                  </div>

                  {/* 3. Set Hours Radio (Switches the right panel) */}
                  <div className="flex items-center gap-6 w-full">
                    {isOpen && (
                      <div
                        className="flex items-center gap-2 w-full cursor-pointer"
                        onClick={() => setActiveDayIdx(idx)}
                      >
                        <CustomRadio selected={activeDayIdx === idx} />
                        <span className={`text-sm lg:text-base ${textColor}`}>Set Hours</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        
                {/* Right Column: Custom Hours Form */}
        <div className={`lg:col-span-7 border ${borderColor} rounded-2xl ${cardBg}`}>
          <div className={`p-5 flex flex-row items-center transition-colors duration-300 gap-2 border-b rounded-t-2xl ${isDark ? "bg-[#171717] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
            <div className="w-[3px] h-6 bg-[#E5D5B8]" />
            <p className={textColor}>Set Custom Hours ({DAYS[activeDayIdx] || "Select a Day"})</p>
          </div>

          <div className="space-y-5 lg:space-y-9 p-5 pt-9">
            
            {/* 1. Opening Time Select */}
            <div className="relative">
              <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                <span className={`text-sm font-medium ${subTextColor}`}>Select Opening Time</span>
              </div>
                <Select 
                disabled={is24HoursSelected}
                value={draftOpens} 
                onValueChange={(val) => setDraftOpens(val)}
              >
                <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all ${is24HoursSelected ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111] text-white border-[#333]" : "bg-white"}>
                  {timeOptions.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Closing Time Select */}
            <div className="relative">
              <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                <span className={`text-sm font-medium ${subTextColor}`}>Select Closing Time</span>
              </div>
              <Select 
                value={draftCloses || undefined} 
                disabled={is24HoursSelected} 
                onValueChange={(val) => setDraftCloses(val)}
              >
                <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50  ${is24HoursSelected ? "opacity-50 cursor-not-allowed" : ""} transition-all`}>
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111] text-white border-[#333]" : "bg-white"}>
                  {closingTimeOptions.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!is24HoursSelected && !closingTimeOptions.length && (
                <p className={`mt-2 text-xs ${subTextColor}`}>No closing times are available after the selected opening time.</p>
              )}
            </div>

            <button 
              onClick={commitSelectionToMainState}
              disabled={is24HoursSelected || !draftCloses || timeToMinutes(draftCloses) <= openingTimeMinutes}
              className={`${is24HoursSelected || !draftCloses || timeToMinutes(draftCloses) <= openingTimeMinutes ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-[#E8D1AB]"} text-black text-lg lg:text-xl font-medium px-8 py-2.5 rounded-lg hover:bg-[#d9c39e] transition-colors `}>
              {is24HoursSelected ? "24 Hours Active" : "Save"}
            </button>

            {/* Confirmed Schedule Summary (Shows only after clicking Save) */}
            {studioData.operating_hours?.some((h: any) => h.is_open) && (
              <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/5">
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-50 ${textColor}`}>
                  Confirmed Schedule
                </p>
                <div className="space-y-3">
                  {DAYS.map((day, idx) => {
                    const saved = studioData.operating_hours?.find((h: any) => h.day_of_week === idx);
                    if (!saved || !saved.is_open) return null;
                    const is24Hours = is24HourRange(saved.opens_at, saved.closes_at);
                    return (
                      <div key={day} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                        <span className={`font-medium ${textColor}`}>{day}</span>
                        <span className="text-[#E8D1AB]">
                          {is24Hours ? "24 Hours" : `${getTimeLabel(saved.opens_at)} - ${getTimeLabel(saved.closes_at)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
              onChange={(e) => setCustomRule(e.target.value)}
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
