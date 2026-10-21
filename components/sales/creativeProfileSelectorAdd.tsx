"use client";

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { salesApi, adminApi } from '@/lib/api';
import { Search, SlidersHorizontal, Check, Loader2, List, LayoutGrid, ChevronDown, ChevronRight, Share } from 'lucide-react';
import { CreativeFilterModal, CREATIVE_RADIUS_OPTIONS } from './CreativeFilterModal';
import { Separator } from '@/src/components/landing/Separator';

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";
const DEFAULT_RADIUS = 50;
const OVER_200_BUCKET = 250;

// Full profile page for a CP (also used for the share link)
const getCreativeProfilePath = (id: number | string) => `/creatives/${id}`;

type CreativeWithDistance = {
  id: number;
  crew_member_id?: number;
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
  distance?: number | string;
  distanceBucket?: number | "traveling" | null;
};

type RadiusBucket = {
  lowerBound: number;
  upperBound: number;
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
  distance?: number | string;
  years_of_experience?: number;
  assigned_shoots?: number;
  hourly_rate?: number | string;
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
  onViewBriefProfile: () => void;
  onViewFullProfile: () => void;
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
  onSelectedCreativesChange,
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
  onViewBriefProfile,
}: {
  selectedIds?: number[],
  onChange?: (ids: number[]) => void,
  onSelectionUpdate?: (counts: { videographer: number, photographer: number }) => void,
  onSelectedCreativesChange?: (creatives: CreativeWithDistance[]) => void,
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
  /** "View Brief Profile" – e.g. open a quick-view drawer. Defaults to the profile page with ?view=brief */
  onViewBriefProfile?: (creative: CreativeWithDistance) => void,
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

  const gridBucketLimits = useMemo(
    () => {
      if (hasActiveSearch) {
        return CREATIVE_RADIUS_OPTIONS;
      }

      return activeBucketLimits;
    },
    [activeBucketLimits, hasActiveSearch]
  );

  useEffect(() => {
    setExpandedBuckets(gridBucketLimits);
  }, [gridBucketLimits]);

  const parseDistance = (distance?: number | string) => {
    if (typeof distance === "number" && Number.isFinite(distance)) {
      if (distance <= 10) return 10;
      if (distance <= 50) return 50;
      if (distance <= 100) return 100;
      if (distance <= 150) return 150;
      if (distance <= 200) return 200;
      return OVER_200_BUCKET;
    }

    if (typeof distance === "string") {
      const normalized = distance.toLowerCase().trim();
      if (!normalized) {
        return null;
      }

      const parsed = Number.parseFloat(normalized);
      if (!Number.isFinite(parsed)) {
        return null;
      }
      if (parsed <= 10) return 10;
      if (parsed <= 50) return 50;
      if (parsed <= 100) return 100;
      if (parsed <= 150) return 150;
      if (parsed <= 200) return 200;
      return OVER_200_BUCKET;
    }

    return null;
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
            radius: debouncedSearch ? 99999 : appliedFilters.radius
          });
        } else {
          response = await salesApi.getCrewForLead({
            lead_id: leadId || 0,
            role_type: roleType,
            search_query: debouncedSearch || undefined,
            radius: debouncedSearch ? 99999 : appliedFilters.radius,
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
            assigned_shoots: Number(item.assigned_shoots ?? 0) || 0,
            hourly_rate: item.hourly_rate,
            specialities: item.role || "Creative",
            availability: item.availability || "Available",
            location: item.location || item.old_location || "",
            profile_photo: item.profile_photo,
            latitude: item.latitude,
            longitude: item.longitude,
            distance: item.distance,
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

  useEffect(() => {
    if (!onSelectedCreativesChange) return;
    onSelectedCreativesChange(creatives.filter((creative) => selectedIds.includes(creative.id)));
  }, [creatives, onSelectedCreativesChange, selectedIds]);

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

    return gridBucketLimits.map((upperBound, index) => {
      const lowerBound = index === 0 ? 0 : gridBucketLimits[index - 1];
      const label = upperBound === OVER_200_BUCKET ? "200+ miles" : `${lowerBound}-${upperBound} miles`;

      const items = filteredCreatives
        .map((creative) => ({
          ...creative,
          distanceBucket: parseDistance(creative.distance),
        }))
        .filter((creative) => creative.distanceBucket === upperBound);

      return { lowerBound, upperBound, label, items };
    });
  }, [filteredCreatives, gridBucketLimits, viewMode]);

  const radiusFilteredCreatives = useMemo(() => {
    if (debouncedSearch) return filteredCreatives;
    return filteredCreatives.filter((creative) => {
      const bucket = parseDistance(creative.distance);

      if (bucket === null) {
        return false;
      }

      return bucket <= appliedFilters.radius;
    });
  }, [appliedFilters.radius, debouncedSearch, filteredCreatives]);

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

  const openFullProfile = (creative: CreativeWithDistance) =>
    window.open(getCreativeProfilePath(creative.id), '_blank', 'noopener,noreferrer');

  const openBriefProfile = (creative: CreativeWithDistance) => {
    if (onViewBriefProfile) {
      onViewBriefProfile(creative);
      return;
    }
    window.open(`${getCreativeProfilePath(creative.id)}?view=brief`, '_blank', 'noopener,noreferrer');
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
          <div className={`hidden md:flex border rounded-xl overflow-hidden ${isDark ? "border-white/10" : "border-[#D8D8D8]"}`}>
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
          </div>
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
            : `Showing available CPs around the shoot location within ${appliedFilters.radius === OVER_200_BUCKET ? "200+ miles" : `${appliedFilters.radius} miles`}.`}
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
          groupedCreatives.length > 0 ? (
            <>
              {groupedCreatives.map((bucket) => {
                const isExpanded = expandedBuckets.includes(bucket.upperBound);
                const isEmptyBucket = bucket.items.length === 0;

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

                    {(isExpanded || isEmptyBucket) && (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 px-4 pb-4 md:px-6 md:pb-6">
                        {bucket.items.length > 0 ? (
                          bucket.items.map((creative, index) => (
                            <CreativeCard
                              key={`${creative.id}-${index}`}
                              creative={creative}
                              isSelected={selectedIds.includes(creative.id)}
                              onToggle={() => toggleSelection(creative.id)}
                              onViewBriefProfile={() => openBriefProfile(creative)}
                              onViewFullProfile={() => openFullProfile(creative)}
                              isDark={isDark}
                              viewMode="grid"
                            />
                          ))
                        ) : (
                          <div className={`col-span-full rounded-2xl border border-dashed px-6 py-10 text-center ${isDark ? "border-white/10 text-white/50" : "border-black/10 text-black/50"
                            }`}>
                            No creative found in this range.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                onViewBriefProfile={() => openBriefProfile(creative)}
                onViewFullProfile={() => openFullProfile(creative)}
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
/* ------------------------------------------------------------------ */
/* Card helpers                                                        */
/* ------------------------------------------------------------------ */

const formatHourlyRate = (rate?: number | string) => {
  const n = typeof rate === "string" ? Number.parseFloat(rate) : rate;
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}/hr`;
};

const getInitials = (name?: string) =>
  (name || "").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

// Share: native share sheet where available (mobile), otherwise copy the profile link
const ShareButton = ({ creative, isDark, size = 20 }: { creative: CreativeWithDistance; isDark?: boolean; size?: number }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${getCreativeProfilePath(creative.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: creative.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // share sheet dismissed / clipboard blocked: nothing to do
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Profile link copied" : `Share ${creative.name}'s profile`}
      title={copied ? "Link copied" : "Share profile"}
      className={`shrink-0 p-1 -m-1 rounded-md transition-colors ${isDark ? "text-white/90 hover:text-[#E8D1AB]" : "text-black/80 hover:text-[#9C7B45]"}`}
    >
      {copied ? <Check size={size} strokeWidth={2.25} /> :
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M11.1002 3C7.45057 3.00657 5.53942 3.09617 4.31806 4.31754C3 5.63559 3 7.75698 3 11.9997C3 16.2425 3 18.3639 4.31806 19.6819C5.63611 21 7.75749 21 12.0003 21C16.243 21 18.3644 21 19.6825 19.6819C20.9038 18.4606 20.9934 16.5494 21 12.8998" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="white" />
            <path d="M20.9995 6.02529L20 6.02276C16.2634 6.01331 14.3951 6.00859 13.0817 6.95266C12.6452 7.26639 12.2622 7.64845 11.9474 8.08412C11 9.39515 11 11.2634 11 15M20.9995 6.02529C21.0062 5.86266 20.9481 5.69906 20.8251 5.55333C20.0599 4.64686 18.0711 3 18.0711 3M20.9995 6.02529C20.9934 6.17112 20.9352 6.31616 20.8249 6.44681C20.0596 7.3531 18.0711 9 18.0711 9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="white" />
          </svg>
        </>
      }
    </button>
  );
};

// "View CP Profile ⌄" -> Brief Profile / Full Profile. The menu is portalled so the
// grid card's overflow-hidden (needed for the rounded photo) can't clip it.
const ViewProfileMenu = ({
  onViewBrief,
  onViewFull,
  fullWidth,
}: {
  onViewBrief: () => void;
  onViewFull: () => void;
  fullWidth?: boolean;
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, 240);
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    const menuHeight = menuRef.current?.offsetHeight ?? 112;
    // open below; flip above when there isn't room
    const below = rect.bottom + 8;
    const top = below + menuHeight > window.innerHeight - 8 ? rect.top - menuHeight - 8 : below;
    setPos({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onMove = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const choose = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex h-12 items-center justify-between rounded-lg bg-[#E8D1AB] pl-4 pr-3 text-sm font-medium text-black transition-colors hover:bg-[#EEDCBC] ${fullWidth ? "w-full" : "w-full md:w-[196px]"}`}
      >
        <span>View CP Profile</span>
        <span className="flex items-center gap-3">
          <span className="h-4 w-px bg-black/25" aria-hidden="true" />
          <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[200] overflow-hidden rounded-lg bg-[#E8D1AB] text-black shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: pos?.width ?? 240 }}
        >
          {[
            { label: "View Brief Profile", action: onViewBrief },
            { label: "View Full Profile", action: onViewFull },
          ].map((item, i) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={choose(item.action)}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-black/5 ${i > 0 ? "border-t border-black/20" : ""}`}
            >
              <span>{item.label}</span>
              <span className="flex items-center gap-3">
                <span className="h-5 w-px bg-black/25" aria-hidden="true" />
                <ChevronRight size={18} />
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

const CreativeCard = ({ creative, isSelected, onToggle, onViewBriefProfile, onViewFullProfile, isDark, viewMode }: CreativeCardProps) => {
  const isGrid = viewMode === 'grid';
  const imageSrc = creative.profile_photo
    ? (creative.profile_photo.startsWith('http') ? creative.profile_photo : `${S3_PREFIX}${creative.profile_photo}`)
    : null;
  const assignedShoots = Number(creative.assigned_shoots ?? 0) || 0;
  const assignedShootsLabel = `${String(assignedShoots).padStart(2, '0')} Shoot${assignedShoots === 1 ? '' : 's'}`;
  const hourlyRate = formatHourlyRate(creative.hourly_rate);
  const locationLabel = formatLocation(creative.location);
  const hasLocation = locationLabel !== "N/A";

  const labelCls = `text-xs lg:text-sm ${isDark ? "text-[#AAA7A7]" : "text-zinc-500"}`;
  const valueCls = `text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`;
  const dividerCls = isDark ? "bg-white/25" : "bg-[#D8D8D8]";

  const locationNode = hasLocation ? (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`text-xs lg:text-sm underline underline-offset-2 ${isDark ? "text-[#E8D1AB] decoration-[#E8D1AB]/60" : "text-[#9C7B45] decoration-[#9C7B45]/60"}`}
    >
      {locationLabel}
    </a>
  ) : (
    <p className={valueCls}>N/A</p>
  );

  const checkbox = (size: string) => (
    <div
      className={`${size} shrink-0 rounded-sm border flex items-center justify-center transition-all ${isSelected ? 'bg-[#E8D1AB] border-[#E8D1AB]' : (isDark ? 'bg-black/20 border-white/30' : 'bg-white border-black/25')}`}
      aria-hidden="true"
    >
      {isSelected && <Check size={16} className="text-black stroke-[3px]" />}
    </div>
  );

  const nameRow = (nameSize: string) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <h3 className={`truncate font-medium leading-tight ${nameSize} ${isDark ? "text-white" : "text-black"}`}>
        {creative.name}
      </h3>
      {creative.status && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] lg:text-xs font-semibold leading-tight text-white ${creative.status === "Active" ? "bg-[#16A34A]" : "bg-zinc-500"}`}>
          {creative.status}
        </span>
      )}
      <ShareButton creative={creative} isDark={isDark} />
    </div>
  );

  const rate = hourlyRate && (
    <p className={`mt-1 ${isGrid ? "text-base lg:text-lg" : "text-base lg:text-xl font-medium"} leading-tight ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>
      {hourlyRate}
    </p>
  );

  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`relative group flex transition-all border rounded-lg lg:rounded-2xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E8D1AB]/60 ${isGrid ? "flex-col h-full overflow-hidden p-0" : "p-4 flex-col md:flex-row items-stretch gap-4 lg:gap-6"
        } ${isGrid
          ? (isSelected
            ? (isDark ? 'bg-[#1A1919] border-[#E8D1AB]' : 'bg-[#E8D1AB]/5 border-[#E8D1AB]')
            : (isDark ? 'bg-[#1A1919] border-transparent hover:border-[#E8D1AB]/10' : 'bg-white border-[#E5E5E5] hover:bg-gray-50'))
          : (isDark ? 'bg-transparent border-transparent hover:bg-white/[0.02]' : 'bg-transparent border-transparent hover:bg-gray-50')
        }`}
    >
      {isGrid ? (
        <>
          {/* Photo with name / status / share / checkbox over the bottom fade */}
          <div className="relative aspect-[350/300] w-full overflow-hidden">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={creative.name}
                className={`h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] ${!isSelected ? 'grayscale-[0.15]' : ''}`}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#2A241A] to-[#0F0F0F] text-white text-xl lg:text-3xl font-semibold">
                {getInitials(creative.name)}
              </div>
            )}
            <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-25 bg-gradient-to-t ${isDark ? "from-[#1A1919] via-[#1A1919]/85" : "from-white via-white/80"} to-transparent`} />
          </div>

          <div className="relative z-10 -mt-12 flex w-full flex-1 flex-col px-4 pb-4 lg:px-5 lg:pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {nameRow("text-base lg:text-xl")}
                {rate}
              </div>
              {checkbox("w-6 h-6")}
            </div>

            <div className={`my-3 lg:my-5 h-px w-full ${isDark ? "bg-white/10" : "bg-[#E5E5E5]"}`} />

            {/* Assigned Shoots | Roles */}
            <div className="grid grid-cols-[auto_auto_1fr] items-start gap-x-4 lg:gap-x-8">
              <div>
                <p className={labelCls}>Assigned Shoots:</p>
                <p className={valueCls}>{assignedShootsLabel}</p>
              </div>
              <div className={`mt-2 h-6 w-px ${dividerCls}`} />
              <div className="min-w-0">
                <p className={labelCls}>Roles:</p>
                <p className={valueCls}>{creative.specialities}</p>
              </div>
            </div>

            <div className="mt-3">
              <p className={labelCls}>Location:</p>
              {locationNode}
            </div>

            <div className="mt-auto pt-4">
              <ViewProfileMenu onViewBrief={onViewBriefProfile} onViewFull={onViewFullProfile} fullWidth />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Profile Image */}
          <div className="relative flex-shrink-0 self-center md:self-start w-24 h-24 lg:w-[146px] lg:h-[156px]">
            {imageSrc ? (
              <img src={imageSrc} alt={creative.name} className="w-full h-full object-cover object-top rounded-lg" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E8D1AB] rounded-lg text-black text-lg lg:text-2xl font-bold">
                {getInitials(creative.name)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 w-full flex flex-col">
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="min-w-0">
                {nameRow("text-lg lg:text-2xl")}
                {rate}
              </div>
              {checkbox("w-7 h-7 lg:w-8 lg:h-8")}
            </div>

            <div className={`my-3 lg:my-4 h-px w-full ${isDark ? "bg-white/10" : "bg-gray-100"}`} />

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between w-full">
              {/* Assigned Shoots | Roles | Location */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:items-start sm:gap-x-0">
                <div className="pr-3 lg:pr-7">
                  <p className={labelCls}>Assigned Shoots:</p>
                  <p className={valueCls}>{assignedShootsLabel}</p>
                </div>
                <div className={`hidden sm:block mt-3 h-6 w-px ${dividerCls}`} />
                <div className="px-3 lg:px-7 min-w-0">
                  <p className={labelCls}>Roles:</p>
                  <p className={valueCls}>{creative.specialities}</p>
                </div>
                <div className={`hidden sm:block mt-3 h-6 w-px ${dividerCls}`} />
                <div className="col-span-2 pl-3 lg:pl-7 min-w-0">
                  <p className={labelCls}>Location:</p>
                  {locationNode}
                </div>
              </div>

              <div className="shrink-0">
                <ViewProfileMenu onViewBrief={onViewBriefProfile} onViewFull={onViewFullProfile} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
