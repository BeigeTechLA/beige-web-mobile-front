"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { Loader2, ArrowDownLeft, ArrowUpRight, CheckCircle2, X, AlertCircle } from "lucide-react";
import { useSearchCreatorsQuery, useGetRandomCrewQuery } from "@/lib/redux/features/creators/creatorsApi";
import { useCreateSalesAssistedLeadMutation } from "@/lib/redux/features/sales/salesApi";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Creator } from "@/lib/types";
import CreatorCarousel from "./components/CreatorsCarousel";
import CreatorCard from "./components/CreatorCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
  bookingId?: number;
}



export const V3SelectDreamTeam: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
  bookingId,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const swiperRef = useRef<SwiperType | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(0);
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Use local state for selection if not in data yet
  const [selectedIds, setSelectedIds] = useState<number[]>(data.selectedCrewIds || []);
  const [showSalesPopup, setShowSalesPopup] = useState(false);

  // Sales lead mutation
  const [createSalesLead, { isLoading: isCreatingSalesLead }] =
    useCreateSalesAssistedLeadMutation();

  // Build search params from booking data
  const searchParams = {
    content_types: data.contentType.filter((t) => t !== "editing").join(","),
    location: data.location || undefined,
    limit: 12,
    page: 1,
  };

  // Fetch real creators from API
  const {
    data: creatorsResponse,
    isLoading,
    error,
  } = useSearchCreatorsQuery(searchParams, {
    skip: !data.location || data.contentType.length === 0,
  });

  // Transform API creators to display format
  const creators: Creator[] = creatorsResponse?.data || [];

  // Fetch random crew
  const { data: randomCrewResponse } = useGetRandomCrewQuery();
  const additionalCreators: Creator[] = randomCrewResponse || [];


  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  // Helper to determine capabilities (User Request: "if any crew have two ability like video and photo")
  const getCreatorCapabilities = (creator: Creator) => {
    const roleName = creator.role_name?.toLowerCase() || "";
    const roleIdStr = String(creator.role_id);
    const skills = creator.skills ? (typeof creator.skills === 'string' ? creator.skills.toLowerCase() : JSON.stringify(creator.skills).toLowerCase()) : "";
    const bio = creator.bio?.toLowerCase() || "";

    const isVideo = roleName.includes("video") || roleIdStr.includes("1") || skills.includes("video") || skills.includes("videographer") || bio.includes("videographer");
    const isPhoto = roleName.includes("photo") || roleIdStr.includes("2") || skills.includes("photo") || skills.includes("photographer") || bio.includes("photographer");

    return { isVideo, isPhoto };
  };

  const requirements = useMemo(() => {
    let reqVideo = data.roleCounts?.videographer || 0;
    let reqPhoto = data.roleCounts?.photographer || 0;

    if (typeof window !== "undefined") {
      if (!reqVideo) reqVideo = Number(localStorage.getItem("required_videographers")) || 0;
      if (!reqPhoto) reqPhoto = Number(localStorage.getItem("required_photographers")) || 0;
    }

    // Availability is looser now, anyone with the capability counts towards "available"
    const availableVideo = creators.filter(c => getCreatorCapabilities(c).isVideo);
    const availablePhoto = creators.filter(c => getCreatorCapabilities(c).isPhoto);

    return {
      required: { video: reqVideo, photo: reqPhoto },
      available: { video: availableVideo, photo: availablePhoto },
      shortfall: {
        video: Math.max(0, reqVideo - availableVideo.length),
        photo: Math.max(0, reqPhoto - availablePhoto.length)
      }
    };
  }, [creators, data.roleCounts]);

  // Smart counting to distribute multi-role creators to fill holes
  const selectedCounts = useMemo(() => {
    const selectedCreators = creators.filter(c => selectedIds.includes(c.crew_member_id));

    let videoCount = 0;
    let photoCount = 0;
    const both: Creator[] = [];

    // First pass: Assign single-role creators
    selectedCreators.forEach(c => {
      const caps = getCreatorCapabilities(c);
      if (caps.isVideo && !caps.isPhoto) {
        videoCount++;
      } else if (!caps.isVideo && caps.isPhoto) {
        photoCount++;
      } else if (caps.isVideo && caps.isPhoto) {
        both.push(c);
      } else {
        // Fallback for others (maybe editing only?), check primary role
        const role = c.role_name?.toLowerCase() || "";
        if (role.includes("video")) videoCount++;
        else if (role.includes("photo")) photoCount++;
      }
    });

    // Second pass: Assign dual-role creators to where they are needed
    both.forEach(_ => {
      if (videoCount < requirements.required.video) {
        videoCount++;
      } else if (photoCount < requirements.required.photo) {
        photoCount++;
      } else {
        // If both full, just dump into video for now (or doesn't matter)
        videoCount++;
      }
    });

    return { video: videoCount, photo: photoCount };
  }, [selectedIds, creators, requirements]);

  const toggleSelection = (id: number) => {
    const creator = creators.find(c => c.crew_member_id === id);
    if (!creator) return;

    const { isVideo, isPhoto } = getCreatorCapabilities(creator);

    setSelectedIds((prev) => {
      const isAlreadySelected = prev.includes(id);

      if (isAlreadySelected) {
        return prev.filter((p) => p !== id);
      }

      // Check if we have space in EITHER compatible role
      const videoFull = selectedCounts.video >= requirements.required.video;
      const photoFull = selectedCounts.photo >= requirements.required.photo;

      if (isVideo && isPhoto) {
        // If they are double agent, they can fit in if ANY slot is open
        if (videoFull && photoFull) {
          toast.error(`You have already selected the required team members.`);
          return prev;
        }
      } else if (isVideo) {
        if (videoFull) {
          toast.error(`You have already selected the required ${requirements.required.video} Videographer(s).`);
          return prev;
        }
      } else if (isPhoto) {
        if (photoFull) {
          toast.error(`You have already selected the required ${requirements.required.photo} Photographer(s).`);
          return prev;
        }
      }

      if (data.crewCount > 0 && prev.length >= data.crewCount) return prev;

      return [...prev, id];
    });
  };

  useEffect(() => {
    updateData({ selectedCrewIds: selectedIds });
  }, [selectedIds, updateData]);

  // Handle Connect with Sales
  const handleConnectWithSales = async () => {
    try {
      if (!data.bookingId) {
        toast.error("Unable to connect with sales. Please try again.");
        return;
      }

      await createSalesLead({
        booking_id: data.bookingId,
        guest_email: data.email,
        client_name: data.fullName,
      }).unwrap();

      setShowSalesPopup(true);
    } catch (error) {
      console.error("Failed to create sales lead:", error);
      toast.error("Failed to connect with sales. Please try again.");
    }
  };

  const handleModalClose = () => {
    setShowSalesPopup(false);
    if (isAuthenticated) {
      router.push("/affiliate/dashboard");
    }
  };

  const canContinue = useMemo(() => {
    // User Request: "if not ad any team then user can continue"
    // So we always allow continue, but we will intercept the click if empty.
    return true;
  }, []);

  const handleContinue = () => {
    if (selectedIds.length === 0) {
      setShowEmptyWarning(true);
    } else {
      onNext();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
            Finding Your Dream Team
          </h2>
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
          <h2 className="text-lg lg:text-[54px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
            Our system is finding your perfect match — let&apos;s get your shoot started.
          </h2>
          <p className="text-white/60 mb-6">
            {error
              ? "We encountered an issue loading creators. Please try again."
              : "A Beige specialist will step in to make sure everything runs smoothly."}
          </p>
        </div>

        <div className="mx-auto">
          <Image
            src={"/images/misc/FindingCreators.svg"}
            alt="No Creators found"
            width={164}
            height={184}
          />
        </div>

        <div className="flex gap-3 lg:gap-6 justify-center items-center pt-6 lg:pt-10">
          <Button
            onClick={onNext}
            className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[200px]"
          >
            Complete Your Shoot
          </Button>
          <Button
            onClick={() => setShowSalesPopup(true)}
            className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
          >
            Connect with Sales
          </Button>
        </div>

        <AnimatePresence>
          {showSalesPopup && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSalesPopup(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-[#1A1A1A] border border-white/10 p-8 lg:p-12 rounded-[24px] max-w-lg w-full text-center shadow-2xl"
              >
                <button
                  onClick={() => setShowSalesPopup(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="bg-[#E8D1AB]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-[#E8D1AB] w-10 h-10" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">Request Received</h3>
                <p className="text-white/60 text-lg leading-relaxed">
                  Our Sales team will shortly reach out to you to finalize your creative requirements.
                </p>
                <Button
                  onClick={() => setShowSalesPopup(false)}
                  className="mt-8 w-full bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold h-14 rounded-xl"
                >
                  Got it
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Swiper Section for additional creators */}
        <section className="pt-6 lg:pt-15 border-t border-white/10 overflow-hidden">
          <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
            <div className="flex items-center justify-between mb-4 lg:mb-8 pb-4">
              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
                Browse other creative partners
              </h2>
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
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              spaceBetween={24}
              slidesPerView={1.1}
              breakpoints={{
                768: { slidesPerView: 2 },
                1280: { slidesPerView: 3 },
              }}
              className="!overflow-visible h-[364px] lg:h-[585px] !p-[2px]"
            >
              {additionalCreators.map((creator, index) => (
                <SwiperSlide key={creator.crew_member_id}>
                  {({ isActive }) => (
                    <CreatorCard
                      {...creator}
                      name={creator.name || "Creator"}
                      role_name={creator.role_name || ""}
                      // rating={creator.rating || 0}
                      total_reviews={creator.total_reviews || 0}
                      profile_image={creator.profile_image || ""}
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
          Select Your Dream Team
        </h2>
        <p className="text-white/60 mb-4">
          Based on your project, we&apos;ve handpicked the best professionals.
          Select crew members to build your team.
        </p>

        {/* ROLE SELECTION STATUS */}

      </div>

      <div className="border-t border-white/10 pt-15">
        <CreatorCarousel
          creators={creators}
          selectedIds={selectedIds}
          toggleSelection={toggleSelection}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {requirements.required.video > 0 && (
          <div className={`px-4 py-2 rounded-full border ${selectedCounts.video === requirements.required.video ? 'bg-[#E8D1AB]/20 border-[#E8D1AB]' : 'border-white/10'}`}>
            <span className="text-white/90 text-sm">
              Videographer(s): {selectedCounts.video} / {requirements.required.video}
            </span>
          </div>
        )}
        {requirements.required.photo > 0 && (
          <div className={`px-4 py-2 rounded-full border ${selectedCounts.photo === requirements.required.photo ? 'bg-[#E8D1AB]/20 border-[#E8D1AB]' : 'border-white/10'}`}>
            <span className="text-white/90 text-sm">
              Photographer(s): {selectedCounts.photo} / {requirements.required.photo}
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-3 lg:gap-6 justify-center items-center pt-6 lg:pt-15 border-t border-white/10">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-sm lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium  text-sm lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canContinue ? `Continue with ${selectedIds.length} Creative(s)` : "Complete Selection"}
        </Button>
      </div>

      {/* EMPTY SELECTION WARNING MODAL */}
      <AnimatePresence>
        {showEmptyWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmptyWarning(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#1A1A1A] border border-white/10 p-8 lg:p-12 rounded-[24px] max-w-lg w-full text-center shadow-2xl"
            >
              <button
                onClick={() => setShowEmptyWarning(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="bg-[#E8D1AB]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-[#E8D1AB] w-10 h-10" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">No Crew Selected?</h3>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                You are choosing to continue without adding any team members.
                <br />
                <span className="text-[#E8D1AB] font-medium">Beige's team will create the best talent for you based on your needs.</span>
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  onClick={() => setShowEmptyWarning(false)}
                  className="flex-1 bg-transparent border border-white/20 hover:bg-white/5 text-white h-14 rounded-xl"
                >
                  Go Back & Select
                </Button>
                <Button
                  onClick={() => {
                    setShowEmptyWarning(false);
                    onNext();
                  }}
                  className="flex-1 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold h-14 rounded-xl"
                >
                  Yes, Continue
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHORTFALL MESSAGE */}
      {(requirements.shortfall.video > 0 || requirements.shortfall.photo > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-2xl mx-auto bg-[#E8D1AB]/5 border border-[#E8D1AB]/20 p-4 rounded-xl flex items-start gap-3 text-left shadow-lg shadow-black/20"
        >
          <AlertCircle className="text-[#E8D1AB] w-5 h-5 mt-0.5 shrink-0" />

          <div className="text-[#E8D1AB]/90 text-sm leading-relaxed">
            <p>
              A smaller pool is Unavailable in your area (
              <span className="font-medium text-[#E8D1AB]">
                {requirements.shortfall.video > 0 && `${requirements.shortfall.video} Videographer(s)`}
                {requirements.shortfall.video > 0 && requirements.shortfall.photo > 0 && " and "}
                {requirements.shortfall.photo > 0 && `${requirements.shortfall.photo} Photographer(s)`}
              </span>
              {" "}Unavailable).
            </p>
            <p className="text-[#E8D1AB] font-semibold">
              Start with what you see here and a Beige specialist will curate and manage the remaining creators for you.
            </p>
          </div>

        </motion.div>
      )}
      {/* {(requirements.shortfall.video > 0 || requirements.shortfall.photo > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-2xl mx-auto bg-[#E8D1AB]/5 border border-[#E8D1AB]/20 p-4 rounded-xl flex items-start gap-3 text-left shadow-lg shadow-black/20"
        >
          <AlertCircle className="text-[#E8D1AB] w-5 h-5 mt-0.5 shrink-0" />

          <p className="text-[#E8D1AB]/90 text-sm leading-relaxed">
            We noticed we have fewer creators available in your area than requested (
            <span className="font-medium text-[#E8D1AB]">
              {requirements.shortfall.video > 0 && `${requirements.shortfall.video} Videographer(s)`}
              {requirements.shortfall.video > 0 && requirements.shortfall.photo > 0 && " and "}
              {requirements.shortfall.photo > 0 && `${requirements.shortfall.photo} Photographer(s)`}
            </span>
            {" "}remaining).
            <strong>
              You can continue with the available selection; our sales team will personally source the remaining talent for you.
            </strong>
          </p>
        </motion.div>
      )} */}
    </div>
  );
};