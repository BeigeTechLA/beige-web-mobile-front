"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  isDark?: boolean;
  studioData: any;
  setStudioData: (data: any) => void;
}

export default function SpaceInformationForm({ isDark = true, studioData, setStudioData }: Props) {
  // --- State Syncing ---
  const spaceTitle = studioData.studio_name ?? "";
  const brandName = studioData.brand_name ??"";
  const description = studioData.description??"";
  const secondaryTypes = Array.isArray(studioData.supported_shoot_types) 
    ? studioData.supported_shoot_types 
    : [];
  const suggestedType = studioData.suggested_type??"";

  const dimensions = {
    propertySize: studioData.square_feet??"",
    height: studioData.height?? "",
    width: studioData.width?? "",
    length: studioData.length?? "",
    floorNumber: studioData.main_floor_number?? ""
  };
  const overnightStays = studioData.overnight_stays_allowed??false;
  const securityEnabled = studioData.security_recording_enabled??false;
  const securityDesc = studioData.security_recording_description??"";

  const setSpaceTitle = (v: string) => setStudioData({ ...studioData, studio_name: v });
  const setBrandName = (v: string) => setStudioData({ ...studioData, brand_name: v });
  const setDescription = (v: string) => setStudioData({ ...studioData, description: v });
  const setSecondaryTypes = (v: string[]) => setStudioData({ ...studioData, supported_shoot_types: v });
  const setSuggestedType = (v: string) => setStudioData({ ...studioData, suggested_type: v });

  const updateDimension = (key: string, val: string) => {
    const map: Record<string, string> = {
      propertySize: 'square_feet',
      height: 'height',
      width: 'width',
      length: 'length',
      floorNumber: 'main_floor_number'
    };
    setStudioData({ ...studioData, [map[key]]: val });
  };

  const setOvernightStays = (v: boolean) => setStudioData({ ...studioData, overnight_stays_allowed: v });
  const setSecurityEnabled = (v: boolean) => setStudioData({ ...studioData, security_recording_enabled: v });
  const setSecurityDesc = (v: string) => setStudioData({ ...studioData, security_recording_description: v });

  // --- Theme Styles ---
  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#FFFFFF99]" : "text-[#71717B]";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";

  const TYPES = ["Photography", "Product Shoot", "Videography", "Podcast"];

    const toggleType = (type: string) => {
      const currentTypes = Array.isArray(secondaryTypes) ? secondaryTypes : [];
      
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t: string) => t !== type)
        : [...currentTypes, type];

      setSecondaryTypes(newTypes);
    };
  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200 mt-4 lg:mt-8">
      {/* 1. Titles Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
            <span className={`text-sm lg:text-base ${subTextColor}`}>Space Title</span>
          </div>
          <Input
            value={spaceTitle}
            onChange={(e) => setSpaceTitle(e.target.value)}
            placeholder="eg : Apartment, Photo Studio, Podcast Studio etc...."
            className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} placeholder:text-[#FFFFFF4D] focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
        </div>

        <div className="relative">
          <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
            <span className={`text-sm lg:text-base ${subTextColor}`}>Add Brand Name (optional)</span>
          </div>
          <Input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="eg : Beige"
            className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} placeholder:text-[#FFFFFF4D] focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
        </div>
      </div>

      {/* 2. Main Description */}
      <div className="relative">
        <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
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

      {/* 3. Secondary Types Selection */}
      <section className="space-y-5 lg:space-y-9">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 ${textColor}`}>Secondary Types</h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Select types that match your space. Each type is unique parameters that we&apos;ll ask about while your listing gets created.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TYPES.map((type) => {
            const isActive = secondaryTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-6 lg:text-lg h-14 lg:h-[82px] rounded-xl font-medium transition-all border text-left ${isActive
                  ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB]"
                  : "bg-transparent border-[#FFFFFF4D] text-[#A9A9A9] hover:border-zinc-700"
                  }`}
              >
                <span className="text-sm lg:text-base font-medium">{type}</span>
              </button>
            );
          })}
        </div>
      </section>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 4. Suggest Type Section */}
      <section className="space-y-5 lg:space-y-9">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 ${textColor}`}>Suggest Type (Optional)</h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            If you didn&apos;t find a suitable secondary location type in the list above, Please suggest one here.
          </p>
        </div>

        <div className="relative">
          <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
            <span className={`text-sm lg:text-base ${subTextColor}`}>Suggest Type</span>
          </div>
          <Input
            value={suggestedType}
            onChange={(e) => setSuggestedType(e.target.value)}
            className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
        </div>
      </section>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 5. Dimensions Section */}
      <section className="space-y-5 lg:space-y-9">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 ${textColor}`}>How Big is the space guests can book?</h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Please only include the size of the space that guests can use during their booking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-3 lg:gap-y-9 lg:gap-x-6">
          {[
            { id: 'propertySize', label: 'Property Size (sq ft)', col: 'md:col-span-1' },
            { id: 'height', label: 'Height', col: '' },
            { id: 'width', label: 'Width', col: '' },
            { id: 'length', label: 'Length', col: '' },
            { id: 'floorNumber', label: 'Main Floor Number (if applicable)', col: 'md:col-span-1' }
          ].map((field) => (
            <div key={field.id} className={`relative ${field.col}`}>
              <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
                <span className={`text-sm lg:text-base ${subTextColor}`}>{field.label}</span>
              </div>
              <Input
                value={dimensions[field.id as keyof typeof dimensions]}
                onChange={(e) => updateDimension(field.id as keyof typeof dimensions, e.target.value)}
                className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
              />
            </div>
          ))}
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 6. Overnight Stays */}
      <section className="space-y-5 lg:space-y-9">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 ${textColor}`}>Do you offer overnight stays at this Space</h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Select <span className={`font-bold ${textColor}`}>&apos;Yes&apos;</span> if your space is listed on sites like Beige and other platform to established that’s subject to lodging taxes.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setOvernightStays(true)}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all duration-300 ${overnightStays ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : `bg-[#101010] border-white/30 ${textColor} opacity-60`}`}
          >
            <span className="font-medium text-sm lg:text-lg">Yes</span>
            <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${overnightStays ? "bg-black" : "border border-[#E5E5E5]"}`}>
              {overnightStays && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
            </div>
          </button>
          <button
            onClick={() => setOvernightStays(false)}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all duration-300 ${!overnightStays ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : `bg-[#101010] border-white/30 ${textColor} opacity-60`}`}
          >
            <span className="font-medium text-sm lg:text-lg">No</span>
            <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!overnightStays ? "bg-black" : "border border-[#E5E5E5]"}`}>
              {!overnightStays && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
            </div>
          </button>
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 7. Security Section */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg lg:text-xl font-medium ${textColor}`}>Security Cameras and Recording Device</h2>
          <button
            onClick={() => setSecurityEnabled(!securityEnabled)}
            className={`w-11 h-7 rounded-lg transition-colors relative ${securityEnabled ? "bg-[#E8D1AB]" : "bg-[#484646]"
              }`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-md transition-transform ${securityEnabled ? "translate-x-5" : ""
              }`} />
          </button>
        </div>

        <div className="relative mt-5 lg:mt-9">
          <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
            <span className={`text-sm lg:text-base ${subTextColor}`}>Description</span>
          </div>
          <textarea
            value={securityDesc}
            onChange={(e) => setSecurityDesc(e.target.value)}
            disabled={!securityEnabled}
            className={`w-full min-h-[158px] rounded-xl p-6 pt-8 text-sm lg:text-base border transition-all resize-none focus:outline-none ${isDark
              ? "bg-[#101010] border-[#FFFFFF80] text-white focus:border-[#E8D1AB]/50"
              : "bg-white border-[#D7D7D7] text-black focus:border-[#E8D1AB]"
              }`}
          />
        </div>

        {/* Security Warning Alert */}
        <div className={`flex gap-3 p-3 rounded-xl items-center mt-4 ${isDark ? "bg-[#20201F]" : "bg-[#F4F4F5]"}`}>
          <div className="mt-0.5 shrink-0">
            <div className="w-5 h-5 rounded-md border border-[#FFDE96] flex items-center justify-center">
              <span className="text-[#FFDE96] text-[10px] font-bold">i</span>
            </div>
          </div>
          <p className={`text-xs lg:text-sm ${isDark ? "text-[#FFDE96]" : "text-[#E8D1AB]"}`}>
            Recording Device in bathrooms or dressing rooms are prohibited by the Beige Service Agreement.
          </p>
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

    </div>
  );
}