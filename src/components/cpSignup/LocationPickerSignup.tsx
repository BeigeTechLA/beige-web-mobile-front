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
  // Track if the dropdown should be allowed to open (only when typing)
  const [shouldShowDropdown, setShouldShowDropdown] = useState(false);

  // Default coordinates (Ahmedabad as fallback)
  const [viewState, setViewState] = useState({
    latitude: 23.0225,
    longitude: 72.5714,
    zoom: 12
  });

  const [marker, setMarker] = useState<LocationData | null>(null);

  const isValidToken =
    MAPBOX_TOKEN &&
    !MAPBOX_TOKEN.includes("replace_with") &&
    MAPBOX_TOKEN.length > 20;

  /* ---------------------- INITIAL LOCATION DETECTION ---------------------- */

  useEffect(() => {
    // Detect user's current location on mount to center the map and bias search
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            zoom: 12
          }));
        },
        (error) => {
          console.warn("Location permission denied. Using default view.");
        }
      );
    }
  }, []);

  /* ---------------------------- MAP CLICK ---------------------------- */

  const handleMapClick = useCallback(
    (event: any) => {
      const { lngLat } = event;
      
      // User is clicking map, so we hide the dropdown
      setShouldShowDropdown(false);
      setSearchResults([]);

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
            const newAddr = data.features[0].place_name;
            setMarker({
              ...baseLocation,
              address: newAddr
            });
            // Update the input field text without opening dropdown
            setSearchQuery(newAddr);
          }
        })
        .catch(() => {});
    },
    [isValidToken]
  );

  /* ---------------------------- SEARCH API ---------------------------- */

  const handleSearch = useCallback(async () => {
    // Only fetch if we are actually allowed to show the dropdown
    if (!searchQuery.trim() || !isValidToken || !shouldShowDropdown) return;

    setIsSearching(true);

    try {
      const proximity = `${viewState.longitude},${viewState.latitude}`;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5&proximity=${proximity}`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch {
      setSearchResults([]);
    }

    setIsSearching(false);
  }, [searchQuery, isValidToken, shouldShowDropdown, viewState.latitude, viewState.longitude]);

  /* -------------------- AUTO SEARCH (DEBOUNCED) -------------------- */

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // If we've been told not to show dropdown (map click/selection), stop here
    if (!shouldShowDropdown) {
      setSearchResults([]);
      return;
    }

    if (marker && searchQuery === marker.address) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, handleSearch, marker, shouldShowDropdown]);

  /* -------------------------- SELECT RESULT -------------------------- */

  const selectSearchResult = (result: any) => {
    const [lng, lat] = result.center;
    const selectedAddress = result.place_name;

    const newMarker = {
      lat,
      lng,
      address: selectedAddress
    };

    setMarker(newMarker);

    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 14
    }));

    // Explicitly close dropdown state
    setShouldShowDropdown(false);
    setSearchResults([]);
    setSearchQuery(selectedAddress);
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
          className="absolute -top-3 left-4 px-2 text-sm lg:text-base"
        >
          Location *
        </label>

        <div className="flex items-center gap-3 h-full px-4">
          <MapPin size={20} color={colors.iconColorSelected} />
          <div style={{ color: value ? colors.primaryText : colors.secondaryText }} className="flex-1 truncate">
            {value || placeholder}
          </div>
          {value && (
            <button onClick={(e) => { e.stopPropagation(); clearSelection(); }}>
              <X size={16} color={colors.secondaryText} />
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ======================== EXPANDED VIEW ======================== */

  return (
    <div style={{ backgroundColor: colors.paperBg, borderColor: colors.divider }} className="w-full border rounded-xl overflow-hidden shadow-2xl">

      {/* SEARCH BAR */}
      <div style={{ borderColor: colors.divider }} className="p-4 border-b">
        <div className="relative">
          <Search size={14} style={{ color: colors.secondaryText }} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              // When user types manually, we enable the dropdown
              setShouldShowDropdown(true);
            }}
            placeholder="Search Your location ..."
            style={{ backgroundColor: '#000', color: '#FFF', borderColor: colors.divider }}
            className="w-full h-11 pl-9 pr-3 rounded-lg border outline-none focus:border-[#E8D1AB] transition-colors"
          />
        </div>

        {shouldShowDropdown && searchResults.length > 0 && (
          <div style={{ borderColor: colors.divider, backgroundColor: colors.paperBg }} className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectSearchResult(r)}
                style={{ borderBottomColor: colors.divider }}
                className="w-full text-left px-4 py-3 border-b last:border-0 hover:bg-white/5 transition-colors"
              >
                <div style={{ color: colors.primaryText }} className="text-sm font-medium">{r.text}</div>
                <div style={{ color: colors.secondaryText }} className="text-xs opacity-60">{r.place_name}</div>
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
              trackUserLocation={true}
              onGeolocate={(pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                // Close dropdown on geolocate
                setShouldShowDropdown(false);

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
                      const addr = d.features[0].place_name;
                      setMarker({
                        ...baseLocation,
                        address: addr
                      });
                      setSearchQuery(addr);
                    }
                  });
              }}
            />

            {marker && (
              <Marker latitude={marker.lat} longitude={marker.lng}>
                <div className="relative">
                    <div style={{ backgroundColor: colors.accent }} className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping opacity-20" />
                    <MapPin size={24} color={colors.accent} />
                </div>
              </Marker>
            )}
          </Map>
        ) : (
          <div className="h-full flex items-center justify-center text-xs opacity-60">
            Mapbox token missing or invalid
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderColor: colors.divider }} className="p-4 border-t flex justify-between items-center bg-[#141414]">
        <div style={{ color: colors.secondaryText }} className="text-xs truncate max-w-[50%]">
          {marker ? marker.address : "No location selected"}
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            style={{ color: colors.buttonSecondaryText }}
            onClick={() => setIsExpanded(false)}
            className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!marker}
            onClick={confirmLocation}
            style={{
              backgroundColor: marker ? colors.buttonPrimaryBg : colors.divider,
              color: colors.buttonPrimaryText
            }}
            className="px-6 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};