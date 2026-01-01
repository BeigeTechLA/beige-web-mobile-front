"use client";

import React, {
  useState,
  useCallback,
  useEffect
} from "react";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Search, X } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

/* -------------------------------- TYPES -------------------------------- */

export interface LocationPickerColors {
  inputBg: string;
  inputBorder: string;
  inputBorderHover: string;
  inputBorderFocus: string;
  labelText: string;
  placeholderText: string;
  primaryText: string;
  secondaryText: string;
  iconBg: string;
  iconBgHover: string;
  iconColor: string;
  iconColorHover: string;
  iconBgSelected: string;
  iconColorSelected: string;
  buttonPrimaryBg: string;
  buttonPrimaryBgHover: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryBgHover: string;
  buttonSecondaryText: string;
  accent: string;
  accentHover: string;
  paperBg: string;
  divider: string;
  searchResultHover: string;
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  colors?: Partial<LocationPickerColors>;
}

/* ----------------------------- DEFAULT COLORS ----------------------------- */

const defaultColors: LocationPickerColors = {
  inputBg: "#101010",
  inputBorder: "rgba(255,255,255,0.2)",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "rgba(255,255,255,0.6)",
  placeholderText: "rgba(255,255,255,0.3)",
  primaryText: "#FFFFFF",
  secondaryText: "rgba(255,255,255,0.4)",
  iconBg: "#1A1A1A",
  iconBgHover: "rgba(232,209,171,0.1)",
  iconColor: "rgba(255,255,255,0.4)",
  iconColorHover: "#E8D1AB",
  iconBgSelected: "rgba(232,209,171,0.2)",
  iconColorSelected: "#E8D1AB",
  buttonPrimaryBg: "#E8D1AB",
  buttonPrimaryBgHover: "#dcb98a",
  buttonPrimaryText: "#000",
  buttonSecondaryBg: "transparent",
  buttonSecondaryBgHover: "rgba(255,255,255,0.05)",
  buttonSecondaryText: "#FFF",
  accent: "#E8D1AB",
  accentHover: "#dcb98a",
  paperBg: "#1A1A1A",
  divider: "rgba(255,255,255,0.1)",
  searchResultHover: "rgba(255,255,255,0.05)"
};

/* ============================ COMPONENT ============================ */

export const LocationPickerSignup: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Select location on map",
  colors: customColors
}) => {
  const colors = { ...defaultColors, ...customColors };

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [viewState, setViewState] = useState({
    latitude: 34.0522,
    longitude: -118.2437,
    zoom: 10
  });

  const [marker, setMarker] = useState<LocationData | null>(null);

  const isValidToken =
    MAPBOX_TOKEN &&
    !MAPBOX_TOKEN.includes("replace_with") &&
    MAPBOX_TOKEN.length > 20;

  /* ---------------------------- MAP CLICK ---------------------------- */

  const handleMapClick = useCallback(
    (event: any) => {
      const { lngLat } = event;
      const baseLocation: LocationData = {
        lat: lngLat.lat,
        lng: lngLat.lng,
        address: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`
      };

      setMarker(baseLocation);

      if (!isValidToken) return;

      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${MAPBOX_TOKEN}`
      )
        .then(res => res.json())
        .then(data => {
          if (data.features?.length) {
            setMarker({
              ...baseLocation,
              address: data.features[0].place_name
            });
          }
        })
        .catch(() => {});
    },
    [isValidToken]
  );

  /* ---------------------------- SEARCH API ---------------------------- */

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !isValidToken) return;

    setIsSearching(true);

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch {
      setSearchResults([]);
    }

    setIsSearching(false);
  }, [searchQuery, isValidToken]);

  /* -------------------- AUTO SEARCH (DEBOUNCED) -------------------- */

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, handleSearch]);

  /* -------------------------- SELECT RESULT -------------------------- */

  const selectSearchResult = (result: any) => {
    const [lng, lat] = result.center;

    setMarker({
      lat,
      lng,
      address: result.place_name
    });

    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 14
    }));

    setSearchResults([]);
    setSearchQuery(result.place_name);
  };

  /* ------------------------- CLEAR / CONFIRM ------------------------- */

  const clearSelection = () => {
    setMarker(null);
    setSearchQuery("");
    onChange("");
  };

  const confirmLocation = () => {
    if (marker) {
      onChange(marker.address);
      setIsExpanded(false);
    }
  };

  /* ======================== COLLAPSED VIEW ======================== */

  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
        className="relative w-full h-[82px] rounded-xl border cursor-pointer"
      >
        <label
          style={{ color: colors.labelText, backgroundColor: colors.inputBg }}
          className="absolute -top-3 left-4 px-2 text-sm"
        >
          Location
        </label>

        <div className="flex items-center gap-3 h-full px-4">
          <MapPin size={20} color={colors.iconColorSelected} />
          <div className="flex-1 truncate">
            {value || placeholder}
          </div>
          {value && (
            <button onClick={clearSelection}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ======================== EXPANDED VIEW ======================== */

  return (
    <div className="w-full border rounded-xl overflow-hidden">

      {/* SEARCH BAR */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="w-full h-11 pl-9 pr-3 rounded-lg bg-black text-white"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map(r => (
              <button
                key={r.id}
                onClick={() => selectSearchResult(r)}
                className="w-full text-left px-4 py-3 hover:bg-white/5"
              >
                <div className="text-sm">{r.text}</div>
                <div className="text-xs opacity-60">{r.place_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="h-72">
        {isValidToken ? (
          <Map
            {...viewState}
            onMove={e => setViewState(e.viewState)}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="top-right" showCompass={false} />

            <GeolocateControl
              position="top-right"
              onGeolocate={(pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                const baseLocation = {
                  lat,
                  lng,
                  address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                };

                setMarker(baseLocation);
                setViewState(v => ({
                  ...v,
                  latitude: lat,
                  longitude: lng,
                  zoom: 14
                }));

                fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
                )
                  .then(r => r.json())
                  .then(d => {
                    if (d.features?.length) {
                      setMarker({
                        ...baseLocation,
                        address: d.features[0].place_name
                      });
                    }
                  });
              }}
            />

            {marker && (
              <Marker latitude={marker.lat} longitude={marker.lng}>
                <MapPin size={22} color="#E8D1AB" />
              </Marker>
            )}
          </Map>
        ) : (
          <div className="h-full flex items-center justify-center text-xs opacity-60">
            Mapbox token missing
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 flex justify-between items-center">
        <div className="text-xs truncate">
          {marker ? marker.address : "No location selected"}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsExpanded(false)}>Cancel</button>
          <button
            disabled={!marker}
            onClick={confirmLocation}
            className="px-4 py-2 bg-[#E8D1AB] text-black rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
