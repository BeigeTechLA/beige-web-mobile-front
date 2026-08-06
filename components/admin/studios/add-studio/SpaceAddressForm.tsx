"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { DynamicCountrySelect } from "@/components/investors/CountryDropdown";
import { Input } from "@/components/ui/input";
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Props {
  isDark?: boolean;
}

export default function SpaceAddressForm({ isDark = true }: Props) {
  // --- State Management ---
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [state, setState] = useState("California");

  const [latitude, setLatitude] = useState(34.0401);
  const [longitude, setLongitude] = useState(-118.2542);
  const [viewState, setViewState] = useState({
    latitude: 34.0401,
    longitude: -118.2542,
    zoom: 15
  });

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("add_studio_address");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.apartment !== undefined) setApartment(parsed.apartment);
        if (parsed.city) setCity(parsed.city);
        if (parsed.zipCode) setZipCode(parsed.zipCode);
        if (parsed.country) setSelectedCountry(parsed.country);
        if (parsed.state) setState(parsed.state);
        
        const lat = parsed.latitude || 34.0401;
        const lng = parsed.longitude || -118.2542;
        setLatitude(lat);
        setLongitude(lng);
        setViewState({
          latitude: lat,
          longitude: lng,
          zoom: 15
        });
      } catch (e) {
        console.error("Failed to load saved address", e);
      }
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    const data = {
      address,
      apartment,
      city,
      zipCode,
      country: selectedCountry,
      state,
      latitude,
      longitude
    };
    localStorage.setItem("add_studio_address", JSON.stringify(data));
  }, [address, apartment, city, zipCode, selectedCountry, state, latitude, longitude]);

  // Debounced geocoding effect
  useEffect(() => {
    if (!address || !city) return;

    const delayDebounceFn = setTimeout(() => {
      const fullQuery = [address, apartment, city, state, zipCode, selectedCountry]
        .filter(Boolean)
        .join(", ");

      const geocode = async () => {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              fullQuery
            )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
          );
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            setLatitude(lat);
            setLongitude(lng);
            setViewState({
              latitude: lat,
              longitude: lng,
              zoom: 15
            });
          }
        } catch (error) {
          console.error("Geocoding failed:", error);
        }
      };

      geocode();
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [address, apartment, city, state, zipCode, selectedCountry]);

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
        <div className={`relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border ${borderColor} bg-[#111111]`}>
          {MAPBOX_TOKEN ? (
            <Map
              {...viewState}
              onMove={(evt) => {
                setViewState(evt.viewState);
                setLatitude(evt.viewState.latitude);
                setLongitude(evt.viewState.longitude);
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v11"}
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <Marker longitude={longitude} latitude={latitude} anchor="bottom">
                <div className="flex flex-col items-center cursor-pointer select-none">
                  {/* Custom Popup/Tooltip */}
                  <div className={`mb-2 font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xl relative text-left border ${
                    isDark ? "bg-[#18181B] text-white border-zinc-800" : "bg-white text-black border-gray-100"
                  }`}>
                    <div className="font-bold">{address || "845 S Los Angeles St"}{apartment ? `, ${apartment}` : ""}</div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? "text-white/70" : "text-black/70"}`}>{city || "Los Angeles"}, {state || "CA"} {zipCode || "90014"}</div>
                    <div className={`text-[10px] mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>{selectedCountry || "United States"}</div>
                    {/* Little down arrow */}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${
                      isDark ? "border-t-[#18181B]" : "border-t-white"
                    }`} />
                  </div>
                  
                  {/* Custom Marker Pin */}
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <div className="absolute w-12 h-12 rounded-full bg-[#E8D1AB]/30 animate-ping" />
                    {/* Inner glowing circle */}
                    <div className="absolute w-6 h-6 rounded-full bg-[#E8D1AB]/20 border border-[#E8D1AB]/40" />
                    {/* Center dot */}
                    <div className="relative w-3 h-3 rounded-full bg-[#E8D1AB] shadow-md" />
                  </div>
                </div>
              </Marker>
            </Map>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-white/50 text-sm">
              Mapbox Token not configured
            </div>
          )}
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}