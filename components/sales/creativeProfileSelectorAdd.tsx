import React, { useState, useEffect, useMemo } from 'react';
import { salesApi, ROLE_MAP } from '@/lib/api';
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

export const CreativeProfileSelectorAdd = ({
    selectedIds: externalSelectedIds,
    onChange,
    leadId,
    currentLocation, 
    targets          
}: {
    selectedIds?: number[],
    onChange?: (ids: number[]) => void,
    leadId?: number | string,
    currentLocation?: string,
    targets?: { videographer: number, photographer: number }
} = {}) => {
    const [internalSelectedIds, setInternalSelectedIds] = useState<number[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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
        const fetchStats = async () => {
            if (leadId) {
                try {
                    const response = await salesApi.getLeadStats(leadId);
                    if (response && response.data) {
                        setStats(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch lead stats", error);
                }
            }
        };
        fetchStats();
    }, [leadId]);

    useEffect(() => {
        const fetchCreatives = async () => {
            const location = currentLocation || stats?.location;

            if (!leadId || (!location && !debouncedSearch)) {
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

                const response = await salesApi.getCrewForLead({
                    lead_id: leadId,
                    role_type: roleType,
                    search_query: debouncedSearch || city
                });

                if (response && response.data) {
                    const formattedCreatives = response.data.map((item: any) => ({
                        id: item.crew_member_id,
                        name: `${item.first_name} ${item.last_name}`,
                        status: item.is_active ? "Active" : "Inactive",
                        shoots: item.years_of_experience || 0,
                        // Use the mapped role from your API response
                        specialities: item.role || "Creative",
                        availability: item.availability || "Available",
                        // Map the profile photo from API
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
    }, [leadId, stats?.location, currentLocation, roleType, debouncedSearch]);

    const selectedIds = externalSelectedIds || internalSelectedIds;

    // Helper to count how many of the selected IDs belong to the current role type
    // This looks at the 'creatives' currently loaded to check their roles
    const currentSelectionCount = useMemo(() => {
        return creatives.filter(c => 
            selectedIds.includes(c.id) && 
            c.specialities.toLowerCase().includes(roleType === 'videographer' ? 'video' : 'photo')
        ).length;
    }, [selectedIds, creatives, roleType]);

    const toggleSelection = (id: number) => {
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
        <div className="text-white">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h3 className="text-xl font-medium text-white/90 mb-6">Select Creative Profile</h3>

                <div className="flex gap-3">
                    <div
                        onClick={() => setRoleType('videographer')}
                        className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors ${roleType === 'videographer' ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]' : 'bg-[#1A1A1A] border-white/10 text-white/70'}`}
                    >
                        <Video size={16} />
                        <span>
                            Videographer(s) : {roleType === 'videographer' ? currentSelectionCount : (stats?.fulfillment_stats?.videographer?.split('/')[0] || 0)}/{targets?.videographer || stats?.fulfillment_stats?.videographer?.split('/')[1] || '0'}
                        </span>
                    </div>
                    <div
                        onClick={() => setRoleType('photographer')}
                        className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors ${roleType === 'photographer' ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]' : 'bg-[#1A1A1A] border-white/10 text-white/70'}`}
                    >
                        <Camera size={16} />
                        <span>
                            Photographers(s) : {roleType === 'photographer' ? currentSelectionCount : (stats?.fulfillment_stats?.photographer?.split('/')[0] || 0)}/{targets?.photographer || stats?.fulfillment_stats?.photographer?.split('/')[1] || '0'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#E8D1AB]/50 transition-all"
                    />
                </div>
                {/* FILTER TRIGGER */}
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-6 py-3 rounded-xl hover:bg-white/5 transition-all active:scale-95"
                >
                    <SlidersHorizontal size={18} />
                    <span>Filters</span>
                </button>
            </div>

            {/* Creative List Container */}
            <div className="bg-[#101010] border border-white/5 rounded-2xl p-4 md:p-8 space-y-4 lg:space-y-8">
                {isLoading ? (
                    <div className="text-white/50 text-center py-8">Loading creatives...</div>
                ) : creatives.length > 0 ? (
                    creatives.map((creative, index) => (
                        <div
                            key={creative.id || index}
                            className="flex flex-col gap-4 lg:gap-8"
                        >
                            <CreativeCard
                                creative={creative}
                                isSelected={selectedIds.includes(creative.id)}
                                onToggle={() => toggleSelection(creative.id)}
                            />
                            {index !== creatives.length - 1 && <Separator />}
                        </div>
                    ))
                ) : (
                    <div className="text-white/50 text-center py-8">No creatives found for {roleType} in this location.</div>
                )}
            </div>

            {/* SIDEBAR COMPONENT */}
            <CreativeFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
};

const CreativeCard = ({ creative, isSelected, onToggle }: any) => {
    return (
        <div
            onClick={onToggle}
            className={`relative group flex flex-col md:flex-row items-center md:items-start gap-6 rounded-2xl cursor-pointer transition-all duration-300 border p-4 ${
                isSelected 
                    ? 'bg-white/[0.06] border-[#E8D1AB] scale-[1.02] shadow-[0_0_25px_rgba(232,209,171,0.15)]' 
                    : 'bg-transparent border-transparent hover:border-white/10'
            }`}
        >
            {/* Profile Image */}
            <div className="relative w-20 h-20 lg:w-[146px] lg:h-[156px] flex-shrink-0 transition-transform duration-300">
                <img
                    // Using the API profile photo if available, fallback to mock
                    src={creative.profile_photo || "/images/crew/CREW(6).png"}
                    alt={creative.name}
                    className={`w-full h-full object-cover rounded-lg transition-all duration-500 ${
                        !isSelected ? 'grayscale opacity-60' : 'grayscale-0 opacity-100'
                    }`}
                />
                {/* Subtle inner ring on image when selected */}
                {isSelected && (
                    <div className="absolute inset-0 rounded-lg ring-2 ring-[#E8D1AB]/20" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 w-full">
                <div className="flex justify-between items-center mb-3 lg:mb-5">
                    <div className="flex items-center gap-3">
                        <h3 className={`lg:text-[22px] font-medium transition-colors duration-300 ${
                            isSelected ? 'text-[#E8D1AB]' : 'text-white'
                        }`}>
                            {creative.name}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize transition-colors ${
                            isSelected ? 'bg-[#E8D1AB] text-black' : 'bg-[#16A34A] text-white'
                        }`}>
                            {creative.status}
                        </span>
                    </div>

                    {/* Custom Checkbox with Glow */}
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300 ${
                        isSelected 
                            ? 'bg-[#E8D1AB] border-[#E8D1AB] shadow-[0_0_10px_rgba(232,209,171,0.5)]' 
                            : 'bg-transparent border-white/20'
                    }`}>
                        {isSelected && <Check size={16} className="text-black stroke-[3px]" />}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 md:gap-8 text-sm border-t border-white/5 pt-3 lg:pt-5">
                    <div>
                        <p className="text-[#AAA7A7] mb-1">Experience:</p>
                        <p className={`font-medium transition-colors ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {(creative.shoots || 0)} Years
                        </p>
                    </div>
                    <div className="md:border-x border-white/10 md:px-8">
                        <p className="text-[#AAA7A7] mb-1">Specialities:</p>
                        <p className={`font-medium capitalize transition-colors ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {creative.specialities}
                        </p>
                    </div>
                    <div className="md:pl-2">
                        <p className="text-[#AAA7A7] mb-1">Availability:</p>
                        <div className={`flex items-center gap-2 underline decoration-[#E8D1AB]/30 underline-offset-4 transition-colors ${
                            isSelected ? 'text-[#E8D1AB]' : 'text-[#E8D1AB]/70'
                        }`}>
                            <span>{creative.availability || 'Available'}</span>
                            <Calendar size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {creative.is_beige_member === 1 && (
                <div className="absolute top-4 right-12 bg-[#E8D1AB] text-black text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                    PRO
                </div>
            )}
        </div>
    );
};