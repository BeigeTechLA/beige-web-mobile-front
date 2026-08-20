"use client";

import React, { useState, Suspense, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, useScroll, useTransform } from "framer-motion";

import type { Swiper as SwiperType } from "swiper";
// import { antonio } from "@/app/layout";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import AppLoading from "@/app/loading";

import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
import {
  useGetCreatorProfileQuery,
  useSearchCreatorsQuery
} from "@/lib/redux/features/creators/creatorsApi";
import {
  selectSelectedCreatorIds,
} from "@/lib/redux/features/booking/bookingSlice";
import "swiper/css";
import StackedVideoScroll from "../components/VideoSlide";
import { ProjectSwitcher } from "../components/ProjectSwitcher";
import { FeaturedWork } from "../components/FeaturedWork";
import { Separator } from "../components/Separator";
import { roleOptions, standardToCustomRoleMap } from "@/app/data/staticData";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

function CreatorProfileContent({ isModalView = false }: { isModalView?: boolean }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const router = useRouter();

  const [activeProject, setActiveProject] = useState<string>("All");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
  const [isFromBookingPage, setIsFromBookingPage] = useState(false);

  const [scrollTarget, setScrollTarget] = useState<HTMLDivElement | null>(null);
  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setScrollTarget(node);
    }
  }, []);

  const searchParams = useSearchParams();
  const params = useParams();
  const creatorId = params.id as string;
  const creatorIdNumber = Number(creatorId);

  const selectedCreatorIds = useSelector(selectSelectedCreatorIds);
  const isSelected = selectedCreatorIds.includes(creatorId);

  // Hook scroll updates safely using the state-tracked element layout node
  const { scrollYProgress } = useScroll({
    target: scrollTarget ? { current: scrollTarget } : undefined,
    offset: ["start start", "end end"]
  });

  /**
   * FINE-TUNED INTERPOLATION GEOMETRY FOR 530px x 757px CARD
   * 
   * - 0.0 to 0.16  : Stays centered in Section 1.
   * - 0.16 to 0.33 : Card shifts right to 480px, scales down/up slightly, and flips to back view.
   * - 0.33 to 0.50 : Resting in Section 2 (Maintains position, remains flipped).
   * - 0.50 to 0.66 : Card unflips back to front view while tracking smoothly.
   * - 0.66 to 1.0  : Rests in Section 3 layout context.
   */
  const cardX = useTransform(
    scrollYProgress,
    [0, 0.16, 0.33, 0.50, 0.66, 1],
    ["0px", "0px", "340px", "340px", "340px", "340px"]
  );

  const cardRotate = useTransform(
    scrollYProgress,
    [0, 0.16, 0.33, 0.50, 0.66, 1],
    [0, 0, -3, 3, 0, 0]
  );

  const cardScale = useTransform(
    scrollYProgress,
    [0, 0.16, 0.25, 0.33, 0.50, 0.58, 0.66, 1],
    [1, 1, 0.96, 1.02, 1.02, 0.97, 1, 1]
  );

  const cardRotateY = useTransform(
    scrollYProgress,
    [0, 0.16, 0.33, 0.50, 0.66, 1],
    [0, 0, 180, 180, 0, 0]
  );

  const bubbleScale = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const bubbleOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  useEffect(() => {
    const fromPage = searchParams.get('from');
    if (fromPage === 'booking_flow') {
      setIsFromBookingPage(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isModalView || typeof document === "undefined") return;
    document.documentElement.classList.add("no-scrollbar");
    document.body.classList.add("no-scrollbar");
    return () => {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, [isModalView]);

  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useGetCreatorProfileQuery(creatorIdNumber, {
    skip: !creatorIdNumber || isNaN(creatorIdNumber)
  });

  const parsedRoles: string[] = useMemo(() => {
    if (!profile?.role) return [];
    if (Array.isArray(profile.role)) return profile.role;

    try {
      const parsed = JSON.parse(profile.role);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      console.error("Error parsing profile.role string:", e);
      return [];
    }
  }, [profile?.role]);

  const profileRoleLabels = useMemo(() => {
    return parsedRoles
      .map(id => roleOptions.find(role => role.value === id)?.label)
      .filter(Boolean);
  }, [parsedRoles]);

  const customServicesArray = useMemo(() => {
    return parsedRoles
      .map(id => standardToCustomRoleMap[id])
      .filter(Boolean);
  }, [parsedRoles]);

  useEffect(() => {
    if (!isModalView || isLoadingProfile || typeof window === "undefined") return;
    if (window.parent === window) return;

    window.parent.postMessage(
      {
        type: "creator-profile-modal-ready",
        creatorId,
      },
      window.location.origin,
    );
  }, [creatorId, isLoadingProfile, isModalView, profile, profileError]);

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
        thumbnail: ""
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

  interface CertificateItem {
    url: string;
    title: string;
  }

  const dynamicCertificates = useMemo<CertificateItem[]>(() => {
    if (!profile?.files) return [];

    const filenames = profile?.certifications || []
    return profile.files
      .filter((file: any) => file.file_type === "certifications")
      .map((file: any, index: number) => ({
        url: file.file_path,
        title: filenames.length > 0 ? filenames[index] : (file.title || "") // Falls back to empty string if title is missing
      }));
  }, [profile?.files]);

  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (isLoadingProfile) {
    return <AppLoading />;
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

  const profileImg = profile.profile_photo ? `${S3_PREFIX}${profile.profile_photo}` : '/images/crew/CREW(9).png';

  return (
    <div className={isModalView ? "pt-6 pb-20" : "container pt-20 lg:pt-30 pb-20 mx-auto "}>
      <Button
        onClick={handleBack}
        className="text-white/60 hover:text-white transition-colors z-30 p-5 lg:p-0"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="px-4 md:px-0">

        {/* --- DYNAMIC VISUAL SCROLL SECTION CONTAINER --- */}
        <div ref={containerRefCallback} className="relative w-full text-white">

          {/* Global Sticky Canvas Track - Desktop view ONLY */}
          <div
            className="absolute top-0 left-0 hidden w-full h-full pointer-events-none md:flex items-start justify-center z-20"
            style={{ perspective: 1600 }}
          >
            <div className="sticky top-[calc(50vh-280px)] w-full flex items-center justify-center">
              <motion.div
                style={{
                  x: cardX,
                  rotate: cardRotate,
                  rotateY: cardRotateY,
                  scale: cardScale,
                  transformStyle: "preserve-3d",
                }}
                className="relative w-[420px] h-[560px] rounded-[32px] shadow-2xl bg-neutral-900 border border-white/10 pointer-events-auto"
              >
                {/* CARD FRONT COMPONENT */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <img
                    src={profileImg}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* CARD BACK COMPONENT */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden bg-[#151515] border border-white/10 flex items-center justify-center"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <img
                    src={dynamicPortfolioImages[0] || profileImg}
                    alt="Portfolio Alternate Preview"
                    className="w-full h-full object-cover brightness-90"
                  />
                </div>

                {/* "Hi" Bubble Component */}
                <motion.div
                  style={{
                    scale: bubbleScale,
                    opacity: bubbleOpacity,
                  }}
                  className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-[#E8D1AB] text-black flex items-center justify-center text-3xl lg:text-5xl shadow-xl pointer-events-none z-30"
                >
                  Hi
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* SECTION 1: HERO CONTAINER */}
          <section className="relative flex items-center justify-center z-10 lg:pb-20 lg:min-h-[700px]">
            {/* Desktop View: Completely Unchanged Layout & Sizes */}
            <div className={`hidden md:grid font-[family-name:var(--font-antonio)] w-full grid-cols-3 items-center justify-between gap-4 pointer-events-none select-none relative z-10`}>
              <div className="text-left">
                <span className="text-xl lg:text-6xl uppercase text-white block mb-4 lg:mb-8">
                  {profile?.firstName} {profile?.lastName?.charAt(0)}
                </span>
                <h1 className="text-6xl md:text-[120px] uppercase text-white">
                  Creative
                </h1>
              </div>

              {/* Explicit spacer dimension preserving structural zone for the scaled canvas element */}
              <div className="w-[420px] h-[560px] mx-auto" />

              <div className="text-right mt-24">
                <h1 className="text-6xl md:text-[120px] uppercase text-white">
                  Partner
                </h1>
              </div>
            </div>

            {/* Mobile View: Custom sequence stack without the sub-description bio text */}
            <div className={`flex md:hidden flex-col items-center text-center w-full font-[family-name:var(--font-antonio)] relative z-10 px-4 pt-4`}>
              <span className="text-2xl uppercase tracking-wider text-white/80 font-light mb-2">
                {profile?.firstName} {profile?.lastName}
              </span>

              <h1 className="text-6xl uppercase text-white tracking-tight mb-4">
                Creative
              </h1>

              {/* Mobile Card Render */}
              <div className="relative w-[280px] aspect-[3/4.2] rounded-3xl overflow-visible shadow-xl border border-white/10 my-4 bg-neutral-900">
                <img
                  src={profileImg}
                  alt={profile.name}
                  className="rounded-3xl w-full h-full object-cover"
                />

                <div className="font-sans absolute bottom-6 -left-4 w-15 h-15 rounded-full bg-[#E8D1AB] text-black text-xl font-medium flex items-center justify-center shadow-lg transform">
                  Hi
                </div>
              </div>

              <h1 className="text-6xl uppercase text-white tracking-tight mt-4">
                Partner
              </h1>
            </div>
          </section>

          <div className="py-14 lg:py-30">
            <CenteredSeparator />
          </div>

          {/* SECTION 2: CREATOR DETAILS & SKILLS LIST */}
          <section className="relative flex items-center px-8 md:px-24 z-10 bg-[#0F0F0F]/40 backdrop-blur-sm lg:min-h-[700px]">
            <div className="w-full md:w-[45%] space-y-8 lg:space-y-18">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-[56px] leading-[1.1] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block tracking-tight text-center lg:text-left">
                  Creator Role
                </h2>

                <p className="text-white text-base lg:text-lg leading-relaxed max-w-md">
                  {profile.bio}
                  {profileRoleLabels.join(", ")}
                </p>
              </div>

              <div className="divide-y divide-white/10 border-b border-white/10">
                {
                  customServicesArray.map((service: any, idx: number) => (
                    <div key={`service_${idx}`} className="py-4 flex justify-between items-center group cursor-pointer">
                      <span className="text-lg lg:text-[32px] font-medium uppercase text-white">{idx + 1}. {service}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </section>

          <div className="py-14 lg:py-30">
            <CenteredSeparator />
          </div>

          {/* SECTION 3: BIO ARCHITECTURE & SPECIFICATIONS */}
          <section className="relative flex items-center px-8 md:px-24 z-10 lg:min-h-[700px]">
            <div className="w-full md:w-[45%] space-y-4 lg:space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-[56px] leading-[1.1] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[95%] bg-clip-text text-transparent select-text block tracking-tight text-center lg:text-left">
                  About Creator
                </h2>
                <p className="text-white text-base lg:text-lg leading-relaxed max-w-md">
                  {profile.bio}
                </p>
              </div>
              <Separator width={"w-fit"} />

              {/* Skill Node Tags Wrapper block */}
              {profile.skills && (
                <div className="space-y-4">
                  <h4 className="text-base lg:text-xl font-bold capitalize text-white">Skills</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {(Array.isArray(profile.skills) ? profile.skills : []).slice(0, 4).map((skill: any, idx: number) => (
                      <span key={idx} className="px-5 py-4 bg-[#101010] border border-white/20 rounded-lg text-sm font-medium text-[#FFFFFFAD]">
                        {typeof skill === 'object' ? skill.name : skill}
                      </span>
                    ))}
                    {(Array.isArray(profile.skills) ? profile.skills : []).length > 4 && (
                      <span className="px-5 py-4 bg-[#E8D1AB] text-black rounded-lg text-base font-semibold">
                        +{(Array.isArray(profile.skills) ? profile.skills : []).length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <Separator width={"w-fit"} />

              {/* Hardware Equipment Tagging grid row line */}
              {profile.equipment && profile.equipment.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-base lg:text-xl font-bold capitalize text-white">Equipment</h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.equipment.slice(0, 3).map((item: any, idx: number) => (
                      <span key={idx} className="px-5 py-4 bg-[#101010] border border-white/20 rounded-lg text-sm font-medium text-[#FFFFFFAD]">
                        {item.equipment_name}
                      </span>
                    ))}
                    {profile.equipment.length > 3 && (
                      <span className="px-5 py-4 bg-[#E8D1AB] text-black rounded-lg text-base font-semibold">
                        +{profile.equipment.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="pt-14 lg:pt-30">
          <CenteredSeparator />
        </div>

        {/* Featured Works */}
        <section className="mt-14 lg:my-20 overflow-hidden">
          <div className=" mx-auto relative overflow-hidden px-5 lg:px-0">
            <div className="flex flex-col items-center justify-center mb-4 lg:mb-8 pb-4">
              <h2 className="text-3xl md:text-[56px] leading-[1.1] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block tracking-tight">
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
              <FeaturedWork key={activeProject} items={dynamicPortfolioImages} />
            ) : (
              <div className="py-20 text-center text-white/40">
                No portfolio items available for this category.
              </div>
            )}
          </div>
        </section>

        {/* Certificates */}
        {/* {
          dynamicCertificates.length > 0 && (
            <>
              <CenteredSeparator />
              <section className="mt-14 lg:my-20 overflow-hidden">
                <div className="mx-auto relative overflow-hidden px-5 lg:px-0">
                  <div className="flex flex-col items-center justify-center mb-4 lg:mb-8 pb-4">
                    <h2 className="text-3xl md:text-[56px] leading-[1.1] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block tracking-tight">
                      Creators Certificate & Rewards
                    </h2>
                  </div>

                  Infinite Marquee Track Container
                  <div className="relative w-full overflow-hidden border-y border-white/70 flex [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
                    <motion.div
                      className="flex whitespace-nowrap min-w-full shrink-0 items-center justify-around gap-0"
                      animate={{ x: [0, "-50%"] }}
                      transition={{
                        ease: "linear",
                        duration: 25,
                        repeat: Infinity,
                      }}
                    >
                      Duplicating array elements creates a perfectly loopable seamless seam
                      {[...dynamicCertificates, ...dynamicCertificates].map((certificate: CertificateItem, index: number) => {
                        const isPDF = certificate.url.toLowerCase().endsWith('.pdf');
                        const fileUrl = `${S3_PREFIX}${certificate.url}`;

                        return (
                          <React.Fragment key={`certificate_wrapper_${index}`}>
                            <div
                              className="flex items-center justify-center shrink-0 w-[280px] md:w-[360px] h-30 md:h-[220px] relative px-6 md:px-12 group"
                            >
                              Content Display Zone
                              <div className="relative w-20 h-20 lg:w-32 lg:h-32 flex items-center justify-center rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                {isPDF ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 border border-white/5 text-white/20 rounded-xl">
                                    <div className="w-12 h-16 bg-[#FF453A] rounded flex items-center justify-center relative">
                                      <span className="text-white font-bold text-xs uppercase">Pdf</span>
                                      <div className="absolute top-0 right-0 w-4 h-4 bg-[#D93025] rounded-bl"></div>
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={fileUrl}
                                    alt={certificate.title || `Certificate ${index + 1}`}
                                    className="w-full h-full object-contain filter brightness-95 group-hover:brightness-110 transition-all duration-300"
                                  />
                                )}
                              </div>

                              Floating Text Title
                              {certificate.title && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <p className="text-[10px] md:text-xs font-medium text-white/70 tracking-wide bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-sm whitespace-normal max-w-[200px]">
                                    {certificate.title || "Certificate " + index+1}
                                  </p>
                                </div>
                              )}
                            </div>

                            Custom Vertical Gradient SVG Divider
                            <VerticalSeparatorDesktop />
                          </React.Fragment>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>
              </section>
            </>
          )
        } */}

        {/* Video Portfolio Section */}
        {dynamicVideos.length > 0 && (
          <>
            <CenteredSeparator />
            <section id="video-portfolio" className="relative w-full">
              <StackedVideoScroll videos={dynamicVideos} />
            </section>
          </>
        )}

      </div>
    </div>
  );
}

// Shell View Configuration wrapper
function CreatorProfilePageShell() {
  const searchParams = useSearchParams();
  const isModalView = searchParams.get("modal") === "1";

  return (
    <main className="bg-[#101010] min-h-screen text-white">
      {!isModalView && <Navbar />}
      <CreatorProfileContent isModalView={isModalView} />
      {!isModalView && <Footer />}
    </main>
  );
}

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={<AppLoading />}>
      <CreatorProfilePageShell />
    </Suspense>
  );
}


const VerticalSeparatorDesktop = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 2 120"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-[2px] h-[120px] ${className}`}
    aria-hidden
  >
    <defs>
      <linearGradient
        id="desktopSeparatorGradient"
        x1="1" y1="0"
        x2="1" y2="120"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="50%" stopColor="white" stopOpacity="0.7" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>

    <line
      x1="1" y1="0"
      x2="1" y2="120"
      stroke="url(#desktopSeparatorGradient)"
      strokeWidth="1"
    />
  </svg>
);
