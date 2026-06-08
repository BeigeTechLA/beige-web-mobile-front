"use client";

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { Loader2, ArrowDownLeft, ArrowUpRight, CheckCircle2, X, AlertCircle, Video, Camera } from "lucide-react";
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
import { pushToDataLayer } from "@/lib/gtm";
import type { CrewRole, SelectedCrewRoles } from "./types";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
  bookingId?: number;
}

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}

export const V3SelectDreamTeam: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
  bookingId,
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const swiperRef = useRef<SwiperType | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(0);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [activeRoleFilter, setActiveRoleFilter] = useState<"video" | "photo" | null>(null);

  // Use local state for selection if not in data yet
  const [selectedIds, setSelectedIds] = useState<number[]>(data.selectedCrewIds || []);
  const [selectedRoles, setSelectedRoles] = useState<SelectedCrewRoles>(
    data.selectedCrewRoles || {}
  );
  const [showSalesPopup, setShowSalesPopup] = useState(false);

  // Sales lead mutation
  const [createSalesLead, { isLoading: isCreatingSalesLead }] =
    useCreateSalesAssistedLeadMutation();
  const isEditingOnly =
    data.contentType.length === 1 && data.contentType.includes("editing");

  const locationLatitude =
    data.locationDetails?.coordinates?.lat ??
    data.locationDetails?.lat ??
    data.locationDetails?.center?.[1] ??
    undefined;
  const locationLongitude =
    data.locationDetails?.coordinates?.lng ??
    data.locationDetails?.lng ??
    data.locationDetails?.center?.[0] ??
    undefined;

  // Build search params from booking data
  const searchParams = {
    content_types: isEditingOnly
      ? "editor"
      : data.contentType.filter((t) => t !== "editing").join(","),
    latitude: isEditingOnly ? undefined : locationLatitude,
    longitude: isEditingOnly ? undefined : locationLongitude,
    limit: 12,
    page: 1,
  };

  // Fetch real creators from API
  const {
    data: creatorsResponse,
    isLoading,
    error,
  } = useSearchCreatorsQuery(searchParams, {
    skip:
      data.contentType.length === 0 || (!isEditingOnly && (locationLatitude === undefined || locationLongitude === undefined)),
  });

  // Transform API creators to display format
  const creators: Creator[] = creatorsResponse?.data || [];

  // Fetch random crew
  const { data: randomCrewResponse } = useGetRandomCrewQuery();
  const additionalCreators: Creator[] = randomCrewResponse || [];

  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  useEffect(() => {
    const formFields = {
      content_type: data.contentType.join(","),
      shoot_type: data.shootType,
      shoot_date_time: `${data.startDate} to ${data.endDate}`,
      edits_needed: data.editsNeeded,
      photo_edit_types: data.photoEditTypes.join(", "),
      video_edit_types: data.videoEditTypes.join(", "),
      additional_creative: data.addTeamMembers,
      shoot_location: data.location,
      additional_details: data.specialInstructions,
      supporting_url: data.referenceLinks,
      videographyCount: data?.roleCounts?.videographer,
      photographyCount: data?.roleCounts?.photographer,
    };

    const dlEvent = (creators.length > 0) ? "cp_selection_found" : "cp_selection_not_found"
    pushToDataLayer(dlEvent, {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_dream_team",
      duration_on_page: performance.now() / 1000,
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : data.email,
      email: isAuthenticated ? user?.email : "Unknown",
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      booking_id: data?.bookingId,
      booking_form_fields: formFields
    });
  }, [creators])

  // Helper to determine capabilities (User Request: "if any crew have two ability like video and photo")
  const getCreatorCapabilities = (creator: Creator) => {
    const roleName = creator.role_name?.toLowerCase() || "";
    const roleId = Number(creator.role_id);
    const skills = creator.skills ? (typeof creator.skills === 'string' ? creator.skills.toLowerCase() : JSON.stringify(creator.skills).toLowerCase()) : "";
    const bio = creator.bio?.toLowerCase() || "";

    // 1=Videographer, 11=Videographer (Pricing), 12=Cinematographer (Pricing/Video)
    const isVideo = roleName.includes("video") || roleId === 1 || roleId === 11 || roleId === 12 || skills.includes("video") || skills.includes("videographer") || bio.includes("videographer");
    
    // 2=Photographer, 10=Photographer (Pricing)
    const isPhoto = roleName.includes("photo") || roleId === 2 || roleId === 10 || skills.includes("photo") || skills.includes("photographer") || bio.includes("photographer");

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

  useEffect(() => {
    if (requirements.required.video > 0 && requirements.required.photo === 0) {
      setActiveRoleFilter("video");
      return;
    }

    if (requirements.required.photo > 0 && requirements.required.video === 0) {
      setActiveRoleFilter("photo");
      return;
    }

    if (requirements.required.video > 0 && requirements.required.photo > 0) {
      setActiveRoleFilter((prev) => prev ?? "video");
      return;
    }

    setActiveRoleFilter(null);
  }, [requirements.required.video, requirements.required.photo]);

  const getDefaultRoleForCreator = (
    creator: Creator,
    currentCounts: { video: number; photo: number },
  ): CrewRole | null => {
    const caps = getCreatorCapabilities(creator);

    if (caps.isVideo && !caps.isPhoto) return "video";
    if (!caps.isVideo && caps.isPhoto) return "photo";
    if (!caps.isVideo && !caps.isPhoto) return null;

    if (currentCounts.video < requirements.required.video && currentCounts.photo >= requirements.required.photo) {
      return "video";
    }
    if (currentCounts.photo < requirements.required.photo && currentCounts.video >= requirements.required.video) {
      return "photo";
    }

    return currentCounts.video <= currentCounts.photo ? "video" : "photo";
  };

  // Helper to calculate counts for any set of IDs
  const calculateCounts = (
    ids: number[],
    roleAssignments: SelectedCrewRoles = {}
  ) => {
    const selectedCreators = creators.filter(c => ids.includes(c.crew_member_id));
    let videoCount = 0;
    let photoCount = 0;
    const both: Creator[] = [];

    selectedCreators.forEach(c => {
      const caps = getCreatorCapabilities(c);
      const assignedRole = roleAssignments[c.crew_member_id];

      if (assignedRole === "video") {
        videoCount++;
      }

      if (assignedRole === "photo") {
        photoCount++;
      }

      if (!assignedRole && caps.isVideo && caps.isPhoto) {
        both.push(c);
      } else if (!assignedRole) {
        const role = (c.role_name || "").toLowerCase();
        if (role.includes("video")) videoCount++;
        else if (role.includes("photo")) photoCount++;
      }
    });

    const targetV = requirements.required.video;
    const targetP = requirements.required.photo;

    both.forEach(() => {
        const deficitV = targetV - videoCount;
        const deficitP = targetP - photoCount;
        if (deficitV > 0 && deficitP > 0) videoCount++;
        else if (deficitV > deficitP) videoCount++;
        else if (deficitP > deficitV) photoCount++;
        else {
          if (videoCount <= photoCount) videoCount++;
          else photoCount++;
      }
    });

    return { video: videoCount, photo: photoCount };
  };

  // Smart counting to distribute multi-role creators to fill holes
  const selectedCounts = useMemo(
    () => calculateCounts(selectedIds, selectedRoles),
    [selectedIds, selectedRoles, creators, requirements, calculateCounts]
  );

  const filteredCreators = useMemo(() => {
    if (activeRoleFilter === "video") {
      return creators.filter((creator) => getCreatorCapabilities(creator).isVideo);
    }

    if (activeRoleFilter === "photo") {
      return creators.filter((creator) => getCreatorCapabilities(creator).isPhoto);
    }

    return creators;
  }, [activeRoleFilter, creators]);

  const getSelectionRole = useCallback(
    (creatorId: number): CrewRole | null => {
      const assignedRole = selectedRoles[creatorId];
      if (assignedRole) return assignedRole;

      const creator = creators.find((item) => item.crew_member_id === creatorId);
      if (!creator) return null;

      const caps = getCreatorCapabilities(creator);
      if (caps.isVideo && !caps.isPhoto) return "video";
      if (!caps.isVideo && caps.isPhoto) return "photo";

      const roleName = (creator.role_name || "").toLowerCase();
      if (roleName.includes("video")) return "video";
      if (roleName.includes("photo")) return "photo";

      return null;
    },
    [creators, selectedRoles]
  );

  useLayoutEffect(() => {
    const maxVideo = requirements.required.video;
    const maxPhoto = requirements.required.photo;

    const currentCounts = calculateCounts(selectedIds, selectedRoles);
    const needsVideoTrim = currentCounts.video > maxVideo;
    const needsPhotoTrim = currentCounts.photo > maxPhoto;

    if (!needsVideoTrim && !needsPhotoTrim) return;

    const idsToRemove = new Set<number>();
    let nextVideo = currentCounts.video;
    let nextPhoto = currentCounts.photo;

    for (let i = selectedIds.length - 1; i >= 0 && (nextVideo > maxVideo || nextPhoto > maxPhoto); i--) {
      const creatorId = selectedIds[i];
      const role = getSelectionRole(creatorId);
      if (!role) continue;

      if (role === "video" && nextVideo > maxVideo) {
        idsToRemove.add(creatorId);
        nextVideo--;
      } else if (role === "photo" && nextPhoto > maxPhoto) {
        idsToRemove.add(creatorId);
        nextPhoto--;
      }
    }

    if (!idsToRemove.size) return;

    setSelectedIds((prevIds) => prevIds.filter((id) => !idsToRemove.has(id)));
    setSelectedRoles((prevRoles) => {
      const nextRoles = { ...prevRoles };
      idsToRemove.forEach((id) => {
        delete nextRoles[id];
      });
      return nextRoles;
    });
  }, [
    calculateCounts,
    getSelectionRole,
    requirements.required.photo,
    requirements.required.video,
    selectedIds,
    selectedRoles,
  ]);

  const toggleSelection = (id: number) => {
    const creator = creators.find(c => c.crew_member_id === id);
    if (!creator) return;

    const { isVideo, isPhoto } = getCreatorCapabilities(creator);
    const currentCounts = calculateCounts(selectedIds, selectedRoles);
    const activeRole =
      activeRoleFilter === "video" && isVideo
        ? "video"
        : activeRoleFilter === "photo" && isPhoto
          ? "photo"
          : null;

    if (activeRole) {
      setSelectedIds((prev) => {
        const isAlreadySelected = prev.includes(id);
        const nextRoles = { ...selectedRoles };

        if (isAlreadySelected) {
          if (nextRoles[id] && nextRoles[id] !== activeRole) {
            toast.error("This CP is already selected.");
            return prev;
          }

          delete nextRoles[id];
          setSelectedRoles(nextRoles);
          return prev.filter((p) => p !== id);
        }

        nextRoles[id] = activeRole;
        const nextIds = [...prev, id];

        const nextCounts = calculateCounts(nextIds, nextRoles);
        const isVideoFull = nextCounts.video > requirements.required.video;
        const isPhotoFull = nextCounts.photo > requirements.required.photo;

        if (activeRole === "video" && isVideoFull) {
          toast.error(`You have already selected the required ${requirements.required.video} Videographer(s).`);
          return prev;
        }

        if (activeRole === "photo" && isPhotoFull) {
          toast.error(`You have already selected the required ${requirements.required.photo} Photographer(s).`);
          return prev;
        }

        setSelectedRoles(nextRoles);
        return nextIds;
      });
      return;
    }

    setSelectedIds((prev) => {
      const isAlreadySelected = prev.includes(id);
      if (isAlreadySelected) {
        setSelectedRoles((prevRoles) => {
          const nextRoles = { ...prevRoles };
          delete nextRoles[id];
          return nextRoles;
        });
        return prev.filter((p) => p !== id);
      }

      const desiredRole = getDefaultRoleForCreator(creator, currentCounts);
      const nextRoles = { ...selectedRoles };

      if (desiredRole) {
        nextRoles[id] = desiredRole;
      }

      const nextIds = [...prev, id];
      const nextCounts = calculateCounts(nextIds, nextRoles);

      const isVideoFull = nextCounts.video > requirements.required.video;
      const isPhotoFull = nextCounts.photo > requirements.required.photo;

      if (isVideo && isPhoto) {
        if (isVideoFull && isPhotoFull) {
          toast.error("You have already selected the required team members.");
          return prev;
        }
      } else if (isVideo && isVideoFull) {
        toast.error(`You have already selected the required ${requirements.required.video} Videographer(s).`);
        return prev;
      } else if (isPhoto && isPhotoFull) {
        toast.error(`You have already selected the required ${requirements.required.photo} Photographer(s).`);
        return prev;
      }

      if (data.crewCount > 0 && prev.length >= data.crewCount) {
        toast.error(`You have already selected the required ${data.crewCount} team members.`);
        return prev;
      }

      setSelectedRoles(nextRoles);
      return nextIds;
    });
  };

  useEffect(() => {
    updateData({ selectedCrewIds: selectedIds, selectedCrewRoles: selectedRoles });
  }, [selectedIds, selectedRoles, updateData]);

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
      pushToDataLayer("cp_selection_found_submit", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_dream_team",
        duration_on_page: performance.now() / 1000,
        user_id: isAuthenticated ? user?.id : "Unknown",
        user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : data.email,
        email: isAuthenticated ? user?.email : "Unknown",
        phone: isAuthenticated ? user?.phone_number : "Unknown",
        booking_id: data?.bookingId,
        booking_form_fields: { cp_id: selectedIds }
      });
      onNext();
    }
  };

  const noCpHandleNext = () => {
    pushToDataLayer("cp_selection_not_found_submit", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_dream_team",
      duration_on_page: performance.now() / 1000,
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : data.email,
      email: isAuthenticated ? user?.email : "Unknown",
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      booking_id: data?.bookingId,
      booking_form_fields: { cp_id: "Not Found" }
    });
    onNext()
  }

  const noCpHandleSales = () => {
    pushToDataLayer("cp_selection_not_found_sales", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_dream_team",
      duration_on_page: performance.now() / 1000,
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : data.email,
      email: isAuthenticated ? user?.email : "Unknown",
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      booking_id: data?.bookingId,
      booking_form_fields: { cp_id: "Not Found" }
    });
    setShowSalesPopup(true)
  }

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
          {/*
          <h2 className="text-lg lg:text-[54px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
            No creators are currently available for your request.
          </h2>
          */}
          <p className="text-white/60 mb-6">
            {error
              ? "We encountered an issue loading creators. Please try again."
              : "A Beige specialist will step in to make sure everything runs smoothly."}
          </p>
          {/* 
          <p className="text-white/60 mb-6">
            {error
              ? "We encountered an issue loading creators. Please try again."
              : "You can continue now, and our team will help source the right creative talent for you."}
          </p>
          */}
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
            // onClick={onNext}
            onClick={noCpHandleNext}
            className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[200px]"
          >
            Complete Your Shoot
          </Button>
          <Button
            onClick={noCpHandleSales}
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
                      rating={creator.rating || 0}
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
        {filteredCreators.length > 0 ? (
          <CreatorCarousel
            creators={filteredCreators}
            selectedIds={selectedIds}
            selectedRoles={selectedRoles}
            activeRoleFilter={activeRoleFilter}
            toggleSelection={toggleSelection}
          />
        ) : (
          <div className="text-center text-white/60 py-16">
            No {activeRoleFilter === "photo" ? "photographers" : "videographers"} available right now.
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {requirements.required.video > 0 && (
          <button
            type="button"
            onClick={() => setActiveRoleFilter("video")}
            className={`h-12 flex items-center gap-2 border px-6 py-2 rounded-lg text-sm transition-all ${activeRoleFilter === "video" || selectedCounts.video >= requirements.required.video ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]' : 'bg-[#1A1A1A] border-white/10 text-white/70'}`}
          >
            <Video size={16} />
            <span className="font-medium">
              Videographer(s): {selectedCounts.video} / {requirements.required.video}
            </span>
          </button>
        )}
        {requirements.required.photo > 0 && (
          <button
            type="button"
            onClick={() => setActiveRoleFilter("photo")}
            className={`h-12 flex items-center gap-2 border px-6 py-2 rounded-lg text-sm transition-all ${activeRoleFilter === "photo" || selectedCounts.photo >= requirements.required.photo ? 'bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]' : 'bg-[#1A1A1A] border-white/10 text-white/70'}`}
          >
            <Camera size={16} />
            <span className="font-medium">
              Photographer(s): {selectedCounts.photo} / {requirements.required.photo}
            </span>
          </button>
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
                <span className="text-[#E8D1AB] font-medium">Beige team will create the best talent for you based on your needs.</span>
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
                    pushToDataLayer("cp_selection_found_submit", {
                      type: "Action Tracking",
                      page_name: "Book-a-shoot Page",
                      location_in_website: "book_a_shoot_dream_team",
                      duration_on_page: performance.now() / 1000,
                      user_id: isAuthenticated ? user?.id : "Unknown",
                      user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : data.email,
                      email: isAuthenticated ? user?.email : "Unknown",
                      phone: isAuthenticated ? user?.phone_number : "Unknown",
                      booking_id: data?.bookingId,
                      booking_form_fields: { cp_id: "Not Selected" }
                    });
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
