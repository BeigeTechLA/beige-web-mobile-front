/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera, Calendar, Dumbbell, Users, Minus, Plus, Check,
  Balloon
} from "lucide-react";
import { Separator } from "@/src/components/landing/Separator";
import { QuantityControl } from "@/components/book-a-shoot";

interface Props {
  isDark?: boolean;
  value?: {
    useDefault: boolean;
    activities: {
      production: boolean;
      event: boolean;
      recreation: boolean;
      meetings: boolean;
    };
    counts: {
      guests: number;
      bedrooms: number;
      beds: number;
      bathrooms: number;
    };
    amenities: string[];
    highlights: string[];
  };
  onChange?: (next: NonNullable<Props["value"]>) => void;
}

const sanitizeText = (value: string) => value.replace(/[^a-zA-Z\s.,'()-]/g, "");
const sanitizeNumber = (value: string) => value.replace(/[^0-9]/g, "");

export default function SpaceDetailsForm({ isDark = true, value, onChange }: Props) {
  const [useDefault, setUseDefault] = useState<boolean>(value?.useDefault ?? true);
  const [activities, setActivities] = useState(
    value?.activities || {
      production: true,
      event: false,
      recreation: false,
      meetings: false,
    },
  );
  const [counts, setCounts] = useState(
    value?.counts || {
      guests: 0,
      bedrooms: 0,
      beds: 0,
      bathrooms: 0,
    },
  );
  const [amenities, setAmenities] = useState<string[]>(value?.amenities || []);
  const [highlights, setHighlights] = useState<string[]>(value?.highlights || []);
  const lastSyncedValueRef = useRef<string>("");
  const hasHydratedValueRef = useRef(false);

  // Load from local storage on mount
  useEffect(() => {
    if (!value || hasHydratedValueRef.current) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastSyncedValueRef.current) return;

    lastSyncedValueRef.current = serialized;
    setUseDefault(value.useDefault ?? true);
    setActivities(value.activities || {
      production: true,
      event: false,
      recreation: false,
      meetings: false,
    });
    setCounts(value.counts || {
      guests: 0,
      bedrooms: 0,
      beds: 0,
      bathrooms: 0,
    });
    setAmenities(value.amenities || []);
    setHighlights(value.highlights || []);
    hasHydratedValueRef.current = true;
  }, [value]);

  // Save to local storage on changes
  useEffect(() => {
    const data = {
      useDefault,
      activities,
      counts,
      amenities,
      highlights
    };
    lastSyncedValueRef.current = JSON.stringify(data);
    onChange?.(data);
    localStorage.setItem("add_studio_details", JSON.stringify(data));
  }, [useDefault, activities, counts, amenities, highlights, onChange]);

  // --- Helpers ---
  const toggleAmenity = (id: string) => {
    setAmenities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const toggleHighlight = (id: string) => {
    setHighlights(prev => {
      if (prev.includes(id)) return prev.filter(h => h !== id);
      if (prev.length < 2) return [...prev, id];
      return prev;
    });
  };

  const updateCount = (key: keyof typeof counts, delta: number) => {
    setCounts(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
  };

  const updateCountDirect = (key: keyof typeof counts, nextValue: string, max?: number) => {
    const numeric = sanitizeNumber(nextValue);
    const parsed = numeric ? Number(numeric) : 0;
    setCounts((prev) => ({ ...prev, [key]: Math.max(0, typeof max === "number" ? Math.min(parsed, max) : parsed) }));
  };

  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#FFFFFF85]" : "text-black/60";
  const borderColor = isDark ? "border-[#FFFFFF4D]" : "border-gray-200";

  return (
    <div className={`mx-auto space-y-10 transition-colors duration-200`}>

      {/* 1. Header Radio Toggles */}
      <div className="flex gap-4">
        <button
          onClick={() => setUseDefault(true)}
          className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${useDefault ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
        >
          <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
          <div
            className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${useDefault ? "bg-black" : "border border-[#E5E5E5]"
              }`}
          >
            {useDefault && (
              <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
            )}
          </div>
        </button>
        <button
          onClick={() => setUseDefault(false)}
          className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!useDefault ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
        >
          <span className="font-medium text-sm lg:text-lg pr-2">No</span>
          <div
            className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!useDefault ? "bg-black" : "border border-[#E5E5E5]"
              }`}
          >
            {!useDefault && (
              <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
            )}
          </div>
        </button>

      </div>

      {/* 2. Activity Switches */}
      <div className="space-y-4">
        {[
          { id: 'production', label: 'Production', icon: <Camera size={18} /> },
          { id: 'event', label: 'Event', icon: <Balloon size={18} /> },
          { id: 'recreation', label: 'Recreation', icon: <Dumbbell size={18} /> },
          { id: 'meetings', label: 'Meetings', icon: <Users size={18} /> },
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${subTextColor}`}>
              {item.icon}
              <span className="text-sm lg:text-base font-medium">{item.label}</span>
            </div>
            <button
              onClick={() => setActivities(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof activities] }))}
              className={`w-11 h-7 rounded-lg transition-colors relative ${activities[item.id as keyof typeof activities] ? "bg-[#E8D1AB]" : "bg-[#484646]"
                }`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-md transition-transform ${activities[item.id as keyof typeof activities] ? "translate-x-5" : ""
                }`} />
            </button>
          </div>
        ))}
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 3. Basic Details Section */}
      <div className="space-y-6">
        <div>
          <h1 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${textColor}`}>
            Share some basic about your space
          </h1>
          <p className={`text-xs lg:text-sm transition-colors duration-100 ${subTextColor}`}>
            You&apos;ll add more details late..
          </p>
        </div>

        <div className={`rounded-xl border ${borderColor} overflow-hidden p-4 lg:p-8 space-y-3 lg:space-y-6`}>
          {Object.entries(counts).map(([key, value], idx) => (
            <div key={key} className=" space-y-3 lg:space-y-6">
              <div className={`flex items-center justify-between `}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const newValue = value > 0 ? 0 : 1;
                      setCounts(prev => ({ ...prev, [key]: newValue }));
                    }}
                    className="focus:outline-none"
                  >
                    <div className={`w-5 h-5 border rounded-sm transition-colors ${value > 0 ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : borderColor
                      } flex items-center justify-center`}>
                      {value > 0 && <Check size={14} className="text-[#E8D1AB]" />}
                    </div>
                  </button>
                  <span className={`lg:text-lg capitalize font-light ${textColor}`}>{key}</span>
                </div>
                <QuantityControl
                  value={value}
                  onIncrease={() => updateCount(key as any, 1)}
                  onDecrease={() => updateCount(key as any, -1)}
                />
                <input
                  value={String(value)}
                  onChange={(e) => updateCountDirect(key as keyof typeof counts, e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  className="sr-only"
                />
              </div>
              {idx !== (Object.entries(counts).length - 1) &&
                <Separator />
              }
            </div>
          ))}
        </div>
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 4. Standout Amenities */}
      <div className="space-y-6">
        <h2 className={`text-lg lg:text-xl font-medium transition-colors duration-100 ${textColor}`}>Do you have any standout amenities?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-y-5 gap-x-6">
          {[
            { id: 'wifi', label: 'Wifi' }, { id: 'hot-tub', label: 'Hot Tub' },
            { id: 'fire-pit', label: 'Fire Pit' }, { id: 'pool-table', label: 'Pool Table' },
            { id: 'bbq', label: 'BBQ Grill' }, { id: 'fireplace', label: 'Indoor Fireplace' },
            { id: 'gym', label: 'Gym' }, { id: 'patio', label: 'Patio' },
            { id: 'pool', label: 'Pool' }, { id: 'dining', label: 'Outdoor Dining Area' }
          ].map((amenity) => (
            <button
              key={amenity.id}
              onClick={() => toggleAmenity(amenity.id)}
              className="flex items-center gap-3 group text-left"
            >
              <div className={`w-6 h-6 border-1 rounded-sm transition-all flex items-center justify-center shrink-0 ${amenities.includes(amenity.id) ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : borderColor
                }`}>
                {amenities.includes(amenity.id) && <Check size={14} className="text-[#E8D1AB]" />}
              </div>
              <span className={`text-xs lg:text-sm ${textColor}`}>{amenity.label}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 5. Highlights Chips */}
      <div className="space-y-6">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium transition-colors duration-100 ${textColor}`}>Let's describe your space</h2>
          <p className={`text-xs lg:text-sm transition-colors duration-100 ${subTextColor}`}>Choose up to 2 highlights,. We’ll use these to get your description started.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {["Peaceful", "Podcast Friendly", "Spacious", "Pet Friendly", "Natural Lightning", "Luxury"].map((tag) => (
            <button
              key={tag}
              onClick={() => toggleHighlight(tag)}
              className={`px-6 lg:text-lg h-12 lg:h-14 rounded-xl font-medium transition-all border ${highlights.includes(tag)
                ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB]"
                : "bg-transparent border-[#FFFFFF4D] text-[#A9A9A9] hover:border-zinc-700"
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}
