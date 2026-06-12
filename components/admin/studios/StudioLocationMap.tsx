"use client";

import React, { useEffect, useMemo, useState } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type StudioLocationMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  isDark?: boolean;
  draggable?: boolean;
  onLocationChange?: (latitude: number, longitude: number) => void;
  className?: string;
};

const DEFAULT_LATITUDE = 34.0401;
const DEFAULT_LONGITUDE = -118.2542;

export default function StudioLocationMap({
  latitude,
  longitude,
  isDark = true,
  draggable = false,
  onLocationChange,
  className = "",
}: StudioLocationMapProps) {
  const resolvedLatitude = Number.isFinite(Number(latitude))
    ? Number(latitude)
    : DEFAULT_LATITUDE;
  const resolvedLongitude = Number.isFinite(Number(longitude))
    ? Number(longitude)
    : DEFAULT_LONGITUDE;

  const [viewState, setViewState] = useState({
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
    zoom: 13.5,
  });

  useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
    }));
  }, [resolvedLatitude, resolvedLongitude]);

  const mapStyle = useMemo(
    () => (isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"),
    [isDark],
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-2xl border border-dashed ${isDark ? "border-white/10 text-white/50" : "border-black/10 text-black/40"} ${className}`}
      >
        Mapbox token is missing
      </div>
    );
  }

  return (
    <Map
      latitude={viewState.latitude}
      longitude={viewState.longitude}
      zoom={viewState.zoom}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle={mapStyle}
      mapboxAccessToken={MAPBOX_TOKEN}
      className={`h-full w-full ${className}`}
      dragRotate={false}
      onClick={(evt) => {
        if (!draggable || !onLocationChange) return;
        const nextLatitude = evt.lngLat.lat;
        const nextLongitude = evt.lngLat.lng;
        onLocationChange(nextLatitude, nextLongitude);
        setViewState((prev) => ({
          ...prev,
          latitude: nextLatitude,
          longitude: nextLongitude,
        }));
      }}
    >
      <Marker
        latitude={viewState.latitude}
        longitude={viewState.longitude}
        draggable={draggable}
        onDragEnd={(evt) => {
          if (!onLocationChange) return;
          const nextLatitude = evt.lngLat.lat;
          const nextLongitude = evt.lngLat.lng;
          onLocationChange(nextLatitude, nextLongitude);
          setViewState((prev) => ({
            ...prev,
            latitude: nextLatitude,
            longitude: nextLongitude,
          }));
        }}
      >
        <div
          className={`h-4 w-4 rounded-full border-2 ${isDark ? "border-[#E8D1AB] bg-[#101010] shadow-[0_0_0_6px_rgba(232,209,171,0.15)]" : "border-[#101010] bg-[#E8D1AB] shadow-[0_0_0_6px_rgba(16,16,16,0.12)]"}`}
        />
      </Marker>
    </Map>
  );
}
