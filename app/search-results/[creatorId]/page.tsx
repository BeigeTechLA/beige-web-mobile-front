"use client";

import React, { useState, Suspense, useRef } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "./components/Separator";

import CreatorCard from "../components/CreatorCard";
import CreatorGallery from "./components/CreatorGallery";
import ImageWheel from "./components/ImageWheel";

import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
import {
  useGetCreatorProfileQuery,
  useGetCreatorPortfolioQuery,
  useSearchCreatorsQuery
} from "@/lib/redux/features/creators/creatorsApi";
import "swiper/css";

const tabs = ["Portfolios"];  //"Work History", "FAQs", "Reviews"

function CreatorProfileContent() {
  const [activeTab, setActiveTab] = useState("Portfolios");
  const searchParams = useSearchParams();
  const params = useParams();
  const shootId = searchParams.get("shootId") ?? undefined;

  // Extract and parse creatorId from URL params
  const creatorId = params.creatorId as string;
  const creatorIdNumber = Number(creatorId);

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
          <Link
            href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search Results
          </Link>
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
    price: creator.hourly_rate ? `From $${creator.hourly_rate}/Hr` : "Contact for pricing",
    rating: creator.rating || 0,
    reviews: creator.total_reviews || 0,
    image: creator.profile_image || "/images/default-avatar.png"
  })) || [];

  return (
    <div className="pt-32 pb-20">
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
            <div className="w-1/2">
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
            <div className="flex-1 w-1/2 flex flex-col gap-[30px]">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                  <h1 className="text-3xl font-medium text-white">
                    {profile.name}
                  </h1>
                  <p className="text-[#E8D1AB] text-[22px]">
                    {profile.role_name || "Content Creator"}
                  </p>
                </div>
                {profile.is_available && (
                  <p className="bg-[#EDF7EE] text-[#4CAF50] text-xl px-5 py-3 rounded-full border border-[#4CAF50] leading-[20px]">
                    Available
                  </p>
                )}
              </div>
              <Separator />

              {/* About */}
              {profile.bio && (
                <>
                  <div className="flex flex-col gap-3.5">
                    <h3 className="text-xl font-bold text-white">About Creator</h3>
                    <p className="text-white/60 leading-relaxed text-lg font-normal">
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
                    <h3 className="text-xl font-bold text-white">Skills</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {(Array.isArray(profile.skills)
                        ? profile.skills
                        : profile.skills.split(',').map(s => s.trim())
                      ).map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="px-5 py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
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
                    <h3 className="text-xl font-bold text-white">Equipment&apos;s</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {(Array.isArray(profile.equipment)
                        ? profile.equipment
                        : profile.equipment.split(',').map(s => s.trim())
                      ).map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="px-5 py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Action Bar */}
              <div className="bg-[#171717] rounded-[20px] p-7 flex flex-col gap-7 mt-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <p className="text-white text-2xl font-semibold">
                      Starting Price
                    </p>
                    <span className="text-white text-sm">for 1 hour</span>
                  </div>

                  <span className="text-3xl font-bold text-white">
                    {profile.hourly_rate ? `$${profile.hourly_rate}` : "Contact"}
                  </span>
                </div>
                <Link
                  href={`/search-results/${creatorId}/payment${shootId ? `?shootId=${shootId}` : ""}`}
                  className="w-full md:w-auto"
                >
                  <Button className="w-full h-[71px] px-10 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-2xl font-medium rounded-[12px]">
                    Proceed to Payment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="my-20">
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

        <section className="mt-20 overflow-hidden">
          <div className="container mx-auto relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-8 pb-4">
              <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
                <p className="text-base text-white">Recommendations</p>
              </div>

              <h2 className="text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
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
                  breakpoints={{
                    640: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2 },
                    1280: { slidesPerView: 3 },
                  }}
                  className="!overflow-visible"
                >
                  {recommendedCreators.map((creator) => (
                    <SwiperSlide key={creator.id} className="h-auto">
                      {({ isActive }) => (
                        <CreatorCard
                          {...creator}
                          shootId={shootId}
                          creatorId={creator.id}
                          isActive={isActive}
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
