"use client";

import React, { useState, useEffect, cloneElement } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check, X, MapPin, Globe, User, Linkedin, Copy, Calendar as CalendarIcon, ChevronDown, Phone, Grid3X3, FolderOpen, Briefcase, Play } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { adminApi, getStatusCount, GetUpcomingShoots, getPendingProjects, getAvailabilityDetails } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface ProfileProps {
  id: string;
}

const SECTION_TITLE_STYLE = "lg:text-lg font-medium text-white px-5 pt-5 lg:px-8 lg:pt-8";
const LABEL_STYLE = "text-[#CFCCCC] text-sm font-medium mb-1 block";
const VALUE_STYLE = "text-[#999696] text-sm block";

import { Search, LayoutGrid, List, Folder, MoreVertical, ArrowLeft, FileText, Clock, Video, Info, CheckCircle, Calendar, Navigation } from "lucide-react";
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

const PORTFOLIO_IMAGES = [
  "/images/crew/CREW(1).png",
  "/images/crew/CREW(2).png",
  "/images/crew/CREW(3).png",
  "/images/crew/CREW(4).png",
  "/images/crew/CREW(6).png",
];

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

export const CreativePartnerProfile = ({ id }: ProfileProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // Default to Jan 2026 for demo
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('All');
  const [activeImages, setActiveImages] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const [partner, setPartner] = useState<any>(null);
  const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [upcomingShoots, setUpcomingShoots] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [availabilityDetails, setAvailabilityDetails] = useState<any>({});
  const [allShoots, setAllShoots] = useState<any[]>([]);
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

        const [partnerResponse, skillsResponse, statsResponse, dashboardDetailResponse] = await Promise.all([
          adminApi.getCrewMemberDetail(cleanId),
          adminApi.getSkills(),
          getStatusCount({ crew_member_id: crewMemberIdNum, creator_id: crewMemberIdNum }),
          adminApi.getAdminDashboardDetail({ crew_member_id: cleanId })
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

        // Set shoots from dashboard detail
        if (dashboardDetailResponse && dashboardDetailResponse.data) {
          const data = dashboardDetailResponse.data;
          // Extract allShoots if it exists, otherwise check if data itself is the array
          const shootsData = data.allShoots && Array.isArray(data.allShoots)
            ? data.allShoots
            : (Array.isArray(data) ? data : []);
          setAllShoots(shootsData);
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
        } else if (status.available) {
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
        <Loader2 className="animate-spin text-white/50" size={40} />
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

  const fullName = `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || "Unknown Partner";

  // Base URL for uploads
  // const S3_BASE_URL = "https://beigexmemehouse.s3.amazonaws.com/beige/";
  const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

  // Get profile photo
  const profilePhoto = partner.crew_member_files?.find(
    (file: any) => file.file_type === 'profile_photo'
  );
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

  // Role mapping: Prioritize role.role_name, then ROLE_MAP, then fallback
  const ROLE_MAP: Record<string, string> = {
    '1': 'Videographer',
    '2': 'Photographer',
    '3': 'Editor',
    '4': 'Producer',
    '5': 'Director',
  };

  let primaryRole = "No role specified";
  if (partner.role?.role_name) {
    primaryRole = partner.role.role_name;
  } else if (partner.primary_role) {
    // Handle if primary_role is a JSON string of IDs (like ["9", "10"])
    try {
      const rolesArray = typeof partner.primary_role === 'string' && partner.primary_role.startsWith('[')
        ? JSON.parse(partner.primary_role)
        : partner.primary_role;

      if (Array.isArray(rolesArray)) {
        primaryRole = rolesArray.map(r => ROLE_MAP[r] || r).join(", ");
      } else {
        primaryRole = ROLE_MAP[partner.primary_role] || partner.primary_role;
      }
    } catch (e) {
      primaryRole = ROLE_MAP[partner.primary_role] || partner.primary_role;
    }
  }

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

  // Parse availability
  let availabilityDays: string[] = [];
  if (partner.availability) {
    try {
      availabilityDays = typeof partner.availability === 'string' ? JSON.parse(partner.availability) : partner.availability;
    } catch (e) {
      console.error("Error parsing availability:", e);
    }
  }

  // Mock data for calendar
  const shootDates = [
    new Date(2026, 0, 16),
    new Date(2026, 0, 19),
    new Date(2026, 0, 26),
    new Date(2026, 0, 29),
    new Date(2026, 0, 30),
  ];

  // Map all shoots for the table
  const shoots = (Array.isArray(allShoots) ? allShoots : []).map(s => {
    const project = s.project || {};
    const statusMap: Record<string, string> = {
      '0': 'Initiated',
      '1': 'Pre Production',
      '2': 'Post Production',
      '3': 'Revision',
      '4': 'Completed',
      '5': 'Cancelled'
    };
    return {
      id: `#${project.stream_project_booking_id || project.id || s.project_id || s.id}`,
      name: project.project_name || s.title || 'Project',
      files: s.files_count || 0,
      price: `$${project.budget || s.total_amount || '0.00'}`,
      status: statusMap[project.status !== undefined ? project.status.toString() : s.status] || 'Unknown'
    };
  });

  // Update UPLOADS_URL to use S3
  const UPLOADS_URL = S3_BASE_URL;

  // Group Recent Work by Title and Tag
  const featuredWorkGroups: Record<string, { title: string, tag: string, images: string[] }> = {};
  if (partner.crew_member_files) {
    partner.crew_member_files.forEach((file: any) => {
      if (file.file_type === 'recent_work') {
        const groupKey = `${file.title || 'Untitled'}-${file.tag || 'No Tag'}`;
        if (!featuredWorkGroups[groupKey]) {
          featuredWorkGroups[groupKey] = {
            title: file.title || 'Untitled',
            tag: file.tag || 'No Tag',
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

  // Fallback if no real shoots
  if (shoots.length === 0) {
    shoots.push(
      { id: '#SHO01', name: 'Wedding Highlight Film', files: 24, price: '$1,200.00', status: 'Initiated' },
      { id: '#SHO02', name: 'Product Promo Video', files: 12, price: '$850.00', status: 'Pre Production' }
    );
  }

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

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3 lg:space-y-6">
      {/* Breadcrumbs */}
      {/* <div className="flex items-center gap-2 text-sm text-[#666]">
        <span className="hover:text-[#E0E0E0] cursor-pointer">User - Creative Partners</span>
        <span>/</span>
        <span className="text-white">Creative Partner Profile Details</span>
      </div> */}

      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-sm text-[#666] mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#E0E0E0] hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-[#101010] border border-[#333] rounded-2xl">
        <div className="flex items-start justify-between px-4 pt-4 lg:p-6">
          <div className="flex gap-6">
            {/* Avatar */}
            <div className="w-[67px] h-[67px] lg:w-32 lg:h-32 rounded-lg lg:rounded-xl bg-[#222] overflow-hidden relative flex-shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#444] bg-[#222] text-3xl font-bold">
                  {fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
              )}
            </div>

            <div className="lg:pt-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="lg:text-2xl font-bold text-white">{fullName}</h1>
                {status === "Approved" && (
                  <div className="text-green-500">
                    <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[#888] text-xs lg:text-sm mb-1 lg:mb-2">{primaryRole}</p>
              <div className="flex items-center gap-1 text-xs lg:text-[#C2C2C2] text-sm mb-2 lg:mb-5">
                <MapPin size={14} className="shrink-0" />
                <span>{partner.location || [partner.city, partner.state].filter(Boolean).join(", ") || "N/A"}</span>
              </div>

              <div className="flex items-center gap-3">
                {partner.linkedin_url && (
                  <a href={partner.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white text-sm hover:bg-[#222] transition-colors">
                    <Linkedin size={16} />
                    <span>LinkedIn</span>
                  </a>
                )}
                {partner.behance_url && (
                  <a href={partner.behance_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white text-sm hover:bg-[#222] transition-colors">
                    <span className="font-bold text-lg leading-none">Bē</span>
                    <span>Behance</span>
                  </a>
                )}
                {partner.portfolio_url && (
                  <a href={partner.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white text-sm hover:bg-[#222] transition-colors">
                    <Globe size={16} />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge Only */}
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
                className="text-[#666] hover:text-[#E0E0E0] text-xs underline underline-offset-4 disabled:opacity-50 mt-2"
              >
                Change to {status === "Approved" ? "Rejected" : "Approved"}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-[1px] w-full my-4 lg:my-9"
          style={{
            backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
            backgroundSize: '30px 1px',
            backgroundRepeat: 'repeat-x'
          }}
        />

        {/* Tabs */}
        <div className="flex items-center w-full overflow-x-auto no-scrollbar gap-6 lg:gap-0 lg:justify-between lg:mt-2 px-2">
          {['Overview', 'Featured Work', 'Availability', 'Shoots', 'Certificates', 'Resume', 'Portfolio Links'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 lg:pb-4 text-sm lg:text-base font-medium transition-all duration-300 relative tracking-normal px-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'text-[#E5D5B8]' : 'text-[#666666] hover:text-white'}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E5D5B8]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'Overview' && (
        <>
          {/* Personal Information */}
          <div className="bg-[##101010] border border-[#333] rounded-2xl">
            <h2 className={`${SECTION_TITLE_STYLE}`}>Personal Information</h2>

            {/* divider */}
            <div
              className="h-[1px] w-full my-4 lg:my-9"
              style={{
                backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
                backgroundSize: '30px 1px',
                backgroundRepeat: 'repeat-x'
              }}
            />
            <div className="px-5 pb-5 lg:px-8 lg:pb-8 grid grid-cols-1 lg:grid-cols-2 gap-y-4 lg:gap-y-8 gap-x-12">
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
                <span className={VALUE_STYLE}>{partner.email || "N/A"}</span>
              </div>
              <div>
                <span className={LABEL_STYLE}>Contact Phone</span>
                <div className="flex items-center gap-2 text-[#E0E0E0] text-[15px] font-medium">
                  <Phone size={18} />
                  <span>{partner.phone_number || partner.contact_phone || "N/A"}</span>
                </div>
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
          <div className="bg-[##101010] border border-[#333] rounded-2xl">
            <h2 className={SECTION_TITLE_STYLE}>Professional Details</h2>
            {/* divider */}
            <div
              className="h-[1px] w-full my-4 lg:my-9"
              style={{
                backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
                backgroundSize: '30px 1px',
                backgroundRepeat: 'repeat-x'
              }}
            />
            <div className="px-5 pb-5 lg:px-8 lg:pb-8 grid grid-cols-1 lg:grid-cols-2 gap-y-4 lg:gap-y-8 gap-x-12">
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
                <span className={VALUE_STYLE}>${partner.hourly_rate || "0.00"}/-</span>
              </div>
              <div className="col-span-2">
                <span className={LABEL_STYLE}>Bio / About</span>
                <p className="text-[#888] text-[15px] leading-relaxed mt-1">
                  {partner.bio || "No biography provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-[#101010] border border-[#333] rounded-2xl">
            <h2 className={SECTION_TITLE_STYLE}>
              Skills <span className="text-[#E5D5B8]">({skillNames.length})</span>
            </h2>
            {/* divider */}
            <div
              className="h-[1px] w-full my-4 lg:my-9"
              style={{
                backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
                backgroundSize: '30px 1px',
                backgroundRepeat: 'repeat-x'
              }}
            />
            <div className="px-5 pb-5 lg:px-8 lg:pb-8 flex flex-wrap gap-2 lg:gap-3">
              {skillNames.length > 0 ? (
                skillNames.map(skill => (
                  <div key={skill} className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-[#E0E0E0] text-xs lg:text-sm">
                    <span>{skill}</span>
                  </div>
                ))
              ) : (
                <span className="text-[#666] text-sm italic">No skills listed.</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB CONTENT: Featured Work */}
      {activeTab === 'Featured Work' && (
        <div className="bg-[#101010] border border-[#333] rounded-2xl min-h-[500px]">
          {openFolder ? (
            <div className="p-5 lg:p-8">
              <button
                onClick={() => {
                  setOpenFolder(null);
                  setActiveImages([]);
                }}
                className="flex items-center gap-2 text-[#E0E0E0] hover:text-white transition-colors mb-4 lg:mb-6"
              >
                <ArrowLeft size={20} />
                <span className="lg:text-lg font-medium">{openFolder}</span>
              </button>

              <div className="w-full bg-[#171717] rounded-2xl overflow-hidden text-white border border-[#3D3D3D] py-10">
                {activeImages.length > 0 ? (
                  <Swiper
                    effect={"coverflow"}
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={Math.min(3, activeImages.length)}
                    initialSlide={Math.floor(activeImages.length / 2)}
                    loop={activeImages.length > 1}
                    spaceBetween={10}
                    coverflowEffect={{
                      rotate: 50,
                      stretch: 0,
                      depth: 100,
                      modifier: 1,
                      slideShadows: false,
                    }}
                    modules={[EffectCoverflow]}
                    className="w-full"
                  >
                    {activeImages.map((img, index) => (
                      <SwiperSlide key={index} className="flex items-center justify-center">
                        <div className="relative w-full h-full md:!w-[280px] md:!h-[400px] rounded-[20px] overflow-hidden transition-all duration-500">
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
                  <div className="flex flex-col items-center justify-center py-20 text-[#666]">
                    <X size={48} className="mb-4 opacity-20" />
                    <p>No images found in this folder.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <h2 className={SECTION_TITLE_STYLE}>CP Featured Work</h2>
              <div
                className="h-[1px] w-full my-4 lg:my-9"
                style={{
                  backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
                  backgroundSize: '30px 1px',
                  backgroundRepeat: 'repeat-x'
                }}
              />
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2 px-5 pb-5 lg:px-8 lg:pb-8">
                <div className="relative w-full lg:w-[500px]">
                  <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
                  />
                </div>

                <>
                  {/* MOBILE VIEW: Dropdown Button */}
                  <div className="md:hidden relative">
                    <Button
                      onClick={toggleDropdown}
                      className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
                    >
                      {viewMode === 'grid' ? <Grid3X3 size={20} /> : <List size={20} />}
                    </Button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
                        <button
                          onClick={() => handleSelect('grid')}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'grid' ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                            }`}
                        >
                          <Grid3X3 size={18} />
                          Grid View
                        </button>
                        <button
                          onClick={() => handleSelect('list')}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'list' ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                            }`}
                        >
                          <List size={18} />
                          List View
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DESKTOP VIEW: Original Toggle */}
                  <div className="hidden lg:flex flex-wrap items-center bg-[#202020] rounded-lg w-full md:w-fit border border-white/5">
                    <Button
                      onClick={() => setViewMode('grid')}
                      className={`px-5 py-2.5 rounded-l-lg transition-colors ${viewMode === 'grid'
                        ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                        : "bg-transparent text-white/40 hover:text-white"
                        }`}
                    >
                      <Grid3X3 size={20} />
                    </Button>
                    <Button
                      onClick={() => setViewMode('list')}
                      className={`px-5 py-2.5 rounded-r-lg transition-colors ${viewMode === 'list'
                        ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                        : "bg-transparent text-white/40 hover:text-white"
                        }`}
                    >
                      <List size={20} />
                    </Button>
                  </div>
                </>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-5 pb-5 lg:px-8 lg:pb-8">
                {Object.keys(featuredWorkGroups).length > 0 ? (
                  Object.entries(featuredWorkGroups).map(([key, group]) => (
                    <div
                      key={key}
                      onClick={() => {
                        setOpenFolder(`${group.title} (${group.tag})`);
                        setActiveImages(group.images);
                      }}
                      className="bg-[#1A1A1A] border border-[#333] rounded-xl hover:border-[#444] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-start justify-between p-5">
                        <div className="flex items-center gap-3">
                          <div>
                            <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
                          </div>
                          <span className="text-white font-semibold text-sm leading-tight">{group.title}</span>
                        </div>
                        <button className="text-[#666] hover:text-white">
                          <MoreVertical size={18} />
                        </button>
                      </div>

                      {/* Divider */}
                      <hr className="my-1 border-white/50" />

                      <div className="flex gap-2 p-5">
                        <span className="px-3 py-1.5 rounded-full bg-[#101010] text-[#999] text-xs font-medium border border-[#333]">
                          {group.tag}
                        </span>
                        <span className="px-3 py-1.5 rounded-full bg-[#101010] text-[#E5D5B8] text-xs font-medium border border-[#E5D5B8]/20">
                          {group.images.length} Image{group.images.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-20 text-center text-[#666] border border-dashed border-[#333] rounded-xl">
                    <Folder size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No featured work available.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT: Availability */}
      {activeTab === 'Availability' && (
        <div className="space-y-4 lg:space-y-8 pb-4 lg:pb-12">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Available Days"
              value={summaryData.availableDays}
              icon={CheckCircle}
              iconColor="text-green-500"
              hoverBorder="hover:border-green-500/30"
            />
            <StatCard
              label="Booked Shoots"
              value={summaryData.bookedShoots}
              icon={Video}
              iconColor="text-[#E5D5B8]"
              hoverBorder="hover:border-[#E5D5B8]/30"
            />
            <StatCard
              label="Time Off"
              value={`${summaryData.timeOff}`}
              icon={Clock}
              iconColor="text-red-400"
              hoverBorder="hover:border-red-400/30"
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Main Calendar Section */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              <div className="bg-[#101010] border border-[#333] rounded-2xl overflow-hidden shadow-2xl">
                {/* Calendar Controls */}
                <div className="p-4 lg:p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black rounded-lg border border-white/10 p-1">
                      <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60 transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60 transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    <span className="lg:text-lg font-bold text-white tracking-tight">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="px-4 py-2 bg-transparent border border-white/10 text-white/60 hover:text-white hover:border-[#E5D5B8]/40 rounded-lg text-sm transition-all"
                      onClick={() => setCurrentMonth(new Date(2026, 0, 1))}
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
                        className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/30 bg-black/40 border-b border-r border-[#333]"
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
                    const hasShoot = isShootDay(day);
                    const isTodayDate = isSameDay(day, new Date(2026, 0, 16)); // Mocking "Today" as Jan 16 for demo visual match

                    // Determine border classes
                    const isLastRow = dayIdx >= calendarDays.length - 7;
                    const isLastCol = (dayIdx + 1) % 7 === 0;

                    return (
                      <div
                        key={day.toString()}
                        className={`min-h-[100px] p-3 border-[#333] ${!isLastRow ? 'border-b' : ''} ${!isLastCol ? 'border-r' : ''} ${!isCurrentMonth ? 'bg-[#0A0A0A] text-[#444]' : 'text-[#E0E0E0]'
                          }`}
                      >
                        <span className={`text-sm font-medium block mb-2 w-7 h-7 flex items-center justify-center ${isTodayDate ? 'bg-[#E5D5B8] text-black rounded-full' : ''
                          }`}>
                          {format(day, 'd')}
                        </span>

                        {hasShoot && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1E293B] border border-[#334155] w-fit">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                              <span className="text-[10px] text-[#93C5FD] font-medium leading-none">Shoot</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1E293B] border border-[#334155] w-fit">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                              <span className="text-[10px] text-[#93C5FD] font-medium leading-none">Shoot</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Sidebar */}
            <div className="col-span-12 lg:col-span-3 w-full xl:w-[320px] space-y-3 lg:space-y-6">
              {/* Legend */}
              <div className="bg-[#101010] border border-[#333] rounded-2xl p-4 lg:p-6">
                <h3 className="text-white font-medium mb-2 lg:mb-4">Color Legend</h3>
                <div className="space-y-2 space-y-4">
                  <div className="flex items-start gap-2 lg:gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#444] mt-1.5"></div>
                    <div>
                      <div className="text-[#E0E0E0] text-sm font-medium">Disabled</div>
                      <div className="text-[#666] text-xs">Time off or blocked</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#8B7355] mt-1.5"></div>
                    <div>
                      <div className="text-[#E0E0E0] text-sm font-medium">Today's</div>
                      <div className="text-[#666] text-xs">Time off or blocked</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#3B82F6] mt-1.5"></div>
                    <div>
                      <div className="text-[#E0E0E0] text-sm font-medium">Shoots</div>
                      <div className="text-[#666] text-xs">Confirmed shoots</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444] mt-1.5"></div>
                    <div>
                      <div className="text-[#E0E0E0] text-sm font-medium">Conflicts</div>
                      <div className="text-[#666] text-xs">Scheduling conflicts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* This Month Stats */}
              <div className="bg-[#101010] border border-[#333] rounded-2xl p-4 lg:p-6">
                <h3 className="text-white font-medium mb-4">This Month</h3>
                <div className="space-y-2 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                    <span className="text-[#999] text-sm">Working Days</span>
                    <span className="text-sm lg:text-base text-white font-medium text-right">{availabilityDays.length > 0 ? availabilityDays.join(", ") : "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                    <span className="text-[#999] text-sm">Booked Shoots</span>
                    <span className="text-sm lg:text-base text-white font-medium">{stats?.total_projects || stats?.accepted_projects || '0'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                    <span className="text-[#999] text-sm">Rating</span>
                    <span className="text-sm lg:text-base text-white font-medium">{partner.rating || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Share Availability */}
              <div className="bg-[#101010] border border-[#333] rounded-2xl p-4 lg:p-6">
                <h3 className="text-white font-medium mb-2">Share Availability</h3>
                <p className="text-[#888] text-sm mb-4">Share your availability link with production teams</p>
                <button className="w-full py-3 bg-[#E5D5B8] text-black rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#d4c3a3] transition-colors">
                  <Copy size={18} />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Shoots */}
      {activeTab === 'Shoots' && (
        <div className="bg-[#101010] border border-[#333] rounded-2xl overflow-hidden">
          {/* MOBILE ONLY VIEW */}
          <div className="lg:hidden p-3 bg-[#111111]">
            <div className="flex justify-between px-5 py-3 text-[#E8D1AB] text-sm font-medium">
              <span>Shoot Name</span>
              <span>Status</span>
            </div>

            <div className="flex flex-col gap-2">
              {shoots.map((shoot) => {
                const isExpanded = expandedId === shoot.id;

                return (
                  <div key={shoot.id} className="bg-[#171717] rounded-xl border border-white/5 overflow-hidden">
                    {/* Header Row */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer active:bg-white/5"
                      onClick={() => toggleRow(shoot.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'border-white/10 text-white/60'}`}>
                          <ChevronDown size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{shoot.name}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-tight flex items-center gap-1">
                            {shoot.id}
                          </span>
                        </div>
                      </div>

                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(shoot.status)}`}>
                        {shoot.status}
                      </span>
                    </div>

                    {/* Collapsible Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="border-t border-white/5 bg-black/20"
                        >
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                                  <Briefcase size={12} /> Files
                                </p>
                                <p className="text-white text-sm font-medium">{shoot.files} Items</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center justify-end gap-1">
                                  Price
                                </p>
                                <p className="text-[#E8D1AB] text-sm font-bold">{shoot.price}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#333] bg-[#202020]">
                  <th className="text-left py-5 px-6 text-[#E5D5B8] font-medium text-sm w-[15%]">Shoot ID</th>
                  <th className="text-left py-5 px-6 text-[#E5D5B8] font-medium text-sm w-[35%]">Shoot Name</th>
                  <th className="text-left py-5 px-6 text-[#E5D5B8] font-medium text-sm w-[10%]">Files</th>
                  <th className="text-left py-5 px-6 text-[#E5D5B8] font-medium text-sm w-[20%]">Price</th>
                  <th className="text-left py-5 px-6 text-[#E5D5B8] font-medium text-sm w-[20%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {shoots.map((shoot) => (
                  <tr key={shoot.id} className="hover:bg-[#161616] transition-colors font-[family-name:var(--font-instrument-sans)]">
                    <td className="py-6 px-6 text-[#E0E0E0] text-[15px]">{shoot.id}</td>
                    <td className="py-6 px-6 text-[#E0E0E0] text-[15px]">{shoot.name}</td>
                    <td className="py-6 px-6 text-[#E0E0E0] text-[15px]">{shoot.files}</td>
                    <td className="py-6 px-6 text-[#E5D5B8] text-[15px]">{shoot.price}</td>
                    <td className="py-6 px-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusStyle(shoot.status)}`}>
                        {shoot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Certificates */}
      {activeTab === 'Certificates' && (
        <div className="bg-[#101010] border border-[#333] rounded-2xl">
          <h2 className={SECTION_TITLE_STYLE}>CP Certificates</h2>

          {/* divider */}
          <div
            className="h-[1px] w-full my-4 lg:my-9"
            style={{
              backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
              backgroundSize: '30px 1px',
              backgroundRepeat: 'repeat-x'
            }}
          />

          <div className="px-5 pb-5 lg:px-8 lg:pb-8 flex flex-wrap gap-5">
            {certificationFiles.length > 0 ? (
              certificationFiles.map((file: any, index: number) => (
                <div key={index} className="bg-[#0D0D0D] border border-[#222] rounded-2xl p-4 w-full lg:w-[340px] hover:border-[#444] transition-all group cursor-default">
                  <div className="flex items-center gap-3 mb-2 lg:mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#FF453A] rounded-md shrink-0">
                      <span className="text-white text-[8px] font-bold">Pdf</span>
                    </div>
                    <span className="text-[#E0E0E0] font-medium text-sm truncate">{file.title || `Certificate ${index + 1}`}</span>
                  </div>

                  <div className="w-full h-[220px] bg-[#161616] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                    <div className="w-16 h-20 bg-[#FF453A] rounded-lg flex items-center justify-center relative transform group-hover:scale-105 transition-transform duration-300">
                      <span className="text-white font-bold text-xl">Pdf</span>
                      <div className="absolute top-0 right-0 w-6 h-6 bg-[#D93025] rounded-bl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 bg-[#161616] transform translate-x-3 -translate-y-3 rotate-45"></div>
                    </div>
                  </div>

                  <a
                    href={`${UPLOADS_URL}${file.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-[#E5D5B8] text-black rounded-xl text-sm font-semibold hover:bg-[#d4c3a3] transition-colors block text-center"
                  >
                    View Certificate
                  </a>
                </div>
              ))
            ) : (
              <div className="w-full py-10 lg:py-20 text-center text-[#666] border border-dashed border-[#333] rounded-xl">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>No certifications uploaded.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Resume */}
      {activeTab === 'Resume' && (
        <div className="bg-[#101010] border border-[#333] rounded-2xl lg:min-h-[500px]">
          <h2 className={SECTION_TITLE_STYLE}>CP Resume</h2>

          {/* divider */}
          <div
            className="h-[1px] w-full my-4 lg:my-9"
            style={{
              backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
              backgroundSize: '30px 1px',
              backgroundRepeat: 'repeat-x'
            }}
          />

          <div className="px-5 pb-5 lg:px-8 lg:pb-8 w-full lg:w-[340px]">
            {resumeFile ? (
              <div className="bg-[#0D0D0D] border border-[#222] rounded-2xl p-4 hover:border-[#444] transition-all group cursor-default">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#2563EB] rounded-md shrink-0">
                    <FileText size={16} className="text-white" />
                  </div>
                  <span className="text-[#E0E0E0] font-medium text-sm truncate">{resumeFile.title || 'Creative Professional Resume'}</span>
                </div>

                <div className="w-full h-[220px] bg-[#161616] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
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
                  className="w-full py-3 bg-[#E5D5B8] text-black rounded-xl text-sm font-semibold hover:bg-[#d4c3a3] transition-colors block text-center"
                >
                  View Resume
                </a>
              </div>
            ) : (
              <div className="lg:w-[850px] py-10 lg:py-20 text-center text-[#666] border border-dashed border-[#333] rounded-xl">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>No resume uploaded.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Portfolio Links */}
      {activeTab === 'Portfolio Links' && (
        <div className="bg-[#101010] border border-[#333] rounded-2xl lg:min-h-[500px]">
          <h2 className={SECTION_TITLE_STYLE}>Portfolio Links</h2>

          {/* divider */}
          <div
            className="h-[1px] w-full my-4 lg:my-9"
            style={{
              backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
              backgroundSize: '30px 1px',
              backgroundRepeat: 'repeat-x'
            }}
          />

          <div className="px-5 pb-5 lg:px-8 lg:pb-8">
            {(() => {
              const portfolioLinks = partner.crew_member_files?.filter(
                (f: any) => f.file_type === "link"
              ) || [];

              if (portfolioLinks.length === 0) {
                return (
                  <div className="py-20 text-center text-[#666] border border-dashed border-[#333] rounded-xl w-full">
                    <Globe size={48} className="mx-auto mb-4 opacity-20" />
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
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 group hover:border-white/20 transition-all shadow-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            {platform?.icon ? (
                              <platform.icon size={24} className="text-[#E8D1AB]" />
                            ) : (
                              <Globe size={24} className="text-[#E8D1AB]" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white uppercase tracking-wider">
                            {platform?.label || "Portfolio Link"}
                          </p>
                          <p className="text-xs text-white/40 truncate">
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
      {/* VIDEO PLAYER MODAL */}
      {playingVideo && (
        <div className="fixed inset-0 z-[120] bg-black/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-500">
          
          {/* Top Bar - Sticky so the close button is always visible even when scrolling */}
          <div className="sticky top-0 z-50 flex items-center justify-between p-4 lg:p-10 bg-gradient-to-b from-black/95 via-black/80 to-transparent pointer-events-none">
            <div className="space-y-1 pointer-events-auto">
              <h3 className="text-white text-xs lg:text-sm font-black uppercase tracking-[0.3em]">
                Portfolio Player
              </h3>
              <div className="flex items-center gap-2">
                {/* Accent color matched to this specific page's theme */}
                <span className="w-1.5 h-1.5 bg-[#E5D5B8] rounded-full animate-pulse" />
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                  Now Playing
                </p>
              </div>
            </div>
            <button
              onClick={() => setPlayingVideo(null)}
              className="p-3 lg:p-4 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/20 transition-all active:scale-90 shadow-lg pointer-events-auto"
            >
              <X size={20} className="lg:w-6 lg:h-6" />
            </button>
          </div>

          {/* Video Container - Beautifully centers and allows scroll */}
          <div className="w-full max-w-6xl mx-auto px-4 pb-24 pt-2 lg:pt-10">
            <div className="w-full aspect-video bg-black rounded-xl lg:rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 relative">
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
    </div >
  );
};
