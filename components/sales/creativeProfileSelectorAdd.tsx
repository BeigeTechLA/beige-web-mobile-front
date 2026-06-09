"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { salesApi, adminApi } from '@/lib/api';
import { Search, SlidersHorizontal, Check, Loader2, List, LayoutGrid, ChevronDown } from 'lucide-react';
import { CreativeFilterModal, CREATIVE_RADIUS_OPTIONS } from './CreativeFilterModal';
import { Separator } from '@/src/components/landing/Separator';

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";
const DEFAULT_RADIUS = 50;

type CreativeWithDistance = {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  status?: string;
  shoots?: number;
  assigned_shoots?: number;
  specialities?: string;
  role?: string;
  availability?: string;
  location?: string;
  email?: string;
  phone_number?: string;
  rating?: number | string;
  hourly_rate?: number | string;
  is_beige_member?: number;
  profile_image?: string;
  profile_photo?: string;
  latitude?: string | number;
  longitude?: string | number;
  working_distance?: string;
  distanceBucket?: number | "traveling" | null;
};

type RadiusBucket = {
  lowerBound: number;
  upperBound: number;
  label: string;
  items: CreativeWithDistance[];
};

type TravelingBucket = {
  label: string;
  items: CreativeWithDistance[];
};

type CrewApiItem = {
  crew_member_id: number;
  first_name?: string;
  last_name?: string;
  role?: string;
  availability?: string;
  profile_photo?: string;
  latitude?: string | number;
  longitude?: string | number;
  working_distance?: string;
  years_of_experience?: number;
  is_active?: boolean;
  [key: string]: unknown;
};

type LeadStats = {
  fulfillment_stats?: {
    videographer?: string;
    photographer?: string;
  };
};

type CreativeCardProps = {
  creative: CreativeWithDistance;
  isSelected: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
  isDark?: boolean;
  viewMode: 'list' | 'grid';
};

type LocationLike = {
  address?: string;
  location?: string;
  full_address?: string;
};

const formatLocation = (locationInput?: unknown) => {
  const raw =
    typeof locationInput === "string"
      ? locationInput.trim()
      : locationInput && typeof locationInput === "object"
        ? String((locationInput as LocationLike).address || (locationInput as LocationLike).location || (locationInput as LocationLike).full_address || "").trim()
        : String(locationInput || "").trim();

  if (!raw) return "N/A";

  let addressStr = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const parsedLocation = parsed as LocationLike;
      addressStr = String(parsedLocation.address || parsedLocation.location || parsedLocation.full_address || raw);
    }
  } catch {
    // Not JSON, use raw string.
  }

  const normalizeSegment = (segment: string) =>
    segment
      .replace(/^\d{3,}(?:-\d+)?\s+/, "")
      .replace(/^\d{3,}(?:\s+\d{3,})*\s+/, "")
      .trim();

  const parts = addressStr
    .split(/[,،，]/)
    .map((part) => normalizeSegment(part.trim()))
    .filter(Boolean);

  if (parts.length <= 1) return addressStr;

  if (parts.length >= 4) {
    const country = normalizeSegment(parts[parts.length - 1]);
    const middle = normalizeSegment(parts[parts.length - 2] || "");
    const city = normalizeSegment(parts[parts.length - 3]);
    return [city, middle, country].filter(Boolean).join(", ");
  }

  if (parts.length === 3) {
    const secondPartLooksLikeCity = !/^\d/.test(parts[1]);
    if (secondPartLooksLikeCity) {
      return parts.map(normalizeSegment).join(", ");
    }

    const country = normalizeSegment(parts[2]);
    const city = normalizeSegment(parts[1]);
    return [city, country].filter(Boolean).join(", ");
  }

  const country = normalizeSegment(parts[parts.length - 1]);
  return [normalizeSegment(parts[0]), country].filter(Boolean).join(", ");
};

export const CreativeProfileSelectorAdd = ({
  selectedIds: externalSelectedIds,
  onChange,
  onSelectionUpdate,
  leadId,
  projectId,
  currentLocation,
  currentLatitude,
  currentLongitude,
  targets,
  disableCrewFetch,
  statsSource = "lead",
  isDark = true,
  roleType: externalRoleType,
}: {
  selectedIds?: number[],
  onChange?: (ids: number[]) => void,
  onSelectionUpdate?: (counts: { videographer: number, photographer: number }) => void,
  leadId?: number | string,
  projectId?: number | string,
  currentLocation?: string,
  currentLatitude?: number,
  currentLongitude?: number,
  targets?: { videographer: number, photographer: number },
  disableCrewFetch?: boolean, // When true, suppresses the get-crew-for-lead API call
  statsSource?: "lead" | "client",
  isDark?: boolean,
  roleType?: string,
} = {}) => {
  const [internalSelectedIds, setInternalSelectedIds] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({ radius: DEFAULT_RADIUS });
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [creatives, setCreatives] = useState<CreativeWithDistance[]>([]);
  // const [roleType, setRoleType] = useState<string>('videographer');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedBuckets, setExpandedBuckets] = useState<number[]>([10, 50]);


  const roleType = externalRoleType || 'videographer';
  const hasActiveSearch = searchQuery.trim().length > 0;
  const activeBucketLimits = useMemo(
    () => CREATIVE_RADIUS_OPTIONS.filter((limit) => limit <= appliedFilters.radius),
    [appliedFilters.radius]
  );

  useEffect(() => {
    setExpandedBuckets(activeBucketLimits);
  }, [activeBucketLimits]);

  const parseWorkingDistance = (workingDistance?: string) => {
    const normalized = (workingDistance || "").toLowerCase().trim();

    if (!normalized) {
      return null;
    }

    if (normalized.includes("travel")) {
      return "traveling" as const;
    }

    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    if (!match) {
      return null;
    }

    const miles = Number.parseFloat(match[1]);
    if (miles <= 10) return 10;
    if (miles <= 50) return 50;
    if (miles <= 100) return 100;
    if (miles <= 150) return 150;
    return 200;
  };

  // 1. Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (creatives.length > 0) {
      setSelectedRoles((prev) => {
        const updatedRoles = { ...prev };
        creatives.forEach((c) => {
          updatedRoles[c.id] = c.specialities || "Creative";
        });
        return updatedRoles;
      });
    }
  }, [creatives]);

  useEffect(() => {
    // Only fetch lead stats if targets are NOT provided externally
    const fetchStats = async () => {
      if (leadId && !targets) {
        try {
          const response = statsSource === "client"
            ? await salesApi.getClientLeadStats(leadId)
            : await salesApi.getLeadStats(leadId);
          if (response && response.data) {
            setStats(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch lead stats", error);
        }
      }
    };
    fetchStats();
  }, [leadId, targets, statsSource]);

  useEffect(() => {
    const fetchCreatives = async () => {
      // Completely skip if disableCrewFetch is true
      if (disableCrewFetch) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        let response;
        if (projectId) {
          response = await adminApi.getCrewForShoot({
            project_id: projectId,
            role_type: roleType,
            search_query: debouncedSearch || undefined,
            radius: appliedFilters.radius
          });
        } else {
          response = await salesApi.getCrewForLead({
            lead_id: leadId || 0,
            role_type: roleType,
            search_query: debouncedSearch || undefined,
            radius: appliedFilters.radius,
            latitude: Number.isFinite(currentLatitude) ? currentLatitude : undefined,
            longitude: Number.isFinite(currentLongitude) ? currentLongitude : undefined
          });
        }

        const responseData = response?.data ?? response;
        const responseCreatives = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];
        if (responseCreatives.length > 0 || responseData?.success) {
          const formattedCreatives = responseCreatives.map((item: CrewApiItem) => ({
            id: item.crew_member_id,
            name: `${item.first_name} ${item.last_name}`,
            status: item.is_active ? "Active" : "Inactive",
            shoots: item.years_of_experience || 0,
            specialities: item.role || "Creative",
            availability: item.availability || "Available",
            location: item.location || item.old_location || "",
            profile_photo: item.profile_photo,
            latitude: item.latitude,
            longitude: item.longitude,
            working_distance: item.working_distance,
            ...item
          }));
          setCreatives(formattedCreatives);
        } else {
          setCreatives([]);
        }
      } catch (error) {
        console.error("Failed to fetch creatives", error);
        setCreatives([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatives();
  }, [disableCrewFetch, leadId, projectId, stats?.location, currentLocation, currentLatitude, currentLongitude, roleType, debouncedSearch, appliedFilters.radius]);

  const selectedIds = externalSelectedIds || internalSelectedIds;

  const filteredCreatives = creatives.filter((creative) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return true;

    const searchableText = [
      creative.first_name,
      creative.last_name,
      creative.name,
      creative.email,
      creative.phone_number,
      creative.location,
      creative.specialities,
      creative.role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const groupedCreatives = useMemo<RadiusBucket[]>(() => {
    if (viewMode !== 'grid') {
      return [];
    }

    return activeBucketLimits.map((upperBound, index) => {
      const lowerBound = index === 0 ? 0 : activeBucketLimits[index - 1];
      const label = `${lowerBound}-${upperBound} miles`;

      const items = filteredCreatives
        .map((creative) => ({
          ...creative,
          distanceBucket: parseWorkingDistance(creative.working_distance),
        }))
        .filter((creative) => creative.distanceBucket === upperBound);

      return { lowerBound, upperBound, label, items };
    }).filter((bucket) => bucket.items.length > 0);
  }, [activeBucketLimits, filteredCreatives, viewMode]);

  const travelingCreatives = useMemo<TravelingBucket | null>(() => {
    if (viewMode !== "grid") {
      return null;
    }

    const items = filteredCreatives.filter((creative) => parseWorkingDistance(creative.working_distance) === "traveling");

    if (items.length === 0) {
      return null;
    }

    return {
      label: "Traveling",
      items,
    };
  }, [filteredCreatives, viewMode]);

  const radiusFilteredCreatives = useMemo(() => {
    return filteredCreatives.filter((creative) => {
      const bucket = parseWorkingDistance(creative.working_distance);

      if (bucket === "traveling") {
        return true;
      }

      if (bucket === null) {
        return false;
      }

      return bucket <= appliedFilters.radius;
    });
  }, [appliedFilters.radius, filteredCreatives]);

  const visibleCreatives = hasActiveSearch ? filteredCreatives : radiusFilteredCreatives;

  const counts = useMemo(() => {
    let vCount = 0;
    let pCount = 0;
    let bothCount = 0;

    selectedIds.forEach(id => {
      const role = (selectedRoles[id] || '').toLowerCase();
      const isVideo = role.includes('video');
      const isPhoto = role.includes('photo');

      if (isVideo && isPhoto) {
        bothCount++;
      } else if (isVideo) {
        vCount++;
      } else if (isPhoto) {
        pCount++;
      }
    });

    const targetV = targets?.videographer || parseInt(stats?.fulfillment_stats?.videographer?.split('/')[1] || '0') || 0;
    const targetP = targets?.photographer || parseInt(stats?.fulfillment_stats?.photographer?.split('/')[1] || '0') || 0;

    for (let i = 0; i < bothCount; i++) {
      const deficitV = targetV - vCount;
      const deficitP = targetP - pCount;

      if (deficitV > deficitP) {
        vCount++;
      } else if (deficitP > deficitV) {
        pCount++;
      } else {
        if (vCount <= pCount) {
          vCount++;
        } else {
          pCount++;
        }
      }
    }

    return { videographer: vCount, photographer: pCount };
  }, [selectedIds, selectedRoles, targets, stats]);

  // Notify parent of count updates
  useEffect(() => {
    if (onSelectionUpdate) {
      onSelectionUpdate(counts);
    }
  }, [counts, onSelectionUpdate]);

  const toggleBucket = (bucketLimit: number) => {
    setExpandedBuckets((current) =>
      current.includes(bucketLimit)
        ? current.filter((limit) => limit !== bucketLimit)
        : [...current, bucketLimit]
    );
  };

  const toggleSelection = (id: number) => {
    const creative = creatives.find(c => c.id === id);
    if (!selectedIds.includes(id) && creative) {
      setSelectedRoles(prev => ({ ...prev, [id]: creative.specialities }));
    }

    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];

    if (onChange) {
      onChange(nextIds);
    } else {
      setInternalSelectedIds(nextIds);
    }
  };

  return (
    <div className={`transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h3 className={`text-lg lg:text-xl font-medium transition-colors ${isDark ? "text-white/90" : "text-black/90"}`}>
          Select Creative Profile
        </h3>

        {/* <div className="flex gap-3">
          {[
            { type: 'videographer', icon: Video, label: 'Videographer(s)', count: counts.videographer, target: targets?.videographer || stats?.fulfillment_stats?.videographer?.split('/')[1] || '0' },
            { type: 'photographer', icon: Camera, label: 'Photographers(s)', count: counts.photographer, target: targets?.photographer || stats?.fulfillment_stats?.photographer?.split('/')[1] || '0' }
          ].map((btn) => (
            <div
              key={btn.type}
              onClick={() => setRoleType(btn.type)}
              className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm cursor-pointer transition-all duration-300 ${roleType === btn.type
                // ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]'
                ? (isDark ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]' : 'bg-[#E8D1AB]/40 border-[#E8D1AB] text-black/70')
                : (isDark ? 'bg-[#1A1A1A] border-white/10 text-white/70' : 'bg-gray-50 border-[#D8D8D8] text-black/70')
                }`}
            >
              <btn.icon size={16} />
              <span>{btn.label} : {btn.count}/{btn.target}</span>
            </div>
          ))}
        </div> */}

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 lg:w-[500px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} size={18} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-10 lg:h-14 w-full border rounded-lg lg:rounded-xl py-3 pl-10 pr-4 outline-none transition-all ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50"
                : "bg-white border-[#D8D8D8] text-black focus:border-[#E8D1AB]"
                }`}
            />
          </div>
          {/* <div className={`hidden md:flex border rounded-xl overflow-hidden ${isDark ? "border-white/10" : "border-[#D8D8D8]"}`}>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-[#E8D1AB] text-black' : (isDark ? 'text-white' : 'text-black')}`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#E8D1AB] text-black' : (isDark ? 'text-white' : 'text-black')}`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>  */}
          {/* FILTER TRIGGER */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`flex items-center gap-2 border h-10 lg:h-14 px-6 py-3 rounded-lg lg:rounded-xl transition-all active:scale-95 ${isDark
              ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-white/5"
              : "bg-white border-[#D8D8D8] text-black hover:bg-gray-50"
              }`}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className={`mb-5 rounded-xl border px-4 py-3 transition-colors ${isDark
        ? "border-[#E8D1AB]/20 bg-[#E8D1AB]/10 text-white"
        : "border-[#D9C19A] bg-[#FFF8EC] text-black"
        }`}>
        <p className="text-sm font-medium">
          {hasActiveSearch
            ? "Searching all creative partners. Select any matching CP to assign them to this shoot."
            : `Showing available CPs around the shoot location within ${appliedFilters.radius} miles.`}
        </p>
        <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
          {hasActiveSearch
            ? "Clear the search to return to nearby CPs around the shoot location."
            : "If you want a different CP, use search to find from all creative partners."}
        </p>
      </div>

      {/* Creative List Container */}
      <div className={`border rounded-xl lg:rounded-2xl p-4 lg:p-8 transition-colors ${isDark ? "bg-black border-white/5" : "bg-white border-[#D8D8D8]"
        } ${viewMode === 'grid' ? "space-y-4" : "space-y-4 lg:space-y-8"}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-5 lg:py-10">
            <Loader2 className="mb-4 animate-spin text-[#E8D1AB]" size={32} />
          </div>
        ) : viewMode === 'grid' ? (
          groupedCreatives.length > 0 || travelingCreatives ? (
            <>
              {groupedCreatives.map((bucket) => {
                const isExpanded = expandedBuckets.includes(bucket.upperBound);

                return (
                  <div
                    key={`${bucket.lowerBound}-${bucket.upperBound}`}
                    className={`overflow-hidden rounded-lg lg:rounded-2xl border transition-colors ${isDark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleBucket(bucket.upperBound)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-4 text-left md:px-6 ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.03]"}`}
                    >
                      <div>
                        <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                          {bucket.label}
                        </p>
                        <p className={isDark ? "text-xs lg:text-sm text-white/45" : "text-xs lg:text-sm text-black/45"}>
                          {bucket.items.length} creative{bucket.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${isExpanded ? "rotate-180" : ""} ${isDark ? "text-white/60" : "text-black/60"}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 px-4 pb-4 md:px-6 md:pb-6">
                        {bucket.items.map((creative, index) => (
                          <CreativeCard
                            key={`${creative.id}-${index}`}
                            creative={creative}
                            isSelected={selectedIds.includes(creative.id)}
                            onToggle={() => toggleSelection(creative.id)}
                            onViewProfile={() => window.open(`/creatives/${creative.id}`, '_blank', 'noopener,noreferrer')}
                            isDark={isDark}
                            viewMode="grid"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {travelingCreatives && (
                <div
                  className={`overflow-hidden rounded-lg lg:rounded-2xl border transition-colors ${isDark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleBucket(999)}
                    className={`flex w-full items-center justify-between gap-3 px-2 py-4 text-left md:px-6 ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.03]"}`}
                  >
                    <div>
                      <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                        {travelingCreatives.label}
                      </p>
                      <p className={isDark ? "text-xs lg:text-sm text-white/45" : "text-xs lg:text-sm text-black/45"}>
                        {travelingCreatives.items.length} creative{travelingCreatives.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${expandedBuckets.includes(999) ? "rotate-180" : ""} ${isDark ? "text-white/60" : "text-black/60"}`}
                    />
                  </button>

                  {expandedBuckets.includes(999) && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 px-4 pb-4 md:px-6 md:pb-6">
                      {travelingCreatives.items.map((creative, index) => (
                        <CreativeCard
                          key={`${creative.id}-${index}`}
                          creative={creative}
                          isSelected={selectedIds.includes(creative.id)}
                          onToggle={() => toggleSelection(creative.id)}
                          onViewProfile={() => window.open(`/creatives/${creative.id}`, '_blank', 'noopener,noreferrer')}
                          isDark={isDark}
                          viewMode="grid"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-4 lg:py-8 ${isDark ? "text-white/50" : "text-black/50"}`}>
              No creatives found for {roleType} in this location.
            </div>
          )
        ) : visibleCreatives.length > 0 ? (
          visibleCreatives.map((creative, index) => (
            <React.Fragment key={creative.id || index}>
              <CreativeCard
                creative={creative}
                isSelected={selectedIds.includes(creative.id)}
                onToggle={() => toggleSelection(creative.id)}
                onViewProfile={() => window.open(`/creatives/${creative.id}`, '_blank', 'noopener,noreferrer')}
                isDark={isDark}
                viewMode={viewMode}
              />
              {viewMode === 'list' && index !== visibleCreatives.length - 1 && <Separator />}
            </React.Fragment>
          ))
        ) : (
          <div className={`text-center py-8 ${isDark ? "text-white/50" : "text-black/50"}`}>
            {hasActiveSearch ? "No creative partners found for this search." : `No creatives found for ${roleType} in this location.`}
          </div>
        )}
      </div>

      {/* SIDEBAR COMPONENT */}
      <CreativeFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) => setAppliedFilters(filters)}
        value={appliedFilters.radius}
        isDark={isDark}
      />
    </div>
  );
};
const CreativeCard = ({ creative, isSelected, onToggle, onViewProfile, isDark, viewMode }: CreativeCardProps) => {
  const isGrid = viewMode === 'grid';
  const imageSrc = creative.profile_photo
    ? (creative.profile_photo.startsWith('http') ? creative.profile_photo : `${S3_PREFIX}${creative.profile_photo}`)
    : null;
  const experienceLabel = `${String(creative.shoots || 0).padStart(2, '0')} Years`;
  const locationLabel = formatLocation(creative.location);

  return (
    <div
      onClick={onToggle}
      className={`relative group flex transition-all border rounded-lg lg:rounded-2xl cursor-pointer overflow-hidden ${isGrid ? "flex-col h-full min-h-[430px] p-0" : "p-4 flex-col md:flex-row items-center md:items-start gap-6"
        } ${isGrid
          ? (isSelected
            ? (isDark ? 'bg-white/[0.08] border-[#E8D1AB]/50' : 'bg-[#E8D1AB]/5 border-[#E8D1AB]')
            : (isDark ? 'bg-white/[0.08] border-white/10 hover:bg-white/[0.06]' : 'bg-transparent border-transparent hover:bg-gray-50'))
          : (isSelected
            ? (isDark ? 'bg-white/[0.04] border-[#E8D1AB]/50' : 'bg-[#E8D1AB]/5 border-[#E8D1AB]')
            : (isDark ? 'bg-transparent border-transparent hover:bg-white/[0.02]' : 'bg-transparent border-transparent hover:bg-gray-50'))
        }`}
    >
      {isGrid ? (
        <>
          <div className="relative w-full overflow-hidden rounded-xl lg:rounded-[22px]">
            <div className="relative aspect-square w-full overflow-hidden">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={creative.name}
                  className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${!isSelected ? 'grayscale-[0.15]' : ''}`}
                />
              ) : (
                <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br from-[#2A241A] to-[#0F0F0F] text-white text-xl lg:text-3xl font-semibold ${!isSelected ? 'grayscale-[0.15]' : ''}`}>
                  {creative.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}
            </div>

            <div className="absolute right-4 top-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${isSelected ? 'bg-[#E8D1AB] border-[#E8D1AB]' : (isDark ? 'bg-transparent border-white/20' : 'bg-transparent border-black/20')}`}
              >
                {isSelected && <Check size={18} className="text-black stroke-[3px]" />}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-1 flex-col px-4 py-4 lg:px-5 lg:pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className={`truncate text-lg lg:text-2xl leading-none font-medium transition-colors ${isDark ? "text-white" : "text-black"
                    }`}>
                    {creative.name}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-[#16A34A] px-2.5 py-1 text-xs font-semibold leading-none text-white">
                    {creative.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Experience and Specialities Row */}
            <div className={`mt-2 lg:mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-2 lg:gap-4 border-t pt-4 transition-colors ${isDark ? "border-white/15 text-white/90" : "border-[#e3e3e3] text-black/80"}`}>
              <div>
                <p className={`mb-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/45" : "text-zinc-500"}`}>
                  Experience:
                </p>
                <p className={`text-sm lg:text-base font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>
                  {experienceLabel}
                </p>
              </div>

              <div className={`mt-1 h-8 w-px transition-colors ${isDark ? "bg-white/20" : "bg-[#e3e3e3]"}`} />

              <div>
                <p className={`mb-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/45" : "text-zinc-500"}`}>
                  Specialities:
                </p>
                <p className={`text-sm lg:text-base font-medium leading-tight transition-colors ${isDark ? "text-white" : "text-black"}`}>
                  {creative.specialities}
                </p>
              </div>
            </div>

            {/* Location Row */}
            <div className={`mt-4 border-t pt-4 transition-colors ${isDark ? "border-white/15" : "border-[#e3e3e3]"}`}>
              <p className={`mb-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/45" : "text-zinc-500"}`}>
                Location:
              </p>
              <p className={`text-sm lg:text-base font-medium leading-tight transition-colors ${isDark ? "text-white" : "text-black"}`}>
                {locationLabel}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Profile Image */}
          <div className="relative flex-shrink-0 w-20 h-20 lg:w-[146px] lg:h-[156px]">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={creative.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E8D1AB] rounded-lg text-black text-lg lg:text-2xl font-bold">
                {creative.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 w-full flex flex-col">
            <div className="flex justify-between items-center mb-3 w-full">
              <div className="flex items-center gap-3">
                <h3 className={`font-medium transition-colors text-lg lg:text-2xl ${isDark ? "text-white" : "text-black"}`}>
                  {creative.name}
                </h3>
                <span className="bg-[#16A34A] text-[#fff] text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize">
                  {creative.status}
                </span>
              </div>

              <div className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-all ${isSelected ? 'bg-[#E8D1AB] border-[#E8D1AB]' : (isDark ? 'bg-transparent border-white/20' : 'bg-transparent border-black/20')}`}>
                {isSelected && <Check size={18} className="text-black stroke-[3px]" />}
              </div>
            </div>

            <div className={`flex gap-4 text-sm border-t pt-3 w-full transition-colors ${isDark ? "border-white/5" : "border-gray-100"} flex-row`}>
              <div>
                <p className={`text-xs mb-0.5 ${isDark ? "text-[#AAA7A7]" : "text-black/50"}`}>Experience:</p>
                <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{(creative.shoots || 0)} Yrs</p>
              </div>
              <div className={`md:border-x md:px-6 transition-colors ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <p className={`text-xs mb-0.5 ${isDark ? "text-[#AAA7A7]" : "text-black/50"}`}>Specialities:</p>
                <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{creative.specialities}</p>
              </div>
              <div className="md:pl-6">
                <p className={`text-xs mb-0.5 ${isDark ? "text-[#AAA7A7]" : "text-black/50"}`}>Location:</p>
                <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{formatLocation(creative.location)}</p>
              </div>
            </div>

            <div className="mt-auto pt-4 w-full flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile();
                }}
                className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors w-full md:w-auto ${isDark ? "bg-[#E8D1AB] text-black hover:bg-[#d9bc90]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"}`}
              >
                View Profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


