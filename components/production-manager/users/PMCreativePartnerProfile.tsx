"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check, X, MapPin, Globe, User, Linkedin, Copy, Calendar as CalendarIcon, ChevronDown, Phone, Grid3X3, FolderOpen, Briefcase, Play, Search, LayoutGrid, List, Folder, MoreVertical, ArrowLeft, FileText, Clock, Video, Info, CheckCircle, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { adminApi, getStatusCount, getAvailabilityDetails } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/StatCard";
import { AnimatePresence, motion } from "framer-motion";
import { PORTFOLIO_ICONS } from "@/app/data/staticData";
import DottedDivider from "@/components/admin/DottedDivider";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import { getInitials } from "@/lib/utils";
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";
import { formatCreatorRoles } from "@/lib/creatorRoles";

interface ProfileProps {
  id: string;
  hideActions?: boolean;
  isDark?: boolean;
}

const SECTION_TITLE_STYLE = "lg:text-lg font-medium text-white px-5 pt-5 lg:px-8 lg:pt-8";
const LABEL_STYLE = "text-[#CFCCCC] text-sm font-medium mb-1 block";
const VALUE_STYLE = "text-[#999696] text-sm block";

export const PMCreativePartnerProfile = ({ id, hideActions = false, isDark = true }: ProfileProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [activeImages, setActiveImages] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [partner, setPartner] = useState<any>(null);
  const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [allShoots, setAllShoots] = useState<any[]>([]);
  const [availabilityDetails, setAvailabilityDetails] = useState<any>({});
  const [summaryData, setSummaryData] = useState({
    availableDays: 0,
    bookedShoots: 0,
    timeOff: 0,
  });

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

        if (skillsResponse && skillsResponse.data) {
          const sMap: Record<string, string> = {};
          skillsResponse.data.forEach((skill: any) => {
            sMap[skill.id?.toString()] = skill.name;
          });
          setSkillsMap(sMap);
        }

        if (partnerResponse && partnerResponse.data) {
          setPartner(partnerResponse.data);
        }

        if (statsResponse && statsResponse.data) {
          setStats(statsResponse.data);
        }

        if (dashboardDetailResponse && dashboardDetailResponse.data) {
          const data = dashboardDetailResponse.data;
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
          setAvailabilityDetails(response.data.availability || {});
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
        if (status.projectAssigned) bookedShoots += 1;
        else if (status.available) availableDays += 1;
        else if (status.available === false) timeOff += 1;
      });
      setSummaryData({ availableDays, bookedShoots, timeOff });
    };

    if (availabilityDetails) calculateSummary();
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

  const fullName = `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || "Unknown Partner";

  // Base URL for uploads
  const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";
  const profilePhoto = partner.crew_member_files?.find((file: any) => file.file_type === 'profile_photo');
  const imageUrl = profilePhoto ? `${S3_BASE_URL}${profilePhoto.file_path}` : null;

  const getStatus = () => {
    if (partner.is_crew_verified === 0) return "Pending";
    if (partner.is_crew_verified === 1) return "Approved";
    if (partner.is_crew_verified === 2) return "Rejected";
    return "Pending";
  };
  const status = getStatus();

  const primaryRole = partner.primary_role
    ? formatCreatorRoles(partner.primary_role, "No role specified")
    : partner.role?.role_name || "No role specified";

  let skillNames: string[] = [];
  if (partner.skills) {
    try {
      const skillsArray = typeof partner.skills === 'string' ? JSON.parse(partner.skills) : partner.skills;
      if (Array.isArray(skillsArray)) {
        if (typeof skillsArray[0] === 'object') skillNames = skillsArray.map((s: any) => s.name || skillsMap[s.id?.toString()]).filter(Boolean);
        else skillNames = skillsArray.map(sId => skillsMap[sId.toString()] || sId).filter(Boolean);
      }
    } catch (e) {
      if (Array.isArray(partner.skills)) skillNames = partner.skills.map((s: any) => s.name || s.skill_name || s).filter(Boolean);
    }
  }

  let availabilityDays: string[] = [];
  if (partner.availability) {
    try { availabilityDays = typeof partner.availability === 'string' ? JSON.parse(partner.availability) : partner.availability; }
    catch (e) { }
  }

  const shoots = (Array.isArray(allShoots) ? allShoots : []).map(s => {
    const project = s.project || {};
    const timelineStage = resolveTimelineStage(
      project.status !== undefined ? project : { ...project, status: s.status }
    );
    return {
      id: `#${project.stream_project_booking_id || project.id || s.project_id || s.id}`,
      name: project.project_name || s.title || 'Project',
      files: s.files_count || 0,
      price: `$${project.budget || s.total_amount || '0.00'}`,
      status: timelineStageToHeaderLabel(timelineStage)
    };
  });

  if (shoots.length === 0) {
    shoots.push(
      { id: '#SHO01', name: 'Wedding Highlight Film', files: 24, price: '$1,200.00', status: 'Initiated' },
      { id: '#SHO02', name: 'Product Promo Video', files: 12, price: '$850.00', status: 'Pre Production' }
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Initiated': return 'bg-[#FFF8E1] text-[#D97706] border-none';
      case 'Pre Production': return 'bg-[#FCE7F3] text-[#DB2777] border-none';
      case 'Post Production': return 'bg-[#E5E5E5] text-[#525252] border-none';
      case 'Completed': return 'bg-[#DCFCE7] text-[#16A34A] border-none';
      case 'Revision': return 'bg-[#DBEAFE] text-[#2563EB] border-none';
      case 'Upcoming': return 'bg-[#E0F2FE] text-[#0369A1] border-none';
      case 'Pending': return 'bg-[#FEF3C7] text-[#92400E] border-none';
      default: return 'bg-[#333] text-white';
    }
  };

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const isShootDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilityDetails[dateStr]?.projectAssigned === true;
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const featuredWorkGroups: Record<string, { title: string, tag: string, images: string[] }> = {};
  if (partner.crew_member_files) {
    partner.crew_member_files.forEach((file: any) => {
      if (file.file_type === 'recent_work') {
        const groupKey = `${file.title || 'Untitled'}-${file.tag || 'No Tag'}`;
        if (!featuredWorkGroups[groupKey]) featuredWorkGroups[groupKey] = { title: file.title || 'Untitled', tag: file.tag || 'No Tag', images: [] };
        featuredWorkGroups[groupKey].images.push(`${S3_BASE_URL}${file.file_path}`);
      }
    });
  }

  const certificationFiles = partner.crew_member_files?.filter((file: any) => file.file_type === 'certifications') || [];
  const resumeFile = partner.crew_member_files?.find((file: any) => file.file_type === 'resume');

  const SECTION_TITLE_STYLE = `lg:text-lg font-medium px-5 pt-5 lg:px-8 lg:pt-8 ${isDark ? "text-white" : "text-black"}`;
  const LABEL_STYLE = `text-sm font-medium mb-1 block ${isDark ? "text-[#CFCCCC]" : "text-[#313131]"}`;
  const VALUE_STYLE = `text-sm block ${isDark ? "text-[#999696]" : "text-[#595959]"}`;

  return (
    <div className="space-y-3 lg:space-y-6">
      {/* Top Navigation */}
      {!hideActions && (
        <div className="flex items-center gap-2 text-sm text-[#666] mb-6">
          <button onClick={() => router.back()} className={`transition-colors flex items-center gap-2 ${isDark ? "text-[#E0E0E0] hover:text-white" : "text-black hover:text-black/70"}`}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className={`rounded-2xl border transition-colors duration-200 ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#FFFCF6] border-[#E5E5E5] shadow-sm"
        }`}>
        <div className="flex items-start justify-between px-4 pt-4 lg:p-6">
          <div className="flex gap-6">
            {/* Avatar */}
            <div className={`w-[67px] h-[67px] lg:w-32 lg:h-32 rounded-lg lg:rounded-xl overflow-hidden relative flex-shrink-0 border ${isDark ? "bg-[#222] border-white/5" : "bg-gray-100 border-gray-200"}`}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${isDark ? "text-[#444] bg-[#222]" : "text-gray-400 bg-gray-100"}`}>
                  {/* {fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)} */}
                  {getInitials(fullName)}
                </div>
              )}
            </div>

            <div className="lg:pt-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className={`lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>{fullName}</h1>
                {status === "Approved" && (
                  <div className="text-green-500">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${isDark ? "bg-green-500/10 border-green-500/20" : "bg-emerald-100 border-emerald-200"
                      }`}>
                      <Check size={12} strokeWidth={3} className={isDark ? "text-green-500" : "text-emerald-600"} />
                    </div>
                  </div>
                )}
              </div>
              <p className={`text-xs lg:text-sm mb-1 lg:mb-2 ${isDark ? "text-[#888]" : "text-gray-500"}`}>{primaryRole}</p>
              <div className={`flex items-center gap-1 text-xs text-sm mb-2 lg:mb-5 ${isDark ? "text-[#C2C2C2]" : "text-gray-600"}`}>
                <MapPin size={14} className="shrink-0" />
                <span>{partner.location || [partner.city, partner.state].filter(Boolean).join(", ") || "N/A"}</span>
              </div>

              <div className="flex items-center gap-3">
                {partner.linkedin_url && (
                  <a href={partner.linkedin_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all active:scale-95 ${isDark
                    ? "bg-[#1A1A1A] border-[#333] text-white hover:bg-[#222]"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                    }`}>
                    <Linkedin size={16} />
                    <span>LinkedIn</span>
                  </a>
                )}
                {partner.behance_url && (
                  <a href={partner.behance_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all active:scale-95 ${isDark
                    ? "bg-[#1A1A1A] border-[#333] text-white hover:bg-[#222]"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                    }`}>
                    <span className="font-bold text-lg leading-none">Bē</span>
                    <span>Behance</span>
                  </a>
                )}
                {partner.portfolio_url && (
                  <a href={partner.portfolio_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all active:scale-95 ${isDark
                    ? "bg-[#1A1A1A] border-[#333] text-white hover:bg-[#222]"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                    }`}>
                    <Globe size={16} />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
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
                ? (isDark ? 'text-[#E5D5B8]' : 'text-black')
                : (isDark ? 'text-[#666666] hover:text-white' : 'text-[#635F5F] hover:text-black')
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className={`absolute bottom-0 left-0 w-full h-[2px] ${isDark ? "bg-[#E5D5B8]" : "bg-black"}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'Overview' && (
        <>
          {/* Personal Information */}
          <div className={`transition-colors duration-200 border rounded-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#FFF] border-[#F4F5F7] shadow-sm"}`}>
            <h2 className={`${SECTION_TITLE_STYLE}`}>Personal Information</h2>

            {/* divider */}
            <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
            {/* <DottedDivider /> */}

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
                <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#595959]"}`}>
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
          <div className={`transition-colors duration-200 border rounded-2xl mt-6 ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#FFF] border-[#F4F5F7] shadow-sm"}`}>
            <h2 className={SECTION_TITLE_STYLE}>Professional Details</h2>
            {/* divider */}
            <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
            {/* <DottedDivider /> */}

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
          <div className={`transition-colors duration-200 border rounded-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#FFF] border-[#F4F5F7] shadow-sm"}`}>
            <h2 className={SECTION_TITLE_STYLE}>
              Skills <span className={isDark ? "text-[#E5D5B8]" : "text-[#000000]"}>({skillNames.length})</span>
            </h2>
            {/* divider */}
            <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
            {/* <DottedDivider /> */}

            <div className="px-5 pb-5 lg:px-8 lg:pb-8 flex flex-wrap gap-2 lg:gap-3">
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
        </>
      )}

      {/* TAB CONTENT: Featured Work */}
      {activeTab === 'Featured Work' && (
        <div className={`transition-colors duration-200 border rounded-2xl min-h-[500px] ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#FFF] border-[#F4F5F7] shadow-sm"}`}>
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

              <div className={`w-full rounded-2xl overflow-hidden border py-10 transition-colors ${isDark ? "bg-[#171717] text-white border-[#3D3D3D]" : "bg-[#F4F5F7] text-black border-[#F4F5F7]"
                }`}>
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
                  <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#666]" : "text-[#000]"}`}>
                    <X size={48} className="mb-4 opacity-20" />
                    <p>No images found in this folder.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <h2 className={SECTION_TITLE_STYLE}>Featured Work</h2>

              {/* <DottedDivider /> */}
              <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2 px-5 pb-5 lg:px-8 lg:pb-8">
                <div className="relative w-full lg:w-[500px]">
                  <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 ${isDark ? "text-white/40" : "text-gray-400"
                    }`} />
                  <input
                    type="text"
                    placeholder="Search"
                    className={`w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                      ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                      : "bg-gray-50 border-[#E3E3E3] text-black placeholder:text-gray-400 focus:ring-[#E3E3E3]"
                      }`}
                  />
                </div>

                <>
                  {/* MOBILE VIEW: Dropdown Button */}
                  <div className="md:hidden relative">
                    <Button
                      onClick={toggleDropdown}
                      className={`flex items-center gap-2 p-2 h-8 rounded-lg border transition-all ${isDark ? "bg-[#202020] border-white/10 text-white" : "bg-white border-gray-200 text-black shadow-sm"
                        }`}
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
                        ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                        : (isDark ? "bg-transparent text-white/40 hover:text-white" : "bg-transparent text-gray-400 hover:text-black")
                        }`}
                    >
                      <Grid3X3 size={20} />
                    </Button>
                    <Button
                      onClick={() => setViewMode('list')}
                      className={`px-5 py-2.5 rounded-r-lg transition-colors ${viewMode === 'list'
                        ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                        : (isDark ? "bg-transparent text-white/40 hover:text-white" : "bg-transparent text-gray-400 hover:text-black")
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
                      className={`rounded-xl transition-all group cursor-pointer border ${isDark ? "bg-[#1A1A1A] border-[#333] hover:border-[#444]" : "bg-[#F4F5F7] border-gray-200 hover:border-gray-400 shadow-sm"}`}
                    >
                      <div className="flex items-start justify-between p-5">
                        <div className="flex items-center gap-3">
                          <div>
                            <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
                          </div>
                          <span className={`font-semibold text-sm leading-tight ${isDark ? "text-white" : "text-black"}`}>{group.title}</span>
                        </div>
                        <button className={`${isDark ? "text-[#666] hover:text-white" : "text-gray-400 hover:text-black"}`}>
                          <MoreVertical size={18} />
                        </button>
                      </div>

                      {/* Divider */}
                      <hr className={`border-[1px] my-1 ${isDark ? "border-white/5" : "border-[#000000]/50 "}`} />

                      <div className="flex gap-2 p-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isDark ? "bg-[#101010] text-[#999] border-[#333]" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {group.tag}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isDark ? "bg-[#101010] text-[#E5D5B8] border-[#E5D5B8]/20" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {group.images.length} Image{group.images.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`col-span-2 py-20 text-center border-dashed rounded-xl ${isDark ? "text-[#666] border-[#333]" : "text-gray-400 border-gray-200"
                    }`}>
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
              iconColor={isDark ? "text-green-500" : "text-green-800"}
              hoverBorder={isDark ? "hover:border-green-500/30" : "hover:border-green-700/30"}
              isDark={isDark}
            />
            <StatCard
              label="Booked Shoots"
              value={summaryData.bookedShoots}
              icon={Video}
              iconColor={isDark ? "text-[#E5D5B8]" : "text-[#4f473a]"}
              hoverBorder={isDark ? "hover:border-[#E5D5B8]/30" : "hover:border-[#4f473a]/30"}
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
              <div className={`transition-colors duration-200 border rounded-2xl overflow-hidden shadow-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200"
                }`}>
                {/* Calendar Controls */}
                <div className={`p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "border-white/5" : "border-gray-100"
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center rounded-lg gap-2 lg:gap-4 p-1`}>
                      <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-black border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"
                          }`}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className={`lg:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                        {format(currentMonth, 'MMMM yyyy')}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-black border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"
                          }`}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className={`px-4 py-2 border rounded-lg text-sm transition-all ${isDark ? "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-[#E5D5B8]/40" : "bg-[#F0F0F0] border-[#E3E3E3] text-gray-600 hover:text-black shadow-sm"}`}
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
                    const hasShoot = isShootDay(day);
                    const isTodayDate = isSameDay(day, new Date(2026, 0, 16)); // Mocking "Today" as Jan 16 for demo visual match

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
                        <span className={`text-sm font-medium block mb-2 w-7 h-7 flex items-center justify-center ${isTodayDate ? 'bg-[#E5D5B8] text-black rounded-full' : ''
                          }`}>
                          {format(day, 'd')}
                        </span>

                        {hasShoot && (
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border w-fit ${isDark ? "bg-[#1E293B] border-[#334155]" : "bg-blue-50 border-blue-100"
                              }`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                              <span className={`text-[10px] font-bold leading-none ${isDark ? "text-[#93C5FD]" : "text-blue-700"}`}>Shoot</span>
                            </div>
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
              <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"
                }`}>
                <h3 className={`font-medium mb-2 lg:mb-4 ${isDark ? "text-white" : "text-black"}`}>Color Legend</h3>
                <div className="space-y-2 space-y-4">
                  <div className="flex items-start gap-2 lg:gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${isDark ? "bg-[#444]" : "bg-[#ECE7E2]"}`}></div>
                    <div>
                      <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Disabled</div>
                      <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Time off or blocked</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#8B7355] mt-1.5"></div>
                    <div>
                      <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Today's</div>
                      <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Time off or blocked</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#3B82F6] mt-1.5"></div>
                    <div>
                      <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Shoots</div>
                      <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Confirmed shoots</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444] mt-1.5"></div>
                    <div>
                      <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Conflicts</div>
                      <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Scheduling conflicts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* This Month Stats */}
              <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"
                }`}>
                <h3 className={`font-medium mb-4 ${isDark ? "text-white" : "text-black"}`}>This Month</h3>
                <div className="space-y-2 lg:space-y-4">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                    <span className="text-[#999] text-sm">Working Days</span>
                    <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#303030]"} text-right`}>{availabilityDays.length > 0 ? availabilityDays.join(", ") : "Not set"}</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                    <span className="text-[#999] text-sm">Booked Shoots</span>
                    <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#303030]"}`}>{stats?.total_projects || stats?.accepted_projects || '0'}</span>
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
                <button className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80 shadow-md"
                  }`}>
                  <Copy size={18} />
                  <span>Copy Link</span>
                </button>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Shoots */}
      {activeTab === 'Shoots' && (
        <div className={`transition-colors duration-200 border rounded-2xl overflow-hidden ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"
          }`}>
          {/* MOBILE ONLY VIEW */}
          <div className={`lg:hidden p-3 transition-colors ${isDark ? "bg-[#111111]" : "bg-white"}`}>
            <div className={`flex justify-between px-5 py-3 text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"
              }`}>
              <span>Shoot Name</span>
              <span>Status</span>
            </div>

            <div className="flex flex-col gap-2">
              {shoots.map((shoot) => {
                const isExpanded = expandedId === shoot.id;

                return (
                  <div
                    key={shoot.id}
                    className={`rounded-xl border transition-all ${isDark
                      ? "bg-[#171717] border-white/5"
                      : "bg-[#F4F5F7] border-[#F4F5F7]"
                      }`}
                  >
                    {/* Header Row */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer active:bg-white/5"
                      onClick={() => toggleRow(shoot.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-transform duration-300 ${isExpanded
                          ? (isDark ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'bg-white rotate-180 border-[#777674] text-[#777674]')
                          : (isDark ? 'border-white/10 text-white/60' : 'bg-white border-[#D9D9D9] text-[#777674]')
                          }`}>
                          <ChevronDown size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm ${isDark ? "font-semibold text-white" : "font-medium text-[#6D6D6D]"}`}>{shoot.name}</span>
                          <span className={`text-[10px] uppercase tracking-tight flex items-center gap-1 ${isDark ? "text-white/40" : "text-gray-400"
                            }`}>
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
                          className={`border-t ${isDark ? "border-white/5 bg-black/20" : "border-[#D9D9D9] bg-[#F4F5F7]"}`}
                        >
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1 ${isDark ? "text-white/40" : "text-gray-400"
                                  }`}>
                                  <Briefcase size={12} /> Files
                                </p>
                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black/80"}`}>{shoot.files} Items</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center justify-end gap-1 ${isDark ? "text-white/40" : "text-gray-400"
                                  }`}>
                                  Price
                                </p>
                                <p className={`text-sm font-bold ${isDark ? "text-[#E8D1AB]" : "text-[#6D6D6D]"}`}>{shoot.price}</p>
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
                <tr className={`transition-colors border-b ${isDark ? "bg-[#202020] border-[#333]" : "bg-[#FFFCF6] border-[#F4F5F7]"
                  }`}>
                  <th className={`text-left py-5 px-6 ${isDark ? "text-[#E5D5B8]" : "text-[#303030]"} font-medium text-sm w-[15%]`}>Shoot ID</th>
                  <th className={`text-left py-5 px-6 ${isDark ? "text-[#E5D5B8]" : "text-[#303030]"} font-medium text-sm  w-[35%]`}>Shoot Name</th>
                  <th className={`text-left py-5 px-6 ${isDark ? "text-[#E5D5B8]" : "text-[#303030]"} font-medium text-sm  w-[10%]`}>Files</th>
                  <th className={`text-left py-5 px-6 ${isDark ? "text-[#E5D5B8]" : "text-[#303030]"} font-medium text-sm w-[20%]`}>Price</th>
                  <th className={`text-left py-5 px-6 ${isDark ? "text-[#E5D5B8]" : "text-[#303030]"} font-medium text-sm w-[20%]`}>Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${isDark ? "divide-[#333]" : "divide-gray-100"}`}>
                {shoots.map((shoot) => (
                  <tr key={shoot.id} className={`${isDark ? "hover:bg-[#161616]" : "bg-[#F4F5F7] hover:bg-gray-50/50"} transition-colors font-[family-name:var(--font-instrument-sans)]`}>
                    <td className={`py-6 px-6 text-[15px] ${isDark ? "text-[#E0E0E0]" : "text-[#000]"}`}>{shoot.id}</td>
                    <td className={`py-6 px-6 text-[15px] ${isDark ? "text-[#E0E0E0]" : "text-[#000]"}`}>{shoot.name}</td>
                    <td className={`py-6 px-6 text-[15px] ${isDark ? "text-[#E0E0E0]" : "text-[#000]"}`}>{shoot.files}</td>
                    <td className={`py-6 px-6 text-[15px] ${isDark ? "text-[#E5D5B8]" : "text-[#0C0C0C]"}`}>{shoot.price}</td>
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
        <div className={`transition-colors duration-200 border rounded-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#fff] border-[#F4F5F7] shadow-sm"
          }`}>
          <h2 className={SECTION_TITLE_STYLE}>CP Certificates</h2>

          {/* divider */}
          {/* <DottedDivider /> */}
          <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />

          <div className="px-5 pb-5 lg:px-8 lg:pb-8 flex flex-wrap gap-5">
            {certificationFiles.length > 0 ? (
              certificationFiles.map((file: any, index: number) => (
                <div
                  key={index}
                  className={`transition-all group cursor-default border rounded-2xl p-4 w-full lg:w-[340px] ${isDark
                    ? "bg-[#0D0D0D] border-[#222] hover:border-[#444]"
                    : "bg-white border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md"
                    }`}
                >
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
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all block text-center bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]`}
                  >
                    View Certificate
                  </a>
                </div>
              ))
            ) : (
              <div className={`w-full py-10 lg:py-20 text-center border border-dashed rounded-xl ${isDark ? "text-[#666] border-[#333]" : "text-gray-400 border-gray-200 bg-gray-50/50"
                }`}>
                <FileText size={48} className={`mx-auto mb-4 transition-opacity ${isDark ? "opacity-20" : "opacity-40"}`} />
                <p>No certifications uploaded.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Resume */}
      {activeTab === 'Resume' && (
        <div className={`transition-colors duration-200 border rounded-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#fff] border-[#F4F5F7] shadow-sm"
          }`}>
          <h2 className={SECTION_TITLE_STYLE}>CP Resume</h2>

          {/* divider */}
          {/* <DottedDivider /> */}
          <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />

          <div className="px-5 pb-5 lg:px-8 lg:pb-8 flex flex-wrap gap-5">
            {resumeFile ? (
              <div className={`transition-all group cursor-default border rounded-2xl p-4 ${isDark
                ? "bg-[#0D0D0D] border-[#222] hover:border-[#444]"
                : "bg-white border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md"
                }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#2563EB] rounded-md shrink-0">
                    <FileText size={16} className="text-white" />
                  </div>
                  <span className={`font-medium text-sm truncate ${isDark ? "text-[#E0E0E0]" : "text-gray-900"}`}>{resumeFile.title || 'Creative Professional Resume'}</span>
                </div>

                <div className={`w-full h-[220px] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden transition-colors ${isDark ? "bg-[#161616]" : "bg-gray-50 border border-gray-100"
                  }`}>
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
              <div className={`w-full py-10 lg:py-20 text-center border border-dashed rounded-xl ${isDark ? "text-[#666] border-[#333]" : "text-gray-400 border-gray-200 bg-gray-50/50"
                }`}>
                <FileText size={48} className={`mx-auto mb-4 transition-opacity ${isDark ? "opacity-20" : "opacity-40"}`} />
                <p>No resume uploaded.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Portfolio Links */}
      {activeTab === 'Portfolio Links' && (
        <div className={`transition-colors duration-200 border lg:min-h-[500px] rounded-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-[#fff] border-[#F4F5F7] shadow-sm"
          }`}>
          <h2 className={SECTION_TITLE_STYLE}>Portfolio Links</h2>

          {/* divider */}
          {/* <DottedDivider /> */}
          <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />

          <div className="px-5 pb-5 lg:px-8 lg:pb-8">
            {(() => {
              const portfolioLinks = partner.crew_member_files?.filter(
                (f: any) => f.file_type === "link"
              ) || [];

              if (portfolioLinks.length === 0) {
                return (
                  <div className={`w-full py-10 lg:py-20 text-center border border-dashed rounded-xl ${isDark ? "text-[#666] border-[#333]" : "text-gray-400 border-gray-200 bg-gray-50/50"
                    }`}>
                    <Globe size={48} className={`mx-auto mb-4 transition-opacity ${isDark ? "opacity-20" : "opacity-40"}`} />
                    <p>No portfolio links added.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolioLinks.map((link: any, index: number) => {
                    const platform = PORTFOLIO_ICONS.find((p) => p.id === link.tag);

                    return (
                      <div
                        key={link.crew_files_id || index}
                        className={`transition-all duration-300 border rounded-2xl p-6 flex flex-col gap-4 group shadow-xl ${isDark
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
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-[#E5D5B8]" : "bg-black"
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
  );
};
