"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, Video, Camera, Check, Info, Calendar } from 'lucide-react';
import { salesApi, ROLE_MAP } from '@/lib/api';
import { Separator } from '@/src/components/landing/Separator';
import { CreativeFilterModal } from './CreativeFilterModal';

interface CreativeProfileSelectorProps {
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    leadId: string | number;
    currentLocation?: string;
    targets: {
        videographer: number;
        photographer: number;
    };
}

export const CreativeProfileSelectorAddEdit = ({
    selectedIds = [],
    onChange,
    leadId,
    currentLocation = "",
    targets
}: CreativeProfileSelectorProps) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [creatives, setCreatives] = useState<any[]>([]);
    const [roleType, setRoleType] = useState<'videographer' | 'photographer'>('videographer');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search query to avoid excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Creatives logic
    useEffect(() => {
        const fetchCreatives = async () => {
            if (!leadId) return;
            
            setIsLoading(true);
            try {
                // Extract City from Location (e.g., "Dubai, United Arab Emirates" -> "Dubai")
                const locationParts = currentLocation.split(/[,،]/);
                let cityHint = "";
                if (locationParts.length > 0) {
                    cityHint = locationParts[0].trim().replace(/\d+/g, '');
                }

                const response = await salesApi.getCrewForLead({
                    lead_id: leadId,
                    role_type: roleType,
                    search_query: debouncedSearch || cityHint
                });

                if (response && response.data) {
                    const formatted = response.data.map((item: any) => {
                        // Role logic: use role string or parse primary_role ID
                        let displayRole = item.role ? (item.role.charAt(0).toUpperCase() + item.role.slice(1)) : "Creative";
                        
                        if (!item.role && item.primary_role) {
                            try {
                                const parsed = JSON.parse(item.primary_role);
                                const roleId = Array.isArray(parsed) ? parseInt(parsed[0]) : parseInt(parsed);
                                displayRole = ROLE_MAP[roleId] || "Creative";
                            } catch (e) { console.error("Role parse error", e); }
                        }

                        return {
                            ...item,
                            id: item.crew_member_id,
                            name: `${item.first_name} ${item.last_name}`,
                            status: item.is_active ? "Active" : "Inactive",
                            specialities: displayRole,
                        };
                    });
                    setCreatives(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch creatives", error);
                setCreatives([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCreatives();
    }, [leadId, currentLocation, roleType, debouncedSearch]);

    // Calculate how many of the currently selected IDs belong to which category
    // Note: This only counts creatives that have been loaded via the API at least once
    const counts = useMemo(() => {
        // We track the roles of all creatives we've seen to properly categorize selected IDs
        // In a real app, you might need a separate API call to get roles for already selected IDs
        const selectedVideoCount = creatives.filter(c => 
            selectedIds.includes(c.id) && c.specialities.toLowerCase().includes('video')
        ).length;

        const selectedPhotoCount = creatives.filter(c => 
            selectedIds.includes(c.id) && c.specialities.toLowerCase().includes('photo')
        ).length;

        return {
            videographer: selectedVideoCount,
            photographer: selectedPhotoCount
        };
    }, [selectedIds, creatives]);

    const toggleSelection = (id: number) => {
        const nextIds = selectedIds.includes(id)
            ? selectedIds.filter(item => item !== id)
            : [...selectedIds, id];
        onChange(nextIds);
    };

    return (
        <div className="text-white mt-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-medium text-white/90">Select Creative Profile</h3>
                    <p className="text-sm text-white/40 mt-1">Showing talent near {currentLocation.split(',')[0] || 'location'}</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setRoleType('videographer')}
                        className={`flex items-center gap-3 border px-4 py-3 rounded-xl text-sm transition-all ${
                            roleType === 'videographer' 
                            ? 'bg-[#E8D1AB] text-black border-[#E8D1AB]' 
                            : 'bg-[#1A1A1A] border-white/10 text-white/70'
                        }`}
                    >
                        <Video size={18} />
                        <span className="font-semibold">
                            Videographers: {counts.videographer}/{targets.videographer}
                        </span>
                    </button>
                    
                    <button
                        onClick={() => setRoleType('photographer')}
                        className={`flex items-center gap-3 border px-4 py-3 rounded-xl text-sm transition-all ${
                            roleType === 'photographer' 
                            ? 'bg-[#E8D1AB] text-black border-[#E8D1AB]' 
                            : 'bg-[#1A1A1A] border-white/10 text-white/70'
                        }`}
                    >
                        <Camera size={18} />
                        <span className="font-semibold">
                            Photographers: {counts.photographer}/{targets.photographer}
                        </span>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${roleType}s by name or skill...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#E8D1AB]/50 transition-all"
                    />
                </div>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all"
                >
                    <SlidersHorizontal size={20} />
                    <span>Filters</span>
                </button>
            </div>

            {/* Creative List Container */}
            <div className="bg-[#151515] border border-white/5 rounded-3xl p-2 md:p-6 min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E8D1AB]"></div>
                        <p className="text-white/40">Searching for creatives...</p>
                    </div>
                ) : creatives.length > 0 ? (
                    <div className="space-y-2">
                        {creatives.map((creative, index) => (
                            <React.Fragment key={creative.id}>
                                <CreativeCard
                                    creative={creative}
                                    isSelected={selectedIds.includes(creative.id)}
                                    onToggle={() => toggleSelection(creative.id)}
                                />
                                {index !== creatives.length - 1 && (
                                    <div className="mx-4 opacity-20">
                                        <Separator />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="text-white/30 flex flex-col items-center justify-center py-20">
                        <Info size={48} className="mb-4 opacity-10" />
                        <p className="text-lg">No {roleType}s found matching your criteria.</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

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