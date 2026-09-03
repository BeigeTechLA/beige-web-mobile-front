"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  MapPin,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  LayoutGrid,
  PictureInPicture2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Swiper JS Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Mousewheel } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";

import "swiper/css";
import "swiper/css/effect-cards";
import Link from "next/link";

export interface StudioItem {
  id: string;
  name: string;
  subtitle: string;
  location: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  pricePerHour: number;
  availability: string;
  image: string;
  link: string;
}

export interface StudiosSelectionProps {
  onContinue: (selectedStudios: string[]) => void;
  onBack?: () => void;
  studios?: StudioItem[];
  initialSelectedStudioIds?: string[];
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

const DEFAULT_STUDIOS: StudioItem[] = [
  {
    id: "studio-1",
    name: "Beige Media",
    subtitle: "(Modern Resort Villa with Jacuzzi)",
    location: "Woodland Hills, Los Angeles,",
    rating: 4.5,
    reviewCount: 120,
    tags: ["Natural light", "Product-friendly"],
    pricePerHour: 150,
    availability: "Available Jun 24",
    image:
      "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
    link: "/studios/new-1787571533413"
  },
  {
    id: "studio-2",
    name: "Hollywood Hills Oasis",
    subtitle: "(Panoramic View Luxury Studio)",
    location: "Hollywood Hills, Los Angeles,",
    rating: 4.8,
    reviewCount: 95,
    tags: ["Cyclorama", "High Ceiling"],
    pricePerHour: 185,
    availability: "Available Jun 25",
    image:
      "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
    link: "/studios/new-1787571533413"
  },
  {
    id: "studio-3",
    name: "Minimalist Loft",
    subtitle: "(Industrial Concrete & Glass)",
    location: "Downtown, Los Angeles,",
    rating: 4.6,
    reviewCount: 84,
    tags: ["Blackout Ready", "Soundproof"],
    pricePerHour: 135,
    availability: "Available Jun 26",
    image:
      "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
    link: "/studios/new-1787571533413"
  },
];

const customSwiperStyles = `
  .studio-stack-swiper {
    width: 100%;
    height: 520px !important;
    padding-top: 25px !important;
    padding-bottom: 25px !important;
    overflow: visible !important;
    cursor: default !important;
  }

  .studio-stack-swiper .swiper-wrapper,
  .studio-stack-swiper .swiper-slide {
    cursor: default !important;
  }

  .studio-stack-swiper.swiper-grab,
  .studio-stack-swiper.swiper-grab .swiper-wrapper,
  .studio-stack-swiper.swiper-grab .swiper-slide,
  .studio-stack-swiper.swiper-grabbing,
  .studio-stack-swiper.swiper-grabbing .swiper-wrapper,
  .studio-stack-swiper.swiper-grabbing .swiper-slide {
    cursor: default !important;
  }

  @media (min-width: 1024px) {
    .studio-stack-swiper {
      height: 480px !important;
      padding-top: 30px !important;
      padding-bottom: 30px !important;
    }
  }

  .studio-stack-swiper .swiper-slide {
    height: 450px !important;
    border-radius: 16px;
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none !important;
  }

  .studio-stack-swiper .swiper-slide-active,
  .studio-stack-swiper .swiper-slide-visible {
    pointer-events: auto !important;
  }

  .studio-stack-swiper .swiper-slide-active .studio-card-action,
  .studio-stack-swiper .swiper-slide-visible .studio-card-action {
    pointer-events: auto !important;
    touch-action: manipulation;
    cursor: pointer !important;
  }

  @media (min-width: 1024px) {
    .studio-stack-swiper .swiper-slide {
      height: 410px !important;
    }
  }

  .swiper-slide-shadow {
    display: none !important;
  }
`;

export const StudiosSelection: React.FC<StudiosSelectionProps> = ({
  onContinue,
  onBack,
  studios = DEFAULT_STUDIOS,
  initialSelectedStudioIds = [],
  title = "Studios That Fit Your Project",
  subtitle = "Browse available studios and find the right space for your shoot.",
  stepNumber = "03",
  completionPercentage = 20,
}) => {
  const [selectedStudioIds, setSelectedStudioIds] = useState<string[]>(initialSelectedStudioIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"stack" | "grid">("stack");
  const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);
  const [sortBy, setSortBy] = useState("");
  const stackActionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const stackPointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (initialSelectedStudioIds && initialSelectedStudioIds.length > 0) {
      setSelectedStudioIds(initialSelectedStudioIds);
    }
  }, [initialSelectedStudioIds]);

  const filteredStudios = useMemo(() => {
    if (!searchQuery.trim()) return studios;
    const q = searchQuery.toLowerCase();
    return studios.filter(
      (studio) =>
        studio.name.toLowerCase().includes(q) ||
        studio.location.toLowerCase().includes(q) ||
        studio.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        studio.subtitle.toLowerCase().includes(q)
    );
  }, [studios, searchQuery]);

  const toggleSelectStudio = (id: string) => {
    setSelectedStudioIds((prev) =>
      prev.includes(id) ? prev.filter((studioId) => studioId !== id) : [...prev, id]
    );
  };

  const setStackSwipeEnabled = (enabled: boolean) => {
    if (!swiperRef || swiperRef.destroyed) return;
    swiperRef.allowTouchMove = enabled;
  };

  const setStackActionButtonRef = (studioId: string, element: HTMLButtonElement | null) => {
    stackActionButtonRefs.current[studioId] = element;
  };

  const handleStackPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    stackPointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleStackPointerUpCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointerStart = stackPointerStartRef.current;
    stackPointerStartRef.current = null;

    if (!pointerStart) return;

    const movedX = Math.abs(event.clientX - pointerStart.x);
    const movedY = Math.abs(event.clientY - pointerStart.y);
    if (movedX > 8 || movedY > 8) return;

    const isPointInsideButton = (button: HTMLButtonElement | null) => {
      if (!button) return false;
      const rect = button.getBoundingClientRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    };

    const activeStudioId = filteredStudios[swiperRef?.activeIndex || 0]?.id;
    const activeButton = activeStudioId ? stackActionButtonRefs.current[activeStudioId] : null;

    if (!activeStudioId || !isPointInsideButton(activeButton)) return;

    event.preventDefault();
    event.stopPropagation();
    toggleSelectStudio(activeStudioId);
    setStackSwipeEnabled(true);
  };

  const stopStackCardGesture = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const lockStackActionGesture = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setStackSwipeEnabled(false);
  };

  const unlockStackActionGesture = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    window.setTimeout(() => setStackSwipeEnabled(true), 0);
  };

  const handleStackStudioKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    studioId: string
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    toggleSelectStudio(studioId);
  };

  const handleNext = () => {
    if (!swiperRef) return;
    swiperRef.slideNext();
  };

  const handlePrev = () => {
    if (!swiperRef) return;
    swiperRef.slidePrev();
  };

  const handleContinue = () => {
    if (selectedStudioIds.length === 0) {
      toast.error("Please select at least one studio.");
      return;
    }

    onContinue(selectedStudioIds);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between select-none">
      <style>{customSwiperStyles}</style>
      <div>
        {/* Top Header Row */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="mb-5 lg:mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP {stepNumber}
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div className="h-full bg-[#E8D1AB] transition-all duration-300"
              style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>

        {/* Section Heading & View Toggle */}
        <div className="flex items-start justify-between mb-4 lg:mb-6">
          <div>
            <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
              {title}
            </h1>
            <p className="text-white/30 text-sm md:text-xl font-light">
              {subtitle}
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-transparent border border-white/20 rounded-xl lg:rounded-2xl p-1 lg:p-2.5 gap-1">
            <button
              type="button"
              onClick={() => setViewMode("stack")}
              className={`flex items-center justify-center p-1 lg:p-2 rounded-lg transition-colors cursor-pointer ${viewMode === "stack"
                ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border border-[#E8D1AB]"
                : "text-white hover:text-white/80"
                }`}
            >
              <PictureInPicture2 className="w-3.5 h-3.5 lg:w-6 lg:h-6" strokeWidth={1} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center p-1 lg:p-2 rounded-lg transition-colors cursor-pointer ${viewMode === "grid"
                ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border border-[#E8D1AB]"
                : "text-white hover:text-white/80"
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 lg:w-6 lg:h-6" strokeWidth={1} />
            </button>
          </div>
        </div>

        {/* Search and Sort Toolbar */}
        <div className="flex items-center gap-3 mb-5 lg:mb-12">
          {/* Search Input */}
          <div className="relative h-12 flex-1 w-full bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/20 rounded-lg lg:rounded-xl px-4 py-3 flex items-center gap-3 transition-colors">
            <Search className="w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Studio..."
              className="bg-transparent text-white placeholder:text-white/30 outline-none w-full text-sm md:text-base font-light"
            />
          </div>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-auto h-12 px-5 py-3 rounded-lg lg:rounded-xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/10 text-white hover:text-white/80 font-medium text-sm flex items-center justify-between gap-4 transition-colors cursor-pointer shrink-0">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#333333]">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Swiper / Grid Section */}
        {viewMode === "stack" ? (
          <div
            className="relative w-full max-w-6xl mx-auto flex items-center justify-center my-3 lg:my-6"
            onPointerDownCapture={handleStackPointerDownCapture}
            onPointerUpCapture={handleStackPointerUpCapture}
          >
            {/* Swiper Arrow Prev (Hidden on Mobile) */}
            <button
              type="button"
              onClick={handlePrev}
              className="hidden md:flex absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-[#101010]/80 text-white items-center justify-center hover:bg-white/10 transition-all z-30 cursor-pointer"
            >
              <ArrowUp className="w-5 h-5" />
            </button>

            {/* Swiper Stack Container */}
            <div className="w-full max-w-6xl overflow-hidden px-1 lg:px-10">
              <Swiper
                direction="vertical"
                effect="cards"
                grabCursor={false}
                modules={[EffectCards, Mousewheel]}
                onSwiper={setSwiperRef}
                watchSlidesProgress
                rewind={true}
                speed={400}
                slideToClickedSlide={false}
                mousewheel={{
                  forceToAxis: true,
                  releaseOnEdges: true,
                }}
                noSwiping
                noSwipingSelector=".studio-card-action"
                preventClicks={false}
                preventClicksPropagation={false}
                cardsEffect={{
                  slideShadows: false,
                  perSlideOffset: 12,
                  perSlideRotate: 0,
                }}
                className="studio-stack-swiper"
              >
                {filteredStudios.map((studio) => {
                  const isAdded = selectedStudioIds.includes(studio.id);

                  return (
                    <SwiperSlide key={studio.id} className="border border-white/20 bg-[#101010] overflow-hidden">
                      <div className="w-full h-full flex flex-col md:flex-row items-stretch">
                        {/* Studio Image + Rating Badge */}
                        <div className="relative w-full md:w-[40%] lg:w-[42%] h-[180px] md:h-full rounded-t-xl md:rounded-tr-none md:rounded-l-xl overflow-hidden shrink-0">
                          <Image
                            src={studio.image}
                            alt={studio.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-white/20 lg:backdrop-blur-md text-white px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-sm font-medium flex items-center gap-1.5 border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-4 lg:h-4" viewBox="0 0 20 20" fill="none">
                              <path d="M19.4965 7.2823C19.4339 7.08334 19.3158 6.90771 19.1569 6.7772C18.9981 6.6467 18.8055 6.56707 18.603 6.5482L12.9602 6.02112L10.7301 0.649329C10.5655 0.254664 10.1909 0 9.77386 0C9.35686 0 8.98209 0.254664 8.81849 0.649329L6.58842 6.02112L0.944711 6.5482C0.530959 6.58748 0.180623 6.87581 0.0511939 7.2823C-0.0118736 7.48143 -0.0167794 7.69522 0.0370842 7.89719C0.0909477 8.09916 0.201214 8.28044 0.354225 8.41857L4.61976 12.2668L3.36209 17.9661C3.27008 18.3851 3.42814 18.8185 3.76611 19.0698C3.94312 19.2023 4.15643 19.2736 4.37534 19.2734C4.56298 19.2734 4.7471 19.221 4.90806 19.1218L9.77386 16.1284L14.6388 19.1218C14.8133 19.2292 15.0146 19.2816 15.2178 19.2723C15.421 19.2631 15.617 19.1927 15.7816 19.0698C16.1196 18.8185 16.2777 18.3851 16.1857 17.9661L14.9279 12.2668L19.1935 8.41861C19.3465 8.28049 19.4568 8.09921 19.5107 7.89724C19.5645 7.69526 19.5596 7.48147 19.4965 7.28234V7.2823Z" fill="#FDE955" />
                            </svg>
                            <span>
                              {studio.rating} ({studio.reviewCount})
                            </span>
                          </div>
                        </div>

                        {/* Studio Content & Details */}
                        <div className="flex-1 flex flex-col justify-between rounded-r-xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-3.5 lg:p-5 min-w-0 h-full">
                          <div className="flex-1 min-w-0">
                            {/* Title & Status Badge */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0">
                                <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white leading-snug">
                                  {studio.name}
                                </h3>
                                {studio.subtitle && (
                                  <span className="text-white/70 text-xs lg:text-sm font-normal block mt-0.5">
                                    {studio.subtitle}
                                  </span>
                                )}
                              </div>

                              {isAdded && (
                                <span className="flex items-center gap-1 bg-[#4CAF50] text-white border border-[#4CAF50] px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full text-[10px] lg:text-sm shrink-0 font-medium">
                                  <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Added
                                </span>
                              )}
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1 text-[11px] lg:text-sm text-white/70 mt-1">
                              <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" strokeWidth={1.5} />
                              <span className="truncate">{studio.location}</span>
                            </div>

                            <hr className="border-t my-2.5 lg:my-3.5 border-white/20" />

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
                              {studio.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 lg:px-3.5 lg:py-1 rounded-md border border-white/20 bg-[#171716] text-[11px] lg:text-sm text-white/70 font-light"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <hr className="border-t my-2.5 lg:my-3.5 border-white/20" />

                          {/* Action & Price Footer */}
                          <div className="flex items-center justify-between pt-1 shrink-0 mt-auto">
                            <div className="flex items-center gap-2">
                              {isAdded ? (
                                <button
                                  type="button"
                                  ref={(element) => setStackActionButtonRef(studio.id, element)}
                                  data-swiper-no-swiping
                                  onPointerEnter={() => setStackSwipeEnabled(false)}
                                  onPointerLeave={() => setStackSwipeEnabled(true)}
                                  onPointerDown={lockStackActionGesture}
                                  onPointerMove={stopStackCardGesture}
                                  onPointerCancel={unlockStackActionGesture}
                                  onPointerUp={unlockStackActionGesture}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onKeyDown={(e) => handleStackStudioKeyDown(e, studio.id)}
                                  className="studio-card-action swiper-no-swiping relative z-30 px-4 py-2 lg:px-8 lg:py-3 rounded-full bg-[#FFC9C9] text-[#C31717] text-xs lg:text-base font-medium hover:bg-[#FFC9C9]/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <X className="w-4 h-4 lg:w-5 lg:h-5" />
                                  <span>Remove</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  ref={(element) => setStackActionButtonRef(studio.id, element)}
                                  data-swiper-no-swiping
                                  onPointerEnter={() => setStackSwipeEnabled(false)}
                                  onPointerLeave={() => setStackSwipeEnabled(true)}
                                  onPointerDown={lockStackActionGesture}
                                  onPointerMove={stopStackCardGesture}
                                  onPointerCancel={unlockStackActionGesture}
                                  onPointerUp={unlockStackActionGesture}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onKeyDown={(e) => handleStackStudioKeyDown(e, studio.id)}
                                  className="studio-card-action swiper-no-swiping relative z-30 px-4 py-2 lg:px-8 lg:py-3 rounded-full bg-white text-black text-xs lg:text-base font-medium hover:bg-white/90 transition-colors cursor-pointer shadow-md"
                                >
                                  Add this Studio
                                </button>
                              )}

                              {/* Add studio detail page link */}
                              <Link
                                href={studio.link}
                                target="_blank"
                                data-swiper-no-swiping
                                onPointerEnter={() => setStackSwipeEnabled(false)}
                                onPointerLeave={() => setStackSwipeEnabled(true)}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  setStackSwipeEnabled(false);
                                }}
                                onPointerUp={(e) => {
                                  e.stopPropagation();
                                  window.setTimeout(() => setStackSwipeEnabled(true), 0);
                                }}
                                onPointerCancel={(e) => {
                                  e.stopPropagation();
                                  setStackSwipeEnabled(true);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="studio-card-action swiper-no-swiping relative z-30 w-8 h-8 lg:h-11 lg:w-11 rounded-full border border-white/40 bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 lg:w-6 lg:h-6" viewBox="0 0 34 34" fill="none">
                                  <path d="M23.3643 12.1704L10.22 21.4163" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                                  <path d="M21.9857 20.091C20.3042 17.7006 20.8201 13.9603 23.3647 12.1703" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                                  <path d="M15.444 10.7913C17.1255 13.1817 20.8201 13.9603 23.3647 12.1703" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                                </svg>
                              </Link>
                            </div>

                            <div className="text-right">
                              <span className="text-xs lg:text-sm text-[#1DAA23] block font-medium">
                                {studio.availability}
                              </span>
                              <div className="text-[#E8D1AB] text-xl lg:text-3xl font-['Roboto_Condensed'] font-bold">
                                ${studio.pricePerHour}{" "}
                                <span className="text-xs md:text-lg text-white font-normal">
                                  / hour
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Swiper Vertical Arrow Next */}
            <button
              type="button"
              onClick={handleNext}
              className="hidden md:flex absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-[#101010]/80 text-white items-center justify-center hover:bg-white/10 transition-all z-30 cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Fallback Grid View Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 my-6">
            {filteredStudios.map((studio) => {
              const isAdded = selectedStudioIds.includes(studio.id);

              return (
                <div
                  key={studio.id}
                  className="rounded-lg lg:rounded-2xl border bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border-white/20 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative w-full h-48 rounded-lg lg:rounded-xl overflow-hidden mb-4">
                      <Image
                        src={studio.image}
                        alt={studio.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-white/20 lg:backdrop-blur-md text-white px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-sm font-medium flex items-center gap-1.5 border border-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-4 lg:h-4" viewBox="0 0 20 20" fill="none">
                          <path d="M19.4965 7.2823C19.4339 7.08334 19.3158 6.90771 19.1569 6.7772C18.9981 6.6467 18.8055 6.56707 18.603 6.5482L12.9602 6.02112L10.7301 0.649329C10.5655 0.254664 10.1909 0 9.77386 0C9.35686 0 8.98209 0.254664 8.81849 0.649329L6.58842 6.02112L0.944711 6.5482C0.530959 6.58748 0.180623 6.87581 0.0511939 7.2823C-0.0118736 7.48143 -0.0167794 7.69522 0.0370842 7.89719C0.0909477 8.09916 0.201214 8.28044 0.354225 8.41857L4.61976 12.2668L3.36209 17.9661C3.27008 18.3851 3.42814 18.8185 3.76611 19.0698C3.94312 19.2023 4.15643 19.2736 4.37534 19.2734C4.56298 19.2734 4.7471 19.221 4.90806 19.1218L9.77386 16.1284L14.6388 19.1218C14.8133 19.2292 15.0146 19.2816 15.2178 19.2723C15.421 19.2631 15.617 19.1927 15.7816 19.0698C16.1196 18.8185 16.2777 18.3851 16.1857 17.9661L14.9279 12.2668L19.1935 8.41861C19.3465 8.28049 19.4568 8.09921 19.5107 7.89724C19.5645 7.69526 19.5596 7.48147 19.4965 7.28234V7.2823Z" fill="#FDE955" />
                        </svg>
                        <span>
                          {studio.rating} ({studio.reviewCount})
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white leading-snug">
                      {studio.name}
                    </h3>
                    {studio.subtitle && (
                      <span className="text-white/70 text-xs lg:text-sm font-normal block mt-0.5">
                        {studio.subtitle}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[11px] lg:text-sm text-white/70 mt-1">
                      <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{studio.location}</span>
                    </div>
                    <hr className="border-t my-2.5 lg:my-3.5 border-white/20" />

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
                      {studio.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 lg:px-3.5 lg:py-1 rounded-md border border-white/20 bg-[#171716] text-[11px] lg:text-sm text-white/70 font-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <hr className="border-t my-2.5 lg:my-3.5 border-white/20" />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => toggleSelectStudio(studio.id)}
                        className={`studio-card-action relative z-30 px-4 lg:px-5 py-2 rounded-full text-xs lg:text-base font-medium cursor-pointer ${isAdded
                          ? "bg-[#FFC9C9] text-[#C31717] hover:bg-[#FFC9C9]/80"
                          : "bg-white text-black hover:bg-white/90"
                          }`}
                      >
                        {isAdded ? "Remove" : "Add this Studio"}
                      </button>
                      {/* Add studio detail page link */}
                      <Link
                        href={studio.link}
                        target="_blank"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="studio-card-action relative z-30 w-8 h-8 lg:h-11 lg:w-11 rounded-full border border-white/40 bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 lg:w-6 lg:h-6" viewBox="0 0 34 34" fill="none">
                          <path d="M23.3643 12.1704L10.22 21.4163" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                          <path d="M21.9857 20.091C20.3042 17.7006 20.8201 13.9603 23.3647 12.1703" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                          <path d="M15.444 10.7913C17.1255 13.1817 20.8201 13.9603 23.3647 12.1703" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                        </svg>
                      </Link>
                    </div>
                    <div className="text-right">
                      <span className="text-xs lg:text-sm text-[#1DAA23] block font-medium">
                        {studio.availability}
                      </span>
                      <div className="text-[#E8D1AB] text-xl lg:text-2xl">
                        <span className="font-['Roboto_Condensed'] font-bold">${studio.pricePerHour}{" "}</span>
                        <span className="text-xs lg:text-sm text-white font-normal">
                          / hour
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StudiosSelection;
