/* eslint-disable */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { DynamicCountrySelect } from "@/components/investors/CountryDropdown";
import { Input } from "@/components/ui/input";
import Map, { MapRef, Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const sanitizeAddressText = (value: string) => value.replace(/[^a-zA-Z0-9\s.,#'/-]/g, "");
const sanitizeZip = (value: string, country: string) => {
  if (country === US_COUNTRY_LABEL) return value.replace(/[^0-9]/g, "").slice(0, 5);
  return value.replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 12);
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const DEFAULT_LAT = 34.0401;
const DEFAULT_LNG = -118.2542;
const DEFAULT_ZOOM = 15;
const US_COUNTRY_LABEL = "United States";

const US_STATE_OPTIONS = [
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
];

const STATE_LOOKUP: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

const STATE_TO_LABEL: Record<string, string> = US_STATE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<string, string>,
);

interface Props {
  isDark?: boolean;
  value?: {
    country: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  };
  onChange?: (next: {
    country: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  }) => void;
}

type GeoAddress = {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const formatState = (rawState: string) => {
  const normalized = rawState.trim();
  if (!normalized) return "";
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }
  return STATE_LOOKUP[normalized.toLowerCase()] || normalized;
};

export default function SpaceAddressForm({ isDark = true, value, onChange }: Props) {
  const [address, setAddress] = useState(value?.address || "");
  const [apartment, setApartment] = useState(value?.apartment || "");
  const [city, setCity] = useState(value?.city || "");
  const [zipCode, setZipCode] = useState(value?.zipCode || "");
  const [selectedCountry, setSelectedCountry] = useState(value?.country || US_COUNTRY_LABEL);
  const [state, setState] = useState(value?.state || "CA");
  const [latitude, setLatitude] = useState(value?.latitude ?? DEFAULT_LAT);
  const [longitude, setLongitude] = useState(value?.longitude ?? DEFAULT_LNG);
  const [viewState, setViewState] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    zoom: DEFAULT_ZOOM,
  });

  const [mapError, setMapError] = useState("");
  const [isReverseLoading, setIsReverseLoading] = useState(false);
  const [isForwardLoading, setIsForwardLoading] = useState(false);
  const lastEmittedRef = useRef("");

  const mapRef = useRef<MapRef | null>(null);
  const lastValidLocationRef = useRef({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
  const reverseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forwardDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forwardSyncResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseRequestIdRef = useRef(0);
  const forwardRequestIdRef = useRef(0);
  const isUpdatingFromFieldsRef = useRef(false);
  const suppressForwardSyncRef = useRef(false);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!value) return;
    setAddress(value.address || "");
    setApartment(value.apartment || "");
    setCity(value.city || "");
    setZipCode(value.zipCode || "");
    setSelectedCountry(value.country || US_COUNTRY_LABEL);
    setState(value.state || "CA");
    setLatitude(value.latitude ?? DEFAULT_LAT);
    setLongitude(value.longitude ?? DEFAULT_LNG);
    setViewState({
      latitude: value.latitude ?? DEFAULT_LAT,
      longitude: value.longitude ?? DEFAULT_LNG,
      zoom: viewState.zoom,
    });
    lastValidLocationRef.current = {
      latitude: value.latitude ?? DEFAULT_LAT,
      longitude: value.longitude ?? DEFAULT_LNG,
    };
  }, [value]);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  useEffect(() => {
    const data = {
      country: US_COUNTRY_LABEL,
      address,
      apartment,
      city,
      state,
      zipCode,
      latitude,
      longitude,
    };
    const serialized = JSON.stringify(data);
    if (serialized !== lastEmittedRef.current) {
      lastEmittedRef.current = serialized;
      onChange?.(data);
    }
    localStorage.setItem("add_studio_address", JSON.stringify(data));
  }, [address, apartment, city, zipCode, state, latitude, longitude, onChange]);

  const updateFromReverseGeocode = (payload: GeoAddress, coords: { latitude: number; longitude: number }) => {
    setMapError("");
    suppressForwardSyncRef.current = true;
    if (forwardSyncResetRef.current) {
      clearTimeout(forwardSyncResetRef.current);
    }
    setAddress(payload.address);
    setCity(payload.city);
    setState(payload.state);
    setZipCode(payload.zipCode);
    setSelectedCountry(US_COUNTRY_LABEL);
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setViewState((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
    lastValidLocationRef.current = coords;
    forwardSyncResetRef.current = setTimeout(() => {
      suppressForwardSyncRef.current = false;
    }, 0);
  };

  const buildForwardQuery = () => {
    const parts = [address.trim(), city.trim(), STATE_TO_LABEL[state] || state, zipCode.trim(), US_COUNTRY_LABEL].filter(Boolean);
    return parts.join(", ");
  };

  const hasEnoughAddressData = () => {
    const hasAddress = Boolean(address.trim());
    const hasCityState = Boolean(address.trim() && city.trim() && state.trim());
    const hasZip = Boolean(address.trim() && zipCode.trim());
    return hasAddress && (hasCityState || hasZip);
  };

  const normalizeResultState = (rawState: string) => {
    const normalized = formatState(rawState);
    return normalized && STATE_TO_LABEL[normalized] ? normalized : normalized;
  };

  const runForwardGeocode = async () => {
    if (!MAPBOX_TOKEN || !hasEnoughAddressData()) return;

    const requestId = ++forwardRequestIdRef.current;
    setIsForwardLoading(true);
    setMapError("");
    let appliedProgrammaticMove = false;

    try {
      const query = buildForwardQuery();
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US&types=address,place,postcode,region`,
      );
      const data = await response.json();

      if (requestId !== forwardRequestIdRef.current) return;

      if (!response.ok) {
        throw new Error(data?.message || "Forward geocoding request failed");
      }

      const feature = data?.features?.[0];
      if (!feature) {
        throw new Error("Location not found, please check the address");
      }

      const countryContext = feature.context?.find((item: any) => item.id?.startsWith("country"));
      const countryCode = countryContext?.short_code || countryContext?.shortCode;
      if (countryCode && String(countryCode).toUpperCase() !== "US") {
        throw new Error("Please select a location within the United States");
      }

      const center = feature.center;
      if (!Array.isArray(center) || center.length < 2) {
        throw new Error("Location not found, please check the address");
      }

      const context = feature.context || [];
      const placeFeature = context.find((item: any) => item.id?.startsWith("place"));
      const regionFeature = context.find((item: any) => item.id?.startsWith("region"));
      const postcodeFeature = context.find((item: any) => item.id?.startsWith("postcode"));

      const streetNumber = feature.address ? `${feature.address} ` : "";
      const streetName = feature.text || "";
      const parsedAddress = `${streetNumber}${streetName}`.trim() || address.trim();
      const parsedCity = placeFeature?.text || city.trim();
      const parsedState = normalizeResultState(regionFeature?.short_code?.replace(/^US-/, "") || regionFeature?.text || state);
      const parsedZip = postcodeFeature?.text || zipCode.trim();

      isUpdatingFromFieldsRef.current = true;
      appliedProgrammaticMove = true;
      setAddress(parsedAddress);
      setCity(parsedCity);
      setState(parsedState || state);
      setZipCode(parsedZip);
      setSelectedCountry(US_COUNTRY_LABEL);
      setLatitude(center[1]);
      setLongitude(center[0]);
      setViewState((prev) => ({
        ...prev,
        latitude: center[1],
        longitude: center[0],
        zoom: prev.zoom,
      }));
      mapRef.current?.flyTo({
        center: [center[0], center[1]],
        zoom: mapRef.current?.getZoom() ?? viewState.zoom,
        essential: true,
        duration: 900,
      });
      lastValidLocationRef.current = { latitude: center[1], longitude: center[0] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Location not found, please check the address";
      setMapError(message);
      if (message !== "Please select a location within the United States") {
        toast.error(message);
      } else {
        toast.error(message);
      }
      isUpdatingFromFieldsRef.current = false;
    } finally {
      if (requestId === forwardRequestIdRef.current) {
        setIsForwardLoading(false);
      }
      if (!appliedProgrammaticMove) {
        isUpdatingFromFieldsRef.current = false;
      }
    }
  };

  const handleCoordinatesChange = async (longitudeValue: number, latitudeValue: number) => {
    if (isUpdatingFromFieldsRef.current) return;
    await runReverseGeocode({ longitude: longitudeValue, latitude: latitudeValue });
  };

  const scheduleForwardGeocode = () => {
    if (!hasEnoughAddressData()) return;
    if (forwardDebounceRef.current) {
      clearTimeout(forwardDebounceRef.current);
    }

    forwardDebounceRef.current = setTimeout(() => {
      void runForwardGeocode();
    }, 650);
  };

  const runReverseGeocode = async (coords: { latitude: number; longitude: number }) => {
    if (!MAPBOX_TOKEN) {
      setMapError("Mapbox token is not configured.");
      return;
    }

    const requestId = ++reverseRequestIdRef.current;
    setIsReverseLoading(true);
    setMapError("");

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US&types=address,place,postcode,region`,
      );
      const data = await response.json();

      if (requestId !== reverseRequestIdRef.current) return;

      if (!response.ok) {
        throw new Error(data?.message || "Reverse geocoding request failed");
      }

      const feature = data?.features?.[0];
      if (!feature) {
        throw new Error("No address found for this location.");
      }

      const countryContext = feature.context?.find((item: any) => item.id?.startsWith("country"));
      const countryCode = countryContext?.short_code || countryContext?.shortCode;
      if (countryCode && String(countryCode).toUpperCase() !== "US") {
        throw new Error("Please select a location within the United States");
      }

      const context = feature.context || [];
      const placeFeature = context.find((item: any) => item.id?.startsWith("place"));
      const regionFeature = context.find((item: any) => item.id?.startsWith("region"));
      const postcodeFeature = context.find((item: any) => item.id?.startsWith("postcode"));

      const streetNumber = feature.address ? `${feature.address} ` : "";
      const streetName = feature.text || "";
      const parsedAddress = `${streetNumber}${streetName}`.trim() || feature.place_name?.split(",")?.[0] || "";
      const parsedCity = placeFeature?.text || "";
      const parsedState = formatState(regionFeature?.short_code?.replace(/^US-/, "") || regionFeature?.text || "");
      const parsedZip = postcodeFeature?.text || "";

      const payload: GeoAddress = {
        address: parsedAddress,
        city: parsedCity,
        state: parsedState || state,
        zipCode: parsedZip,
        country: US_COUNTRY_LABEL,
      };

      const safeState = payload.state && STATE_TO_LABEL[payload.state] ? payload.state : state;
      updateFromReverseGeocode(
        {
          ...payload,
          state: safeState,
        },
        coords,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reverse geocoding failed";
      setMapError(message);
      toast.error(message);
      setLatitude(lastValidLocationRef.current.latitude);
      setLongitude(lastValidLocationRef.current.longitude);
      setViewState((prev) => ({
        ...prev,
        latitude: lastValidLocationRef.current.latitude,
        longitude: lastValidLocationRef.current.longitude,
      }));
    } finally {
      if (requestId === reverseRequestIdRef.current) {
        setIsReverseLoading(false);
      }
    }
  };

  const scheduleReverseGeocode = (coords: { latitude: number; longitude: number }) => {
    if (isUpdatingFromFieldsRef.current) return;
    if (reverseDebounceRef.current) {
      clearTimeout(reverseDebounceRef.current);
    }

    reverseDebounceRef.current = setTimeout(() => {
      void handleCoordinatesChange(coords.longitude, coords.latitude);
    }, 400);
  };

  const getCitiesForState = (stateVal: string) => {
    const defaults: Record<string, string[]> = {
      CA: ["Los Angeles", "San Francisco", "San Diego"],
      NY: ["New York City", "Buffalo", "Rochester"],
      TX: ["Houston", "Austin", "Dallas"],
    };
    const list = defaults[stateVal] || ["Los Angeles", "New York City", "Houston"];
    if (city && !list.includes(city)) {
      return [city, ...list];
    }
    return list;
  };

  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#D3D3D3]" : "text-[#71717B]";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";

  useEffect(() => {
    if (!hasMountedRef.current) return;
    if (suppressForwardSyncRef.current) return;
    scheduleForwardGeocode();
  }, [address, city, state, zipCode]);

  useEffect(() => {
    if (!isUpdatingFromFieldsRef.current) return;
    const timer = setTimeout(() => {
      isUpdatingFromFieldsRef.current = false;
    }, 1000);
    return () => clearTimeout(timer);
  }, [latitude, longitude]);

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">
      <div className="space-y-5 lg:space-y-9">
        <div className="relative w-full md:w-[320px]">
          <DynamicCountrySelect
            value={selectedCountry}
            onlyUS={true}
            onChange={() => setSelectedCountry(US_COUNTRY_LABEL)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative md:col-span-2">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>Address*</span>
            </div>
          <Input
            value={address}
            autoComplete="street-address"
            onChange={(e) => {
              setAddress(sanitizeAddressText(e.target.value));
              setMapError("");
            }}
            inputMode="text"
            pattern="[A-Za-z0-9\s.,#'/-]*"
            onBlur={scheduleForwardGeocode}
            className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
          </div>

          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>Apartment, suite, etc.</span>
            </div>
          <Input
            value={apartment}
            autoComplete="address-line2"
            onChange={(e) => setApartment(sanitizeAddressText(e.target.value))}
            inputMode="text"
            pattern="[A-Za-z0-9\s.,#'/-]*"
            className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>City*</span>
            </div>
            <Select
              value={city}
              onValueChange={(val) => {
                setCity(val);
                setMapError("");
              }}
            >
              <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                {getCitiesForState(state).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>State*</span>
            </div>
            <Select
              value={state}
              onValueChange={(val) => {
                setState(val);
                const defaults: Record<string, string> = {
                  CA: "Los Angeles",
                  NY: "New York City",
                  TX: "Houston",
                };
                setCity(defaults[val] || "Los Angeles");
                setMapError("");
              }}
            >
              <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                {US_STATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm lg:text-base ${subTextColor}`}>ZIP code*</span>
            </div>
            <Input
              value={zipCode}
              inputMode="numeric"
              autoComplete="postal-code"
              onChange={(e) => {
                setZipCode(sanitizeZip(e.target.value, selectedCountry));
                setMapError("");
              }}
              pattern={selectedCountry === US_COUNTRY_LABEL ? "[0-9]{5}" : "[A-Za-z0-9\\s-]{1,12}"}
              maxLength={selectedCountry === US_COUNTRY_LABEL ? 5 : 12}
              onBlur={scheduleForwardGeocode}
              className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
            />
          </div>
        </div>
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      <section className="space-y-6">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium mb-1 ${textColor}`}>Do we have the right spot?</h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Move the map or drag the pin to adjust the pin placement. The new location will be saved automatically when you proceed to the next step.
          </p>
        </div>

        {mapError ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {mapError}
          </div>
        ) : null}

        <div className={`relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border ${borderColor} bg-[#111111]`}>
          {MAPBOX_TOKEN ? (
            <Map
              ref={mapRef}
              {...viewState}
              onMove={(evt) => {
                setViewState(evt.viewState);
                setMapError("");
              }}
              onMoveEnd={(evt) => {
                if (isUpdatingFromFieldsRef.current) {
                  return;
                }
                setViewState(evt.viewState);
              }}
              onClick={(evt) => {
                if (isUpdatingFromFieldsRef.current) return;
                const nextCoords = {
                  latitude: evt.lngLat.lat,
                  longitude: evt.lngLat.lng,
                };
                setViewState((prev) => ({
                  ...prev,
                  latitude: nextCoords.latitude,
                  longitude: nextCoords.longitude,
                }));
                setLatitude(nextCoords.latitude);
                setLongitude(nextCoords.longitude);
                scheduleReverseGeocode(nextCoords);
              }}
              style={{ width: "100%", height: "100%" }}
              mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v11"}
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <Marker
                longitude={longitude}
                latitude={latitude}
                anchor="bottom"
                draggable
                onDragEnd={(evt) => {
                  if (isUpdatingFromFieldsRef.current) return;
                  const nextCoords = {
                    latitude: evt.lngLat.lat,
                    longitude: evt.lngLat.lng,
                  };
                  setViewState((prev) => ({
                    ...prev,
                    latitude: nextCoords.latitude,
                    longitude: nextCoords.longitude,
                  }));
                  setLatitude(nextCoords.latitude);
                  setLongitude(nextCoords.longitude);
                  scheduleReverseGeocode(nextCoords);
                }}
              >
                <div className="flex flex-col items-center cursor-pointer select-none">
                  <div
                    className={`mb-2 font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xl relative text-left border whitespace-pre-line ${
                      isDark ? "bg-[#18181B] text-white border-zinc-800" : "bg-white text-black border-gray-100"
                    }`}
                  >
                    <div className="font-bold">{address || "845 S Los Angeles St"}{apartment ? `, ${apartment}` : ""}</div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? "text-white/70" : "text-black/70"}`}>
                      {city || "Los Angeles"}, {state || "CA"} {zipCode || "90014"}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>
                      {selectedCountry || US_COUNTRY_LABEL}
                    </div>
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${
                        isDark ? "border-t-[#18181B]" : "border-t-white"
                      }`}
                    />
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-12 h-12 rounded-full bg-[#E8D1AB]/30 animate-ping" />
                    <div className="absolute w-6 h-6 rounded-full bg-[#E8D1AB]/20 border border-[#E8D1AB]/40" />
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

          {isReverseLoading ? (
            <div className="absolute top-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
              Updating address...
            </div>
          ) : null}

          {isForwardLoading ? (
            <div className="absolute top-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
              Finding location...
            </div>
          ) : null}
        </div>
      </section>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}
