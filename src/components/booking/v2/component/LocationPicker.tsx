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

const defaultColors: LocationPickerColors = {
  inputBg: "#FAFAFA",
  inputBorder: "#E5E5E5",
  inputBorderHover: "#1A1A1A",
  inputBorderFocus: "#1A1A1A",
  labelText: "#00000099", // #000/60
  placeholderText: "#666666",
  primaryText: "#1A1A1A",
  secondaryText: "#666666",
  iconBg: "#F5F5F5",
  iconBgHover: "rgba(232, 209, 171, 0.3)", // #E8D1AB/30
  iconColor: "#666666",
  iconColorHover: "#C58213",
  iconBgSelected: "#DCFCE7", // green-100
  iconColorSelected: "#16A34A", // green-600
  buttonPrimaryBg: "#1A1A1A",
  buttonPrimaryBgHover: "#333333",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondaryBg: "transparent",
  buttonSecondaryBgHover: "#E5E5E5",
  buttonSecondaryText: "#1A1A1A",
  accent: "#E8D1AB",
  accentHover: "#dcb98a",
  paperBg: "#FFFFFF",
  divider: "#E5E5E5",
  searchResultHover: "#F5F5F5",
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

export const LocationPicker: React.FC<LocationPickerProps> = ({
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
          className="absolute -top-3 left-4 px-2 text-base"
        >
          Location
        </label>
        <div className="flex items-center gap-3 h-full px-4">
          <div
            style={{ backgroundColor: value ? colors.iconBgSelected : colors.iconBg }}
            className={`p-2 rounded-lg transition-colors ${!value ? 'group-hover:bg-[var(--hover-bg)]' : ''}`}
            // Using a CSS variable hack to pass the dynamic color to the group-hover logic since we are preserving the Tailwind class structure
            //@ts-ignore
            style={{ '--hover-bg': colors.iconBgHover, backgroundColor: value ? colors.iconBgSelected : colors.iconBg }}
          >
            <MapPin
              size={18}
              style={{ color: value ? colors.iconColorSelected : colors.iconColor }}
              className={!value ? 'group-hover:text-[var(--hover-text)]' : ''}
              //@ts-ignore
              style={{ '--hover-text': colors.iconColorHover, color: value ? colors.iconColorSelected : colors.iconColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            {value ? (
              <>
                <p style={{ color: colors.primaryText }} className="text-sm font-medium truncate">{value}</p>
                <p style={{ color: colors.secondaryText }} className="text-xs">Click to change location</p>
              </>
            ) : (
              <>
                <p style={{ color: colors.secondaryText }} className="text-sm">{placeholder}</p>
                <p style={{ color: colors.secondaryText, opacity: 0.7 }} className="text-xs">Click to open map</p>
              </>
            )}
          </div>
          {value && (
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.buttonSecondaryBgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              className="p-1 rounded-full transition-colors"
            >
              <X size={16} style={{ color: colors.secondaryText }} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderColor: colors.divider, backgroundColor: colors.paperBg }} className="w-full border rounded-xl overflow-hidden shadow-lg">
      {/* Search Bar */}
      <div style={{ borderColor: colors.divider, backgroundColor: colors.inputBg }} className="p-3 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} style={{ color: colors.secondaryText }} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              style={{
                backgroundColor: colors.paperBg,
                borderColor: colors.divider,
                color: colors.primaryText
              }}
              onFocus={(e) => e.target.style.borderColor = colors.inputBorderFocus}
              onBlur={(e) => e.target.style.borderColor = colors.divider}
              className="w-full h-10 pl-9 pr-3 border rounded-lg outline-none"
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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.buttonPrimaryBgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.buttonPrimaryBg}
            className="px-4 h-10 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ backgroundColor: colors.paperBg, borderColor: colors.divider }} className="mt-2 border rounded-lg shadow-sm max-h-40 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => selectSearchResult(result)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.searchResultHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                style={{ borderBottomColor: colors.divider }}
                className="w-full text-left px-3 py-2 border-b last:border-0 transition-colors"
              >
                <p style={{ color: colors.primaryText }} className="text-sm font-medium truncate">{result.text}</p>
                <p style={{ color: colors.secondaryText }} className="text-xs truncate">{result.place_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="h-64 relative">
        {isValidToken ? (
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            cursor="crosshair"
          >
            <NavigationControl position="top-right" showCompass={false} />
            <GeolocateControl position="top-right" />

            {marker && (
              <Marker latitude={marker.lat} longitude={marker.lng}>
                <div className="relative">
                  <div style={{ backgroundColor: colors.accent }} className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping opacity-30" />
                  <div style={{ backgroundColor: colors.accent, borderColor: colors.paperBg }} className="relative p-1.5 rounded-full shadow-lg border-2">
                    <MapPin size={16} style={{ color: colors.primaryText }} />
                  </div>
                </div>
              </Marker>
            )}
          </Map>
        ) : (
          <div style={{ backgroundColor: colors.iconBg, color: colors.secondaryText }} className="w-full h-full flex flex-col items-center justify-center">
            <MapPin size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Map requires Mapbox token</p>
            <p className="text-xs mt-1 opacity-70">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env</p>
          </div>
        )}

        {isValidToken && !marker && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            Click on the map to drop a pin
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderColor: colors.divider, backgroundColor: colors.inputBg }} className="p-3 border-t flex flex-col lg:flex-row items-center justify-between">
        <div style={{ color: colors.secondaryText }} className="flex items-center gap-2 text-sm">
          {marker ? (
            <>
              <MapPin size={14} style={{ color: colors.iconColorSelected }} />
              <span className="truncate max-w-[200px]">{marker.address}</span>
            </>
          ) : (
            <span>No location selected</span>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            style={{ color: colors.buttonSecondaryText }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.buttonSecondaryBgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.buttonSecondaryBg}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmLocation}
            disabled={!marker}
            style={{
              backgroundColor: colors.accent,
              color: colors.buttonSecondaryText
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};