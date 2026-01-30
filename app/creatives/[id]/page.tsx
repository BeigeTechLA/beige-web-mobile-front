"use client";

import React, { useState, Suspense, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import axios from "axios";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { ArrowLeft, Loader2, Plus, Check, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "../components/Separator";

import CreatorCard from "../components/CreatorCard";
import CreatorGallery from "../components/CreatorGallery";
import ImageWheel from "../components/ImageWheel";

import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
import {
  useGetCreatorProfileQuery,
  useGetCreatorPortfolioQuery,
  useSearchCreatorsQuery
} from "@/lib/redux/features/creators/creatorsApi";
import {
  selectSelectedCreatorIds,
  selectSelectedCreators,
  selectCanAddMoreCreators,
  selectIsCrewComplete,
  selectCrewSize,
  selectSelectedCreatorsCount,
  addCreator,
  removeCreator,
  SelectedCreator,
} from "@/lib/redux/features/booking/bookingSlice";
import "swiper/css";

const tabs = ["Portfolios"];  //"Work History", "FAQs", "Reviews"

// DummyImage List: To be removed later
const crewImages = [
  "/images/crew/CREW(1).png",
  "/images/crew/CREW(2).png",
  "/images/crew/CREW(3).png",
  "/images/crew/CREW(4).png",
  "/images/crew/CREW(5).png",
  "/images/crew/CREW(7).png",
  "/images/crew/CREW(6).png",
  "/images/crew/CREW(8).png",
  "/images/crew/CREW(9).png",
  "/images/crew/CREW(10).png",
];

function CreatorProfileContent() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Portfolios");
  const [isAssigning, setIsAssigning] = useState(false);
  const searchParams = useSearchParams();
  const params = useParams();
  const shootId = searchParams.get("shootId") ?? searchParams.get("booking_id") ?? undefined;

  // Redux selectors for crew management
  const selectedCreatorIds = useSelector(selectSelectedCreatorIds);
  const selectedCreators = useSelector(selectSelectedCreators);
  const canAddMore = useSelector(selectCanAddMoreCreators);
  const isCrewComplete = useSelector(selectIsCrewComplete);
  const crewSize = useSelector(selectCrewSize);
  const selectedCount = useSelector(selectSelectedCreatorsCount);

  // Extract and parse creatorId from URL params
  const creatorId = params.id as string;
  const creatorIdNumber = Number(creatorId);

  const isSelected = selectedCreatorIds.includes(creatorId);

  // Fetch creator profile data
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useGetCreatorProfileQuery(creatorIdNumber, {
    skip: !creatorIdNumber || isNaN(creatorIdNumber)
  });

  // Fetch creator portfolio data
  const {
    data: portfolioData,
    isLoading: isLoadingPortfolio
  } = useGetCreatorPortfolioQuery(
    { id: creatorIdNumber, page: 1, limit: 12 },
    { skip: !creatorIdNumber || isNaN(creatorIdNumber) }
  );

  // Fetch recommended creators (using search API)
  const { data: recommendedData } = useSearchCreatorsQuery({
    page: 1,
    limit: 4
  });

  const swiperRef = useRef<SwiperType | null>(null);

  // Get fallback image
  const getFallbackImage = (id: string) => {
    return crewImages[parseInt(id) % 10];
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddToCrew = () => {
    if (!profile) return;

    const profileImage = profile.profile_image || getFallbackImage(creatorId);

    const creator: SelectedCreator = {
      id: creatorId,
      name: profile.name,
      role: profile.role_name || "Content Creator",
      image: profileImage,
      hourlyRate: profile.hourly_rate || 0,
    };

    dispatch(addCreator(creator));
  };

  const handleRemoveFromCrew = () => {
    dispatch(removeCreator(creatorId));
  };

  const handleProceedToPayment = async () => {
    if (!shootId) {
      toast.error("Booking ID not found");
      return;
    }

    if (selectedCreators.length === 0) {
      toast.error("No creators selected");
      return;
    }

    setIsAssigning(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';
      const creatorIds = selectedCreators.map(c => parseInt(c.id));

      await axios.post(
        `${API_BASE_URL}guest-bookings/${shootId}/assign-creators`,
        { creator_ids: creatorIds }
      );

      router.push(`/search-results/payment?shootId=${shootId}`);
    } catch (error: any) {
      console.error('Error assigning creators:', error);
      toast.error(error.response?.data?.message || 'Failed to assign creators. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Loading state
  if (isLoadingProfile || isLoadingPortfolio) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" />
          <p className="text-white/60 text-lg">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  // Error state - 404 or other errors
  if (profileError || !profile) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="text-6xl">😔</div>
          <h2 className="text-3xl font-bold text-white">Creator Not Found</h2>
          <p className="text-white/60 text-lg">
            The creator you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back to Previous Page
          </Button>
        </div>
      </div>
    );
  }

  // Prepare portfolio images
  const portfolioImages = portfolioData?.data?.map(item => item.image_url || item.video_url).filter(Boolean) || [];

  // Prepare recommended creators
  const recommendedCreators = recommendedData?.data?.slice(0, 4).map(creator => ({
    id: creator.crew_member_id.toString(),
    name: creator.name,
    role: creator.role_name || "Content Creator",
    hourlyRate: creator.hourly_rate || 0,
    rating: creator.rating || 0,
    reviews: creator.total_reviews || 0,
    image: creator.profile_image || '/images/influencer/default.png',
  })) || [];

  return (
    <div className="pt-20 lg:pt-32 pb-20">
      <div className="px-4 md:px-0">
        <section className="mx-auto mt-12 container">
          {/* Back Button */}
          <Link
            href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
            className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>

          {/* CP Info Section */}
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left: Gallery */}
            <div className="lg:w-1/2">
              <CreatorGallery
                mockCreator={{
                  images: portfolioImages.slice(0, 7),
                  name: profile.name,
                  rating: profile.rating || 0,
                  reviews: profile.total_reviews || 0
                }}
              />
            </div>

            {/* Right: Info */}
            <div className="flex-1 lg:w-1/2 flex flex-col gap-3 lg:gap-[30px]">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                  <h1 className="text-lg lg:text-3xl font-medium text-white">
                    {profile.name}
                  </h1>
                  <p className="text-[#E8D1AB] text-sm lg:text-[22px]">
                    {profile.role_name || "Content Creator"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="flex items-center gap-1 bg-green-500/90 px-3 py-2 rounded-full">
                      <Check className="w-4 h-4 text-white" />
                      <span className="text-sm text-white font-medium">In Crew</span>
                    </div>
                  )}
                  {profile.is_available && (
                    <p className="bg-[#EDF7EE] text-[#4CAF50] text-xs lg:text-base px-2 py-1 lg:px-3.5 lg:py-2 rounded-full border border-[#4CAF50] lg:leading-[20px]">
                      Available
                    </p>
                  )}
                </div>
              </div>
              <Separator />

              {/* About */}
              {profile.bio && (
                <>
                  <div className="flex flex-col gap-3.5">
                    <h3 className="text-base lg:text-xl font-bold text-white">About Creator</h3>
                    <p className="text-white/60 leading-relaxed text-sm lg:text-lg font-normal">
                      {profile.bio}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Skills */}
              {profile.skills && (
                <>
                  <div className="flex flex-col gap-3.5">
                    <h3 className="text-base lg:text-xl font-bold text-white">Skills</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {(Array.isArray(profile.skills)
                        ? profile.skills
                        : profile.skills.split(',').map(s => s.trim())
                      ).map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="p-3 lg:px-5 lg:py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Equipment */}
              {profile.equipment && (
                <>
                  <div className="flex flex-col gap-3.5">
                    <h3 className="text-base lg:text-xl font-bold text-white">Equipment&apos;s</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {(Array.isArray(profile.equipment)
                        ? profile.equipment
                        : profile.equipment.split(',').map(s => s.trim())
                      ).map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="p-3 lg:px-5 lg:py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

             
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="my-10 lg:my-20">
          <div className="flex justify-center border-b border-t border-white/10 mb-8 w-full gap-20">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-8 py-4 lg:py-10 text-base lg:text-2xl font-medium transition-colors relative ${activeTab === tab
                  ? "text-[#E8D1AB]"
                  : "text-white/40 hover:text-white"
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E8D1AB]" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "Portfolios" && (
            portfolioImages.length > 0 ? (
              <ImageWheel images={portfolioImages} />
            ) : (
              <div className="py-10 text-center text-white/40">
                No portfolio items available yet.
              </div>
            )
          )}

          {/* Content based on active tab */}
          {activeTab !== "Portfolios" && (
            <div className="py-10 text-center text-white/40">
              Content for {activeTab} coming soon...
            </div>
          )}
        </section>
        <CenteredSeparator />

        <section className="mt-14 lg:mt-20 overflow-hidden">
          <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-4 lg:mb-8 pb-4">
              <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
                <p className="text-xs md:text-base text-white">Recommendations</p>
              </div>

              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
                Recommended Creators for you
              </h2>
            </div>

            <div>
              {/* CAROUSEL */}
              {recommendedCreators.length > 0 ? (
                <Swiper
                  spaceBetween={24}
                  slidesPerView={1.1}
                  grabCursor
                  centeredSlides={false}
                  preventClicks={false}
                  preventClicksPropagation={false}
                  breakpoints={{
                    640: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2 },
                    1280: { slidesPerView: 3 },
                  }}
                  className="!overflow-visible"
                >
                  {recommendedCreators.map((creator) => (
                    <SwiperSlide key={creator.id} className="h-auto">
                      {() => (
                        <CreatorCard
                          {...creator}
                          shootId={shootId}
                          creatorId={creator.id}
                        />
                      )}
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="py-10 text-center text-white/40">
                  No recommendations available at this time.
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
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
      <Footer />
    </main>
  );
}
