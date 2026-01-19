"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useSearchCreatorsQuery } from "@/lib/redux/features/creators/creatorsApi";
import type { Creator } from "@/lib/types";
import CreatorCarousel from "./components/CreatorsCarousel";
import CreatorCard from "./components/CreatorCard";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

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

const additionalCreators = [
  {
    "crew_member_id": 135,
    "name": "Gary Ahmed",
    "role_id": "1",
    "role_name": "Videographer",
    "hourly_rate": 125,
    "rating": 4.5,
    "total_reviews": 10,
    "profile_image": "/images/crew/CREW(5).png",
    "location": "Los Angeles, California",
    "experience_years": 5,
    "bio": "videography specialist with professional experience",
    "skills": "videography",
    "is_available": true
  },
  {
    "crew_member_id": 130,
    "name": "Yasmine Img",
    "role_id": "1",
    "role_name": "Videographer",
    "hourly_rate": 100,
    "rating": 4.5,
    "total_reviews": 23,
    "profile_image": "/images/crew/CREW(4).png",
    "location": "Los Angeles, California",
    "experience_years": 5,
    "bio": "Fashion and weddings",
    "skills": "videography, photography",
    "is_available": true
  },
  {
    "crew_member_id": 132,
    "name": "Marcelo Echeverria",
    "role_id": "1",
    "role_name": "Videographer",
    "hourly_rate": 200,
    "rating": 4.5,
    "total_reviews": 12,
    "profile_image": "/images/crew/CREW(7).png",
    "location": "Los Angeles, California",
    "experience_years": 5,
    "bio": "videography specialist with professional experience",
    "skills": "videography",
    "is_available": true
  },
  {
    "crew_member_id": 125,
    "name": "Corey Bishop",
    "role_id": "1",
    "role_name": "Videographer",
    "hourly_rate": 90,
    "rating": 4.5,
    "total_reviews": 10,
    "profile_image": "/images/crew/CREW(6).png",
    "location": "Los Angeles, California",
    "experience_years": 5,
    "bio": "videography specialist with professional experience",
    "skills": "videography",
    "is_available": true
  },
  {
    "crew_member_id": 172,
    "name": "Parth Panchal",
    "role_id": "[\"9\"]",
    "role_name": "Creative Professional",
    "hourly_rate": 50,
    "rating": 0,
    "total_reviews": 0,
    "profile_image": "/images/crew/CREW(10).png",
    "location": "119 Rosemont Avenue, Los Angeles, California 90026, United States",
    "experience_years": 5,
    "bio": "acfade",
    "skills": "[\"18\"]",
    "is_available": true
  }
]

export const V3SelectDreamTeam: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(0);

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
      <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
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
      <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">Our creators around your location are booked</h2>
          <p className="text-white/60 mb-6">
            {error ? "We encountered an issue loading creators. Please try again." : "Looks like no creators are available right now, but our sales expert can help you find a great match."}
          </p>
          {/* <div className="flex gap-4 justify-center">
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
          </div> */}
        </div>

        <div className="mx-auto">
          <Image
            src={"/images/misc/NoCreators.svg"}
            alt="No Creators found"
            width={164}
            height={184}
            className=""
          />
        </div>

        <section className="pt-6 lg:pt-15 border-t border-white/10 overflow-hidden">
          <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 lg:mb-8 pb-4">
              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
                Browse other creative partners
              </h2>

              {/* NAV ARROWS */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="w-10 h-10 lg:w-22 lg:h-22 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
                >
                  <ArrowDownLeft className="w-4 lg:w-8 h-4 lg:h-8" />
                </button>

                <button
                  onClick={() => swiperRef.current?.slideNext()}
                  className="w-10 h-10 lg:w-22 lg:h-22 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
                >
                  <ArrowUpRight className="w-4 lg:w-8 h-4 lg:h-8" />
                </button>
              </div>
            </div>

            {/* CAROUSEL */}
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              spaceBetween={24}
              slidesPerView={1.1}
              preventClicks={false}
              preventClicksPropagation={false}
              breakpoints={{
                768: { slidesPerView: 2 },
                1280: { slidesPerView: 3 },
              }}
              className="!overflow-visible h-[364px] lg:h-[520px] !p-[2px]"
            >
              {additionalCreators.map((creator, index) => (
                <SwiperSlide key={creator.crew_member_id}>
                  {({ isActive }) => (
                    <CreatorCard
                      {...creator}
                      isActive={isActive}
                      index={index}
                      isExpanded={hoveredIndex === index}
                      onHover={() => setHoveredIndex(index)}
                      onLeave={() => setHoveredIndex(0)}
                    />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        <div className="flex gap-3 lg:gap-6 justify-center items-center pt-6 lg:pt-15 border-t border-white/10">
          <Button
            className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
          >
            Connect with Sales Expert
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
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
      <div className="flex gap-3 lg:gap-6 justify-center items-center pt-6 lg:pt-15 border-t border-white/10">
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
