"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { DynamicCountrySelect } from "@/components/investors/CountryDropdown";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPicker, darkThemeColors, lightThemeColors } from "@/src/components/booking/v2/component/LocationPicker";

interface Props {
  isDark?: boolean;
  studioData: any;
  setStudioData: (data: any) => void;
}

export default function SpaceAddressForm({ isDark = true, studioData, setStudioData }: Props) {
  // --- State Syncing ---
  const updateAddress = (field: string, value: any) => {
    setStudioData({
      ...studioData,
      address: {
        ...studioData.address,
        [field]: value
      }
    });
  };

  const updateLocationFromMapbox = (address: string, details?: any) => {
    const context = Array.isArray(details?.context) ? details.context : [];
    const findByPrefix = (prefix: string) => context.find((item: any) => item?.id?.startsWith(prefix));

    const place = findByPrefix("place.");
    const region = findByPrefix("region.");
    const country = findByPrefix("country.");
    const postcode = findByPrefix("postcode.");
    const coordinates = details?.coordinates || details;

    setStudioData({
      ...studioData,
      location: address || "",
      address: {
        ...studioData.address,
        line1: address || studioData.address.line1,
        city: place?.text || studioData.address.city,
        state: region?.short_code ? String(region.short_code).split(".").pop()?.toUpperCase() || region.text : studioData.address.state,
        country: country?.text || studioData.address.country,
        zipCode: postcode?.text || studioData.address.zipCode,
        latitude: Number(coordinates?.lat ?? coordinates?.latitude ?? studioData.address.latitude),
        longitude: Number(coordinates?.lng ?? coordinates?.longitude ?? studioData.address.longitude),
      },
      locationDetails: details || null,
    });
  };

  const clearLocation = () => {
    setStudioData({
      ...studioData,
      location: "",
      locationDetails: null,
      address: {
        ...studioData.address,
        line1: "",
        city: "",
        state: studioData.address.state,
        country: studioData.address.country,
        zipCode: "",
        latitude: "",
        longitude: "",
      },
    });
  };

  const address = studioData.address.line1;
  const apartment = studioData.address.line2;
  const city = studioData.address.city;
  const zipCode = studioData.address.zipCode;
  const selectedCountry = studioData.address.country;
  const state = studioData.address.state;
  const fullLocation = studioData.location || [
    studioData.address.line1,
    studioData.address.line2,
    studioData.address.city,
    studioData.address.state,
    studioData.address.zipCode,
    studioData.address.country,
  ].filter(Boolean).join(", ");
  const mapColors = isDark ? darkThemeColors : lightThemeColors;

  const setAddress = (v: string) => updateAddress('line1', v);
  const setApartment = (v: string) => updateAddress('line2', v);
  const setCity = (v: string) => updateAddress('city', v);
  const setZipCode = (v: string) => updateAddress('zipCode', v);
  const setSelectedCountry = (v: string) => updateAddress('country', v);
  const setState = (v: string) => updateAddress('state', v);

  // --- Theme Styles ---
  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#D3D3D3]" : "text-[#71717B]";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">

      {/* 1. Address Details Grid */}
      <div className="space-y-5 lg:space-y-9 ">
        {/* Country Select */}
        <div className="relative w-full md:w-[320px]">
          <DynamicCountrySelect
            value={selectedCountry}
            onChange={setSelectedCountry}
          />
        </div>

        {/* Primary Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative md:col-span-2">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>Address*</span>
            </div>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
            />
          </div>

          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>Apartment, Suite, etc*</span>
            </div>
            <Input
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
            />
          </div>
        </div>

        {/* City, State, Zip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>City*</span>
            </div>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
            />
          </div>

          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>State*</span>
            </div>
            <div className="relative">

              <Select value={state} onValueChange={(val) => setState(val)}>
                <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all }`}>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                </SelectContent>
              </Select>
              {/* <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 ${subTextColor} pointer-events-none`} size={20} /> */}
            </div>
          </div>

          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>Zip Code*</span>
            </div>
            <Input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
            />
          </div>
        </div>
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 2. Map Section */}
      <section className="space-y-6">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 ${textColor}`}>Do we have the right spot?</h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Move the map to adjust the pin placement. The new location will be saved automatically when you proceed to the next step.
          </p>
        </div>

        {/* Map Container */}
        <div className="w-full">
          <LocationPicker
            value={fullLocation}
            onChange={(address, details) => {
              if (!address) {
                clearLocation();
                return;
              }
              updateLocationFromMapbox(address, details);
            }}
            placeholder="Search for a location"
            label="Do we have the right spot?"
            colors={mapColors}
            hasError={false}
            disabled={false}
          />
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}
