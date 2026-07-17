"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Search, X } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export const darkThemeColors = {
  inputBg: "#101010",
  inputBorder: "#ffffff4d",
  inputBorderHover: "#ffffff99",
  labelText: "#ffffff99",
  primaryText: "#FFFFFF",
  secondaryText: "#ffffff99",
  paperBg: "#1A1A1A",
  divider: "#ffffff1a",
  accent: "#E8D1AB",
  accentHover: "#dcb98a",
  buttonPrimaryText: "#1A1A1A",
  buttonPrimaryBg: "#E8D1AB",
  buttonPrimaryBgHover: "#dcb98a",
  buttonSecondaryText: "#fff",
  buttonSecondaryBg: "#ffffff4d",
  buttonSecondaryBgHover: "#ffffff4d",
};

export const lightThemeColors = {
  inputBg: "#FFFFFF",
  inputBorder: "#00000026",
  inputBorderHover: "#0000004d",
  labelText: "#00000099",
  primaryText: "#171717",
  secondaryText: "#00000080",
  paperBg: "#F9F9F9",
  divider: "#0000001a",
  accent: "#E8D1AB",
  accentHover: "#dcb98a",
  buttonPrimaryText: "#171717",
  buttonPrimaryBg: "#E8D1AB",
  buttonPrimaryBgHover: "#dcb98a",
  buttonSecondaryText: "#171717",
  buttonSecondaryBg: "#0000000d",
  buttonSecondaryBgHover: "#0000001a",
};

export interface LocationPickerColors {
  inputBg: string;
  inputBorder: string;
  inputBorderHover: string;
  inputBorderFocus: string;
  labelText: string;
  errorText: string;
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
  labelText: "#00000099",
  errorText: "#fc8181",
  placeholderText: "#666666",
  primaryText: "#1A1A1A",
  secondaryText: "#666666",
  iconBg: "#F5F5F5",
  iconBgHover: "rgba(232, 209, 171, 0.3)",
  iconColor: "#666666",
  iconColorHover: "#C58213",
  iconBgSelected: "#DCFCE7",
  iconColorSelected: "#16A34A",
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
  onChange: (address: string, details?: any) => void;
  placeholder?: string;
  label?: string;
  colors?: Partial<LocationPickerColors>;
  hasError?: boolean;
  disabled?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Select location on map",
  label = "Select Location",
  colors: customColors,
  hasError = false,
  disabled = false
}) => {
  const colors = { ...defaultColors, ...customColors };
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isQueryFromSelection, setIsQueryFromSelection] = useState(false);

  // Structural DOM reference anchor wrapper frame
  const expandedCardRef = useRef<HTMLDivElement>(null);

  const [viewState, setViewState] = useState({
    latitude: 34.0522,
    longitude: -118.2437,
    zoom: 10
  });

  const [marker, setMarker] = useState<LocationData | null>(null);

  const isValidToken = MAPBOX_TOKEN && !MAPBOX_TOKEN.includes("replace_with_your_token") && MAPBOX_TOKEN.length > 20;

  /**
   * Helper function to get current position and update map
   */
  const syncLocation = useCallback(() => {
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
          console.warn("Location access not yet granted or blocked.");
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  /**
   * EFFECT: Handle initial location and permission changes
   */
  useEffect(() => {
    // 1. Try to get location immediately (triggers browser prompt)
    syncLocation();

    // 2. Watch for permission changes (When user clicks 'Allow' without refresh)
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        // If they click 'Allow', the 'onchange' event fires instantly
        result.onchange = () => {
          if (result.state === 'granted') {
            syncLocation();
          }
        };
      });
    }
  }, [syncLocation]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !isValidToken || isQueryFromSelection) return;

    setIsSearching(true);
    try {
      const proximity = `${viewState.longitude},${viewState.latitude}`;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5&proximity=${proximity}`;

      const response = await fetch(url);
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  }, [searchQuery, isValidToken, viewState.latitude, viewState.longitude]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 3) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

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
            setSelectedFeature(data.features[0]); // Store the feature for context
          }
        })
        .catch(() => { });
    }
  }, [isValidToken]);

  const selectSearchResult = useCallback((result: any) => {
    const [lng, lat] = result.center;
    const newLocation: LocationData = {
      lat,
      lng,
      address: result.place_name
    };

    setMarker(newLocation);
    setSelectedFeature(result); // Store the full feature for context data
    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 14
    }));
    setSearchResults([]);
    setIsQueryFromSelection(true);
    setSearchQuery(result.place_name);
  }, []);

  const clearSelection = useCallback(() => {
    if (disabled) return;
    setMarker(null);
    setSearchQuery('');
    onChange('');
  }, [onChange, disabled]);

  // Store the selected feature for passing details
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const confirmLocation = useCallback(() => {
    if (marker) {
      const detailPayload = {
        ...(selectedFeature || {}),
        lat: marker.lat,
        lng: marker.lng,
        coordinates: {
          lat: marker.lat,
          lng: marker.lng
        }
      };
      onChange(marker.address, detailPayload);
      setIsExpanded(false);
    }
  }, [marker, onChange, selectedFeature]);

  // Handle visual shifts cleanly when mobile viewport triggers keyboard heights
  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      if (expandedCardRef.current) {
        expandedCardRef.current.scrollIntoView({
          block: "center",
          behavior: "smooth"
        });
      }
    }, 280);
  }, []);

  if (!isExpanded) {
    return (
      <div
        onClick={() => !disabled && setIsExpanded(true)}
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        className={`relative w-full h-[82px] rounded-[12px] border transition-all ${disabled ? '' : 'group'}`}
        onMouseEnter={(e) => !disabled && (e.currentTarget.style.borderColor = colors.inputBorderHover)}
        onMouseLeave={(e) => !disabled && (e.currentTarget.style.borderColor = colors.inputBorder)}
      >
        <label
          style={{ backgroundColor: colors.inputBg, color: hasError ? colors.errorText : colors.labelText }}
          className="absolute -top-3 left-4 px-2 text-base transition-colors duration-300"
        >
          {label}
        </label>
        <div className="flex items-center gap-3 h-full px-4">
          <div
            style={{
              backgroundColor: value ? colors.iconBgSelected : colors.iconBg,
              //@ts-ignore
              '--hover-bg': colors.iconBgHover
            } as any}
            className={`p-2 rounded-lg transition-colors ${!value ? 'group-hover:bg-[var(--hover-bg)]' : ''}`}
          >
            <MapPin
              size={18}
              style={{
                color: value ? colors.iconColorSelected : colors.iconColor,
                //@ts-ignore
                '--hover-text': colors.iconColorHover
              } as any}
              className={!value ? 'group-hover:text-[var(--hover-text)]' : ''}
            />
          </div>
          <div className="flex-1 min-w-0">
            {value ? (
              <>
                <p style={{ color: colors.primaryText }} className="text-sm font-medium truncate">{value}</p>
                {!disabled && <p style={{ color: colors.secondaryText }} className="text-xs">Click to change location</p>}
              </>
            ) : (
              <>
                <p style={{ color: colors.secondaryText }} className="text-sm">{placeholder}</p>
                <p style={{ color: colors.secondaryText, opacity: 0.7 }} className="text-xs">Click to open map</p>
              </>
            )}
          </div>
          {value && !disabled && (
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
    <div
      ref={expandedCardRef}
      style={{ borderColor: colors.divider, backgroundColor: colors.paperBg }}
      className="w-full border rounded-xl overflow-hidden shadow-lg transition-all"
    >
      {/* Search Bar */}
      <div style={{ borderColor: colors.divider, backgroundColor: colors.inputBg }} className="p-3 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} style={{ color: colors.secondaryText }} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsQueryFromSelection(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search Your Location..."
              style={{
                backgroundColor: colors.paperBg,
                borderColor: colors.divider,
                color: colors.primaryText
              }}
              // onFocus={(e) => e.target.style.borderColor = colors.inputBorderFocus}
              // onBlur={(e) => e.target.style.borderColor = colors.divider}
              className="w-full h-10 pl-9 pr-3 border rounded-lg outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              backgroundColor: colors.accent,
              color: colors.buttonPrimaryText
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent}
            className="px-4 h-10 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div
            style={{ backgroundColor: colors.paperBg, borderColor: colors.divider }}
            className="mt-2 border rounded-lg shadow-sm max-h-40 overflow-y-auto no-scrollbar"
          >
            <style jsx>{`
              .group .result-title {
                color: var(--text-normal);
              }

              .group .result-subtitle {
                color: var(--text-secondary);
              }

              .group:hover .result-title,
              .group:hover .result-subtitle {
                color: var(--text-hover);
              }
            `}</style>
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => selectSearchResult(result)}
                style={{
                  borderBottomColor: colors.divider,
                  '--bg-hover': colors.searchResultHover,
                  '--text-normal': colors.primaryText,
                  '--text-secondary': colors.secondaryText,
                  '--text-hover': colors.buttonPrimaryText,
                } as React.CSSProperties}
                className="group w-full text-left px-3 py-2 border-b last:border-0 transition-colors hover:bg-[var(--bg-hover)]"
              >
                <p className="result-title text-sm font-medium truncate transition-colors">
                  {result.text}
                </p>
                <p className="result-subtitle text-xs truncate transition-colors">
                  {result.place_name}
                </p>
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
            <GeolocateControl
              position="top-right"
              trackUserLocation={true}
              showUserLocation={true}
              onGeolocate={(e: any) => {
                setViewState(prev => ({
                  ...prev,
                  latitude: e.coords.latitude,
                  longitude: e.coords.longitude,
                  zoom: 14
                }));
              }}
            />

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
        <div className="flex flex-col lg:flex-row gap-2 mt-2 lg:mt-0">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            style={{
              color: colors.buttonSecondaryText,
              backgroundColor: colors.buttonSecondaryBg
            }}
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
              color: colors.buttonPrimaryText
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