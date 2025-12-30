"use client";

import React, { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Search, X } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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

// Updated defaults to match your Dark/Gold theme perfectly
const defaultColors: LocationPickerColors = {
  inputBg: "#101010",
  inputBorder: "rgba(255, 255, 255, 0.2)",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "rgba(255, 255, 255, 0.6)",
  placeholderText: "rgba(255, 255, 255, 0.3)",
  primaryText: "#FFFFFF",
  secondaryText: "rgba(255, 255, 255, 0.4)",
  iconBg: "#1A1A1A",
  iconBgHover: "rgba(232, 209, 171, 0.1)",
  iconColor: "rgba(255, 255, 255, 0.4)",
  iconColorHover: "#E8D1AB",
  iconBgSelected: "rgba(232, 209, 171, 0.2)",
  iconColorSelected: "#E8D1AB",
  buttonPrimaryBg: "#E8D1AB",
  buttonPrimaryBgHover: "#dcb98a",
  buttonPrimaryText: "#000000",
  buttonSecondaryBg: "transparent",
  buttonSecondaryBgHover: "rgba(255, 255, 255, 0.05)",
  buttonSecondaryText: "#FFFFFF",
  accent: "#E8D1AB",
  accentHover: "#dcb98a",
  paperBg: "#1A1A1A",
  divider: "rgba(255, 255, 255, 0.1)",
  searchResultHover: "rgba(255, 255, 255, 0.05)",
};

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

export const LocationPickerSignup: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Select location on map",
  colors: customColors
}) => {
  const colors = { ...defaultColors, ...customColors };
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [viewState, setViewState] = useState({
    latitude: 34.0522,
    longitude: -118.2437,
    zoom: 10
  });

  const [marker, setMarker] = useState<LocationData | null>(null);

  const isValidToken = MAPBOX_TOKEN && !MAPBOX_TOKEN.includes("replace_with_your_token") && MAPBOX_TOKEN.length > 20;

  const handleMapClick = useCallback((event: any) => {
    const { lngLat } = event;
    const newLocation: LocationData = {
      lat: lngLat.lat,
      lng: lngLat.lng,
      address: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`
    };
    setMarker(newLocation);

    if (isValidToken) {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${MAPBOX_TOKEN}`)
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const address = data.features[0].place_name;
            const updatedLocation = { ...newLocation, address };
            setMarker(updatedLocation);
          }
        })
        .catch(() => { });
    }
  }, [isValidToken]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !isValidToken) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  }, [searchQuery, isValidToken]);

  const selectSearchResult = useCallback((result: any) => {
    const [lng, lat] = result.center;
    const newLocation: LocationData = {
      lat,
      lng,
      address: result.place_name
    };

    setMarker(newLocation);
    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 14
    }));
    setSearchResults([]);
    setSearchQuery(result.place_name);
  }, []);

  const clearSelection = useCallback(() => {
    setMarker(null);
    setSearchQuery('');
    onChange('');
  }, [onChange]);

  const confirmLocation = useCallback(() => {
    if (marker) {
      onChange(marker.address);
      setIsExpanded(false);
    }
  }, [marker, onChange]);

  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder
        }}
        className="relative w-full h-[82px] rounded-[12px] border cursor-pointer transition-all group"
        onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.inputBorderHover}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.inputBorder}
      >
        <label
          style={{ backgroundColor: colors.inputBg, color: colors.labelText }}
          className="absolute -top-3 left-4 px-2 text-sm lg:text-base pointer-events-none z-10"
        >
          Location
        </label>
        <div className="flex items-center gap-3 h-full px-4">
          <div
            style={{ 
              backgroundColor: value ? colors.iconBgSelected : colors.iconBg,
              //@ts-ignore
              '--hover-bg': colors.iconBgHover 
            }}
            className="p-2.5 rounded-xl transition-colors group-hover:bg-[var(--hover-bg)]"
          >
            <MapPin
              size={20}
              style={{ 
                color: value ? colors.iconColorSelected : colors.iconColor,
                //@ts-ignore
                '--hover-text': colors.iconColorHover 
              }}
              className="group-hover:text-[var(--hover-text)]"
            />
          </div>
          <div className="flex-1 min-w-0">
            {value ? (
              <>
                <p style={{ color: colors.primaryText }} className="text-sm lg:text-base font-medium truncate">{value}</p>
                <p style={{ color: colors.secondaryText }} className="text-xs">Click to change location</p>
              </>
            ) : (
              <>
                <p style={{ color: colors.secondaryText }} className="text-sm lg:text-base">{placeholder}</p>
                <p style={{ color: colors.secondaryText, opacity: 0.6 }} className="text-xs">Click to open map</p>
              </>
            )}
          </div>
          {value && (
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="p-1.5 rounded-full transition-colors hover:bg-white/10"
            >
              <X size={18} style={{ color: colors.secondaryText }} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderColor: colors.divider, backgroundColor: colors.paperBg }} className="w-full border rounded-xl overflow-hidden shadow-2xl">
      {/* Search Bar */}
      <div style={{ borderColor: colors.divider, backgroundColor: colors.inputBg }} className="p-4 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} style={{ color: colors.secondaryText }} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              style={{
                backgroundColor: colors.paperBg,
                borderColor: colors.divider,
                color: colors.primaryText
              }}
              className="w-full h-11 pl-9 pr-3 border rounded-lg outline-none focus:border-[#E8D1AB]"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              backgroundColor: colors.buttonPrimaryBg,
              color: colors.buttonPrimaryText
            }}
            className="px-5 h-11 rounded-lg font-semibold transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ backgroundColor: colors.paperBg, borderColor: colors.divider }} className="mt-2 border rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => selectSearchResult(result)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.searchResultHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                style={{ borderBottomColor: colors.divider }}
                className="w-full text-left px-4 py-3 border-b last:border-0 transition-colors"
              >
                <p style={{ color: colors.primaryText }} className="text-sm font-medium truncate">{result.text}</p>
                <p style={{ color: colors.secondaryText }} className="text-xs truncate">{result.place_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="h-72 relative">
        {isValidToken ? (
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/dark-v11" // Dark theme map
            mapboxAccessToken={MAPBOX_TOKEN}
            cursor="crosshair"
          >
            <NavigationControl position="top-right" showCompass={false} />
            <GeolocateControl position="top-right" />

            {marker && (
              <Marker latitude={marker.lat} longitude={marker.lng}>
                <div className="relative">
                  <div style={{ backgroundColor: colors.accent }} className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping opacity-30" />
                  <div style={{ backgroundColor: colors.accent, borderColor: "#000" }} className="relative p-1.5 rounded-full shadow-lg border-2">
                    <MapPin size={16} color="#000" />
                  </div>
                </div>
              </Marker>
            )}
          </Map>
        ) : (
          <div style={{ backgroundColor: colors.iconBg, color: colors.secondaryText }} className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <MapPin size={32} className="mb-2 opacity-20" />
            <p className="text-sm">Map access required</p>
            <p className="text-[10px] mt-1 opacity-50 max-w-[200px]">Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file</p>
          </div>
        )}

        {isValidToken && !marker && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            Click map to pin location
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderColor: colors.divider, backgroundColor: colors.inputBg }} className="p-4 border-t flex items-center justify-between gap-4">
        <div style={{ color: colors.secondaryText }} className="flex items-center gap-2 text-sm flex-1 min-w-0">
          <MapPin size={14} className={marker ? "text-[#E8D1AB]" : "opacity-30"} />
          <span className="truncate">{marker ? marker.address : "No location selected"}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            style={{ color: colors.buttonSecondaryText }}
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmLocation}
            disabled={!marker}
            style={{
              backgroundColor: colors.accent,
              color: colors.buttonPrimaryText
            }}
            className="px-5 py-2 text-sm font-bold rounded-lg transition-transform active:scale-95 disabled:opacity-30"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};