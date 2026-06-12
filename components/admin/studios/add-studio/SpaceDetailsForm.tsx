"use client";

import React, { useState } from "react";
import {
  Camera, Calendar, Dumbbell, Users, Minus, Plus, Check,
  Balloon
} from "lucide-react";
import { Separator } from "@/src/components/landing/Separator";
import { QuantityControl } from "@/components/book-a-shoot";

interface Props {
  isDark?: boolean;
  studioData: any;
  setStudioData: (data: any) => void;
}

export default function SpaceDetailsForm({ isDark = true, studioData, setStudioData }: Props) {
  // --- State Syncing ---
  const [useDefault, setUseDefault] = useState<boolean>(true);
  
  const activities = {
    production: studioData.activities?.includes('production'),
    event: studioData.activities?.includes('event'),
    recreation: studioData.activities?.includes('recreation'),
    meetings: studioData.activities?.includes('meetings'),
  };

  const setActivitiesRaw = (newActivities: any) => {
    const updated = typeof newActivities === 'function' ? newActivities(activities) : newActivities;
    const activityArray = Object.keys(updated).filter(k => updated[k]);
    setStudioData({ ...studioData, activities: activityArray });
  };

  const counts = studioData.space_basics || {
    guests: 0,
    bedrooms: 0,
    beds: 0,
    bathrooms: 0,
  };

  const amenities = studioData.amenities || [];
  const highlights = studioData.description_tags || [];

  // --- Helpers ---
  const toggleAmenity = (id: string) => {
    const updated = amenities.includes(id) ? amenities.filter((a: string) => a !== id) : [...amenities, id];
    setStudioData({ ...studioData, amenities: updated });
  };

  const toggleHighlight = (id: string) => {
    let updated = highlights;
    if (highlights.includes(id)) {
      updated = highlights.filter((h: string) => h !== id);
    } else if (highlights.length < 2) {
      updated = [...highlights, id];
    }
    setStudioData({ ...studioData, description_tags: updated });
  };

  const updateCount = (key: string, delta: number) => {
    setStudioData({
      ...studioData,
      space_basics: {
        ...counts,
        [key]: Math.max(0, (counts[key] || 0) + delta)
      }
    });
  };

  const setCounts = (v: any) => {
    const updated = typeof v === 'function' ? v(counts) : v;
    setStudioData({ ...studioData, space_basics: updated });
  };

  const setActivities = (v: any) => setActivitiesRaw(v);


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
        {/* Update the icons */}
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
          {(Object.entries(counts) as [string, number][]).map(([key, value], idx) => (
            <div key={key} className=" space-y-3 lg:space-y-6">
              <div className={`flex items-center justify-between `}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      // If current value is 0, set to 1. If > 0, set to 0.
                      const newValue = value > 0 ? 0 : 1;
                      setCounts((prev: any) => ({ ...prev, [key]: newValue }));
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
                  onIncrease={() => updateCount(key, 1)}
                  onDecrease={() => updateCount(key, -1)}
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

