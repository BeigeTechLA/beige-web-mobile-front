"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Camera,
  Sparkles,
  Video,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import type { Creator } from "@/lib/types";
import type { CrewRole, SelectedCrewRoles } from "../../v3/types";
import { useGetRandomCrewV4Query, useSearchCreatorsV4Query } from "@/lib/redux/features/creators/creatorsApi";
import CreatorCarousel from "./CreatorsCarousel";

interface ChooseCreativePartnerProps {
  onBack: () => void;
  onContinue: (selectedCreatives: Creator[], letBeigeChoose: boolean) => void;
  requiredCount?: number;
  contentTypes?: string[];
  locationDetails?: any;
}

const MOCK_CREATIVES = [
  {
    "crew_member_id": 527,
    "name": "Mridula S",
    "role_id": "[1,2]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 325,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_94_1780072696372.jpg",
    "location": "520 South Olive Street, Los Angeles, California 90013, United States",
    "search_location": {
      "lat": 34.04891328,
      "lng": -118.25311412,
      "address": "520 South Olive Street, Los Angeles, California 90013, United States"
    },
    "experience_years": 3,
    "bio": "Test User Profile",
    "skills": "[28,29,30,31,35,36,37]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 521,
    "name": "Janice D",
    "role_id": "[\"1\",\"2\"]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 432,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_75_1778851280356.jpg",
    "location": "431 West 5th Street, Los Angeles, California 90013, United States",
    "search_location": {
      "lat": 34.04925108,
      "lng": -118.25272788,
      "address": "431 West 5th Street, Los Angeles, California 90013, United States"
    },
    "experience_years": 6,
    "bio": "Testing email templates",
    "skills": "[\"19\",\"18\",\"20\",\"22\",\"26\",\"27\"]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 473,
    "name": "Pranav D",
    "role_id": "[\"1\",\"2\",\"3\"]",
    "role_name": "Videographer, Photographer, Editor",
    "hourly_rate": 550,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_63_1776326907973.jpg",
    "location": "Los Angeles, California, United States",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California, United States"
    },
    "experience_years": 6,
    "bio": "",
    "skills": "[\"21\",\"20\",\"19\",\"18\",\"22\"]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 472,
    "name": "Pranav D",
    "role_id": "[\"1\",\"2\",\"3\"]",
    "role_name": "Videographer, Photographer, Editor",
    "hourly_rate": 500,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_57_1776326398645.jpg",
    "location": "Los Angeles, California, United States",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California, United States"
    },
    "experience_years": 6,
    "bio": "",
    "skills": "[\"18\",\"19\",\"20\",\"21\",\"22\"]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 458,
    "name": "Testt C",
    "role_id": "[1,2]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 120,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_51_1775283054261.jpg",
    "location": "Ahmedabad, Gujarat, India",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Ahmedabad, Gujarat, India"
    },
    "experience_years": 5,
    "bio": "teest.. g",
    "skills": "[18,19,20,21,22]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 457,
    "name": "Jay P",
    "role_id": "[\"1\",\"2\"]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 120,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_58_1775282087814.jpg",
    "location": "Los Angeles, California, United States",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California, United States"
    },
    "experience_years": 5,
    "bio": "",
    "skills": "[\"19\",\"20\",\"21\",\"22\",\"18\"]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 453,
    "name": "Vivek P",
    "role_id": "[\"1\",\"2\"]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 500,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_52_1774960264342.jpg",
    "location": "Los Angeles, California, United States",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California, United States"
    },
    "experience_years": 28,
    "bio": "",
    "skills": "[\"19\",\"21\",\"20\",\"18\",\"22\"]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 300,
    "name": "Emily C",
    "role_id": "[\"1\",\"2\"]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 110,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_70_1773137477088.jpg",
    "location": "Los Angeles, California, United States",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California, United States"
    },
    "experience_years": 5,
    "bio": "Professional videographer and photographer with experience in events and commercial shoots.",
    "skills": "[\"22\",\"21\",\"20\",\"19\",\"18\",\"23\",\"24\",\"25\",\"26\",\"27\",\"28\"]",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 135,
    "name": "Gary A",
    "role_id": "[1,2]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 125,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_50_1770122818772.jpeg",
    "location": "Los Angeles, California",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California"
    },
    "experience_years": 5,
    "bio": "videography specialist with professional experience",
    "skills": "videography",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 132,
    "name": "Marcelo E",
    "role_id": "1",
    "role_name": "Videographer",
    "hourly_rate": 200,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_4_1770122736023.png",
    "location": "Los Angeles, California",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California"
    },
    "experience_years": 5,
    "bio": "videography specialist with professional experience",
    "skills": "videography",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 130,
    "name": "Yasmine P",
    "role_id": "[1,2]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 100,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_53_1770232090038.png",
    "location": "Los Angeles, California",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California"
    },
    "experience_years": 5,
    "bio": "Fashion and weddings",
    "skills": "videography, photography",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 125,
    "name": "Corey B",
    "role_id": "[1,2]",
    "role_name": "Videographer, Photographer",
    "hourly_rate": 90,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_58_1770122407901.jpeg",
    "location": "Los Angeles, California",
    "search_location": {
      "lat": 34.048051,
      "lng": -118.254187,
      "address": "Los Angeles, California"
    },
    "experience_years": 5,
    "bio": "videography specialist with professional experience",
    "skills": "videography",
    "is_available": true,
    "distance": 5.6,
    "distanceText": "5.6 mi"
  },
  {
    "crew_member_id": 518,
    "name": "Parth P",
    "role_id": "[2,1]",
    "role_name": "Photographer, Videographer",
    "hourly_rate": 619199,
    "rating": 0,
    "total_reviews": 0,
    "profile_photo": "profile_photo_88_1777970160435.png",
    "location": "00000, , Los Angeles, California",
    "search_location": {
      "lat": 34.051641,
      "lng": -118.242299,
      "address": "00000, , Los Angeles, California"
    },
    "experience_years": 255,
    "bio": "testffwv\nwhahwb",
    "skills": "[9,23,12]",
    "is_available": true,
    "distance": 6.2,
    "distanceText": "6.2 mi"
  }
] as unknown as Creator[];

export default function ChooseCreativePartner({
  onBack,
  onContinue,
  requiredCount = 5,
  contentTypes = [],
  locationDetails,
}: ChooseCreativePartnerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [letBeigeChoose, setLetBeigeChoose] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [activeRoleFilter, setActiveRoleFilter] = useState<"video" | "photo" | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<SelectedCrewRoles>({});
  const [profileModalUrl, setProfileModalUrl] = useState<string | null>(null);

  useEffect(() => {
    const totalTimeMs = 5000;
    const updateIntervalMs = 100;
    const incrementStep = 100 / (totalTimeMs / updateIntervalMs);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setLoading(false);
          return 100;
        }
        return prev + incrementStep;
      });
    }, updateIntervalMs);

    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    if (!profileModalUrl || typeof window === "undefined") return;

    const handleProfileReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "creator-profile-modal-ready") return;

      // setIsProfileModalLoading(false);
    };

    window.addEventListener("message", handleProfileReady);

    return () => {
      window.removeEventListener("message", handleProfileReady);
    };
  }, [profileModalUrl]);

  const locationLatitude =
    locationDetails?.coordinates?.lat ??
    locationDetails?.lat ??
    locationDetails?.center?.[1];
  const locationLongitude =
    locationDetails?.coordinates?.lng ??
    locationDetails?.lng ??
    locationDetails?.center?.[0];
  const searchableContentTypes = contentTypes.filter((type) => type !== "editing" && type !== "studio");
  const isEditingOnly = contentTypes.length === 1 && contentTypes.includes("editing");

  const { data: creatorsResponse, isLoading: isSearchLoading } = useSearchCreatorsV4Query(
    {
      content_types: isEditingOnly ? "editor" : searchableContentTypes.join(","),
      latitude: isEditingOnly ? undefined : locationLatitude,
      longitude: isEditingOnly ? undefined : locationLongitude,
      limit: 20,
      page: 1,
    },
    {
      skip:
        (isEditingOnly ? contentTypes.length === 0 : searchableContentTypes.length === 0) ||
        (!isEditingOnly && (locationLatitude === undefined || locationLongitude === undefined)),
    },
  );
  const { data: randomCrewResponse } = useGetRandomCrewV4Query();

  const apiCreators = creatorsResponse?.data || [];
  const creators: Creator[] = apiCreators.length > 0
    ? apiCreators
    : (randomCrewResponse?.length ? randomCrewResponse : MOCK_CREATIVES);

  const handleLetBeigeChoose = () => {
    setLetBeigeChoose(!letBeigeChoose);
  };

  // Helper to determine capabilities
  const getCreatorCapabilities = (creator: Creator) => {
    const roleName = creator.role_name?.toLowerCase() || "";
    const roleId = Number(creator.role_id);
    const skills = creator.skills ? (typeof creator.skills === 'string' ? creator.skills.toLowerCase() : JSON.stringify(creator.skills).toLowerCase()) : "";
    const bio = creator.bio?.toLowerCase() || "";

    const isVideo = roleName.includes("video") || roleId === 1 || roleId === 11 || roleId === 12 || skills.includes("video") || skills.includes("videographer") || bio.includes("videographer");
    const isPhoto = roleName.includes("photo") || roleId === 2 || roleId === 10 || skills.includes("photo") || skills.includes("photographer") || bio.includes("photographer");

    return { isVideo, isPhoto };
  };

  const requirements = useMemo(() => {
    return {
      required: { video: requiredCount, photo: 0 },
    };
  }, [requiredCount]);

  const filteredCreators = useMemo(() => {
    if (activeRoleFilter === "video") {
      return creators.filter((creator) => getCreatorCapabilities(creator).isVideo);
    }

    if (activeRoleFilter === "photo") {
      return creators.filter((creator) => getCreatorCapabilities(creator).isPhoto);
    }

    return creators;
  }, [activeRoleFilter, creators]);

  const calculateCounts = useCallback((
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

      if (assignedRole === "video") videoCount++;
      if (assignedRole === "photo") photoCount++;

      if (!assignedRole && caps.isVideo && caps.isPhoto) {
        both.push(c);
      } else if (!assignedRole) {
        const role = (c.role_name || "").toLowerCase();
        if (role.includes("video")) videoCount++;
        else if (role.includes("photo")) photoCount++;
      }
    });

    return { video: videoCount, photo: photoCount };
  }, [creators]);

  const getDefaultRoleForCreator = (
    creator: Creator,
    currentCounts: { video: number; photo: number },
  ): CrewRole | null => {
    const caps = getCreatorCapabilities(creator);

    if (caps.isVideo && !caps.isPhoto) return "video";
    if (!caps.isVideo && caps.isPhoto) return "photo";
    if (!caps.isVideo && !caps.isPhoto) return null;

    if (currentCounts.video < requirements.required.video) {
      return "video";
    }

    return currentCounts.video <= currentCounts.photo ? "video" : "photo";
  };

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

        if (activeRole === "video" && isVideoFull) {
          toast.error(`You have already selected the required ${requirements.required.video} Videographer(s).`);
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

      if (isVideo && isVideoFull) {
        toast.error(`You have already selected the required ${requirements.required.video} Videographer(s).`);
        return prev;
      }

      if (requiredCount > 0 && prev.length >= requiredCount) {
        toast.error(`You have already selected the required ${requiredCount} team members.`);
        return prev;
      }

      setSelectedRoles(nextRoles);
      return nextIds;
    });
  };

  const handleViewProfile = (url: string) => {
    setProfileModalUrl(url);
  };

  if (loading || isSearchLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        {/* Glow & Sparkle Animation */}
        <div className="relative w-32 h-32 mb-8">
          {/* Animated Logo Ring */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#333"
              strokeWidth="2"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#E8D1AB"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0.1 }}
              style={{ rotate: -90, transformOrigin: "center" }}
            />
          </svg>

          {/* Center Logo Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-[#E8D1AB] rounded-full flex items-center justify-center text-black font-bold text-xl">
              B
            </div>
          </div>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white">
          Finding Creative Partners for Your Shoot
        </h2>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Content Stack */}
      <div>
        {/* Back Arrow */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP 07
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div className="h-full w-5/6 bg-[#E8D1AB] transition-all duration-300" />
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          Choose Your Creative Partner
        </h1>
        <p className="text-white/30 text-base md:text-xl font-light">
          Choose your preferred team and complete your booking. Not sure who to pick? No worries—let Beige choose the right Creative Partner for you.
        </p>
      </div>

      {/* 3D Carousel Section */}
      <div className="relative w-full flex items-center justify-center min-h-[460px]">
        {filteredCreators.length > 0 ? (
          <CreatorCarousel
            creators={filteredCreators}
            selectedIds={selectedIds}
            selectedRoles={selectedRoles}
            activeRoleFilter={activeRoleFilter}
            toggleSelection={toggleSelection}
            onViewProfile={handleViewProfile}
          />
        ) : (
          <div className="text-center text-white/60 py-16">
            No {activeRoleFilter === "photo" ? "photographers" : "videographers"} available right now.
          </div>
        )}
      </div>

      {/* Sub-controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
        <button
          onClick={handleLetBeigeChoose}
          className={`px-5 py-2.5 lg:py-4 lg:px-10 rounded-2xl border text-sm lg:text-lg font-medium flex items-center gap-2 transition bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border border-[#E8D1AB]`}
        >
          <Sparkles className="w-4 h-4 lg:w-7 lg:h-7 text-black" strokeWidth={1} />
          Let Beige Choose.
        </button>

        <div className="px-5 py-2.5 lg:py-4 lg:px-10 rounded-2xl border border-white/20 bg-[linear-gradient(180deg, #191919 0%, rgba(16, 16, 16, 0.00) 100%)] text-sm lg:text-lg font-medium text-white/80 flex items-center gap-2">
          <Camera className="w-4 h-4 lg:w-7 lg:h-7 text-white" strokeWidth={1} />
          <span>
            Photographers(s) : {String(selectedIds.length).padStart(2, "0")}/
            {String(requiredCount).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
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
          onClick={() =>
            onContinue(
              creators.filter((c) => selectedIds.includes(c.crew_member_id)),
              letBeigeChoose
            )
          }
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue with {String(selectedIds.length).padStart(2, "0")} Creatives
        </button>
      </div>
    </div>
  );
}
