"use client";

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Video, Camera, Calendar, Check, Loader2 } from 'lucide-react';
import { CreativeFilterModal } from './CreativeFilterModal';
import { Separator } from '@/src/components/landing/Separator';

// Types for the creative data
export interface CreativeData {
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
  rating?: number | string;
  hourly_rate?: number | string;
  is_beige_member?: number;
  profile_image?: string;
  profile_photo?: string;
}

export interface CreativeProfileSelectorProps {
  selectedIds?: number[];
  onChange?: (ids: number[]) => void;
  creatives?: CreativeData[];
  isLoading?: boolean;
  emptyMessage?: string;
  videographerCount?: number; // This is the Required count
  photographerCount?: number; // This is the Required count
  onSelectionUpdate?: (counts: { videographer: number, photographer: number }) => void;
  isDark?: boolean;
}

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

// Mock Data for backward compatibility
const MOCK_CREATIVES: CreativeData[] = [
  { id: 1, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
  { id: 2, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
  { id: 3, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
  { id: 4, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
  { id: 5, name: "Ethan Cole", status: "Active", shoots: 5, specialities: "Videography & Photography", availability: "16 February, 2026 Hours" },
];

export const CreativeProfileSelector = ({
  selectedIds = [],
  onChange,
  creatives,
  isLoading = false,
  emptyMessage = "No matching professionals found for this selection.",
  videographerCount = 0,
  photographerCount = 0,
  onSelectionUpdate,
    isDark = true, // Added isDark prop
}: CreativeProfileSelectorProps) => {
  const [internalSelectedIds, setInternalSelectedIds] = useState<number[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentSelectedIds = selectedIds || internalSelectedIds;

  // Use provided creatives or fall back to mock data
  const displayCreatives = creatives || MOCK_CREATIVES;

  // Logic to count currently selected creatives by role
  const selectedDetails = useMemo(() => {
    const list = displayCreatives.filter(c => currentSelectedIds.includes(c.id));
    return {
      v: list.filter(c => (c.role || c.specialities || "").toLowerCase().includes("video")).length,
      p: list.filter(c => (c.role || c.specialities || "").toLowerCase().includes("photo")).length,
      total: currentSelectedIds.length
    };
  }, [currentSelectedIds, displayCreatives]);

  // Notify parent of count updates
  React.useEffect(() => {
    if (onSelectionUpdate) {
      onSelectionUpdate({ videographer: selectedDetails.v, photographer: selectedDetails.p });
    }
  }, [selectedDetails.v, selectedDetails.p, onSelectionUpdate]);

  const toggleSelection = (id: number) => {
    const nextIds = currentSelectedIds.includes(id)
      ? currentSelectedIds.filter(item => item !== id)
      : [...currentSelectedIds, id];

    if (onChange) {
      onChange(nextIds);
    } else {
      setInternalSelectedIds(nextIds);
    }
  };

  const filteredCreatives = displayCreatives.filter(c => {
    if (!searchQuery) return true;
    const fullName = `${c.first_name || ''} ${c.last_name || ''} ${c.name || ''}`.toLowerCase();
    const location = (c.location || '').toLowerCase();
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || location.includes(search);
  });
  // Transform API data to display format
  const transformCreativeData = (creative: CreativeData) => {
    if (creative.first_name || creative.last_name) {
      return {
        id: creative.id,
        name: `${creative.first_name || ''} ${creative.last_name || ''}`.trim(),
        status: creative.status || 'Active',
        shoots: creative.assigned_shoots || creative.shoots || 0,
        specialities: creative.role || creative.specialities || 'Videography & Photography',
        availability: creative.availability || 'Available',
        location: creative.location,
        rating: creative.rating || '5.0',
        hourly_rate: creative.hourly_rate,
        is_beige_member: creative.is_beige_member,
        profile_image: creative.profile_photo || creative.profile_image,
      };
    }
    return {
      id: creative.id,
      name: creative.name || 'Unknown',
      status: creative.status || 'Active',
      shoots: creative.shoots || 0,
      specialities: creative.specialities || 'Videography & Photography',
      availability: creative.availability || 'Available',
      location: creative.location,
      rating: creative.rating || '5.0',
      hourly_rate: creative.hourly_rate,
      is_beige_member: creative.is_beige_member,
      profile_image: creative.profile_photo || creative.profile_image,
    };
  };

  return (
    <div className={isDark ? "text-white" : "text-[#2C2C2C]"}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h3 className={`text-xl font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>
            Select Creative Profile
        </h3>

        <div className="flex gap-3">
          <div className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors ${
              isDark ? "bg-[#1A1A1A] border-white/10 text-white/70" : "bg-black/5 border-[#0000004D] text-black/70"
            }`}>
            <Video size={16} className={selectedDetails.v >= videographerCount && videographerCount > 0 ? "text-green-500" : (isDark ? "text-white/70" : "text-black/70")} />
            <span>Videographer(s) : {selectedDetails.v.toString()}/{videographerCount.toString()}</span>
          </div>
          <div className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors ${
              isDark ? "bg-[#1A1A1A] border-white/10 text-white/70" : "bg-black/5 border-[#0000004D] text-black/70"
            }`}>
            <Camera size={16} className={selectedDetails.p >= photographerCount && photographerCount > 0 ? "text-green-500" : (isDark ? "text-white/70" : "text-black/70")} />
            <span>Photographers(s) : {selectedDetails.p.toString()}/{photographerCount.toString()}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/40" : "text-black/40"}`} size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className={`w-full border rounded-xl py-3 pl-10 pr-4 outline-none transition-all ${
              isDark ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-white/40 focus:border-[#E8D1AB]/50" : "bg-white border-[#0000004D] text-black placeholder:text-black/40 focus:border-black/40"
            }`}
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex items-center gap-2 border px-6 py-3 rounded-xl transition-all active:scale-95 ${
            isDark ? "bg-[#1A1A1A] border-white/10 hover:bg-white/5" : "bg-white border-[#0000004D] hover:bg-black/5"
          }`}
        >
          <SlidersHorizontal size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Creative List Container */}
      <div className={`border rounded-2xl p-4 md:p-8 space-y-4 lg:space-y-8 transition-colors ${
        isDark ? "bg-[#101010] border-white/5" : "bg-white border-black/10 shadow-sm"
      }`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="animate-spin text-[#E8D1AB] mb-4" size={32} />
            <p className={isDark ? "text-white/40" : "text-black/40"}>Loading available creatives...</p>
          </div>
        ) : filteredCreatives.length > 0 ? (
          filteredCreatives.map((creative, index) => {
            const transformedCreative = transformCreativeData(creative);
            return (
              <div
                key={creative.id}
                className="flex flex-col gap-4 lg:gap-8"
              >
                <CreativeCard
                  creative={transformedCreative}
                  isSelected={currentSelectedIds.includes(creative.id)}
                  onToggle={() => toggleSelection(creative.id)}
                  onViewProfile={() => window.open(`/creatives/${creative.id}`, '_blank', 'noopener,noreferrer')}
                  isDark={isDark}
                />
                {index !== filteredCreatives.length - 1 && <Separator />}
              </div>
            );
          })
        ) : (
          <div className={`p-10 border border-dashed rounded-2xl text-center ${isDark ? "border-white/20 text-white/40" : "border-black/20 text-black/40"}`}>
            {emptyMessage}
          </div>
        )}
      </div>

      <CreativeFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        isDark={isDark}
      />
    </div>
  );
};

interface CreativeCardProps {
  creative: {
    id: number;
    name: string;
    status: string;
    shoots: number;
    specialities: string;
    availability: string;
    location?: string;
    rating?: string | number;
    hourly_rate?: string | number;
    is_beige_member?: number;
    profile_image?: string;
  };
  isSelected: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
  isDark?: boolean;
}

const CreativeCard = ({ creative, isSelected, onToggle, onViewProfile, isDark=true }: CreativeCardProps) => {
  return (
    <div
      onClick={onToggle}
      className={`relative group flex flex-col md:flex-row items-center md:items-start gap-6 rounded-2xl cursor-pointer transition-all border p-2 ${
        isSelected 
          ? isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.03] border-[#E8D1AB]/40' 
          : 'bg-transparent border-transparent'
        }`}
    >
      <div className="relative w-20 h-25 lg:w-[146px] lg:h-[156px] flex-shrink-0">
        {creative.profile_image ? (
          <img
            src={creative.profile_image.startsWith('http') ? creative.profile_image : `${S3_PREFIX}${creative.profile_image}`}
            alt={creative.name}
            className={`w-full h-full object-cover rounded-lg transition-all ${!isSelected ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-[#E8D1AB] rounded-lg text-black text-2xl lg:text-4xl font-bold transition-all ${!isSelected ? 'grayscale' : ''}`}>
            {creative.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        )}
      </div>

      <div className="flex-1 w-full">
        <div className="flex justify-between items-center mb-3 lg:mb-5">
          <div className="flex items-center gap-3">
            <h3 className="lg:text-[22px] font-medium">{creative.name}</h3>
            <span className="bg-[#16A34A] text-[#fff] text-xs font-semibold px-2 py-0.5 rounded-lg capitalize">
              {creative.status}
            </span>
          </div>

          <div className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-all ${
            isSelected ? 'bg-[#E8D1AB] border-[#E8D1AB]' : isDark ? 'bg-transparent border-white/20' : 'bg-transparent border-[#0000004D]'
            }`}>
            {isSelected && <Check size={16} className="text-black stroke-[3px]" />}
          </div>
        </div>

        <div className={`flex flex-col lg:flex-row gap-4 md:gap-8 text-sm border-t pt-3 lg:pt-5 ${isDark ? "border-white/5" : "border-black/5"}`}>
          <div>
            <p className={isDark ? "text-[#AAA7A7] mb-1" : "text-black/50 mb-1"}>Assigned Shoots:</p>
            <p className={isDark ? "font-medium text-white" : "font-medium text-black/80"}>{creative.shoots.toString()} Shoots</p>
          </div>
          <div className={`md:border-x-2 md:px-8 ${isDark ? "border-white/5":"border-black/5"}`}>
            <p className={isDark ? "text-[#AAA7A7] mb-1" : "text-black/50 mb-1"}>Specialities:</p>
            <p className={`${isDark ? "text-white":"text-black/80"} font-medium capitalize`}>{creative.specialities}</p>
          </div>
          <div className="md:pl-8">
            <p className={isDark ? "text-[#AAA7A7] mb-1" : "text-black/50 mb-1"}>Availability:</p>
            <div className="flex items-center gap-2 text-[#E8D1AB] underline decoration-[#E8D1AB]/30 underline-offset-4">
              <span>{creative.availability}</span>
              <Calendar size={14} />
            </div>
          </div>
        </div>

        {creative.location && (
          <div className={`flex items-center gap-2 text-sm mt-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
            <span className="truncate">{creative.location}</span>
          </div>
        )}

        <div className="flex justify-end mt-4 lg:mt-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="text-sm font-semibold bg-[#E8D1AB] text-black px-5 py-2.5 rounded-lg hover:bg-[#d9bc90] transition-colors"
          >
            View Profile
          </button>
        </div>
      </div>

      {creative.is_beige_member === 1 && (
        <div className="absolute top-4 right-10 bg-[#E8D1AB] text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
          PRO
        </div>
      )}
    </div>
  );
};