"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import MapboxMap, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  CalendarDays,
  ChevronRight,
  Camera,
  Clock3,
  Loader2,
  MapPin,
  Search,
  Video,
  X,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import DatePicker from "@/components/ui/Datepicker";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { format as formatDateFns, startOfDay } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const DEFAULT_VIEW = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
};

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" } as const;

type GlobeStatus = "active" | "upcoming" | "completed" | "cancelled";
type GlobeStatusFilter = "all" | GlobeStatus;
type CrewFilter = "all" | "assigned" | "not_assigned";
type GlobalRange =
  | "upcoming"
  | "all"
  | "tbd"
  | "today"
  | "next_7_days"
  | "next_15_days"
  | "next_30_days"
  | "last_7_days"
  | "last_15_days"
  | "last_30_days"
  | "custom";

type GlobeShoot = {
  id: string;
  title: string;
  date: string;
  rawDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  hasCoordinates: boolean;
  isGeocoded?: boolean;
  status: GlobeStatus;
  assignedCrewCount: number;
  crew: Array<{ id: string; name: string; image?: string }>;
  equipment: string[];
  streamingPlatforms: string[];
  updatedAt?: string | null;
};

type ShootsGlobeViewProps = {
  isDark: boolean;
};

const isValidMapboxToken = Boolean(
  MAPBOX_TOKEN && !MAPBOX_TOKEN.includes("replace_with_your_token"),
);

const asNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const hasValidCoordinates = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) =>
  typeof latitude === "number" &&
  typeof longitude === "number" &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const getCoordinates = (project: any) => {
  const eventLocation =
    project?.event_location && typeof project.event_location === "object"
      ? project.event_location
      : null;
  const location =
    project?.location && typeof project.location === "object"
      ? project.location
      : null;
  const locationData =
    project?.location_data && typeof project.location_data === "object"
      ? project.location_data
      : null;

  const latitude = asNumber(
    project?.event_latitude,
    project?.location_latitude,
    project?.latitude,
    eventLocation?.lat,
    eventLocation?.latitude,
    eventLocation?.coordinates?.lat,
    eventLocation?.coordinates?.latitude,
    location?.lat,
    location?.latitude,
    location?.coordinates?.lat,
    location?.coordinates?.latitude,
    locationData?.lat,
    locationData?.latitude,
    locationData?.coordinates?.lat,
    locationData?.coordinates?.latitude,
  );

  const longitude = asNumber(
    project?.event_longitude,
    project?.location_longitude,
    project?.longitude,
    eventLocation?.lng,
    eventLocation?.lon,
    eventLocation?.longitude,
    eventLocation?.coordinates?.lng,
    eventLocation?.coordinates?.lon,
    eventLocation?.coordinates?.longitude,
    location?.lng,
    location?.lon,
    location?.longitude,
    location?.coordinates?.lng,
    location?.coordinates?.lon,
    location?.coordinates?.longitude,
    locationData?.lng,
    locationData?.lon,
    locationData?.longitude,
    locationData?.coordinates?.lng,
    locationData?.coordinates?.lon,
    locationData?.coordinates?.longitude,
  );

  return hasValidCoordinates(latitude, longitude)
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : null;
};

const getLocationLabel = (project: any) => {
  if (
    typeof project?.event_location === "string" &&
    project.event_location.trim()
  ) {
    return project.event_location.trim();
  }

  if (typeof project?.location === "string" && project.location.trim()) {
    return project.location.trim();
  }

  return String(
    project?.event_location?.address ||
      project?.event_location?.formatted_address ||
      project?.location?.address ||
      project?.location?.formatted_address ||
      project?.location_data?.address ||
      project?.location_data?.placeName ||
      "Location TBD",
  );
};

const getShootStatus = (project: any): GlobeStatus => {
  const status = String(
    project?.status || project?.project_status || project?.shoot_status || "",
  ).toLowerCase();

  if (
    Number(project?.is_cancelled) === 1 ||
    status.includes("cancel") ||
    status.includes("delete")
  ) {
    return "cancelled";
  }

  if (
    Number(project?.is_completed) === 1 ||
    status.includes("complete") ||
    status.includes("asset")
  ) {
    return "completed";
  }

  if (project?.event_date) {
    const eventDate = new Date(
      `${String(project.event_date).slice(0, 10)}T00:00:00`,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!Number.isNaN(eventDate.getTime()) && eventDate > today) {
      return "upcoming";
    }
  }

  return "active";
};

const statusConfig: Record<
  GlobeStatus,
  { label: string; marker: string; ring: string; badgeDark: string; badgeLight: string }
> = {
  active: {
    label: "Active Productions",
    marker: "bg-[#22C55E]",
    ring: "border-[#22C55E]",
    badgeDark: "border border-[#2F6848] bg-[#123A27] text-[#53D18B]",
    badgeLight: "border border-[#B9E7CD] bg-[#DCF7E8] text-[#1F8A53]",
  },
  upcoming: {
    label: "Upcoming Shoots",
    marker: "bg-[#60A5FA]",
    ring: "border-[#60A5FA]",
    badgeDark: "border border-[#355E84] bg-[#182532] text-[#78B9FF]",
    badgeLight: "border border-[#CFD8FF] bg-[#EEF2FF] text-[#4A5FD3]",
  },
  completed: {
    label: "Completed Shoots",
    marker: "bg-[#10B981]",
    ring: "border-[#10B981]",
    badgeDark: "border border-[#2F6848] bg-[#123A27] text-[#53D18B]",
    badgeLight: "border border-[#B9E7CD] bg-[#DCF7E8] text-[#1F8A53]",
  },
  cancelled: {
    label: "Cancelled Shoots",
    marker: "bg-[#F87171]",
    ring: "border-[#F87171]",
    badgeDark: "border border-[#704042] bg-[#3A2022] text-[#FF9292]",
    badgeLight: "border border-[#F4C0C0] bg-[#FFE8E8] text-[#D03434]",
  },
};

const formatDate = (value?: string | null) => {
  if (!value) return "Date TBD";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "Time TBD";
  const raw = String(value).trim();
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour24) || !Number.isFinite(minute)) return raw;
  return `${hour24 % 12 || 12}:${String(minute).padStart(2, "0")} ${
    hour24 >= 12 ? "PM" : "AM"
  }`;
};

const normalizeStringList = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item: any) =>
        typeof item === "string"
          ? item
          : item?.name ||
            item?.label ||
            item?.equipment_name ||
            item?.title ||
            "",
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeStringList(parsed);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const mapProjectToGlobeShoot = (item: any): GlobeShoot => {
  const project = item?.project || item;
  const coordinates = getCoordinates(project);

  const assignedCrew = Array.isArray(item?.assignedCrew)
    ? item.assignedCrew
    : Array.isArray(project?.assigned_crews)
      ? project.assigned_crews
      : [];

  const crew = assignedCrew.map((member: any, index: number) => ({
    id: String(member?.id || member?.crew_member_id || index),
    name: String(
      member?.name || member?.full_name || member?.crew_name || "Crew",
    ),
    image:
      member?.profile_image ||
      member?.profile_photo ||
      member?.avatar ||
      member?.image ||
      undefined,
  }));

  return {
    id: String(project?.stream_project_booking_id || project?.id || ""),
    title: String(
      project?.project_name ||
        project?.title ||
        project?.name ||
        "Untitled Shoot",
    ),
    date: formatDate(project?.event_date),
    rawDate: project?.event_date || null,
    startTime: project?.start_time || null,
    endTime: project?.end_time || null,
    location: getLocationLabel(project),
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    hasCoordinates: Boolean(coordinates),
    status: getShootStatus(project),
    assignedCrewCount: crew.length,
    crew,
    equipment: normalizeStringList(
      item?.assignedEquipment ||
        project?.assigned_equipment ||
        project?.equipment ||
        project?.equipment_assigned,
    ),
    streamingPlatforms: normalizeStringList(
      project?.streaming_platforms || project?.streamingPlatforms,
    ),
    updatedAt: project?.updated_at || project?.updatedAt || null,
  };
};

const calculateViewport = (events: GlobeShoot[]) => {
  const valid = events.filter(
    (event) =>
      event.hasCoordinates &&
      hasValidCoordinates(event.latitude, event.longitude),
  );

  if (!valid.length) return DEFAULT_VIEW;

  if (valid.length === 1) {
    return {
      latitude: Number(valid[0].latitude),
      longitude: Number(valid[0].longitude),
      zoom: 8,
      pitch: 0,
      bearing: 0,
    };
  }

  const lats = valid.map((event) => Number(event.latitude));
  const lngs = valid.map((event) => Number(event.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);

  let zoom = 3;
  if (maxDiff < 0.05) zoom = 11;
  else if (maxDiff < 0.2) zoom = 9;
  else if (maxDiff < 1) zoom = 8;
  else if (maxDiff < 5) zoom = 6;
  else if (maxDiff < 10) zoom = 5;
  else if (maxDiff < 20) zoom = 4;
  else if (maxDiff < 40) zoom = 3.5;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    zoom,
    pitch: 0,
    bearing: 0,
  };
};

export const ShootsGlobeView = ({ isDark }: ShootsGlobeViewProps) => {
  const router = useRouter();
  const initialZoomDone = useRef(false);
  const geocodeCache = useRef(
    new Map<
      string,
      { latitude: number; longitude: number; placeName: string } | null
    >(),
  );

  const mapRef = useRef<any>(null);
  const [dbEvents, setDbEvents] = useState<GlobeShoot[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GlobeStatusFilter>("all");
  const [crewFilter, setCrewFilter] = useState<CrewFilter>("all");
  const [range, setRange] = useState<GlobalRange>("upcoming");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [draftCustomRangeStartDate, setDraftCustomRangeStartDate] =
    useState<Date | null>(null);
  const [draftCustomRangeEndDate, setDraftCustomRangeEndDate] =
    useState<Date | null>(null);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GlobeShoot | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<GlobeStatus>>(
    () =>
      new Set<GlobeStatus>(["active", "upcoming", "completed", "cancelled"]),
  );
  const [highlightedLegend, setHighlightedLegend] =
    useState<GlobeStatus | null>(null);

  const geocodeAddress = useCallback(async (address: string) => {
    if (!address || address === "Location TBD" || !isValidMapboxToken)
      return null;

    const cacheKey = address.trim().toLowerCase();
    if (geocodeCache.current.has(cacheKey)) {
      return geocodeCache.current.get(cacheKey) || null;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address,
        )}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address,poi,place,locality,region`,
      );

      if (!response.ok) {
        throw new Error(
          `Mapbox geocoding failed with status ${response.status}`,
        );
      }

      const data = await response.json();
      const feature = Array.isArray(data?.features) ? data.features[0] : null;
      const center = Array.isArray(feature?.center) ? feature.center : null;

      if (!center || center.length < 2) {
        geocodeCache.current.set(cacheKey, null);
        return null;
      }

      const longitude = Number(center[0]);
      const latitude = Number(center[1]);

      if (!hasValidCoordinates(latitude, longitude)) {
        geocodeCache.current.set(cacheKey, null);
        return null;
      }

      const result = {
        latitude,
        longitude,
        placeName: String(feature?.place_name || address),
      };

      geocodeCache.current.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Globe View geocoding error:", address, error);
      geocodeCache.current.set(cacheKey, null);
      return null;
    }
  }, []);

  const moveMapTo = useCallback((viewport: typeof DEFAULT_VIEW, duration = 650) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    map.easeTo({
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      pitch: viewport.pitch,
      bearing: viewport.bearing,
      duration,
      essential: true,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadGlobalShoots = async () => {
      if (range === "custom" && (!customStartDate || !customEndDate)) {
        setEventsLoading(false);
        setGeocoding(false);
        return;
      }

      setEventsLoading(true);
      setSelectedEvent(null);
      initialZoomDone.current = false;

      try {
        const params =
          range === "custom"
            ? { start_date: customStartDate, end_date: customEndDate }
            : { range };

        const response = await adminApi.getGlobalShoots(params);
        if (cancelled) return;

        const projects =
          response?.error === false && Array.isArray(response?.data?.projects)
            ? response.data.projects
            : [];

        const transformedEvents = projects.map(mapProjectToGlobeShoot);

        // Same flow as the reference: store every project first.
        setDbEvents(transformedEvents);
        setEventsLoading(false);

        const eventsToGeocode = transformedEvents.filter(
          (event) =>
            !event.hasCoordinates &&
            Boolean(event.location) &&
            event.location !== "Location TBD",
        );

        if (!eventsToGeocode.length || !isValidMapboxToken) {
          setGeocoding(false);
          return;
        }

        setGeocoding(true);

        // Same as reference: geocode missing coordinates in the background,
        // then patch successful results into the existing event list.
        const results = await Promise.all(
          eventsToGeocode.map(async (event) => {
            const coordinates = await geocodeAddress(event.location);
            return coordinates ? { id: event.id, ...coordinates } : null;
          }),
        );

        if (cancelled) return;

        const successful = results.filter(
          (
            result,
          ): result is {
            id: string;
            latitude: number;
            longitude: number;
            placeName: string;
          } => Boolean(result),
        );

        if (successful.length) {
          const geocodedById = new Map(successful.map((item) => [item.id, item]));

          setDbEvents((previous) =>
            previous.map((event) => {
              const geocoded = geocodedById.get(event.id);
              if (!geocoded) return event;

              return {
                ...event,
                latitude: geocoded.latitude,
                longitude: geocoded.longitude,
                location: geocoded.placeName || event.location,
                hasCoordinates: true,
                isGeocoded: true,
              };
            }),
          );
        }
      } catch (error) {
        console.error("Failed to load global shoots:", error);
        if (!cancelled) {
          setDbEvents([]);
          setSelectedEvent(null);
          setEventsLoading(false);
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
          setGeocoding(false);
        }
      }
    };

    void loadGlobalShoots();

    return () => {
      cancelled = true;
    };
  }, [range, customStartDate, customEndDate, geocodeAddress]);

  const mappedEvents = useMemo(
    () =>
      dbEvents.filter(
        (event) =>
          event.hasCoordinates &&
          hasValidCoordinates(event.latitude, event.longitude),
      ),
    [dbEvents],
  );

  useEffect(() => {
    if (!mappedEvents.length || initialZoomDone.current) return;

    const frame = window.requestAnimationFrame(() => {
      moveMapTo(
        {
          latitude: 39.8283,
          longitude: -98.5795,
          zoom: 3,
          pitch: 0,
          bearing: 0,
        },
        500,
      );
      setSelectedEvent(null);
      initialZoomDone.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mappedEvents.length, moveMapTo]);

  const legendItems = useMemo(
    () =>
      (Object.keys(statusConfig) as GlobeStatus[]).map((status) => ({
        id: status,
        ...statusConfig[status],
        count: mappedEvents.filter((event) => event.status === status).length,
      })),
    [mappedEvents],
  );

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return dbEvents.filter((event) => {
      if (
        !event.hasCoordinates ||
        !hasValidCoordinates(event.latitude, event.longitude)
      ) {
        return false;
      }

      if (!activeFilters.has(event.status)) return false;

      if (statusFilter !== "all" && event.status !== statusFilter) return false;

      if (
        query &&
        !event.title.toLowerCase().includes(query) &&
        !event.location.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (crewFilter === "assigned" && event.assignedCrewCount <= 0)
        return false;
      if (crewFilter === "not_assigned" && event.assignedCrewCount > 0)
        return false;

      return true;
    });
  }, [dbEvents, searchQuery, statusFilter, crewFilter, activeFilters]);

  const zoomToLegendMarkers = useCallback(
    (status: GlobeStatus) => {
      const matchingEvents = mappedEvents.filter(
        (event) => event.status === status,
      );
      if (!matchingEvents.length) return;

      setHighlightedLegend(status);
      setActiveFilters((current) => {
        if (current.size === 1 && current.has(status)) {
          return new Set<GlobeStatus>([
            "active",
            "upcoming",
            "completed",
            "cancelled",
          ]);
        }
        return new Set<GlobeStatus>([status]);
      });
      moveMapTo(calculateViewport(matchingEvents));
      setSelectedEvent(matchingEvents.length === 1 ? matchingEvents[0] : null);

      window.setTimeout(() => setHighlightedLegend(null), 1200);
    },
    [mappedEvents, moveMapTo],
  );

  const selectAllFilters = useCallback(() => {
    setActiveFilters(
      new Set<GlobeStatus>(["active", "upcoming", "completed", "cancelled"]),
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters(new Set<GlobeStatus>());
  }, []);

  const handleMarkerClick = useCallback(
    (event: GlobeShoot) => {
      if (!hasValidCoordinates(event.latitude, event.longitude)) return;

      setSelectedEvent(event);
      moveMapTo({
        latitude: Number(event.latitude),
        longitude: Number(event.longitude),
        zoom: 11,
        pitch: 0,
        bearing: 0,
      });
    },
    [moveMapTo],
  );

  const closePopup = useCallback(() => {
    setSelectedEvent(null);
    moveMapTo(
      calculateViewport(filteredEvents.length ? filteredEvents : mappedEvents),
    );
  }, [filteredEvents, mappedEvents, moveMapTo]);

  const openCustomRangeDialog = useCallback(() => {
    setDraftCustomRangeStartDate(
      customStartDate ? new Date(`${customStartDate}T00:00:00`) : null,
    );
    setDraftCustomRangeEndDate(
      customEndDate ? new Date(`${customEndDate}T00:00:00`) : null,
    );
    setIsCustomRangeOpen(true);
  }, [customStartDate, customEndDate]);

  const handleRangeChange = useCallback(
    (value: GlobalRange) => {
      if (value === "custom") {
        setRange("custom");
        openCustomRangeDialog();
        return;
      }

      setRange(value);
      setCustomStartDate("");
      setCustomEndDate("");
      setDraftCustomRangeStartDate(null);
      setDraftCustomRangeEndDate(null);
      setIsCustomRangeOpen(false);
    },
    [openCustomRangeDialog],
  );

  const handleCustomRangeApply = useCallback(() => {
    if (!draftCustomRangeStartDate || !draftCustomRangeEndDate) {
      toast.error("Select both start and end dates for the custom range.");
      return;
    }

    const start = startOfDay(draftCustomRangeStartDate);
    const end = startOfDay(draftCustomRangeEndDate);

    if (start > end) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    setCustomStartDate(formatDateFns(start, "yyyy-MM-dd"));
    setCustomEndDate(formatDateFns(end, "yyyy-MM-dd"));
    setRange("custom");
    setIsCustomRangeOpen(false);
  }, [draftCustomRangeStartDate, draftCustomRangeEndDate]);

  const handleCustomRangeCancel = useCallback(() => {
    setIsCustomRangeOpen(false);
    setDraftCustomRangeStartDate(null);
    setDraftCustomRangeEndDate(null);

    if (!customStartDate && !customEndDate) {
      setRange("all");
    }
  }, [customStartDate, customEndDate]);

  const clearCustomRange = useCallback(() => {
    setIsCustomRangeOpen(false);
    setDraftCustomRangeStartDate(null);
    setDraftCustomRangeEndDate(null);
    setCustomStartDate("");
    setCustomEndDate("");
    setRange("all");
  }, []);

  const currentCustomRangeLabel =
    range === "custom" && customStartDate && customEndDate
      ? `${formatDateFns(new Date(`${customStartDate}T00:00:00`), "MMM dd, yyyy")} - ${formatDateFns(new Date(`${customEndDate}T00:00:00`), "MMM dd, yyyy")}`
      : "";

  const mapStyleUrl = isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  const mapFog = useMemo(
    () => ({
      color: isDark ? "rgb(19,19,19)" : "rgb(248,248,248)",
      "high-color": isDark ? "rgb(28,28,30)" : "rgb(226,232,240)",
      "horizon-blend": 0.08,
      "space-color": isDark ? "rgb(8,8,9)" : "rgb(246,247,249)",
      "star-intensity": isDark ? 0.55 : 0.15,
    }),
    [isDark],
  );

  return (
    <div
      className={`shoots-globe-view relative h-[calc(100vh-250px)] min-h-[640px] w-full overflow-hidden rounded-2xl border transition-colors duration-300 ${isDark ? "shoots-globe-dark" : "shoots-globe-light"} ${
        isDark
          ? "border-[#333333] bg-[#111111]"
          : "border-[#E5E5E5] bg-white"
      }`}
    >
      <style jsx global>{`
        .shoots-globe-view .mapboxgl-ctrl-group {
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
        }
        .shoots-globe-dark .mapboxgl-ctrl-group {
          background: #171717;
          border: 1px solid #333333;
        }
        .shoots-globe-dark .mapboxgl-ctrl-group button + button {
          border-top-color: #333333;
        }
        .shoots-globe-dark .mapboxgl-ctrl-icon {
          filter: invert(1) opacity(0.72);
        }
        .shoots-globe-light .mapboxgl-ctrl-group {
          background: #ffffff;
          border: 1px solid #e5e5e5;
        }
        .shoots-globe-light .mapboxgl-ctrl-group button + button {
          border-top-color: #e5e5e5;
        }
        .shoots-globe-light .mapboxgl-ctrl-icon {
          filter: none;
          opacity: 0.68;
        }
      `}</style>

      {isValidMapboxToken ? (
        <MapboxMap
          ref={mapRef}
          initialViewState={DEFAULT_VIEW}
          style={MAP_CONTAINER_STYLE}
          reuseMaps
          mapStyle={mapStyleUrl}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
          projection="globe"
          fog={mapFog}
          onClick={() => setSelectedEvent(null)}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          {filteredEvents.map((event) => {
            const colors = statusConfig[event.status];
            const isSelected = selectedEvent?.id === event.id;
            const isHighlighted = highlightedLegend === event.status;

            return (
              <Marker
                key={event.id}
                latitude={Number(event.latitude)}
                longitude={Number(event.longitude)}
                anchor="center"
                onClick={(markerEvent) => {
                  markerEvent.originalEvent.stopPropagation();
                  handleMarkerClick(event);
                }}
              >
                <div
                  className={`group relative flex h-11 w-11 cursor-pointer items-center justify-center transition-all duration-200 ${
                    isSelected ? "scale-125" : "hover:scale-125"
                  } ${isHighlighted ? "scale-150" : ""}`}
                >
                  <span
                    className={`absolute h-9 w-9 rounded-full border-[4px] ${
                      event.isGeocoded ? "border-dashed" : "border-solid"
                    } ${colors.ring} ${
                      isDark ? "bg-[#111111]/80" : "bg-white/85"
                    } shadow-[0_5px_18px_rgba(0,0,0,0.22)] ${
                      isSelected || isHighlighted ? "animate-pulse" : ""
                    }`}
                  />
                  <span className={`relative h-3 w-3 rounded-full ${colors.marker}`} />

                  {!isSelected && (
                    <div
                      className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-[230px] -translate-x-1/2 rounded-xl border p-3 text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 ${
                        isDark
                          ? "border-[#3A3A3A] bg-[#171717]"
                          : "border-[#E5E5E5] bg-white"
                      }`}
                    >
                      <p
                        className={`truncate text-xs font-semibold ${
                          isDark ? "text-white" : "text-[#111111]"
                        }`}
                      >
                        {event.title}
                      </p>
                      <p
                        className={`mt-1.5 truncate text-[11px] ${
                          isDark ? "text-white/45" : "text-[#777777]"
                        }`}
                      >
                        {event.location}
                      </p>
                      <div
                        className={`mt-2 flex items-center justify-between text-[10px] ${
                          isDark ? "text-white/35" : "text-[#999999]"
                        }`}
                      >
                        <span>{event.date}</span>
                        <span>{formatTime(event.startTime)}</span>
                      </div>
                      {event.isGeocoded && (
                        <p className="mt-2 text-[10px] font-medium text-[#C7A46B]">
                          Approximate location
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Marker>
            );
          })}
        </MapboxMap>
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-center px-6 text-center ${
            isDark ? "bg-[#111111]" : "bg-[#FAFAFA]"
          }`}
        >
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl border ${
              isDark
                ? "border-[#333333] bg-[#202020] text-white/30"
                : "border-[#E5E5E5] bg-white text-black/30"
            }`}
          >
            <MapPin size={26} />
          </div>
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>
            Mapbox token required
          </h3>
          <p className={`mt-2 max-w-md text-sm ${isDark ? "text-white/45" : "text-[#777777]"}`}>
            Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment to display the Globe View map.
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute left-4 right-4 top-4 z-20">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="pointer-events-auto w-full xl:w-[340px]">
            <div className="relative">
              <Search
                size={17}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-white/40" : "text-[#777777]"
                }`}
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search shoots or location..."
                className={`h-11 w-full rounded-lg border pl-10 pr-10 text-sm outline-none transition-colors ${
                  isDark
                    ? "border-[#333333] bg-[#171717] text-white placeholder:text-white/35 focus:border-[#E8D1AB]"
                    : "border-[#E5E5E5] bg-white text-black placeholder:text-[#999999] focus:border-[#D7BD90]"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
                    isDark
                      ? "text-white/40 hover:bg-white/10 hover:text-white"
                      : "text-[#777777] hover:bg-black/5 hover:text-black"
                  }`}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 xl:justify-end">
            <Select value={statusFilter} onValueChange={(value: GlobeStatusFilter) => setStatusFilter(value)}>
              <SelectTrigger
                className={`h-11 w-[160px] rounded-lg text-sm focus:ring-0 ${
                  isDark
                    ? "border-[#333333] bg-[#171717] text-white/70"
                    : "border-[#E5E5E5] bg-white text-[#666666]"
                }`}
              >
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "border-[#333333] bg-[#111111] text-white"
                    : "border-[#E5E5E5] bg-white text-black"
                }
              >
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="active">Active Productions</SelectItem>
                <SelectItem value="upcoming">Upcoming Shoots</SelectItem>
                <SelectItem value="completed">Completed Shoots</SelectItem>
                <SelectItem value="cancelled">Cancelled Shoots</SelectItem>
              </SelectContent>
            </Select>

            <Select value={crewFilter} onValueChange={(value: CrewFilter) => setCrewFilter(value)}>
              <SelectTrigger
                className={`h-11 w-[155px] rounded-lg text-sm focus:ring-0 ${
                  isDark
                    ? "border-[#333333] bg-[#171717] text-white/70"
                    : "border-[#E5E5E5] bg-white text-[#666666]"
                }`}
              >
                <SelectValue placeholder="All Crew" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "border-[#333333] bg-[#111111] text-white"
                    : "border-[#E5E5E5] bg-white text-black"
                }
              >
                <SelectItem value="all">All Crew</SelectItem>
                <SelectItem value="assigned">CP Assigned</SelectItem>
                <SelectItem value="not_assigned">CP Not Assigned</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={range}
              onValueChange={(value: GlobalRange) => handleRangeChange(value)}
            >
              <SelectTrigger
                className={`h-11 w-[175px] rounded-lg text-sm focus:ring-0 ${
                  isDark
                    ? "border-[#333333] bg-[#171717] text-white/70"
                    : "border-[#E5E5E5] bg-white text-[#666666]"
                }`}
              >
                <CalendarDays size={16} className={isDark ? "mr-2 text-white/35" : "mr-2 text-[#777777]"} />
                <SelectValue placeholder="Upcoming" />
              </SelectTrigger>
              <SelectContent
                className={`max-h-72 ${
                  isDark
                    ? "border-[#333333] bg-[#111111] text-white"
                    : "border-[#E5E5E5] bg-white text-black"
                }`}
              >
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="tbd">TBD</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="next_7_days">Next 7 Days</SelectItem>
                <SelectItem value="next_15_days">Next 15 Days</SelectItem>
                <SelectItem value="next_30_days">Next 30 Days</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_15_days">Last 15 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem
                  value="custom"
                  onClick={(event) => {
                    event.preventDefault();
                    handleRangeChange("custom");
                  }}
                  onSelect={(event) => {
                    event.preventDefault();
                    handleRangeChange("custom");
                  }}
                >
                  Custom Range
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {currentCustomRangeLabel && (
          <div
            className={`pointer-events-auto mt-3 ml-auto flex w-fit max-w-full items-center gap-3 rounded-xl border px-3 py-2.5 shadow-lg ${
              isDark
                ? "border-[#333333] bg-[#171717] text-white"
                : "border-[#E5E5E5] bg-white text-black"
            }`}
          >
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"}`}>
                Saved Range
              </p>
              <p className={`mt-0.5 truncate text-xs ${isDark ? "text-white/70" : "text-black/65"}`}>
                {currentCustomRangeLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={openCustomRangeDialog}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                isDark
                  ? "border-[#333333] bg-[#202020] text-white hover:bg-[#2A2A2A]"
                  : "border-[#E5E5E5] bg-white text-black hover:bg-[#F7F7F7]"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={clearCustomRange}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                isDark
                  ? "border-[#333333] bg-[#202020] text-white/70 hover:bg-[#2A2A2A] hover:text-white"
                  : "border-[#E5E5E5] bg-white text-black/60 hover:bg-[#F7F7F7] hover:text-black"
              }`}
              aria-label="Clear custom range"
              title="Clear custom range"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {isCustomRangeOpen && (
        <div
          className={`fixed inset-0 z-[120] flex items-center justify-center px-4 py-6 ${isDark ? "bg-black/60" : "bg-black/35"}`}
          onClick={handleCustomRangeCancel}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl ${
              isDark
                ? "border-[#3A3A3A] bg-[#171717] text-white"
                : "border-[#E5E5E5] bg-white text-black"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold">Custom Range</h3>
              <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-black/55"}`}>
                Choose a start and end date to filter globe shoots.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DatePicker
                label="Start Date"
                floating
                value={draftCustomRangeStartDate}
                onChange={(date) => {
                  const nextStartDate = date ? startOfDay(date) : null;
                  setDraftCustomRangeStartDate(nextStartDate);

                  if (
                    nextStartDate &&
                    draftCustomRangeEndDate &&
                    nextStartDate > startOfDay(draftCustomRangeEndDate)
                  ) {
                    setDraftCustomRangeEndDate(nextStartDate);
                  }
                }}
                maxDate={draftCustomRangeEndDate || undefined}
                isDark={isDark}
                disablePortal
                format="MM/dd/yyyy"
              />

              <DatePicker
                label="End Date"
                floating
                value={draftCustomRangeEndDate}
                onChange={(date) => {
                  const nextEndDate = date ? startOfDay(date) : null;
                  setDraftCustomRangeEndDate(nextEndDate);

                  if (
                    nextEndDate &&
                    draftCustomRangeStartDate &&
                    nextEndDate < startOfDay(draftCustomRangeStartDate)
                  ) {
                    setDraftCustomRangeStartDate(nextEndDate);
                  }
                }}
                minDate={draftCustomRangeStartDate || undefined}
                isDark={isDark}
                disablePortal
                format="MM/dd/yyyy"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={clearCustomRange}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  isDark
                    ? "border-[#3D3D3D] bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
                    : "border-[#E3E3E3] bg-white text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                Clear Range
              </button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleCustomRangeCancel}
                  className={
                    isDark
                      ? "border border-[#3D3D3D] bg-transparent text-white hover:bg-white/5"
                      : "border border-[#E3E3E3] bg-white text-black hover:bg-black/5"
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleCustomRangeApply}
                  className="bg-[#E8D1AB] text-black hover:bg-[#d4c3a3]"
                >
                  Apply Range
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-4 left-4 z-20 hidden w-[248px] rounded-xl border p-3 shadow-xl md:block ${
          isDark
            ? "border-[#333333] bg-[#171717]/95"
            : "border-[#E5E5E5] bg-white/95"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-1 pb-2">
          <div>
            <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111111]"}`}>Status Legend</p>
            <p className={`mt-0.5 text-[10px] ${isDark ? "text-white/35" : "text-[#999999]"}`}>
              {filteredEvents.length} mapped shoots
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllFilters}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                isDark ? "text-[#E8D1AB] hover:bg-white/5" : "text-[#8B6D3E] hover:bg-[#F8F4EA]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={clearAllFilters}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                isDark ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-[#777777] hover:bg-[#F5F5F5]"
              }`}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-1 space-y-1.5">
          {legendItems.map((item) => {
            const isActive = activeFilters.has(item.id);
            const isHighlighted = highlightedLegend === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => zoomToLegendMarkers(item.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
                  isActive
                    ? isDark
                      ? "border-[#333333] bg-[#202020]"
                      : "border-[#E5E5E5] bg-[#FFFCF6]"
                    : "border-transparent bg-transparent opacity-40"
                } ${isHighlighted ? "ring-1 ring-[#E8D1AB]" : ""}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.marker}`} />
                  <span className={`truncate text-[11px] ${isDark ? "text-white/70" : "text-[#555555]"}`}>
                    {item.label}
                  </span>
                </span>
                <span className={`text-[11px] font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <div
          className={`absolute bottom-4 right-4 z-30 w-[370px] max-w-[calc(100%-32px)] overflow-hidden rounded-2xl border shadow-[0_20px_55px_rgba(0,0,0,0.38)] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 ${
            isDark
              ? "border-[#3A3A3A] bg-[#171717] text-white"
              : "border-[#E5E5E5] bg-white text-black"
          }`}
        >
          <button
            type="button"
            onClick={closePopup}
            className={`absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              isDark
                ? "border-[#333333] bg-[#202020] text-white/45 hover:text-white"
                : "border-[#E5E5E5] bg-[#FAFAFA] text-[#777777] hover:text-black"
            }`}
            aria-label="Close shoot details"
          >
            <X size={16} />
          </button>

          <div className={`border-b p-5 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            <div className="mb-3 flex items-start justify-between gap-4 pr-10">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold capitalize ${isDark ? statusConfig[selectedEvent.status].badgeDark : statusConfig[selectedEvent.status].badgeLight}`}
              >
                {selectedEvent.status}
              </span>

              {!!selectedEvent.crew.length && (
                <div className="flex -space-x-2">
                  {selectedEvent.crew.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      title={member.name}
                      className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 text-[9px] font-semibold ${
                        isDark
                          ? "border-[#171717] bg-[#E8D1AB] text-black"
                          : "border-white bg-[#E8D1AB] text-black"
                      }`}
                    >
                      {member.image ? (
                        <img src={member.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        member.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                  ))}
                  {selectedEvent.crew.length > 4 && (
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[9px] font-semibold ${
                        isDark
                          ? "border-[#171717] bg-[#202020] text-white/70"
                          : "border-white bg-[#F4F5F7] text-[#666666]"
                      }`}
                    >
                      +{selectedEvent.crew.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>

            <h3 className={`pr-8 text-base font-semibold leading-snug ${isDark ? "text-white" : "text-[#111111]"}`}>
              {selectedEvent.title}
            </h3>

            <div className={`mt-4 space-y-2.5 text-xs ${isDark ? "text-white/50" : "text-[#777777]"}`}>
              <div className="flex items-center gap-2.5">
                <CalendarDays size={15} className="shrink-0" />
                <span>{selectedEvent.date}</span>
              </div>
              <div className="flex min-w-0 items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2">{selectedEvent.location}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock3 size={15} className="shrink-0" />
                <span>
                  {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                </span>
              </div>
              {selectedEvent.isGeocoded && (
                <p className="pl-[25px] text-[11px] font-medium text-[#C7A46B]">Approximate geocoded location</p>
              )}
            </div>
          </div>

          {(selectedEvent.streamingPlatforms.length > 0 || selectedEvent.equipment.length > 0) && (
            <div className={`grid grid-cols-1 border-b sm:grid-cols-2 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              <div className={`px-5 py-4 sm:border-r ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                <p className={`text-[11px] font-medium ${isDark ? "text-white/65" : "text-[#666666]"}`}>Streaming Platforms</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedEvent.streamingPlatforms.length ? (
                    selectedEvent.streamingPlatforms.slice(0, 2).map((platform) => (
                      <span
                        key={platform}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] ${
                          isDark
                            ? "border-[#333333] bg-[#202020] text-white/45"
                            : "border-[#E5E5E5] bg-[#FAFAFA] text-[#777777]"
                        }`}
                      >
                        <Video size={11} /> {platform}
                      </span>
                    ))
                  ) : (
                    <span className={`text-[11px] ${isDark ? "text-white/25" : "text-[#AAAAAA]"}`}>—</span>
                  )}
                </div>
              </div>

              <div className="px-5 py-4">
                <p className={`text-[11px] font-medium ${isDark ? "text-white/65" : "text-[#666666]"}`}>Equipment Assigned</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedEvent.equipment.length ? (
                    selectedEvent.equipment.slice(0, 2).map((equipment) => (
                      <span
                        key={equipment}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] ${
                          isDark
                            ? "border-[#333333] bg-[#202020] text-white/45"
                            : "border-[#E5E5E5] bg-[#FAFAFA] text-[#777777]"
                        }`}
                      >
                        <Camera size={11} /> {equipment}
                      </span>
                    ))
                  ) : (
                    <span className={`text-[11px] ${isDark ? "text-white/25" : "text-[#AAAAAA]"}`}>—</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between gap-4 p-4 ${isDark ? "bg-[#141414]" : "bg-[#FAFAFA]"}`}>
            <span className={`text-[11px] ${isDark ? "text-white/35" : "text-[#999999]"}`}>
              {selectedEvent.updatedAt ? "Recently updated" : `${selectedEvent.assignedCrewCount} CP assigned`}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                const shootId = String(selectedEvent.id || "").replace(/^#/, "").trim();
                if (shootId) router.push(`/admin/shoots/${encodeURIComponent(shootId)}`);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#E8D1AB] px-4 text-xs font-semibold text-black transition-colors hover:bg-[#D9C29D]"
            >
              View Details
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {(eventsLoading || geocoding) && (
        <div
          className={`absolute inset-0 z-40 flex items-center justify-center backdrop-blur-[1px] ${
            isDark ? "bg-black/35" : "bg-white/35"
          }`}
        >
          <div
            className={`flex min-w-[150px] items-center justify-center gap-2 rounded-xl border px-4 py-3 shadow-xl ${
              isDark
                ? "border-[#333333] bg-[#171717] text-white"
                : "border-[#E5E5E5] bg-white text-black"
            }`}
          >
            <Loader2 size={18} className="animate-spin text-[#E8D1AB]" />
            <span className="text-xs font-medium">{eventsLoading ? "Loading shoots..." : "Mapping locations..."}</span>
          </div>
        </div>
      )}
    </div>
  );
};
