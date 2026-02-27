"use client";

import React, { useState, Suspense, useRef, useEffect } from "react";
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

const tabs = ["Portfolios"];  //"Work History", "FAQs", "Reviews"

// Fallback portfolio Images
const fallbackImages = ["https://d2jhn32fsulyac.cloudfront.net/assets/categories/wedding.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/commercial.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/podcast.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/social_content.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/music.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/short_film.jpg",
  "https://d2jhn32fsulyac.cloudfront.net/assets/categories/Brands&Products.jpg",
]

const videos = [
  {
    url: "https://youtu.be/5FrhtahQiRc?si=Ub2wKKHeid3HWayt",
    thumbnail: "https://img.youtube.com/vi/5FrhtahQiRc/maxresdefault.jpg"

  },
  {
    url: "https://vimeo.com/1067901829",
  },
  {
    url: "https://youtu.be/ug-dxCgd9Jc?si=zKVXROHg3dIOC9g6",
    thumbnail: "https://img.youtube.com/vi/ug-dxCgd9Jc/maxresdefault.jpg"
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

function CreatorProfileContent() {
  const swiperRef = useRef<SwiperType | null>(null);
  const router = useRouter();

  const [activeProject, setActiveProject] = useState(sampleProjects[1]);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(0);

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
  }, [])

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

  const handleBack = () => {
    router.back();
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
  // const portfolioImages = portfolioData?.data?.map(item => item.image_url || item.video_url).filter(Boolean) || [];
  const portfolioImages = portfolioData?.data?.map(item => item.image_url || item.video_url).filter(Boolean) || fallbackImages

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
        <section className="mx-auto my-12 container">
          <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
            {/* Back Button */}
            <Button
              onClick={handleBack}
              className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* CP Info Section */}
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left: Gallery */}
              <div className="lg:w-1/2">
                <CreatorGallery
                  mockCreator={{
                    // images: portfolioImages.slice(0, 7),
                    images: profile?.image,
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

                {/* If landed on Profile from Booking flow, show following */}
                {isFromBookingPage &&
                  <div className="rounded-[20px] bg-[#171717] p-4 lg:p-[30px]">
                    <div className="flex justify-between mb-4 lg:mb-[30px]">
                      <div>
                        <p className="text-lg lg:text-2xl font-semibold">Your Crew</p>
                        {/* Depends on the required crew size. to be dynamic */}
                        <p className="text-xs lg:text-sm">1 of 1 selected</p>
                      </div>
                      <div className="flex gap-2 flex-end items-center text-[#4CAF50] lg:text-[20px]">
                        <Check />
                        {/* Depends on where required crew size is met. to be dynamic */}
                        <span>Completed</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent Swiper from intercepting this as a drag/slide
                          e.preventDefault();
                        }}
                        className={`flex-1 py-2 lg:py-4 rounded-lg text-sm lg:text-[20px] font-medium flex items-center justify-center transition-colors ${isSelected ? "bg-[#FFC9C9] text-[#C31717] border border-[#C31717] hover:bg-[#FFC9C9]/70" : "border border-white/30 text-white hover:bg-white/10"
                          }`}
                      >
                        {isSelected ? <><X size={16} className="mr-1" /> Remove From Crew</> : <><Plus size={16} className="mr-1" /> Add to the Crew</>}
                      </button>
                      <Link
                        href={`/payment`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-center flex-1 bg-[#E8D1AB] hover:bg-[#E8D1AB]/80 text-black py-2 lg:py-4 rounded-lg text-sm lg:text-[20px] font-medium transition-all "
                      >
                        Proceed to Payment
                      </Link>
                    </div>
                  </div>
                }

              </div>
            </div>
          </div>
        </section>

        <CenteredSeparator />

        {/* Featured Works */}
        <section className="mt-14 lg:my-20 overflow-hidden">
          <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-4 lg:mb-8 pb-4">
              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
                Featured Works
              </h2>
            </div>

            <ProjectSwitcher
              projects={sampleProjects}
              active={activeProject}
              onChange={(tab) => {
                setActiveProject(tab);
              }}
              className="mx-auto mb-10"
            />

            {
              portfolioImages.length > 0 ? (
                <ImageWheel images={portfolioImages} />
              ) : (
                <div className="py-10 text-center text-white/40">
                  No portfolio items available yet.
                </div>
              )
            }
          </div>
        </section>

        <CenteredSeparator />

        {/* Video Portfolio Section */}
        <section id="video-portfolio" className="relative w-full">
          <StackedVideoScroll videos={videos} />
        </section>

        <CenteredSeparator />

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
