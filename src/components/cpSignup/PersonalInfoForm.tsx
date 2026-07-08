"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Import all required Select sub-components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { LocationPicker } from "../booking/v2/component/LocationPicker";
import { sanitizePhoneInput } from "@/lib/utils/phone";

const distanceOptions = [
  { value: "Upto 50 miles", label: "Upto 50 miles" },
  { value: "Upto 75 miles", label: "Upto 75 miles" },
  { value: "Upto 100 miles", label: "Upto 100 miles" },
  { value: "I'm open to travelling", label: "I'm open to travelling" },
];

// Define the dark theme for the Location Picker
const locationPickerDarkTheme = {
  inputBg: "#000000",
  inputBorder: "rgba(255,255,255,0.1)",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "rgba(255,255,255,0.4)",
  placeholderText: "rgba(255,255,255,0.2)",
  primaryText: "#FFFFFF",
  secondaryText: "rgba(255,255,255,0.6)",
  iconBg: "#111111",
  iconBgHover: "rgba(232, 209, 171, 0.1)",
  iconColor: "rgba(255,255,255,0.4)",
  iconColorHover: "#E8D1AB",
  iconBgSelected: "rgba(232, 209, 171, 0.2)",
  iconColorSelected: "#E8D1AB",
  buttonPrimaryBg: "#E8D1AB",
  buttonPrimaryBgHover: "#dcb98a",
  buttonPrimaryText: "#000000",
  buttonSecondaryBg: "transparent",
  buttonSecondaryBgHover: "rgba(255,255,255,0.05)",
  buttonSecondaryText: "#FFFFFF",
  accent: "#E8D1AB",
  accentHover: "#dcb98a",
  paperBg: "#0A0A0A",
  divider: "rgba(255,255,255,0.1)",
  searchResultHover: "#1A1A1A",
};

// Light theme definitions for LocationPicker
const locationPickerLightTheme = {
  inputBg: "#FAFAFA",
  inputBorder: "rgba(0,0,0,0.1)",
  inputBorderHover: "#cbb38b",
  inputBorderFocus: "#cbb38b",
  labelText: "rgba(0,0,0,0.4)",
  placeholderText: "rgba(0,0,0,0.3)",
  primaryText: "#000000",
  secondaryText: "rgba(0,0,0,0.6)",
  iconBg: "#F5F5F5",
  iconBgHover: "rgba(203, 179, 139, 0.1)",
  iconColor: "rgba(0,0,0,0.4)",
  iconColorHover: "#cbb38b",
  iconBgSelected: "rgba(203, 179, 139, 0.2)",
  iconColorSelected: "#cbb38b",
  buttonPrimaryBg: "#cbb38b",
  buttonPrimaryBgHover: "#bfa57c",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondaryBg: "transparent",
  buttonSecondaryBgHover: "rgba(0,0,0,0.05)",
  buttonSecondaryText: "#000000",
  accent: "#cbb38b",
  accentHover: "#bfa57c",
  paperBg: "#FFFFFF",
  divider: "rgba(0,0,0,0.1)",
  searchResultHover: "#F0F0F0",
};

// Assuming isDark context flag is provided or passed here
const PersonalInfoForm = ({ profile = {}, onChange, isDark = true }: any) => {
  const [formData, setFormData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    email: profile.email || "",
    phone_number: profile.phone_number || "",
    location: profile.location || null,
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    working_distance: profile.working_distance || "",
  });

  useEffect(() => {
    setFormData({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      phone_number: profile.phone_number || "",
      location: profile.location || null,
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
      working_distance: profile.working_distance || "",
    });
  }, [profile]);

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    const profileUpdate = {
      ...newData,
      location: (typeof newData.location === "object" && newData.location !== null)
        ? JSON.stringify(newData.location)
        : newData.location,
    };
    onChange?.(profileUpdate);
  };

  const handleLocationChange = (address: string, details?: any) => {
    const newData = {
      ...formData,
      location: address,
      latitude: details?.coordinates?.lat ?? details?.lat ?? details?.center?.[1] ?? null,
      longitude: details?.coordinates?.lng ?? details?.lng ?? details?.center?.[0] ?? null,
    };
    setFormData(newData);
    onChange?.(newData);
  };

  const labelClasses = `text-[10px] font-bold uppercase tracking-widest mb-2 block transition-colors ${
    isDark ? "text-white/40" : "text-black/40"
  }`;

  const inputClasses = `h-12 border rounded-xl focus:ring-0 transition-all text-sm md:text-base ${
    isDark 
      ? "bg-black border-white/10 text-white focus:border-[#E8D1AB]/50 placeholder:text-white/20" 
      : "bg-neutral-50 border-black/10 text-black focus:border-[#cbb38b]/50 placeholder:text-black/30"
  }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 lg:gap-y-8 gap-x-12 animate-in fade-in duration-300">
      <div className="flex flex-col">
        <Label className={labelClasses}>First Name</Label>
        <Input
          placeholder="e.g. Namu"
          value={formData.first_name}
          onChange={(e) => handleFieldChange("first_name", e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col">
        <Label className={labelClasses}>Last Name</Label>
        <Input
          placeholder="e.g. Park"
          value={formData.last_name}
          onChange={(e) => handleFieldChange("last_name", e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col">
        <Label className={labelClasses}>Email Address</Label>
        <Input
          type="email"
          placeholder="namu@example.com"
          value={formData.email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col">
        <Label className={labelClasses}>Contact Phone</Label>
        <Input
          type="tel"
          placeholder="Enter phone number"
          value={formData.phone_number}
          onChange={(e) => handleFieldChange("phone_number", sanitizePhoneInput(e.target.value))}
          inputMode="tel"
          autoComplete="tel"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col md:col-span-2">
        <Label className={labelClasses}>Location</Label>
        <LocationPicker
          value={formData.location}
          onChange={handleLocationChange}
          placeholder="Click to select venue location on map"
          colors={isDark ? locationPickerDarkTheme : locationPickerLightTheme}
        />
      </div>

      <div className="flex flex-col">
        <Label className={labelClasses}>Working Distance</Label>
        <Select
          value={formData.working_distance}
          onValueChange={(val) => handleFieldChange("working_distance", val)}
        >
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder="Select working distance" />
          </SelectTrigger>
          <SelectContent className={`border transition-colors ${
            isDark ? "bg-[#111111] border-white/10 text-white" : "bg-white border-black/10 text-black"
          }`}>
            {distanceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
