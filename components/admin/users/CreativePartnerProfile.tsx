"use client";

import React, { useState, useEffect, cloneElement } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check, X, MapPin, Globe, User, Linkedin, Copy, Calendar as CalendarIcon, ChevronDown, Phone, Grid3X3, FolderOpen, Briefcase, Play, Search, LayoutGrid, List, Folder, MoreVertical, ArrowLeft, FileText, Clock, Video, Info, CheckCircle, Navigation, Link as LinkIcon, PencilLine, Instagram } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { adminApi, getStatusCount, GetUpcomingShoots, getPendingProjects, getAvailabilityDetails } from "@/lib/api";
import { Key } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import { Button } from "@/components/ui/button";
import { StatCard } from "../StatCard";
import { MobileShootRow } from "../shoot-details/MobileShootRow";
import { AnimatePresence, motion } from "framer-motion";
import { PORTFOLIO_ICONS } from "@/app/data/staticData";
import DottedDivider from "../DottedDivider";
import { formatCreatorRoles } from "@/lib/creatorRoles";
import { getLatestProfilePhoto } from "@/lib/crewFiles";
import { useGenerateUserResetLinkForAdminMutation } from "@/lib/redux/features/auth/authApi";

interface ProfileProps {
  id: string;
  hideActions?: boolean;
  isDark?: boolean;
  onboardingStatus?: any;
}

// --- PREMIUM UI HELPERS ---
const formatLocation = (locationInput: string) => {
  if (!locationInput) return "Location TBD";
  let addressStr = locationInput;

  try {
    const parsed = JSON.parse(locationInput);
    if (parsed && parsed.address) addressStr = parsed.address;
  } catch (e) {
    /* Not JSON */
  }

  const parts = addressStr.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    const country = parts[parts.length - 1];
    const stateZip = parts[parts.length - 2];
    const city = parts[parts.length - 3];
    const state = stateZip.replace(/\d+/g, "").trim();
    return `${city}, ${state}, ${country}`;
  }
  return addressStr;
};

/* Reusable Stat Card Component */
// function StatCard({ label, value, icon, iconColor, hoverBorder, valueColor = "text-white", subtext }: any) {
//   return (
//     <div className={`bg-[#101010] rounded-xl p-5 border border-white/5 relative overflow-hidden group ${hoverBorder} transition-all duration-300`}>
//       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
//         {cloneElement(icon, { size: 40, className: iconColor })}
//       </div>
//       <div className="relative z-10">
//         <p className="text-white/40 text-sm font-medium mb-1 uppercase tracking-wider">{label}</p>
//         <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
//         {subtext && <p className="text-xs text-white/40 mt-1">{subtext}</p>}
//       </div>
//     </div>
//   );
// }

function Legend({ color, label, desc }: any) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
      <div>
        <p className="text-xs font-bold text-white leading-none mb-1">{label}</p>
        <p className="text-[10px] text-white/30">{desc}</p>
      </div>
    </div>
  );
}

function EventDot({ color, label }: any) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="truncate text-[10px] font-medium text-white/60">{label}</span>
    </div>
  );
}

export const CreativePartnerProfile = ({ id, hideActions = false, isDark = true, onboardingStatus }: ProfileProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('All');
  const [activeImages, setActiveImages] = useState<string[]>([]);
const [isVerifying, setIsVerifying] = useState(false);
const [isGeneratingLink, setIsGeneratingLink] = useState(false);
const [manualResetLink, setManualResetLink] = useState<string | null>(null);
const [generateAdminReset] = useGenerateUserResetLinkForAdminMutation();

  const [partner, setPartner] = useState<any>(null);
  const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [upcomingShoots, setUpcomingShoots] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [shootTab, setShootTab] = useState<"current" | "past">("current");
  const [shootSearchQuery, setShootSearchQuery] = useState("");
  const [availabilityDetails, setAvailabilityDetails] = useState<any>({});
  const [pastShoots, setPastShoots] = useState<any[]>([]);
  const [shootsLoading, setShootsLoading] = useState(true);
  const [hoveredProject, setHoveredProject] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState({
    availableDays: 0,
    bookedShoots: 0,
    timeOff: 0,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    let fullUrl = url;
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      fullUrl = `https://${fullUrl}`;
    }

    const ytMatch = fullUrl.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&controls=1&rel=0`;

    const vimeoMatch = fullUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&controls=1`;

    const driveMatch = fullUrl.match(/\/d\/(.*?)\//);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

    return fullUrl;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cleanId = id.startsWith('#') ? id.substring(1) : id;
        const crewMemberIdNum = parseInt(cleanId);

        const [partnerResponse, skillsResponse, statsResponse] = await Promise.all([
          adminApi.getCrewMemberDetail(cleanId),
          adminApi.getSkills(),
          getStatusCount({ crew_member_id: crewMemberIdNum, creator_id: crewMemberIdNum }),
        ]);

        // Map skills if needed (response might already have names)
        if (skillsResponse && skillsResponse.data) {
          const sMap: Record<string, string> = {};
          skillsResponse.data.forEach((skill: any) => {
            sMap[skill.id?.toString()] = skill.name;
          });
          setSkillsMap(sMap);
        }

        // Set partner data
        if (partnerResponse && partnerResponse.data) {
          setPartner(partnerResponse.data);
        }

        // Set stats
        if (statsResponse && statsResponse.data) {
          setStats(statsResponse.data);
        }

      } catch (error) {
        console.error("Error fetching partner details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      setShootsLoading(true);
      try {
        const cleanId = id.startsWith('#') ? id.substring(1) : id;
        const response = await adminApi.getCrewMemberAssignedProjects(cleanId);

        const responseData = response?.data;

        const upcomingData = Array.isArray(responseData?.upcoming)
          ? responseData.upcoming.map((item: any) => ({
            ...item.project,
            assignment_id: item.assignment_id,
            project_id: item.project_id,
            assignment_status: item.status,
            crew_accept: item.crew_accept,
            assigned_status: item.assigned_status,
            assigned_date: item.assigned_date,
          }))
          : [];

        const pastData = Array.isArray(responseData?.past)
          ? responseData.past.map((item: any) => ({
            ...item.project,
            assignment_id: item.assignment_id,
            project_id: item.project_id,
            assignment_status: item.status,
            crew_accept: item.crew_accept,
            assigned_status: item.assigned_status,
            assigned_date: item.assigned_date,
          }))
          : [];

        setUpcomingShoots(upcomingData);
        setPastShoots(pastData);
      } catch (error) {
        console.error("Error fetching assigned projects:", error);
        setUpcomingShoots([]);
        setPastShoots([]);
      } finally {
        setShootsLoading(false);
      }
    };

    if (id) {
      fetchAssignedProjects();
    }
  }, [id]);

  const handleVerifyStatus = async (status: number) => {
    setIsVerifying(true);
    try {
      const cleanId = id.startsWith('#') ? id.substring(1) : id;
      const crewMemberIdNum = parseInt(cleanId);

      const response = await adminApi.verifyCrewMember({
        crew_member_id: crewMemberIdNum,
        status: status
      });

      if (response && !response.error) {
        toast.success(status === 1 ? "Creative Partner approved successfully" : "Creative Partner rejected");
        // Refresh partner details to show updated status
        const partnerResponse = await adminApi.getCrewMemberDetail(cleanId);
        if (partnerResponse && partnerResponse.data) {
          setPartner(partnerResponse.data);
        }
      } else {
        toast.error(response.error || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const cleanId = id.startsWith('#') ? id.substring(1) : id;
        const response = await getAvailabilityDetails({
          year: format(currentMonth, 'yyyy'),
          month: format(currentMonth, 'MM'),
          crew_member_id: cleanId
        });
        if (response && response.data) {
          const data = response.data;
          // availabilityDetails should store the actual availability object map
          setAvailabilityDetails(data.availability || {});
        }
      } catch (error) {
        console.error("Error fetching availability details:", error);
      }
    };

    if (id && currentMonth) {
      fetchAvailability();
    }
  }, [id, currentMonth]);

  useEffect(() => {
    const calculateSummary = () => {
      let availableDays = 0;
      let bookedShoots = 0;
      let timeOff = 0;

      Object.values(availabilityDetails).forEach((status: any) => {
        if (status.projectAssigned) {
          bookedShoots += 1;
        } else if (status.available || status.customAvailabilityStatus === 1) {
          availableDays += 1;
        } else if (status.available === false) {
          timeOff += 1;
        }
      });
      setSummaryData({ availableDays, bookedShoots, timeOff });
    };

    if (availabilityDetails) {
      calculateSummary();
    }
  }, [availabilityDetails]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/50"}`} size={40} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px] text-[#666]">
        Partner not found.
      </div>
    );
  }

  const convertLinksStringToArray = (jsonString: string) => {
    try {
      const parsedObject = JSON.parse(jsonString);

      // Convert object entries into a structured array
      return Object.entries(parsedObject).map(([platform, url]) => ({
        platform,
        url: url as string
      }));
    } catch (error) {
      console.error("Invalid JSON string provided:", error);
      return [];
    }
  };
  const socialMediaLinks = convertLinksStringToArray(partner?.social_media_links || null)

  const fullName = `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || "Unknown Partner";
  const partnerEmail = String(partner?.email || "").trim().toLowerCase();

  // Base URL for uploads
  const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

  // Get profile photo
  const profilePhoto = getLatestProfilePhoto(partner.crew_member_files);
  const imageUrl = profilePhoto
    ? `${S3_BASE_URL}${profilePhoto.file_path}`
    : null;

  // Determine status based on is_crew_verified field
  // 0 = Pending, 1 = Approved, 2 = Rejected
  const getStatus = () => {
    if (partner.is_crew_verified === 0) return "Pending";
    if (partner.is_crew_verified === 1) return "Approved";
    if (partner.is_crew_verified === 2) return "Rejected";
    return "Pending"; // Default to Pending if undefined
  };
  const status = getStatus();

  const primaryRole = partner.primary_role
    ? formatCreatorRoles(partner.primary_role, "No role specified")
    : partner.role?.role_name || "No role specified";

  // Parse skills
  let skillNames: string[] = [];
  if (partner.skills) {
    try {
      const skillsArray = typeof partner.skills === 'string' ? JSON.parse(partner.skills) : partner.skills;
      if (Array.isArray(skillsArray)) {
        // If it's an array of objects (as seen in some responses)
        if (typeof skillsArray[0] === 'object') {
          skillNames = skillsArray.map((s: any) => s.name || skillsMap[s.id?.toString()]).filter(Boolean);
        } else {
          // Array of IDs
          skillNames = skillsArray.map(sId => skillsMap[sId.toString()] || sId).filter(Boolean);
        }
      }
    } catch (e) {
      console.error("Error parsing skills:", e);
      // Fallback: if it's already an array of objects
      if (Array.isArray(partner.skills)) {
        skillNames = partner.skills.map((s: any) => s.name || s.skill_name || s).filter(Boolean);
      }
    }
  }

  // Parse equipment
  let equipmentNames: string[] = [];

  if (Array.isArray(partner.equipment_details)) {
    equipmentNames = partner.equipment_details
      .map((item: any) => item?.equipment_name)
      .filter(Boolean);
  } else if (Array.isArray(partner.equipment_names)) {
    equipmentNames = partner.equipment_names.filter(Boolean);
  } else if (partner.equipment_names) {
    try {
      const parsedEquipmentNames =
        typeof partner.equipment_names === "string"
          ? JSON.parse(partner.equipment_names)
          : partner.equipment_names;

      equipmentNames = Array.isArray(parsedEquipmentNames)
        ? parsedEquipmentNames.filter(Boolean)
        : [];
    } catch (error) {
      console.error("Error parsing equipment names:", error);
      equipmentNames = [];
    }
  }

  // Remove duplicate equipment names while preserving order
  equipmentNames = [...new Set(equipmentNames)];

  // Parse availability
  let availabilityDays: string[] = [];
  if (partner.availability) {
    try {
      availabilityDays = typeof partner.availability === 'string' ? JSON.parse(partner.availability) : partner.availability;
    } catch (e) {
      console.error("Error parsing availability:", e);
    }
  }
  const assignedProjects =
    shootTab === "current"
      ? upcomingShoots
      : pastShoots;
  //  const shootColumns = assignedProjects.length > 0
  //     ? Object.keys(assignedProjects[0]).filter((key) => {
  //       const value = assignedProjects[0][key];
  //       return typeof value !== "object" || value === null;
  //     })
  //     : [];

  // const formatShootCellValue = (value: any) => {
  //   if (value === null || value === undefined || value === "") return "N/A";
  //   if (typeof value === "boolean") return value ? "Yes" : "No";
  //   if (Array.isArray(value)) return value.length ? value.join(", ") : "N/A";
  //   if (typeof value === "object") return JSON.stringify(value);
  //   return String(value);
  // };

  const formatShootDate = (date?: string | null) => {
    if (!date) return "N/A";

    try {
      return format(
        new Date(`${date}T00:00:00`),
        "do MMM, yyyy"
      );
    } catch {
      return date;
    }
  };

  const formatShootType = (type?: string | null) => {
    if (!type) return "N/A";

    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  };

  const formatShootColumnLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const normalizeFeaturedWorkTag = (value: unknown) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]" || trimmed.toLowerCase() === "no tag") return "";
    return trimmed;
  };

  // Update UPLOADS_URL to use S3
  const UPLOADS_URL = S3_BASE_URL;

  // Group Recent Work by Title and Tag
  const featuredWorkGroups: Record<string, { title: string, tag: string, images: string[] }> = {};
  if (partner.crew_member_files) {
    partner.crew_member_files.forEach((file: any) => {
      if (file.file_type === 'recent_work') {
        const tag = normalizeFeaturedWorkTag(file.tag);
        const groupKey = `${file.title || 'Untitled'}-${tag || 'untagged'}`;
        if (!featuredWorkGroups[groupKey]) {
          featuredWorkGroups[groupKey] = {
            title: file.title || 'Untitled',
            tag,
            images: []
          };
        }
        featuredWorkGroups[groupKey].images.push(`${UPLOADS_URL}${file.file_path}`);
      }
    });
  }

  // Get Certifications
  const certificationFiles = partner.crew_member_files?.filter((file: any) => file.file_type === 'certifications') || [];

  // Get Resume
  const resumeFile = partner.crew_member_files?.find((file: any) => file.file_type === 'resume');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Initiated': return 'bg-[#FFF8E1] text-[#D97706] border-none'; // Yellowish
      case 'Pre Production': return 'bg-[#FCE7F3] text-[#DB2777] border-none'; // Pinkish
      case 'Post Production': return 'bg-[#E5E5E5] text-[#525252] border-none'; // Greyish
      case 'Completed': return 'bg-[#DCFCE7] text-[#16A34A] border-none'; // Greenish
      case 'Revision': return 'bg-[#DBEAFE] text-[#2563EB] border-none'; // Blueish
      case 'Upcoming': return 'bg-[#E0F2FE] text-[#0369A1] border-none'; // Light Blue
      case 'Pending': return 'bg-[#FEF3C7] text-[#92400E] border-none'; // Light Orange
      default: return 'bg-[#333] text-white';
    }
  };

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const isShootDay = (date: Date) => {
    if (!availabilityDetails) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayInfo = (availabilityDetails as any)[dateStr];
    return dayInfo?.projectAssigned === true;
  };

  const getAvailabilityForDay = (date: Date) => {
    if (!availabilityDetails) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return (availabilityDetails as any)[dateStr] || null;
  };

  const formatAvailabilityTime = (value: unknown) => {
    if (!value) return "";
    const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (!match) return "";

    const time = new Date();
    time.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return format(time, "h:mm a");
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setIsOpen(false);
  };

  const handleGenerateLink = async () => {
    if (isGeneratingLink) return;

    setIsGeneratingLink(true);
    try {
      const cleanId = id.startsWith('#') ? id.substring(1) : id;
      const publicUrl = `${window.location.origin}/creatives/${cleanId}`;
      await navigator.clipboard.writeText(publicUrl);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Public link copied to clipboard");
    } catch (error) {
      console.error("Generate Link Error:", error);
      toast.error("Failed to generate link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const SECTION_TITLE_STYLE = `lg:text-xl font-medium p-5 lg:p-8 ${isDark ? "text-white" : "text-black"}`;
  const LABEL_STYLE = `text-sm font-medium mb-1 block ${isDark ? "text-[#CFCCCC]" : "text-[#313131]"}`;
  const VALUE_STYLE = `text-sm block ${isDark ? "text-[#999696]" : "text-[#595959]"}`;

  const formatAssignmentStatus = (status?: string | null) => {
    if (!status) return "N/A";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  };

  const getAssignmentStatusStyle = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-[#D1FAE5] text-[#059669]";

      case "rejected":
      case "declined":
        return "bg-[#FEE2E2] text-[#DC2626]";

      case "pending":
        return "bg-[#FEF3C7] text-[#D97706]";

      case "selected":
        return "bg-[#DBEAFE] text-[#2563EB]";

      default:
        return isDark
          ? "bg-[#353535] text-[#BDBDBD]"
          : "bg-gray-200 text-gray-600";
    }
  };
  const normalizedShootSearchQuery = shootSearchQuery.trim().toLowerCase();
  const filteredAssignedProjects = normalizedShootSearchQuery
    ? assignedProjects.filter((shoot) => {
      const projectId = shoot.project_id || shoot.stream_project_booking_id;
      const searchableText = [
        projectId ? `#${projectId}` : "",
        projectId,
        shoot.project_name,
        formatShootType(shoot.shoot_type || shoot.event_type),
        shoot.event_date,
        formatShootDate(shoot.event_date),
        formatAssignmentStatus(shoot.assignment_status),
        formatAssignmentStatus(shoot.assigned_status),
        shoot.crew_accept,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedShootSearchQuery);
    })
    : assignedProjects;

  const progressPercent = onboardingStatus?.progress_percent ?? 0;
  const completedCount = onboardingStatus?.completed_count ?? 0;
  const totalRequired = onboardingStatus?.total_required ?? 0;
  const missingCount = onboardingStatus?.missing_count ?? 0;
  const showOnboardingBanner = onboardingStatus?.success !== false && missingCount > 0;

return (
    <div className="flex flex-col">
      {/* FULL WIDTH TOP BANNER */}
      {showOnboardingBanner && (
        <div 
          className={`relative z-[50] w-auto border-b transition-colors duration-200 
            /* Negative margins to kill layout padding */
            -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-10 lg:-mt-10 mb-6
            ${isDark 
              ? "bg-[#2B2823] border-[#4E4128] text-[#E6D8B6]" 
              : "bg-[#EFE1BE] border-[#D7C295] text-[#2D2415]"
            }`}
        >
          <div className="px-6 py-4 lg:px-10 lg:py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                <p className="truncate text-xs lg:text-sm font-medium">
                  Onboarding Status: Incomplete
                </p>                
              </div>
                <p className="shrink-0 text-[13px] font-bold">
                  {completedCount} / {totalRequired} <span className="opacity-50 font-medium">Fields</span>
                </p>
              </div>
              
              {/* Progress Bar - Sharp edges */}
              <div className={`h-1.5 w-full overflow-hidden rounded-2xl ${isDark ? "bg-black/40" : "bg-black/10"}`}>
                <div
                  className="h-full bg-gradient-to-r from-[#E8D1AB] via-[#D7BC8A] to-[#FFF3D6] transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className={`text-[10px] lg:text-[13px] font-medium ${isDark ? "text-white/50" : "text-black/50"}`}>
                  Please provide the {missingCount} remaining details to verify your profile.
                </p>
                <p className="text-[14px] font-medium tracking-tighter">
                  {Math.round(progressPercent)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="space-y-6">

      {!hideActions && (
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => router.push("/admin/users/creative-partners")}
            className={`transition-colors flex items-center gap-2 ${isDark ? "text-[#E0E0E0] hover:text-white" : "text-black hover:text-black/70"}`}
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
              {manualResetLink ? (
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm ${isDark ? "bg-[#111] border-white/10" : "bg-white border-gray-200"}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDark ? "border-white/10 bg-white/5 text-[#E8D1AB]" : "border-gray-200 bg-gray-50 text-[#B08A3C]"}`}>
                    <Key size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] uppercase tracking-widest ${isDark ? "text-white/35" : "text-gray-400"}`}>Reset Link</p>
                    <span className={`block max-w-[180px] truncate font-mono text-[11px] ${isDark ? "text-[#E8D1AB]" : "text-[#8A6A2A]"}`}>{manualResetLink}</span>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(manualResetLink); toast.success("Copied!"); }}
                    className={`ml-1 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-gray-100 text-gray-600"}`}
                    title="Copy reset link"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => setManualResetLink(null)}
                    className={`text-[10px] font-medium uppercase tracking-wide transition-colors ${isDark ? "text-white/35 hover:text-white/70" : "text-gray-400 hover:text-gray-600"}`}
                    title="Clear link"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      if (!partnerEmail) {
                        toast.error("Email is missing for this partner");
                        return;
                      }
                      const res = await generateAdminReset({ email: partnerEmail }).unwrap();
                      setManualResetLink(res.resetLink);
                    } catch (e) { toast.error("Failed to generate link"); }
                  }}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isDark ? "bg-[#1A1A1A] border-[#333] text-white" : "bg-white border-gray-200"}`}
                >
                  <Key size={16} />
                  <span>Reset Password</span>
                </button>
              )}
              <button
                type="button"
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 border ${isDark
                ? "bg-[#1A1A1A] border-[#333] text-white hover:bg-[#222]"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                }`}
            >
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => {
                void handleGenerateLink();
              }}
              disabled={isGeneratingLink}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 border ${isDark
                ? "bg-[#E8D1AB] border-[#E8D1AB] text-black hover:bg-[#d4c3a3] disabled:opacity-70"
                : "bg-black border-black text-white hover:bg-black/80 disabled:opacity-70"
                }`}
            >
              {isGeneratingLink ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LinkIcon size={16} />
              )}
              <span>{isGeneratingLink ? "Generating..." : "Copy Profile Link"}</span>
            </button>
          </div>
        </div>
      )}

      <div className={`rounded-2xl border transition-colors duration-200 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
        {/* Profile Header Card */}
        <div className={`rounded-2xl border-b transition-colors duration-200 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E5E5E5] shadow-sm"}`}>
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-4 px-4 pt-4 lg:px-6 lg:pt-6">
              <div className="flex gap-6">
                {/* Avatar */}
                <div className={`w-[67px] h-[67px] lg:w-35 lg:h-35 rounded-lg lg:rounded-xl overflow-hidden relative flex-shrink-0 border ${isDark ? "bg-[#222] border-white/5" : "bg-gray-100 border-gray-200"}`}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={fullName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${isDark ? "text-[#444] bg-[#222]" : "text-gray-400 bg-gray-100"}`}>
                      {fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  )}
                </div>

                <div className="lg:pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className={`lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>{fullName}</h1>
                    {status === "Approved" && (
                      <div className="text-green-500">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 bg-[#16A34A] border-[#16A34A]}`}>
                          <Check size={12} strokeWidth={3} className={"text-white"} />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs lg:text-sm mb-1 lg:mb-2 ${isDark ? "text-[#888]" : "text-gray-500"}`}>{primaryRole}</p>
                  <div className={`flex items-center gap-1 text-xs text-sm mb-2 lg:mb-5 ${isDark ? "text-[#C2C2C2]" : "text-gray-600"}`}>
                    <MapPin size={14} className="shrink-0" />
                    <span>{partner.location || [partner.city, partner.state].filter(Boolean).join(", ") || "N/A"}</span>
                  </div>

                  {
                    socialMediaLinks.length > 0 &&
                    <div className="hidden lg:flex flex-wrap items-center gap-3">
                      {socialMediaLinks.map((link) => {
                        const platformConfig: Record<string, { icon: React.ReactNode; label: string }> = {
                          linkedin: {
                            icon: <Linkedin size={16} />,
                            label: "LinkedIn"
                          },
                          behance: {
                            icon: <span className="font-bold text-lg leading-none">Bē</span>,
                            label: "Behance"
                          },
                          custom: {
                            icon: <Globe size={16} />,
                            label: "Portfolio"
                          },
                          instagram: {
                            icon: <Instagram size={16} />,
                            label: "Instagram"
                          },
                        };

                        const config = platformConfig[link.platform.toLowerCase()];
                        if (!config || !link.url) return null;

                        return (
                          <a
                            key={link.platform}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-4 py-1.5 border rounded-lg text-sm transition-all active:scale-95 ${isDark
                              ? "bg-[#171717] border-white/20 text-[#E8D1AB] hover:bg-[#222]"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                              }`}
                          >
                            {config.icon}
                            <span className="text-[#8C8C8C]">{config.label}</span>
                          </a>
                        );
                      })}
                    </div>
                  }
                </div>
              </div>

              {!hideActions && (
                <div className="flex flex-col items-end">
                  <span className={`px-4 py-1 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold border h-fit ${status === "Approved" ? "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20" :
                    status === "Pending" ? "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20" :
                      "bg-[#FFF5F5] text-[#FF4D4D] border-[#FF4D4D]/20"
                    }`}>
                    {status}
                  </span>
                  {(status === "Approved" || status === "Rejected") && (
                    <button
                      onClick={() => handleVerifyStatus(status === "Approved" ? 2 : 1)}
                      disabled={isVerifying}
                      className={`text-xs underline underline-offset-4 disabled:opacity-50 mt-2 font-medium ${isDark ? "text-[#666] hover:text-[#E0E0E0]" : "text-gray-400 hover:text-black"}`}
                    >
                      Change to {status === "Approved" ? "Rejected" : "Approved"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {
              socialMediaLinks.length > 0 &&
              <div className="flex lg:hidden flex-wrap items-center gap-3 px-4">
                {socialMediaLinks.map((link) => {
                  const platformConfig: Record<string, { icon: React.ReactNode; label: string }> = {
                    linkedin: {
                      icon: <Linkedin size={16} />,
                      label: "LinkedIn"
                    },
                    behance: {
                      icon: <span className="font-bold text-lg leading-none">Bē</span>,
                      label: "Behance"
                    },
                    custom: {
                      icon: <Globe size={16} />,
                      label: "Portfolio"
                    },
                    instagram: {
                      icon: <Instagram size={16} />,
                      label: "Instagram"
                    },
                  };

                  const config = platformConfig[link.platform.toLowerCase()];
                  if (!config || !link.url) return null;

                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-1.5 border rounded-lg text-xs transition-all active:scale-95 ${isDark
                        ? "bg-[#171717] border-white/20 text-[#E8D1AB] hover:bg-[#222]"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                        }`}
                    >
                      {config.icon}
                      <span className="text-[#8C8C8C]">{config.label}</span>
                    </a>
                  );
                })}
              </div>
            }
          </div>

          {/* Divider */}
          <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
          {/* <DottedDivider /> */}

          {/* Tabs */}
          <div className="flex items-center w-full overflow-x-auto no-scrollbar gap-6 lg:gap-0 lg:justify-between lg:mt-2 px-2.5">
            {['Overview', 'Featured Work', 'Availability', 'Shoots', 'Certificates', 'Resume', 'Portfolio Links'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 lg:pb-4 text-sm lg:text-base font-medium transition-all duration-300 relative tracking-normal px-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab
                  ? (isDark ? 'text-[#E8D1AB]' : 'text-black')
                  : (isDark ? 'text-[#9F9F9F] hover:text-white' : 'text-[#635F5F] hover:text-black')
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className={`absolute bottom-0 left-0 w-full h-[2px] ${isDark ? "bg-[#E8D1AB]" : "bg-black"}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">

          {/* TAB CONTENT: Overview */}
          {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-4">
              {/* Personal Information */}
              <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
                <h2 className={`${SECTION_TITLE_STYLE}`}>Personal Information</h2>

                {/* divider */}
                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
                {/* <DottedDivider /> */}

                <div className="p-5 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <span className={LABEL_STYLE}>First Name</span>
                    <span className={VALUE_STYLE}>{partner.first_name || "N/A"}</span>
                  </div>
                  <div>
                    <span className={LABEL_STYLE}>Last Name</span>
                    <span className={VALUE_STYLE}>{partner.last_name || "N/A"}</span>
                  </div>
                  <div>
                    <span className={LABEL_STYLE}>Email Address</span>
                    {partner.email ? (
                      <a
                        href={`mailto:${partner.email}`}
                        title="Email ID"
                        className={`${VALUE_STYLE} transition-colors hover:opacity-80`}
                      >
                        {partner.email}
                      </a>
                    ) : (
                      <span className={VALUE_STYLE}>N/A</span>
                    )}
                  </div>
                  <div>
                    <span className={LABEL_STYLE}>Contact Phone</span>
                    {partner.phone_number || partner.contact_phone ? (
                      <a
                        href={`tel:${String(partner.phone_number || partner.contact_phone).replace(/[^\d+]/g, "")}`}
                        title="Phone Number"
                        className={`flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 ${isDark ? "text-[#E0E0E0]" : "text-[#595959]"}`}
                      >
                        <Phone size={18} />
                        <span>{partner.phone_number || partner.contact_phone}</span>
                      </a>
                    ) : (
                      <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#595959]"}`}>
                        <Phone size={18} />
                        <span>N/A</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className={LABEL_STYLE}>Location</span>
                    <span className={VALUE_STYLE}>{partner.location || [partner.city, partner.state, partner.country].filter(Boolean).join(", ") || "N/A"}</span>
                  </div>
                  <div>
                    <span className={LABEL_STYLE}>Working Distance</span>
                    <span className={VALUE_STYLE}>{partner.working_distance ? `${partner.working_distance}` : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
                <h2 className={SECTION_TITLE_STYLE}>Professional Details</h2>
                {/* divider */}
                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
                {/* <DottedDivider /> */}

                <div className="p-5 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <span className={LABEL_STYLE}>Primary Role</span>
                    <span className={VALUE_STYLE}>{primaryRole}</span>
                  </div>
                  <div>
                    <span className={LABEL_STYLE}>Year of Experience</span>
                    <span className={VALUE_STYLE}>{partner.years_of_experience || "0"} Years</span>
                  </div>
                  <div>
                    <span className={LABEL_STYLE}>Hourly Rate</span>
                    <span className={VALUE_STYLE}>${partner.hourly_rate || "0.00"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={LABEL_STYLE}>Bio / About</span>
                    <p className={`text-sm leading-relaxed mt-1 ${isDark ? "text-[#888]" : "text-[#595959]"}`}>
                      {partner.bio || "No biography provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
                <h2 className={SECTION_TITLE_STYLE}>
                  Skills <span className={isDark ? "text-[#E8D1AB]" : "text-black"}>({skillNames.length})</span>
                </h2>
                {/* divider */}
                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
                {/* <DottedDivider /> */}

                <div className="p-5 lg:p-8 flex flex-wrap gap-2 lg:gap-3">
                  {skillNames.length > 0 ? (
                    skillNames.map(skill => (
                      <div key={skill} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs lg:text-sm transition-all ${isDark ? "bg-[#1A1A1A] border-[#333] text-[#E0E0E0]" : "bg-gray-50 border-[#0000004D] text-[#020202]"}`}>
                        <span>{skill}</span>
                      </div>
                    ))
                  ) : (
                    <span className={`text-sm italic ${isDark ? "text-[#666]" : "text-[#020202]"}`}>No skills listed.</span>
                  )}
                </div>
              </div>

              {/* Equipment */}
              <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
                <h2 className={SECTION_TITLE_STYLE}>
                  Equipment <span className={isDark ? "text-[#E8D1AB]" : "text-black"}>({equipmentNames.length})</span>
                </h2>

                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

                <div className="p-5 lg:p-8 flex flex-wrap gap-2 lg:gap-3">
                  {equipmentNames.length > 0 ? (
                    equipmentNames.map((equipmentName, index) => (
                      <div
                        key={`${equipmentName}-${index}`}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs lg:text-sm transition-all ${isDark
                          ? "bg-[#1A1A1A] border-[#333] text-[#E0E0E0]"
                          : "bg-gray-50 border-[#0000004D] text-[#020202]"
                          }`}
                      >
                        <span>{equipmentName}</span>
                      </div>
                    ))
                  ) : (
                    <span className={`text-sm italic ${isDark ? "text-[#666]" : "text-[#020202]"}`}>
                      No equipment listed.
                    </span>
                  )}
              </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Featured Work */}
          {activeTab === 'Featured Work' && (
            <div className={`transition-colors duration-200 rounded-2xl min-h-[500px] ${isDark ? "bg-[#111]" : "bg-[#FFF] border-[#F4F5F7] shadow-sm"}`}>
              {openFolder ? (
                <div className="p-5 lg:p-8">
                  <button
                    onClick={() => {
                      setOpenFolder(null);
                      setActiveImages([]);
                    }}
                    className={`flex items-center gap-2 transition-colors mb-4 lg:mb-6 ${isDark ? "text-[#E0E0E0] hover:text-white" : "text-[#171717] hover:text-black"}`}
                  >
                    <ArrowLeft size={20} />
                    <span className="lg:text-lg font-medium">{openFolder}</span>
                  </button>

                  <div className={`w-full rounded-2xl overflow-hidden py-4 lg:py-10 transition-colors ${isDark ? "bg-[#171717] text-white" : "bg-[#F4F5F7] text-black border-[#F4F5F7]"}`}>
                    {activeImages.length > 0 ? (
                      <Swiper
                        effect={"coverflow"}
                        grabCursor={true}
                        centeredSlides={true}
                        slidesPerView={"auto"}
                        initialSlide={Math.floor(activeImages.length / 2)}
                        loop={activeImages.length > 1}
                        spaceBetween={30}       // Enforces clean, equal physical gaps between the tilted slides
                        modules={[EffectCoverflow]}
                        coverflowEffect={{
                          rotate: -20,          // Negative rotation tilts outer card edges forward toward the viewer
                          stretch: 0,           // Kept at 0 so standard spacing handle allocates equal structural gaps
                          depth: 100,           // Sets perspective depth anchor point for center slide
                          modifier: 1,          // Kept at 1 for clean 1:1 conversion matching spaceBetween math
                          slideShadows: false,
                        }}
                        className="w-full !overflow-visible"
                        style={{ perspective: "1200px" }}
                      >
                        {activeImages.map((img, index) => (
                          <SwiperSlide
                            key={index}
                            className="flex items-center justify-center !w-[260px] md:!w-[320px]"
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            <div className="relative w-full aspect-[3/4] rounded-[24px] overflow-hidden transition-all duration-500 shadow-2xl">
                              <Image
                                src={img}
                                alt={`Portfolio Image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    ) : (
                      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#666]" : "text-[#000]"}`}>
                        <X size={48} className="mb-4 opacity-20" />
                        <p>No images found in this folder.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h2 className={SECTION_TITLE_STYLE}>CP Featured Work</h2>

                  {/* <DottedDivider /> */}
                  <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

                  <div className="space-y-5 p-5 lg:p-8">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative w-full lg:w-[500px]">
                        <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 ${isDark ? "text-white/40" : "text-gray-400"}`} />
                        <input
                          type="text"
                          placeholder="Search"
                          className={`w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 border ${isDark
                            ? "bg-[#202020] border-white/20 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                            : "bg-gray-50 border-[#E3E3E3] text-black placeholder:text-gray-400 focus:ring-[#E3E3E3]"
                            }`}
                        />
                      </div>

                      <>
                        {/* MOBILE VIEW: Dropdown Button */}
                        <div className="md:hidden relative">
                          <Button
                            onClick={toggleDropdown}
                            className={`flex items-center gap-2 p-2 h-8 rounded-lg border transition-all ${isDark ? "bg-[#202020] border-white/10 text-white" : "bg-white border-gray-200 text-black shadow-sm"}`}
                          >
                            {viewMode === 'grid' ? <Grid3X3 size={20} /> : <List size={20} />}
                          </Button>

                          {/* Dropdown Menu */}
                          {isOpen && (
                            <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-2xl z-[50] overflow-hidden border ${isDark ? "bg-[#171717] border-white/10" : "bg-white border-gray-200"}`}>
                              <button
                                onClick={() => handleSelect('grid')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'grid' ? (isDark ? "bg-white/10 text-white" : "bg-gray-100 text-black")
                                  : (isDark ? "text-white/60 hover:bg-white/5" : "text-gray-500 hover:bg-gray-50")}`}
                              >
                                <Grid3X3 size={18} />
                                Grid View
                              </button>
                              <button
                                onClick={() => handleSelect('list')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'list' ? (isDark ? "bg-white/10 text-white" : "bg-gray-100 text-black")
                                  : (isDark ? "text-white/60 hover:bg-white/5" : "text-gray-500 hover:bg-gray-50")}`}
                              >
                                <List size={18} />
                                List View
                              </button>
                            </div>
                          )}
                        </div>

                        {/* DESKTOP VIEW: Original Toggle */}
                        <div className={`hidden lg:flex flex-wrap items-center rounded-lg border transition-all ${isDark ? "bg-[#202020] border-white/5" : "bg-gray-100 border-gray-200"}`}>
                          <Button
                            onClick={() => setViewMode('grid')}
                            className={`px-5 py-2.5 rounded-l-lg transition-colors ${viewMode === 'grid'
                              ? "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
                              : (isDark ? "bg-transparent text-white/40 hover:text-white" : "bg-transparent text-gray-400 hover:text-black")
                              }`}
                          >
                            <Grid3X3 size={20} />
                          </Button>
                          <Button
                            onClick={() => setViewMode('list')}
                            className={`px-5 py-2.5 rounded-r-lg transition-colors ${viewMode === 'list'
                              ? "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
                              : (isDark ? "bg-transparent text-white/40 hover:text-white" : "bg-transparent text-gray-400 hover:text-black")
                              }`}
                          >
                            <List size={20} />
                          </Button>
                        </div>
                      </>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.keys(featuredWorkGroups).length > 0 ? (
                        Object.entries(featuredWorkGroups).map(([key, group]) => (
                          <div
                            key={key}
                            onClick={() => {
                              setOpenFolder(group.tag ? `${group.title} (${group.tag})` : group.title);
                              setActiveImages(group.images);
                            }}
                            className={`rounded-xl transition-all group cursor-pointer ${isDark ? "bg-[#202020] border-[#333] hover:border-[#444]" : "bg-[#F4F5F7] border-gray-200 hover:border-gray-400 shadow-sm"}`}
                          >
                            <div className="flex items-start justify-between p-5">
                              <div className="flex items-center gap-3">
                                <div>
                                  <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
                                </div>
                                <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-black"}`}>{group.title}</span>
                              </div>
                              <button className={`${isDark ? "text-white hover:text-white/80" : "text-gray-400 hover:text-black"}`}>
                                <MoreVertical size={18} />
                              </button>
                            </div>

                            {/* Divider */}
                            <hr className={`border ${isDark ? "border-white/5" : "border-black/10"}`} />

                            <div className="flex gap-2 p-5">
                              {group.tag && (
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isDark ? "bg-[#171717] text-white border-[#333]" : "bg-white text-gray-500 border-gray-200"}`}>
                                  {group.tag}
                                </span>
                              )}
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isDark ? "bg-[#171717] text-white border-[#E8D1AB]/20" : "bg-white text-gray-500 border-gray-200"}`}>
                                {group.images.length} Image{group.images.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={`md:col-span-2 lg:col-span-3 py-20 text-center ${isDark ? "text-white" : "text-gray-400"}`}>
                          <Folder size={48} className="mx-auto mb-4 opacity-70" strokeWidth={2} />
                          <p>No featured work available.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </>
              )}
            </div>
          )}

          {/* TAB CONTENT: Availability */}
          {activeTab === 'Availability' && (
            <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
              <h2 className={SECTION_TITLE_STYLE}>Availability</h2>

              {/* divider */}
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
              <div className="space-y-4 lg:space-y-8 p-5 lg:p-8">
                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    label="Available Days"
                    value={summaryData.availableDays}
                    icon={CheckCircle}
                    iconColor={isDark ? "text-green-500" : "text-green-800"}
                    hoverBorder={isDark ? "hover:border-green-500/30" : "hover:border-green-700/30"}
                    isDark={isDark}
                  />
                  <StatCard
                    label="Booked Shoots"
                    value={summaryData.bookedShoots}
                    icon={Video}
                    iconColor={isDark ? "text-[#E8D1AB]" : "text-[#4f473a]"}
                    hoverBorder={isDark ? "hover:border-[#E8D1AB]/30" : "hover:border-[#4f473a]/30"}
                    isDark={isDark}
                  />
                  <StatCard
                    label="Time Off"
                    value={`${summaryData.timeOff}`}
                    icon={Clock}
                    iconColor={isDark ? "text-red-400" : "text-red-800"}
                    hoverBorder={isDark ? "hover:border-red-400/30" : "hover:border-red-800/30"}
                    isDark={isDark}
                  />
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* Main Calendar Section */}
                  <div className="col-span-12 lg:col-span-9 space-y-6">
                    <div className={`transition-colors duration-200 rounded-2xl overflow-hidden ${isDark ? "bg-[#171717] border-[#333]" : "bg-white border-gray-200"}`}>
                      {/* Calendar Controls */}
                      <div className={`p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "border-white/5" : "border-gray-100"
                        }`}>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center rounded-lg gap-2 lg:gap-4 p-1`}>
                            <button
                              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                              className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white bg-[#202020] border-white/10" : "hover:bg-gray-200 text-black bg-[#F0F0F0] border-[#0A0A0A33]"}`}
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <span className={`lg:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                              {format(currentMonth, 'MMMM yyyy')}
                            </span>
                            <button
                              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                              className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white bg-[#202020] border-white/10" : "hover:bg-gray-200 text-black bg-[#F0F0F0] border-[#0A0A0A33]"}`}
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className={`px-4 py-2 border rounded-lg text-sm transition-all ${isDark ? "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-[#E8D1AB]/40" : "bg-[#F0F0F0] border-[#E3E3E3] text-gray-600 hover:text-black shadow-sm"}`}
                            onClick={() => setCurrentMonth(new Date())}
                          >
                            Today
                          </button>
                        </div>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 border-collapse">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (d, index) => (
                            <div
                              key={index}
                              className={`py-3 text-center text-[10px] font-bold uppercase tracking-widest border-b border-r last:border-r-0 ${isDark ? "text-white/30 bg-black/40 border-[#333]" : "text-[#7C7777] bg-[#EDEBEB] border-gray-100"}`}
                            >
                              {d}
                            </div>
                          )
                        )}
                      </div>

                      {/* Days Cells */}
                      <div className="grid grid-cols-7 bg-[#101010]">
                        {calendarDays.map((day, dayIdx) => {
                          const isCurrentMonth = isSameMonth(day, currentMonth);
                          const dayAvailability = getAvailabilityForDay(day);
                          const hasShoot = isShootDay(day);
                          const availabilityValue = dayAvailability?.available;
                          const isAvailable = Boolean(availabilityValue === true || dayAvailability?.customAvailabilityStatus === 1);
                          const isUnavailable = Boolean(dayAvailability && !dayAvailability.projectAssigned && availabilityValue === false);
                          const startTimeDisplay = formatAvailabilityTime(dayAvailability?.start_time);
                          const endTimeDisplay = formatAvailabilityTime(dayAvailability?.end_time);
                          const hasTimeRange = Boolean(startTimeDisplay && endTimeDisplay);
                          const isTodayDate = isSameDay(day, new Date());

                          // Determine border classes
                          const isLastRow = dayIdx >= calendarDays.length - 7;
                          const isLastCol = (dayIdx + 1) % 7 === 0;

                          return (
                            <div
                              key={day.toString()}
                              className={`min-h-[100px] p-3 transition-colors ${isDark ? "border-[#333]" : "border-gray-100"} ${!isLastRow ? 'border-b' : ''} ${!isLastCol ? 'border-r' : ''} ${!isCurrentMonth
                                ? (isDark ? 'bg-[#0A0A0A] text-[#444]' : 'bg-[#F4F4F4] text-[#878787]')
                                : (isDark ? 'text-[#E0E0E0]' : 'bg-[#F8F4EE] text-[#3F3F3F]')
                                }`}
                            >
                              <span className={`text-sm font-medium block mb-2 w-7 h-7 flex items-center justify-center ${isTodayDate ? 'bg-[#E8D1AB] text-black rounded-full' : ''
                                }`}>
                                {format(day, 'd')}
                              </span>

                              {(hasShoot || isAvailable || isUnavailable || hasTimeRange) && (
                                <div className="space-y-1">
                                  {hasShoot && (
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${isDark ? "bg-[#2A2A2A] border-[#334155]" : "bg-blue-50 border-blue-100"}`}>
                                      <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
                                      <span className={`hidden md:inline text-sm leading-none ${isDark ? "text-[#93C5FD]" : "text-blue-700"}`}>Shoot</span>
                                    </div>
                                  )}
                                  {!hasShoot && isAvailable && (
                                    <div className="flex items-center gap-1.5 text-green-500/75">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                      <span className="hidden md:inline text-sm leading-none">Available</span>
                                    </div>
                                  )}
                                  {!hasShoot && isUnavailable && (
                                    <div className="flex items-center gap-1.5 text-red-400/75">
                                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                      <span className="hidden md:inline text-sm leading-none">Not Available</span>
                                    </div>
                                  )}
                                  {hasTimeRange && (
                                    <div className={`flex items-center gap-1 text-[10px] ${isDark ? "text-white/45" : "text-[#6D6D6D]"}`}>
                                      <Clock size={11} />
                                      <span>{startTimeDisplay} - {endTimeDisplay}</span>
                                    </div>
                                  )}
                                  {/* <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1E293B] border border-[#334155] w-fit">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                              <span className="text-[10px] text-[#93C5FD] font-medium leading-none">Shoot</span>
                            </div> */}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Sidebar */}
                  <div className="col-span-12 lg:col-span-3 w-full xl:max-w-[320px] space-y-3 lg:space-y-6">
                    {/* Legend */}
                    <div className={`rounded-2xl p-4 transition-colors ${isDark ? "bg-[#171717] border-[#333]" : "bg-white border-gray-200 shadow-sm"}`}>
                      <h3 className={`lg:text-lg font-medium mb-3 ${isDark ? "text-white" : "text-black"}`}>Color Legend</h3>
                      <div className="space-y-2 space-y-4">
                        <div className="flex items-start gap-2 lg:gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${isDark ? "bg-[#ECE7E2]" : "bg-[#ECE7E2]"}`}></div>
                          <div>
                            <div className={`text-sm font-medium ${isDark ? "text-[#C5C5C5]" : "text-[#3A3A3A]"}`}>Disabled</div>
                            <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Time off or blocked</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#7E7367] mt-1.5"></div>
                          <div>
                            <div className={`text-sm font-medium ${isDark ? "text-[#C5C5C5]" : "text-[#3A3A3A]"}`}>Today's</div>
                            <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Time off or blocked</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#3B82F6] mt-1.5"></div>
                          <div>
                            <div className={`text-sm font-medium ${isDark ? "text-[#C5C5C5]" : "text-[#3A3A3A]"}`}>Shoots</div>
                            <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Confirmed shoots</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#D22D2D] mt-1.5"></div>
                          <div>
                            <div className={`text-sm font-medium ${isDark ? "text-[#C5C5C5]" : "text-[#3A3A3A]"}`}>Conflicts</div>
                            <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Scheduling conflicts</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* This Month Stats */}
                    <div className={`rounded-2xl p-4 transition-colors ${isDark ? "bg-[#171717] border-[#333]" : "bg-white border-gray-200 shadow-sm"}`}>
                      <h3 className={`font-medium mb-4 ${isDark ? "text-white" : "text-black"}`}>This Month</h3>
                      <div className="space-y-2 lg:space-y-4">
                        <div className={`flex items-center justify-between px-2 py-1 rounded-lg text-sm lg:text-base ${isDark ? "bg-[#202020]" : "bg-[#F0F0F0]"}`}>
                          <span className={isDark ? "text-white/70" : "text-[#999]"}>Working Days</span>
                          <span className={` ${isDark ? "text-[#E8D1AB]" : "text-[#303030]"} text-right`}>{availabilityDays.length > 0 ? availabilityDays.join(", ") : "Not set"}</span>
                        </div>
                        <div className={`flex items-center justify-between px-2 py-1 rounded-lg text-sm lg:text-base ${isDark ? "bg-[#202020]" : "bg-[#F0F0F0]"}`}>
                          <span className={isDark ? "text-white/70" : "text-[#999]"}>Booked Shoots</span>
                          <span className={` ${isDark ? "text-[#E8D1AB]" : "text-[#303030]"}`}>{stats?.total_projects || stats?.accepted_projects || '0'}</span>
                        </div>
                        {/* <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                    <span className="text-[#999] text-sm">Rating</span>
                    <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#303030]"}`}>{partner.rating || "N/A"}</span>
                  </div> */}
                      </div>
                    </div>

                    {/* Share Availability */}
                    {/* <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"
                }`}>
                <h3 className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Share Availability</h3>
                <p className={`text-sm mb-4 ${isDark ? "text-[#888]" : "text-gray-500"}`}>Share your availability link with production teams</p>
                <button className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? "bg-[#E8D1AB] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80 shadow-md"
                  }`}>
                  <Copy size={18} />
                  <span>Copy Link</span>
                </button>
              </div> */}
                  </div>

                  {/* {!hideActions && (
              <button
                onClick={() => {
                  void handleGenerateLink();
                }}
                disabled={isGeneratingLink}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 border ${
                  isDark
                    ? "bg-[#E8D1AB] border-[#E8D1AB] text-black hover:bg-[#d4c3a3] disabled:opacity-70"
                    : "bg-black border-black text-white hover:bg-black/80 disabled:opacity-70"
                }`}
              >
                {isGeneratingLink ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LinkIcon size={16} />
                )}
                <span>{isGeneratingLink ? "Generating..." : "Generate Link"}</span>
              </button>
            )} */}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Shoots */}
          {activeTab === "Shoots" && (
            <div
              className={`overflow-hidden rounded-3xl transition-colors duration-200 ${isDark
                ? "border-[#333] bg-[#101010]"
                : "border-gray-200 bg-white shadow-sm"
                }`}>
              <div
                className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 ${isDark ? "border-[#333]" : "border-gray-200"}`}
              >
                <div
                  className={`inline-flex rounded-2xl border p-1 ${isDark
                    ? "border-[#333333] bg-[#101010]"
                    : "border-[#E5E5E5] bg-white"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setShootTab("current")}
                    className={`min-w-[140px] rounded-xl px-5 py-3 text-sm font-medium transition-all ${shootTab === "current"
                      ? isDark
                        ? "bg-[#E8D1AB] text-black"
                        : "bg-black text-white"
                      : isDark
                        ? "text-[#8A8A8A] hover:text-white"
                        : "text-[#666666] hover:text-black"
                      }`}
                  >
                    Current Shoots
                  </button>

                  <button
                    type="button"
                    onClick={() => setShootTab("past")}
                    className={`min-w-[140px] rounded-xl px-5 py-3 text-sm font-medium transition-all ${shootTab === "past"
                      ? isDark
                        ? "bg-[#E8D1AB] text-black"
                        : "bg-black text-white"
                      : isDark
                        ? "text-[#8A8A8A] hover:text-white"
                        : "text-[#666666] hover:text-black"
                      }`}
                  >
                    Past Shoots
                  </button>
                </div>
                <div
                  className={`relative w-full rounded-xl border transition-colors lg:max-w-[320px] ${isDark
                    ? "border-[#333333] bg-[#171717]"
                    : "border-[#E5E5E5] bg-white"
                    }`}
                >
                  <Search
                    size={16}
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#777]" : "text-gray-400"
                      }`}
                  />
                  <input
                    type="search"
                    value={shootSearchQuery}
                    onChange={(event) => setShootSearchQuery(event.target.value)}
                    placeholder="Search shoots"
                    className={`h-12 w-full rounded-xl bg-transparent pl-10 pr-4 text-sm outline-none transition-colors ${isDark
                      ? "text-white placeholder:text-[#777]"
                      : "text-black placeholder:text-gray-400"
                      }`}
                  />
                </div>
              </div>
              {shootsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2
                    className="animate-spin text-[#BFA780]"
                    size={40}
                  />
                </div>
              ) : assignedProjects.length === 0 ? (
                <div
                  className={`px-6 py-12 text-center ${isDark ? "text-[#888]" : "text-gray-500"
                    }`}
                >
                  No shoots assigned to this creative partner.
                </div>
              ) : filteredAssignedProjects.length === 0 ? (
                <div
                  className={`px-6 py-12 text-center ${isDark ? "text-[#888]" : "text-gray-500"
                    }`}
                >
                  No shoots match your search.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className={`text-left text-x ${isDark ? "bg-[#202020] text-[#E8D1AB]" : "border-gray-200 bg-gray-50 text-black"}`}>
                          <th className="p-4 font-medium">Shoot ID</th>
                          <th className="p-4 font-medium">Shoot Name</th>
                          <th className="p-4 font-medium">Shoot Type</th>
                          <th className="p-4 font-medium">Shoot Date</th>
                          <th className="p-4 font-medium">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredAssignedProjects.map((shoot, index) => {
                          const projectId =
                            shoot.project_id ||
                            shoot.stream_project_booking_id;

                          return (
                            <tr
                              key={shoot.assignment_id || projectId || index}
                              onClick={(event) => {
                                if (!projectId) return;

                                // Avoid duplicate navigation when clicking the Link.
                                if ((event.target as HTMLElement).closest("a")) return;

                                router.push(`/admin/shoots/${projectId}`);
                              }}
                              className={`text-sm transition-colors ${projectId ? "cursor-pointer" : "cursor-default"
                                } ${isDark
                                  ? "text-white hover:bg-white/5"
                                  : "text-black hover:bg-gray-50"
                                }`}
                            >
                              <td className="p-0">
                                <Link href={`/admin/shoots/${projectId}`} className="block p-4">
                                  #{projectId || "N/A"}
                                </Link>
                              </td>

                              <td className="p-0">
                                <Link
                                  href={`/admin/shoots/${projectId}`}
                                  className="block p-4"
                                >
                                  {shoot.project_name || "N/A"}
                                </Link>
                              </td>

                              <td className="p-0">
                                <Link
                                  href={`/admin/shoots/${projectId}`}
                                  className="block p-4"
                                >
                                  {formatShootType(shoot.shoot_type || shoot.event_type)}
                                </Link>
                              </td>

                              <td className="p-0">
                                <Link
                                  href={`/admin/shoots/${projectId}`}
                                  className="block p-4"
                                >
                                  {formatShootDate(shoot.event_date)}
                                </Link>
                              </td>

                              <td className="p-0">
                                <Link
                                  href={`/admin/shoots/${projectId}`}
                                  className="block p-4"
                                >
                                  <span
                                    className={`inline-flex min-w-[90px] items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium ${getAssignmentStatusStyle(
                                      shoot.assignment_status
                                    )}`}
                                  >
                                    {formatAssignmentStatus(shoot.assignment_status)}
                                  </span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View with Expandable Panels */}
                  <div className="block lg:hidden w-full overflow-hidden">
                    <div className={`flex justify-between p-4 border-y text-sm font-medium ${isDark ? "border-white/5 bg-[#202020] text-[#E8D1AB]" : "border-gray-200 bg-gray-50 text-black"}`}>
                      <p>Shoot Name</p>
                      <p>Status</p>
                    </div>

                    {filteredAssignedProjects.length === 0 ? (
                      <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-white/40" : "text-gray-500"}`}>
                        No shoots found for the selected filters.
                      </div>
                    ) : (
                      filteredAssignedProjects.map((shoot, index) => {
                        const projectId = shoot.project_id || shoot.stream_project_booking_id;
                        const baseIdentifier = shoot.assignment_id || projectId || String(index);
                        const rowKey = `${shootTab}-${baseIdentifier}`;
                        const isExpanded = expandedId === rowKey;

                        return (
                          <div
                            key={rowKey}
                            className={`p-4 transition-all duration-200 ease-in-out ${isDark ? "border-white/5 text-white" : "border-gray-200 text-black"
                              } ${isExpanded ? (isDark ? "bg-[#202020]" : "bg-gray-100/50") : "bg-transparent"}`}
                          >
                            {/* Main Row Header */}
                            <div className="flex items-center justify-between gap-3">

                              {/* Chevron Trigger Area */}
                              <div className="flex items-center shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation(); // Stop event bubble
                                    toggleRow(rowKey);
                                  }}
                                  className={`p-1 rounded-full transition-transform duration-200 border ${isExpanded
                                    ? (isDark ? 'rotate-180 border-[#E8D1AB]' : 'rotate-180 border-black')
                                    : (isDark ? 'border-white/20' : 'border-gray-400')
                                    }`}
                                >
                                  <ChevronDown
                                    size={16}
                                    className={isExpanded ? (isDark ? 'text-[#E8D1AB]' : 'text-black') : (isDark ? 'text-white/60' : 'text-gray-500')}
                                  />
                                </button>
                              </div>

                              {/* Clickable Content Redirect Zone */}
                              <div
                                className={`w-full flex justify-between items-center min-w-0 cursor-pointer transition-colors ${isDark ? "active:bg-white/5" : "active:bg-gray-100"
                                  }`}
                                onClick={() => {
                                  if (projectId) router.push(`/admin/shoots/${projectId}`);
                                }}
                              >
                                <div className="min-w-0 pr-2">
                                  <p className={`font-medium text-sm truncate ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>
                                    {shoot.project_name || "N/A"}
                                  </p>
                                  <p className={`${isDark ? "text-white/40" : "text-gray-500"} text-[10px] mt-0.5 tracking-wider font-bold`}>
                                    #{projectId || "N/A"}
                                  </p>
                                </div>

                                <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium ${getAssignmentStatusStyle(shoot.assignment_status)}`}>
                                  {formatAssignmentStatus(shoot.assignment_status)}
                                </span>
                              </div>
                            </div>

                            {/* Expandable Meta Block */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: "easeInOut" }}
                                  style={{ overflow: "hidden" }}
                                  className="w-full min-w-0 clear-both"
                                >
                                  <div className={`grid grid-cols-2 gap-4 text-xs pt-4 ${isDark ? "text-[#BDBDBD]" : "text-gray-600"}`}>
                                    <div>
                                      <p className={`mb-1 font-medium ${isDark ? "text-white" : "text-gray-400"}`}>
                                        Shoot Type
                                      </p>
                                      <p className="text-sm">
                                        {formatShootType(shoot.shoot_type || shoot.event_type)}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className={`mb-1 font-medium ${isDark ? "text-white" : "text-gray-400"}`}>
                                        Shoot Date
                                      </p>
                                      <p className="text-sm">
                                        {formatShootDate(shoot.event_date)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Navigation Row Footer */}
                                  <div className="flex justify-start pt-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (projectId) router.push(`/admin/shoots/${projectId}`);
                                      }}
                                      className={`flex items-center gap-1 text-sm font-semibold transition-colors ${isDark ? "text-[#E8D1AB] hover:text-white" : "text-black hover:text-gray-600"}`}
                                    >
                                      View Shoot Details <ChevronRight size={20} />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB CONTENT: Certificates */}
          {activeTab === 'Certificates' && (
            <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
              <h2 className={SECTION_TITLE_STYLE}>CP Certificates</h2>

              {/* divider */}
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

              <div className="p-5 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {certificationFiles.length > 0 ? (
                  certificationFiles.map((file: any, index: number) => (
                    <div
                      key={index}
                      className={`transition-all group cursor-default border rounded-xl p-4 ${isDark
                        ? "bg-[#111111] border-white/30 hover:border-[#444]"
                        : "bg-white border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md"
                        }`}>
                      <div className="flex items-center gap-3 mb-2 lg:mb-4">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#FF453A] rounded-md shrink-0">
                          <span className="text-white text-[8px] font-bold">Pdf</span>
                        </div>
                        <span className={`font-medium text-sm truncate ${isDark ? "text-[#E0E0E0]" : "text-gray-900"}`}>{file.title || `Certificate ${index + 1}`}</span>
                      </div>

                      <div className={`w-full h-[220px] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden transition-colors ${isDark ? "bg-[#161616]" : "bg-gray-50 border border-gray-100"
                        }`}>
                        <div className="w-16 h-20 bg-[#FF453A] rounded-lg flex items-center justify-center relative transform group-hover:scale-105 transition-transform duration-300">
                          <span className="text-white font-bold text-xl">Pdf</span>
                          <div className="absolute top-0 right-0 w-6 h-6 bg-[#D93025] rounded-bl-lg"></div>
                          <div className={`absolute top-0 right-0 w-6 h-6 transform translate-x-3 -translate-y-3 rotate-45 ${isDark ? "bg-[#161616]" : "bg-gray-50"
                            }`}></div>
                        </div>
                      </div>

                      <a
                        href={`${UPLOADS_URL}${file.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all block text-center bg-[#E8D1AB] text-black hover:bg-[#d4c3a3]`}
                      >
                        View Certificate
                      </a>
                    </div>
                  ))
                ) : (
                  <div className={`md:col-span-2 lg:col-span-3 py-20 text-center ${isDark ? "text-white" : "text-gray-400"}`}>
                    <FileText size={48} className={`mx-auto mb-4 transition-opacity ${isDark ? "opacity-70" : "opacity-40"}`} />
                    <p>No certifications uploaded.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Resume */}
          {activeTab === 'Resume' && (
            <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
              <h2 className={SECTION_TITLE_STYLE}>CP Resume</h2>

              {/* divider */}
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

              <div className="p-5 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {resumeFile ? (
                  <div className={`transition-all group cursor-default border rounded-xl p-4 ${isDark
                    ? "bg-[#111111] border-white/30 hover:border-[#444]"
                    : "bg-white border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md"
                    }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#2563EB] rounded-md shrink-0">
                        <FileText size={16} className="text-white" />
                      </div>
                      <span className={`font-medium text-sm truncate ${isDark ? "text-[#E0E0E0]" : "text-gray-900"}`}>{resumeFile.title || 'Creative Professional Resume'}</span>
                    </div>

                    <div className={`w-full h-[220px] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden transition-colors ${isDark ? "bg-[#161616]" : "bg-gray-50 border border-gray-100"}`}>
                      <div className="w-16 h-20 bg-[#2563EB] rounded-lg flex flex-col items-center justify-center p-4 relative transform group-hover:scale-105 transition-transform duration-300">
                        <div className="w-full h-1 bg-white/40 mb-1.5 rounded-full"></div>
                        <div className="w-full h-1 bg-white/40 mb-1.5 rounded-full"></div>
                        <div className="w-full h-1 bg-white/40 mb-1.5 rounded-full"></div>
                        <div className="w-3/4 h-1 bg-white/40 rounded-full self-start"></div>
                      </div>
                    </div>

                    <a
                      href={`${UPLOADS_URL}${resumeFile.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#E8D1AB] text-black rounded-lg text-sm font-semibold hover:bg-[#d4c3a3] transition-colors block text-center"
                    >
                      View Resume
                    </a>
                  </div>
                ) : (
                  <div className={`md:col-span-2 lg:col-span-3 py-20 text-center ${isDark ? "text-white" : "text-gray-400"}`}>
                    <FileText size={48} className={`mx-auto mb-4 transition-opacity ${isDark ? "opacity-20" : "opacity-40"}`} />
                    <p>No resume uploaded.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Portfolio Links */}
          {activeTab === 'Portfolio Links' && (
            <div className={`transition-colors duration-200 rounded-2xl ${isDark ? "bg-[#111]" : "bg-[#F4F5F7] shadow-sm"}`}>
              <h2 className={SECTION_TITLE_STYLE}>Portfolio Links</h2>

              {/* divider */}
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

              <div className="p-5 lg:p-8">
                {(() => {
                  const portfolioLinks = partner.crew_member_files?.filter(
                    (f: any) => f.file_type === "link"
                  ) || [];

                  if (portfolioLinks.length === 0) {
                    return (
                      <div className={`w-full py-10 lg:py-20 text-center border rounded-xl ${isDark ? "text-[#666] border-[#333]" : "text-gray-400 border-gray-200 bg-gray-50/50"}`}>
                        <Globe size={48} className={`mx-auto mb-4 transition-opacity ${isDark ? "opacity-20" : "opacity-40"}`} />
                        <p>No portfolio links added.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {portfolioLinks.map((link: any, index: number) => {
                        const platform = PORTFOLIO_ICONS.find((p) => p.id === link.tag);
                        const formatExternalUrl = (url: string) => {
                          if (!url) return "#";
                          if (url.startsWith("http://") || url.startsWith("https://")) {
                            return url;
                          }
                          return `https://${url}`;
                        };

                        return (
                          <div
                            key={link.crew_files_id || index}
                            className={`transition-all duration-300 rounded-2xl p-6 flex flex-col gap-4 group shadow-xl ${isDark
                              ? "bg-white/5 border-white/10 hover:border-white/20"
                              : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-2xl"
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
                                }`}>
                                {platform?.icon ? (
                                  <platform.icon size={24} className="text-[#E8D1AB]" />
                                ) : (
                                  <Globe size={24} className="text-[#E8D1AB]" />
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-black"
                                }`}>
                                {platform?.label || "Portfolio Link"}
                              </p>
                              <p className={`text-xs truncate font-medium ${isDark ? "text-white/40" : "text-gray-400"
                                }`}>
                                {link.file_path}
                              </p>
                            </div>

                            <button
                              onClick={() => setPlayingVideo(link.file_path)}
                              className="w-full bg-[#1A1A1A] text-white border border-white/10 hover:bg-white hover:text-black py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
                            >
                              Play Portfolio
                              <Play size={14} className="fill-current group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIDEO PLAYER MODAL */}
      {playingVideo && (
        <div className={`fixed inset-0 z-[120] overflow-y-auto animate-in fade-in duration-500 backdrop-blur-2xl ${isDark ? "bg-black/98" : "bg-white/98"
          }`}>

          {/* Top Bar - Sticky so the close button is always visible even when scrolling */}
          <div className={`sticky top-0 z-50 flex items-center justify-between p-4 lg:p-10 pointer-events-none bg-gradient-to-b ${isDark
            ? "from-black/95 via-black/80 to-transparent"
            : "from-white/95 via-white/80 to-transparent"
            }`}>
            <div className="space-y-1 pointer-events-auto">
              <h3 className={`text-xs lg:text-sm font-black uppercase tracking-[0.3em] ${isDark ? "text-white" : "text-black"
                }`}>
                Portfolio Player
              </h3>
              <div className="flex items-center gap-2">
                {/* Accent color matched to this specific page's theme */}
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-[#E8D1AB]" : "bg-black"
                  }`} />
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-white/30" : "text-black/30"
                  }`}>  Now Playing
                </p>
              </div>
            </div>
            <button
              onClick={() => setPlayingVideo(null)}
              className={`p-3 lg:p-4 border rounded-full transition-all active:scale-90 shadow-lg pointer-events-auto ${isDark
                ? "bg-white/5 border-white/10 text-white hover:bg-white/20"
                : "bg-black/5 border-black/10 text-black hover:bg-black/20"
                }`}
            >
              <X size={20} className="lg:w-6 lg:h-6" />
            </button>
          </div>

          {/* Video Container - Beautifully centers and allows scroll */}
          <div className="w-full max-w-6xl mx-auto px-4 pb-24 pt-2 lg:pt-10">
            <div className={`w-full aspect-video rounded-xl lg:rounded-[2rem] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.8)] border ${isDark ? "bg-black border-white/10" : "bg-gray-100 border-black/10"
              }`}>
              <iframe
                src={getEmbedUrl(playingVideo) || ""}
                className="w-full h-full absolute inset-0 border-none"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                title="Portfolio Video"
              />
            </div>
          </div>

        </div>
      )}
    </div>
    </div>
  );
};
