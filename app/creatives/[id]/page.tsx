"use client";

import React, { useState, Suspense, useRef, useEffect } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Image from "next/image";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { ArrowLeft, Loader2, Check, ArrowUpRight, ArrowDownLeft, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "../components/Separator";

import CreatorCard from "../components/CreatorCard";
import ImageWheel from "../components/ImageWheel";

import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
import {
  useGetCreatorProfileQuery,
  useGetCreatorPortfolioQuery,
  useSearchCreatorsQuery
} from "@/lib/redux/features/creators/creatorsApi";
import {
  selectSelectedCreatorIds,
} from "@/lib/redux/features/booking/bookingSlice";
import "swiper/css";

const tabs = ["Portfolios"];

function CreatorProfileContent() {
  const swiperRef = useRef<SwiperType | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("Portfolios");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(0);

  const searchParams = useSearchParams();
  const params = useParams();
  
  const creatorId = params.id as string;
  const creatorIdNumber = Number(creatorId);

  // Redux selectors
  const selectedCreatorIds = useSelector(selectSelectedCreatorIds);
  const isSelected = selectedCreatorIds.includes(creatorId);

  // Fetch creator profile data
  const {
    data: profileResponse,
    isLoading: isLoadingProfile,
    isFetching: isFetchingProfile,
    isError: isProfileError,
  } = useGetCreatorProfileQuery(creatorIdNumber, {
    skip: !creatorIdNumber || isNaN(creatorIdNumber)
  });

  const profile = profileResponse;

  // Role Logic Mapping
  const getRoleLabel = (roleJson: string | any) => {
    try {
      const roles = typeof roleJson === 'string' ? JSON.parse(roleJson || "[]") : roleJson;
      if (roles?.includes("1") || roles?.includes("9")) return "Videographer Specialist";
      if (roles?.includes("10") || roles?.includes("2")) return "Photographer Specialist";
      if (roles?.includes("3") || roles?.includes("11")) return "Editor Specialist";
      return "Creative Specialist";
    } catch (e) {
      return "Creative Specialist";
    }
  };

  const profilePhotoFile = profile?.files?.find((f: any) => f.file_type === "profile_photo");
  const profileImageUrl = profilePhotoFile 
    ? `https://beigexmemehouse.s3.amazonaws.com/beige/${profilePhotoFile.file_path}`
    : "/images/influencer/default.png";

  const {
    data: portfolioData,
    isLoading: isLoadingPortfolio
  } = useGetCreatorPortfolioQuery(
    { id: creatorIdNumber, page: 1, limit: 12 },
    { skip: !creatorIdNumber || isNaN(creatorIdNumber) }
  );

  const { data: recommendedData } = useSearchCreatorsQuery({
    page: 1,
    limit: 4
  });

  const handleBack = () => {
    router.back();
  };

  if (isLoadingProfile || (isFetchingProfile && !profile)) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" />
      </div>
    );
  }

  if (!isFetchingProfile && (isProfileError || !profile)) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="text-6xl">😔</div>
          <h2 className="text-3xl font-bold text-white">Creator Not Found</h2>
          <Button onClick={handleBack} className="bg-[#E8D1AB] text-black">Go Back</Button>
        </div>
      </div>
    );
  }

  const portfolioImages = portfolioData?.data?.map((item: any) => item.image_url || item.video_url).filter(Boolean) || [];

  const recommendedCreators = recommendedData?.data?.slice(0, 4).map((creator: any) => ({
    id: creator.crew_member_id.toString(),
    name: creator.name,
    role: creator.role_name || "Content Creator",
    hourlyRate: creator.hourly_rate || 0,
    rating: creator.rating || 0,
    reviews: creator.total_reviews || 0,
    image: creator.profile_image || '/images/influencer/default.png',
  })) || [];

  return (
    <div className="pt-20 lg:pt-28 pb-20">
      {/* Constrained Container for spacing on both sides */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-20">
        <section className="mt-12">
          {/* Back Button */}
          {/* <Button
            onClick={handleBack}
            className="inline-flex items-center text-white/60 hover:text-white mb-10 transition-colors p-0 bg-transparent hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button> */}

          {/* MAIN PROFILE SECTION - items-stretch makes left and right same height */}
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 items-stretch">
            
            {/* Left Image Section */}
            <div className="lg:w-[48%] relative rounded-[24px] overflow-hidden border border-white/5 bg-[#161616]">
               <Image 
                  src={profileImageUrl} 
                  alt={profile.name} 
                  fill 
                  className="object-cover"
                  priority
               />
               <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-white text-xs font-medium">
                    {profile.rating || "0.0"} <span className="text-white/40">({profile.files?.filter((f:any)=>f.file_type==='recent_work').length || "0"})</span>
                  </span>
               </div>
            </div>

            {/* Right Side Content */}
            <div className="flex-1 flex flex-col justify-between py-2">
              <div className="flex flex-col gap-8">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-3xl lg:text-[42px] font-medium text-white tracking-tight">
                      {profile.name}
                    </h1>
                    <p className="text-[#E8D1AB] text-lg lg:text-[20px]">
                      {getRoleLabel(profile.role)}
                    </p>
                  </div>
                  {profile.isAvailable && (
                    <p className="bg-[#EDF7EE]/10 text-[#4CAF50] text-xs lg:text-sm px-4 py-2 rounded-full border border-[#4CAF50]/30">
                      Available
                    </p>
                  )}
                </div>

                {/* About Section */}
                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-lg font-bold text-white mb-3">About Creator</h3>
                  <p className="text-white/50 leading-relaxed text-sm lg:text-base font-normal">
                    {profile.bio || "No bio available."}
                  </p>
                </div>

                {/* Skills Section */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {profile.skills.map((skill: any) => (
                        <span key={skill.id} className="px-4 py-2 bg-[#161616] border border-white/5 rounded-[8px] text-xs font-medium text-white/50">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment Section */}
                {profile.equipment && profile.equipment.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Equipment&apos;s</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {profile.equipment.map((eq: any) => (
                        <span key={eq.equipment_id} className="px-4 py-2 bg-[#161616] border border-white/5 rounded-[8px] text-xs font-medium text-white/50">
                          {eq.equipment_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BOX (YOUR CREW) */}
              <div className="mt-10 bg-[#111111] rounded-[24px] p-6 lg:p-8 border border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-white text-xl font-semibold">Your Crew</h2>
                    <p className="text-white/40 text-xs mt-1">1 of 1 Selected</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#4CAF50]">
                    <Check className="w-5 h-5" />
                    <span className="font-medium text-sm">Completed</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="destructive"
                    className="flex-1 h-14 bg-[#FFD1D1] hover:bg-[#ffc6c6] text-[#FF4D4D] border-none rounded-[12px] text-sm font-semibold"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove From Crew
                  </Button>
                  <Button
                    onClick={() => router.push("/checkout")}
                    className="flex-1 h-14 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black border-none rounded-[12px] text-sm font-semibold"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TABS SECTION */}
        <section className="my-16 lg:my-24">
          <div className="flex justify-center border-b border-t border-white/10 mb-8 w-full">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-12 py-6 lg:py-10 text-lg lg:text-2xl font-medium transition-colors relative ${activeTab === tab ? "text-[#E8D1AB]" : "text-white/40 hover:text-white"}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E8D1AB]" />}
              </button>
            ))}
          </div>

          {activeTab === "Portfolios" && (
            portfolioImages.length > 0 ? (
              <ImageWheel images={portfolioImages} />
            ) : (
              <div className="py-10 text-center text-white/40">No portfolio items available yet.</div>
            )
          )}
        </section>

        <CenteredSeparator />

        {/* RECOMMENDATIONS SECTION */}
        <section className="mt-14 lg:mt-20 overflow-hidden">
          <div className="relative overflow-hidden">
            <div className="flex flex-col items-center justify-center mb-4 lg:mb-8 pb-4">
              <div className="border-b border-t border-white/40 w-fit px-8 py-1.5 text-center mb-6">
                <p className="text-xs text-white/80">Recommendations</p>
              </div>
              <div className="flex items-center justify-between mb-4 lg:mb-8 pb-4 w-full">
                <h2 className="flex-1 text-2xl md:text-[56px] leading-[1.1] font-medium text-white tracking-tight">
                  Recommended Creators for you
                </h2>
                <div className="flex justify-end gap-3">
                  <button onClick={() => swiperRef.current?.slidePrev()} className="w-10 h-10 lg:w-16 lg:h-16 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition">
                    <ArrowDownLeft className="w-4 lg:w-6 h-4 lg:h-6" />
                  </button>
                  <button onClick={() => swiperRef.current?.slideNext()} className="w-10 h-10 lg:w-16 lg:h-16 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition">
                    <ArrowUpRight className="w-4 lg:w-6 h-4 lg:h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              {recommendedCreators.length > 0 ? (
                <Swiper
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
                  spaceBetween={24}
                  slidesPerView={1.1}
                  breakpoints={{ 640: { slidesPerView: 1.5 }, 768: { slidesPerView: 2 }, 1280: { slidesPerView: 3 } }}
                  className="!overflow-visible !p-[2px]"
                >
                  {recommendedCreators.map((creator: any, index: number) => (
                    <SwiperSlide key={creator.id}>
                      <CreatorCard
                        {...creator}
                        creatorId={creator.id}
                        index={index}
                        isExpanded={hoveredIndex === index}
                        onHover={() => setHoveredIndex(index)}
                        onLeave={() => setHoveredIndex(0)}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="py-10 text-center text-white/40">No recommendations available.</div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#101010]" />}>
        <CreatorProfileContent />
      </Suspense>
    </main>
  );
}