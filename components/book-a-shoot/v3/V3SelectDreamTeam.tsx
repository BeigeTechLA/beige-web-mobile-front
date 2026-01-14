"use client";

import React, { useEffect, useState } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { Loader2 } from "lucide-react";
import { useSearchCreatorsQuery } from "@/lib/redux/features/creators/creatorsApi";
import type { Creator } from "@/lib/types";
import CreatorCarousel from "./components/CreatorsCarousel";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const V3SelectDreamTeam: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  // Use local state for selection if not in data yet
  const [selectedIds, setSelectedIds] = useState<number[]>(data.selectedCrewIds || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build search params from booking data
  const searchParams = {
    content_types: data.contentType.filter(t => t !== 'editing').join(','),
    location: data.location || undefined,
    limit: 12, // Get more creators for better selection
    page: 1,
  };

  // Fetch real creators from API
  const { data: creatorsResponse, isLoading, error } = useSearchCreatorsQuery(
    searchParams,
    { skip: !data.location || data.contentType.length === 0 }
  );

  // Transform API creators to display format
  const creators: Creator[] = creatorsResponse?.data || [];

  // const toggleSelection = (id: number) => {
  //   setSelectedIds(prev => {
  //     const newIds = prev.includes(id)
  //       ? prev.filter(p => p !== id)
  //       : [...prev, id];

  //     // Sync with parent data
  //     updateData({ selectedCrewIds: newIds });
  //     return newIds;
  //   });
  // };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      // If already selected, allow deselection
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      }

      // If trying to add but already at limit, prevent addition
      const crewLimit = data.crewCount || 0;
      if (crewLimit > 0 && prev.length >= crewLimit) {
        return prev; // Don't add, already at limit
      }

      // Add the selection
      return [...prev, id];
    });
  };

  useEffect(() => {
    updateData({ selectedCrewIds: selectedIds });
  }, [selectedIds, updateData]);


  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">Finding Your Dream Team</h2>
          <p className="text-white/60">Searching for the perfect match...</p>
        </div>
        <div className="flex items-center justify-center h-[450px]">
          <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" />
        </div>
      </div>
    );
  }

  // Error or no creators found
  if (error || !creators || creators.length === 0) {
    return (
      <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">No Creators Available</h2>
          <p className="text-white/60 mb-6">
            {error ? "We encountered an issue loading creators. Please try again." : "No creators found matching your criteria."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={onBack}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Go Back
            </Button>
            <Button
              onClick={onNext}
              className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"
            >
              Continue Anyway
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">Select Your Dream Team</h2>
        {/* <p className="text-white/60">Select from {creators.length} available professionals</p> */}
        <p className="text-white/60">Based on your project, we've handpicked the best professionals. Select crew members to build your team.</p>
        {data.crewCount > 0 && (
          <p className={`mt-2 text-lg font-medium ${selectedIds.length === data.crewCount ? 'text-[#E8D1AB]' : 'text-white/80'}`}>
            {selectedIds.length} of {data.crewCount} crew members selected
          </p>
        )}
      </div>

      {/* Carousel */}
      <div className="border-t border-white/10 pt-15">
        <CreatorCarousel
          creators={creators}
          selectedIds={data.selectedCrewIds || []}
          toggleSelection={toggleSelection}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-6 justify-center items-center pt-8 lg:pt-15 border-t border-white/10">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-sm lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={data.crewCount > 0 && selectedIds.length !== data.crewCount}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium  text-sm lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with {selectedIds.length} Creatives
        </Button>

      </div>

    </div>
  );
};
