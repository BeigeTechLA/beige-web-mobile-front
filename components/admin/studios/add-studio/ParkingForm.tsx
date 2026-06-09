"use client";

import React, { useState } from "react";
import {
  Camera,
  Check
} from "lucide-react";

interface Props {
  isDark?: boolean;
}

export default function StudioFeaturesForm({ isDark = true }: Props) {
  const [parking, setParking] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [accessFeatures, setAccessFeatures] = useState<string[]>([]);

  // State for all collapsible feature categories
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    access: true,
    general: false,
    photography: false,
    videography: false,
    podcast: false,
    product: false,
  });

  // State for specific feature values within categories
  const [featureValues, setFeatureValues] = useState<Record<string, string[]>>({
    general: [],
    photography: [],
    videography: [],
    podcast: [],
    product: [],
  });

  // Helpers
  const toggleParking = (id: string) => {
    setParking(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleSection = (id: string) => {
    setActiveSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFeature = (sectionId: string, featureId: string) => {
    setFeatureValues(prev => {
      const current = prev[sectionId] || [];
      const updated = current.includes(featureId)
        ? current.filter(id => id !== featureId)
        : [...current, featureId];
      return { ...prev, [sectionId]: updated };
    });
  };

  const toggleAccess = (id: string) => {
    setAccessFeatures(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // Theme Styles
  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-white/60" : "text-black/60";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-gray-200";

  const PARKING_OPTIONS = [
    { id: "free-onsite", label: "Free Onsite Parking" },
    { id: "paid-onsite", label: "Paid Onsite Parking" },
    { id: "free-street", label: "Free Street Parking" },
    { id: "metered-street", label: "Metered Street Parking" },
    { id: "valet", label: "Valet" },
    { id: "nearby-lot", label: "Nearby Parking lot" },
  ];

  const ACCESS_OPTIONS = [
    { id: "elevator", label: "Elevator" },
    { id: "stairs", label: "Stairs" },
    { id: "street-level", label: "Street Level" },
    { id: "freight", label: "Freight Elevator" },
    { id: "handicap", label: "Wheelchair / Handicap access" },
  ];

  const FEATURE_SECTIONS = [
    {
      id: "general",
      label: "General Studios Facilities",
      options: ["Kitchen", "Changing Room", "Lounge Area", "High Speed Wifi", "Air Conditioning", "Makeup Station"]
    },
    {
      id: "photography",
      label: "Photography Studio Features",
      options: ["Backdrops", "Softboxes", "Ring Light", "Reflectors", "Flash Triggers"]
    },
    {
      id: "videography",
      label: "Videography Studio Features",
      options: ["Green Screen", "Continuous Lighting", "Teleprompter", "Sound Proofing"]
    },
    {
      id: "podcast",
      label: "Podcast Studio Features",
      options: ["Professional Mics", "Headphones", "Audio Mixer", "Acoustic Treatment"]
    },
    {
      id: "product",
      label: "Product Studio Features",
      options: ["Product Table", "Macro Lens", "Lightbox", "Turntable"]
    },
  ];

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">

      {/* 1. Parking Options Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl">
        {PARKING_OPTIONS.map((opt) => {
          const isSelected = parking.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggleParking(opt.id)}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <div className={`w-6 h-6 border rounded-sm transition-colors flex items-center justify-center shrink-0 ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : borderColor}`}>
                {isSelected && <Check size={14} className="text-[#E8D1AB]" />}
              </div>
              <span className={`text-xs lg:text-sm ${textColor}`}>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Description Area */}
      <div className="relative">
        <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#101010]" : "bg-white"}`}>
          <span className={`text-sm lg:text-base ${subTextColor}`}>Description</span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full min-h-[158px] rounded-xl p-6 pt-8 text-sm lg:text-base border transition-all resize-none focus:outline-none ${isDark
            ? "bg-[#101010] border-[#FFFFFF80] text-white focus:border-[#E8D1AB]/50"
            : "bg-white border-[#D7D7D7] text-black focus:border-[#E8D1AB]"
            }`}
        />
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 3. Access Availability (Main Toggle Section) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={`text-lg lg:text-xl font-medium transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
            Access Availability <span className={subTextColor}>(Basic)</span>
          </h2>
          <button
            onClick={() => toggleSection('access')}
            className={`w-11 h-7 rounded-lg transition-colors relative ${activeSections.access ? "bg-[#E8D1AB]" : "bg-[#484646]"}`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-md transition-transform ${activeSections.access ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {activeSections.access && (
          <div className="flex flex-wrap gap-x-8 gap-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {ACCESS_OPTIONS.map((opt) => {
              const isAccessSelected = accessFeatures.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleAccess(opt.id)}
                  className="flex items-center gap-3 group text-left"
                >
                  <div className={`w-5 h-5 border rounded-sm transition-all flex items-center justify-center shrink-0 ${isAccessSelected ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : borderColor}`}>
                    {isAccessSelected && <Check size={14} className="text-[#E8D1AB]" />}
                  </div>
                  <span className={`text-xs lg:text-sm ${textColor}`}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Collapsible Feature Sections */}
      <div>
        {FEATURE_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-6">
            <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
            <div className="flex items-center justify-between">
              <h2 className={`text-lg lg:text-xl font-medium transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
                {section.label}
              </h2>
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-11 h-7 rounded-lg transition-colors relative ${activeSections[section.id] ? "bg-[#E8D1AB]" : "bg-[#484646]"}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-md transition-transform ${activeSections[section.id] ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* Expanded Content for Feature Sections */}
            {activeSections[section.id] && (
              <div className="flex flex-wrap gap-x-8 gap-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {section.options.map((opt) => {
                  const isSelected = featureValues[section.id]?.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleFeature(section.id, opt)}
                      className="flex items-center gap-3 group text-left"
                    >
                      <div className={`w-5 h-5 border rounded-sm transition-all flex items-center justify-center shrink-0 ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : borderColor}`}>
                        {isSelected && <Check size={14} className="text-[#E8D1AB]" />}
                      </div>
                      <span className={`text-xs lg:text-sm ${textColor}`}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}