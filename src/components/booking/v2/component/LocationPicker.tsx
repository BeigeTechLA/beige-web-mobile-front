"use client";

import React, { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Search, X } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Select location on map"
}) => {
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

  // Handle map click to place marker
  const handleMapClick = useCallback((event: any) => {
    const { lngLat } = event;
    const newLocation: LocationData = {
      lat: lngLat.lat,
      lng: lngLat.lng,
      address: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`
    };
    setMarker(newLocation);

    // Reverse geocode to get address
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
        .catch(() => {});
    }
  }, [isValidToken]);

  // Search for location
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

  // Select search result
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

  // Clear selection
  const clearSelection = useCallback(() => {
    setMarker(null);
    setSearchQuery('');
    onChange('');
  }, [onChange]);

  // Confirm and close
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
        className="relative w-full h-[82px] rounded-[12px] border border-[#E5E5E5] cursor-pointer hover:border-[#1A1A1A] transition-all group bg-[#FAFAFA]"
      >
        <label className="absolute -top-3 left-4 bg-[#FAFAFA] px-2 text-base text-[#000]/60">
          Location
        </label>
        <div className="flex items-center gap-3 h-full px-4">
          <div className={`p-2 rounded-lg ${value ? 'bg-green-100' : 'bg-[#F5F5F5] group-hover:bg-[#E8D1AB]/30'} transition-colors`}>
            <MapPin size={18} className={value ? 'text-green-600' : 'text-[#666] group-hover:text-[#C58213]'} />
          </div>
          <div className="flex-1 min-w-0">
            {value ? (
              <>
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{value}</p>
                <p className="text-xs text-[#666]">Click to change location</p>
              </>
            ) : (
              <>
                <p className="text-sm text-[#666]">{placeholder}</p>
                <p className="text-xs text-[#666]/70">Click to open map</p>
              </>
            )}
          </div>
          {value && (
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="p-1 hover:bg-[#E5E5E5] rounded-full transition-colors"
            >
              <X size={16} className="text-[#666]" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-[#E5E5E5] rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] w-4 h-4" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              className="w-full h-10 pl-9 pr-3 bg-white border border-[#E5E5E5] rounded-lg text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 h-10 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white border border-[#E5E5E5] rounded-lg shadow-sm max-h-40 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-3 py-2 hover:bg-[#F5F5F5] border-b border-[#E5E5E5] last:border-0 transition-colors"
              >
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{result.text}</p>
                <p className="text-xs text-[#666] truncate">{result.place_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
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
                  <div className="absolute -top-1 -left-1 w-6 h-6 bg-[#E8D1AB] rounded-full animate-ping opacity-30" />
                  <div className="relative bg-[#E8D1AB] p-1.5 rounded-full shadow-lg border-2 border-white">
                    <MapPin size={16} className="text-[#1A1A1A]" />
                  </div>
                </div>
              </Marker>
            )}
          </Map>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F5F5] text-[#666]">
            <MapPin size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Map requires Mapbox token</p>
            <p className="text-xs text-[#666]/70 mt-1">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env</p>
          </div>
        )}

        {/* Click instruction overlay */}
        {isValidToken && !marker && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            Click on the map to drop a pin
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#E5E5E5] bg-[#FAFAFA] flex flex-col lg:flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#666]">
          {marker ? (
            <>
              <MapPin size={14} className="text-green-600" />
              <span className="truncate max-w-[200px]">{marker.address}</span>
            </>
          ) : (
            <span className="text-[#666]">No location selected</span>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#E5E5E5] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmLocation}
            disabled={!marker}
            className="px-4 py-2 text-sm font-medium bg-[#E8D1AB] hover:bg-[#dcb98a] text-[#1A1A1A] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};
