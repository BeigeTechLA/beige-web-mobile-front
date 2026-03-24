"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { salesApi, adminApi, ROLE_MAP } from '@/lib/api';
import { Search, SlidersHorizontal, Video, Camera, Calendar, Check } from 'lucide-react';
import { CreativeFilterModal } from './CreativeFilterModal';
import { Separator } from '@/src/components/landing/Separator';

// Mock Data (Kept as per original code)
const CREATIVES = [
    { id: 1, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
    { id: 2, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
    { id: 3, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
    { id: 4, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
    { id: 5, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
];

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const CreativeProfileSelectorAdd = ({
    selectedIds: externalSelectedIds,
    onChange,
    onSelectionUpdate,
    leadId,
    projectId,
    currentLocation,
    targets,
    disableCrewFetch,
    isDark = true
}: {
    selectedIds?: number[],
    onChange?: (ids: number[]) => void,
    onSelectionUpdate?: (counts: { videographer: number, photographer: number }) => void,
    leadId?: number | string,
    projectId?: number | string,
    currentLocation?: string,
    targets?: { videographer: number, photographer: number },
    disableCrewFetch?: boolean, // When true, suppresses the get-crew-for-lead API call
    isDark?: boolean,
} = {}) => {
    const [internalSelectedIds, setInternalSelectedIds] = useState<number[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({ radius: 100 });
    const [stats, setStats] = useState<any>(null);
    const [creatives, setCreatives] = useState<any[]>([]);
    const [roleType, setRoleType] = useState<string>('videographer');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

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
                    const response = await salesApi.getClientLeadStats(leadId);
                    if (response && response.data) {
                        setStats(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch lead stats", error);
                }
            }
        };
        fetchStats();
    }, [leadId, targets]);

    useEffect(() => {
        const fetchCreatives = async () => {
            // Completely skip if disableCrewFetch is true
            if (disableCrewFetch) return;

            const location = currentLocation || stats?.location;

            // Allow search with location even without leadId
            if (!location && !debouncedSearch) {
                return;
            }

            setIsLoading(true);
            try {
                // Extract city logic
                let city = "";
                if (location) {
                    const locationParts = location.split(/[,،]/);
                    city = location;
                    if (locationParts.length > 1) {
                        let candidate = locationParts[1].trim();
                        candidate = candidate.replace(/\d+/g, '').trim();
                        if (candidate) city = candidate;
                    }
                }

                let response;
                if (projectId) {
                    response = await adminApi.getCrewForShoot({
                        project_id: projectId,
                        role_type: roleType,
                        search_query: debouncedSearch || city,
                        radius: appliedFilters.radius
                    });
                } else {
                    response = await salesApi.getCrewForLead({
                        lead_id: leadId || 0,
                        role_type: roleType,
                        search_query: debouncedSearch || city,
                        radius: appliedFilters.radius
                    });
                }

                if (response && response.data) {
                    const formattedCreatives = response.data.map((item: any) => ({
                        id: item.crew_member_id,
                        name: `${item.first_name} ${item.last_name}`,
                        status: item.is_active ? "Active" : "Inactive",
                        shoots: item.years_of_experience || 0,
                        specialities: item.role || "Creative",
                        availability: item.availability || "Available",
                        profile_photo: item.profile_photo,
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
    }, [leadId, stats?.location, currentLocation, roleType, debouncedSearch, appliedFilters.radius]);

    const selectedIds = externalSelectedIds || internalSelectedIds;

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
                <h3 className={`text-xl font-medium transition-colors mb-6 ${isDark ? "text-white/90" : "text-black/90"}`}>
                    Select Creative Profile
                </h3>

                <div className="flex gap-3">
                    {[
                        { type: 'videographer', icon: Video, label: 'Videographer(s)', count: counts.videographer, target: targets?.videographer || stats?.fulfillment_stats?.videographer?.split('/')[1] || '0' },
                        { type: 'photographer', icon: Camera, label: 'Photographers(s)', count: counts.photographer, target: targets?.photographer || stats?.fulfillment_stats?.photographer?.split('/')[1] || '0' }
                    ].map((btn) => (
                        <div
                            key={btn.type}
                            onClick={() => setRoleType(btn.type)}
                            className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm cursor-pointer transition-all duration-300 ${roleType === btn.type
                                // ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]'
                                ?(isDark ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]' : 'bg-[#E8D1AB]/40 border-[#E8D1AB] text-black/70')
                                : (isDark ? 'bg-[#1A1A1A] border-white/10 text-white/70' : 'bg-gray-50 border-[#D8D8D8] text-black/70')
                                }`}
                        >
                            <btn.icon size={16} />
                            <span>{btn.label} : {btn.count}/{btn.target}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full border rounded-xl py-3 pl-10 pr-4 outline-none transition-all ${isDark
                            ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50"
                            : "bg-white border-[#D8D8D8] text-black focus:border-[#E8D1AB]"
                            }`}
                    />
                </div>
                {/* FILTER TRIGGER */}
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className={`flex items-center gap-2 border px-6 py-3 rounded-xl transition-all active:scale-95 ${isDark
                        ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-white/5"
                        : "bg-white border-[#D8D8D8] text-black hover:bg-gray-50"
                        }`}
                >
                    <SlidersHorizontal size={18} />
                    <span>Filters</span>
                </button>
            </div>

            {/* Creative List Container */}
            <div className={`border rounded-2xl p-4 md:p-8 space-y-4 lg:space-y-8 transition-colors ${isDark ? "bg-[#101010] border-white/5" : "bg-white border-[#D8D8D8]"
                }`}>
                {isLoading ? (
                    <div className={`text-center py-8 ${isDark ? "text-white/50" : "text-black/50"}`}>Loading creatives...</div>
                ) : creatives.length > 0 ? (
                    creatives.map((creative, index) => (
                        <div
                            key={creative.id || index}
                            className="flex flex-col"
                        >
                            <CreativeCard
                                creative={creative}
                                isSelected={selectedIds.includes(creative.id)}
                                onToggle={() => toggleSelection(creative.id)}
                                onViewProfile={() => window.open(`/creatives/${creative.id}`, '_blank', 'noopener,noreferrer')}
                                isDark={isDark}
                            />
                            {index !== creatives.length - 1 && <Separator />}
                        </div>
                    ))
                ) : (
                    <div className={`text-center py-8 ${isDark ? "text-white/50" : "text-black/50"}`}>
                        No creatives found for {roleType} in this location.
                    </div>
                )}
            </div>

            {/* SIDEBAR COMPONENT */}
            <CreativeFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(filters) => setAppliedFilters(filters)}
                isDark={isDark}
            />
        </div>
    );
};

const CreativeCard = ({ creative, isSelected, onToggle, onViewProfile, isDark }: any) => {
    return (
        <div
            onClick={onToggle}
            className={`p-2 lg:p-4 relative group flex flex-col md:flex-row items-center md:items-start gap-6 rounded-xl cursor-pointer transition-all border ${isSelected
                    ? (isDark ? 'bg-white/[0.02] border-white/10' : 'bg-[#E8D1AB]/10 border-[#E8D1AB]/30')
                    : 'bg-transparent border-transparent'
                }`}
        >
            {/* Profile Image */}
            <div className="relative w-20 h-25 lg:w-[146px] lg:h-[156px] flex-shrink-0">
                {creative.profile_photo ? (
                    <img
                        src={`${S3_PREFIX}${creative.profile_photo}`}
                        alt={creative.name}
                        className="w-full h-full object-cover rounded-lg"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#E8D1AB] rounded-lg text-black text-2xl lg:text-4xl font-bold">
                        {creative.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 w-full">
                <div className="flex justify-between items-center mb-3 lg:mb-5">
                    <div className="flex items-center gap-3">
                        <h3 className={`lg:text-[22px] transition-colors ${isDark ? "text-white" : "text-black"}`}>
                            {creative.name}
                        </h3>
                        <span className="bg-[#16A34A] text-[#fff] text-xs font-semibold px-2 py-0.5 rounded-lg capitalize">
                            {creative.status}
                        </span>
                    </div>

                    <div className="flex items-center">
                        {/* Custom Checkbox */}
                        <div className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-all ${isSelected ? 'bg-[#E8D1AB] border-[#E8D1AB]' : (isDark ? 'bg-transparent border-white/20' : 'bg-transparent border-black/20')
                            }`}>
                            {isSelected && <Check size={16} className="text-black stroke-[3px]" />}
                        </div>
                    </div>
                </div>

                <div className={`flex flex-col lg:flex-row gap-4 md:gap-8 text-sm border-t pt-3 lg:pt-5 transition-colors ${isDark ? "border-white/5" : "border-gray-100"}`}>
                    <div>
                        <p className={`mb-1 ${isDark ? "text-[#AAA7A7]" : "text-black/50"}`}>Experience:</p>
                        <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{(creative.shoots || 0)} Years</p>
                    </div>
                    <div className={`md:border-x-2 md:px-8 transition-colors ${isDark ? "border-[#E0E0E0]/10" : "border-gray-200"}`}>
                        <p className={`mb-1 ${isDark ? "text-[#AAA7A7]" : "text-black/50"}`}>Specialities:</p>
                        <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{creative.specialities}</p>
                    </div>
                </div>

                <div className="flex justify-end mt-4 lg:mt-6">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile();
                        }}
                        className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors ${
                            isDark ? "bg-[#E8D1AB] text-black hover:bg-[#d9bc90]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                        }`}
                    >
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    );
};