"use client";

import React, { useState, Suspense, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { ArrowLeft, Loader2, Check, ArrowUpRight, ArrowDownLeft, X, Plus } from "lucide-react";
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
} from "@/lib/redux/features/booking/bookingSlice";
import "swiper/css";
import StackedVideoScroll from "../components/VideoSlide";
import { ProjectSwitcher } from "../components/ProjectSwitcher";
import { FeaturedWork } from "../components/FeaturedWork";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

const tabs = ["Portfolios"];  //"Work History", "FAQs", "Reviews"

/* ORIGINAL HARDCODED DATA COMMENTED OUT
const fallbackImages = [
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/wedding.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/commercial.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/podcast.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/social_content.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/music.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/short_film.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/Brands&Products.jpg",
];

const videos = [
  {
    url: "",
    thumbnail: "https://img..jpg"
  },
  {
    url: "https://vimeo.com/1067901829",
  },
  {
    url: "",
    thumbnail: "https://img..jpg"
  },
  {
    url: "https://vimeo.com/952121987"
  },
  {
    url: "https://vimeo.com/1056604264",
  },
  {
    url: "https://vimeo.com/1056043823",
  },
  {
    url: "https://vimeo.com/1067856067",
  },
];

const sampleProjects: string[] = [
  "Commercial Projects",
  "Weddings",
  "Brand Campaigns"
];
*/

function CreatorProfileContent() {
  const swiperRef = useRef<SwiperType | null>(null);
  const router = useRouter();

  // Updated state to handle dynamic project categories
  const [activeProject, setActiveProject] = useState<string>("All");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);

  const [isFromBookingPage, setIsFromBookingPage] = useState(false);

  const searchParams = useSearchParams();
  const params = useParams();
  const shootId = searchParams.get("shootId") ?? searchParams.get("booking_id") ?? undefined;

  // Redux selectors for crew management
  const selectedCreatorIds = useSelector(selectSelectedCreatorIds);

  // Extract and parse creatorId from URL params
  const creatorId = params.id as string;
  const creatorIdNumber = Number(creatorId);

  const isSelected = selectedCreatorIds.includes(creatorId);

  useEffect(() => {
    const fromPage = searchParams.get('from');
    if (fromPage === 'booking_flow') {
      setIsFromBookingPage(true);
    }
  }, [searchParams]);

  // Fetch creator profile data
  // FIX: Because your API slice uses transformResponse: (res) => res.data, 
  // 'profile' here is the actual creator object.
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useGetCreatorProfileQuery(creatorIdNumber, {
    skip: !creatorIdNumber || isNaN(creatorIdNumber)
  });

  // Fetch recommended creators (using search API)
  const { data: recommendedData } = useSearchCreatorsQuery({
    page: 1,
    limit: 4
  });

  // --- DYNAMIC DATA PROCESSING ---

  // 1. Process Video Links from API (file_type: "link")
  const dynamicVideos = useMemo(() => {
    if (!profile?.files) return [];
    return profile.files
      .filter((file: any) => file.file_type === "link")
      .map((file: any) => ({
        url: file.file_path,
        thumbnail: "" // You can add custom logic here if you have thumbnails for videos
      }));
  }, [profile?.files]);

  // 2. Process Recent Work Images & Dynamic Categories for ProjectSwitcher
  const { dynamicCategories, dynamicPortfolioImages } = useMemo(() => {
    if (!profile?.files) return { dynamicCategories: ["All"], dynamicPortfolioImages: [] };

    const recentWorks = profile.files.filter((file: any) => file.file_type === "recent_work");

    // Extract unique titles (e.g., "Wedding", "Recent") from the API
    const titles = Array.from(new Set(recentWorks.map((f: any) => f.title || "Recent")));
    const categories = titles.length > 0 ? ["All", ...titles] : ["All"];

    // Filter images based on active tab
    const images = recentWorks
      .filter((f: any) => activeProject === "All" || (f.title || "Recent") === activeProject)
      .map((f: any) => `${S3_PREFIX}${f.file_path}`);

    return { dynamicCategories: categories, dynamicPortfolioImages: images };
  }, [profile?.files, activeProject]);

  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (isLoadingProfile) {
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

  // Prepare recommended creators
  const recommendedCreators = recommendedData?.data?.map((creator) => ({
    id: creator.crew_member_id.toString(),
    name: creator.name,
    role: creator.role_name || "Content Creator",
    hourlyRate: creator.hourly_rate || 0,
    rating: creator.rating || 0,
    reviews: creator.total_reviews || 0,
    image: creator.profile_photo ? `${S3_PREFIX}${creator.profile_photo}` : '/images/influencer/default.png',
  })) || [];

  return (
    <div className="pt-20 lg:pt-32 pb-20">
      <div className="px-4 md:px-0">
        <section className="mx-auto my-12 container">
          <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
            {/* Back Button */}
            {/* <Button
              onClick={handleBack}
              className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button> */}

            {/* CP Info Section */}
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left: Gallery */}
              <div className="lg:w-1/2">
                <CreatorGallery
                  mockCreator={{
                    // DYNAMIC: Using the profile_photo from your API response
                    images: profile.profile_photo ? [`${S3_PREFIX}${profile.profile_photo}`] : [],
                    name: profile.name,
                    rating: profile.rating || 0,
                    reviews: 0
                  }}
                />
              </div>

              {/* Right: Info */}
              <div className="flex-1 lg:w-1/2 flex flex-col gap-3 lg:gap-[30px]">
                {/* Header Info */}
                {/* Header Info */}
                <div className="flex flex-col gap-3">
                  {/* Grouping Name and Status Tags together */}
                  <div className="flex items-center justify-between lg:justify-start lg:gap-6 flex-wrap">
                    <h1 className="text-lg lg:text-3xl font-medium text-white whitespace-nowrap">
                      {profile.name}
                    </h1>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className="flex items-center gap-1 bg-green-500/90 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full">
                          <Check className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                          <span className="text-[10px] lg:text-sm text-white font-medium">In Crew</span>
                        </div>
                      )}
                      {profile.isAvailable && (
                        <p className="bg-[#EDF7EE] text-[#4CAF50] text-[10px] lg:text-base px-2 py-1 lg:px-3.5 lg:py-2 rounded-full border border-[#4CAF50] lg:leading-[20px]">
                          Available
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-[#E8D1AB] text-sm lg:text-[22px]">
                    {profile.role_name || (profile.role === '["2"]' ? "Videographer" : "Content Creator")}
                  </p>
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
                        {(Array.isArray(profile.skills) ? profile.skills : []).map((skill: any, index: number) => (
                          <span
                            key={skill.id || index}
                            className="p-3 lg:px-5 lg:py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                          >
                            {typeof skill === 'object' ? skill.name : skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Equipment */}
                {profile.equipment && profile.equipment.length > 0 && (
                  <>
                    <div className="flex flex-col gap-3.5">
                      <h3 className="text-base lg:text-xl font-bold text-white">Equipment</h3>
                      <div className="flex flex-wrap gap-2.5">
                        {profile.equipment.map((item: any, index: number) => (
                          <span
                            key={item.equipment_id || index}
                            className="p-3 lg:px-5 lg:py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                          >
                            {item.equipment_name} {/* Display equipment name */}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {/* If landed on Profile from Booking flow, show following */}
                {/* {isFromBookingPage && (
                  <div className="rounded-[20px] bg-[#171717] p-4 lg:p-[30px]">
                    <div className="flex justify-between mb-4 lg:mb-[30px]">
                      <div>
                        <p className="text-lg lg:text-2xl font-semibold">Your Crew</p>
                        <p className="text-xs lg:text-sm">1 of 1 selected</p>
                      </div>
                      <div className="flex gap-2 flex-end items-center text-[#4CAF50] lg:text-[20px]">
                        <Check />
                        <span>Completed</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); 
                        }}
                        className={`flex-1 py-2 lg:py-4 rounded-lg text-sm lg:text-[20px] font-medium flex items-center justify-center transition-colors ${isSelected ? "bg-[#FFC9C9] text-[#C31717] border border-[#C31717] hover:bg-[#FFC9C9]/70" : "border border-white/30 text-white hover:bg-white/10"
                          }`}
                      >
                        {isSelected ? <><X size={16} className="mr-1" /> Remove From Crew</> : <><Plus size={16} className="mr-1" /> Add to the Crew</>}
                      </button>
                      <Link
                        href={`/payment`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-center flex-1 bg-[#E8D1AB] hover:bg-[#E8D1AB]/80 text-black py-2 lg:py-4 rounded-lg text-sm lg:text-[20px] font-medium transition-all "
                      >
                        Proceed to Payment
                      </Link>
                    </div>
                  </div>
                )} */}

              </div>
            </div>
          </div>
        </section>

        <CenteredSeparator />

        {/* Featured Works - DYNAMIC */}
        <section className="mt-14 lg:my-20 overflow-hidden">
          <div className=" mx-auto relative overflow-hidden px-5 lg:px-0">
            <div className="flex flex-col items-center justify-center mb-4 lg:mb-8 pb-4">
              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
                Featured Works
              </h2>
            </div>

            {dynamicCategories.length > 1 && (
              <ProjectSwitcher
                projects={dynamicCategories}
                active={activeProject}
                onChange={(tab) => {
                  setActiveProject(tab);
                }}
                className="mx-auto mb-10"
              />
            )}

            {dynamicPortfolioImages.length > 0 ? (
              /* ADD A KEY HERE BASED ON activeProject */
              <FeaturedWork key={activeProject} items={dynamicPortfolioImages} />
            ) : (
              <div className="py-20 text-center text-white/40">
                No portfolio items available for this category.
              </div>
            )}
          </div>
        </section>

        <CenteredSeparator />

        {/* Video Portfolio Section - DYNAMIC */}
        {dynamicVideos.length > 0 && (
          <section id="video-portfolio" className="relative w-full">
            <StackedVideoScroll videos={dynamicVideos} />
            <CenteredSeparator />
          </section>
        )}

        <section className="mt-14 lg:mt-20 overflow-hidden">
          <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-4 lg:mb-8 pb-4">
              <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
                <p className="text-xs md:text-base text-white">Recommendations</p>
              </div>
              <div className="flex items-center justify-between mb-4 lg:mb-8 pb-4 w-full">
                <h2 className="flex-1 text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight w-full">
                  Recommended Creators for you
                </h2>

                {/* NAV ARROWS */}
                <div className="flex justify-end gap-3">
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
            </div>

            <div>
              {/* CAROUSEL */}
              {recommendedCreators.length > 0 ? (
                <Swiper
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
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
                  className="!overflow-visible h-[364px] lg:h-[585px] !p-[2px]"
                >
                  {recommendedCreators.map((creator, index) => (
                    <SwiperSlide key={creator.id} className="h-auto">
                      {({ isActive }) => (
                        <CreatorCard
                          {...creator}
                          creatorId={creator.id}
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