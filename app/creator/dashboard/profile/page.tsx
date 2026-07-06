"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  Star,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Edit,
  Edit3,
  Camera,
  Play,
  FileText,
  Plus,
  Trash2,
  X,
  PlusCircle,
  Video,
  ExternalLink,
  Navigation,
  Globe,
  Settings,
  Pencil,
  Image as ImageIcon,
  Linkedin,
  Eye,
  CheckCircle,
  Phone,
  Loader2,
  EyeOff,
  Pause, Volume2, VolumeX
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useChangePasswordMutation } from "@/lib/redux/features/auth/authApi";
import SecurityForm from "@/src/components/cpSignup/SecurityForm";
import { usePathname } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

import FeaturedWorkModal from "@/src/components/cpSignup/FeaturedWorkModal";
import SocialLinksModal from "@/src/components/cpSignup/SocialLinksModal";
import PersonalInfoForm from "@/src/components/cpSignup/PersonalInfoForm";
import ProfessionalInfoForm from "@/src/components/cpSignup/ProfessionalInfoForm";
import SkillsForm from "@/src/components/cpSignup/SkillsForm";
import { toast } from "sonner";
import { GetMyProfile, EditMyProfile, UploadProfileFile, UploadProfilePhoto, DeleteProfileFile, AddPortfolioLinks, EditPortfolioLink } from "@/lib/api";
import { SOCIAL_ICONS, PORTFOLIO_ICONS } from "@/app/data/staticData";
import DeleteConfirmationModal from "@/src/components/cpSignup/DeleteConfirmationModal";
import PortfolioLinksModal from "@/src/components/cpSignup/PortfolioLinksModal";
import Topbar from "@/components/admin/Topbar";

// --- CONSTANTS ---
const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

// --- REUSABLE SUB-COMPONENTS ---
const StatBox = ({ value, sublabel, isDark }: { value: string, sublabel: string, isDark?: boolean }) => (
  <div className={`w-full flex flex-col items-center justify-center last:border-r-0 px-4 py-2 ${isDark ? "border-r border-white/5" : "border-r border-[#F5EBDA]"}`}>
    <p className={`lg:text-lg font-bold ${isDark ? "text-white" : "text-[#14171F]"}`}>
      {value}
    </p>
    <p className={`text-xs lg:text-sm ${isDark ? "text-white/40" : "text-[#677084]"}`}>
      {sublabel}
    </p>
  </div>
);

const SocialButton = ({ icon: Icon, label, onClick, isDark }: { icon: any, label: string, onClick?: () => void, isDark?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 border rounded-lg lg:rounded-xl transition-colors ${isDark
      ? "bg-white/5 border-white/10 hover:bg-white/10"
      : "bg-[#FDFAF7] border-[#F1E1C9] hover:bg-[#F1E1C9]/10"
      }`}
  >
    <Icon size={16} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} />
    <span className={`text-xs font-medium ${isDark ? "text-white/80" : "text-[#8C8C8C]"}`}>
      {label}
    </span>
  </button>
);

const InfoField = ({ label, value, placeholder, isDark }: { label: string, value?: any, placeholder?: string, isDark?: boolean }) => (
  <div className="space-y-1">
    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? "text-white/40" : "text-black/40"
      }`}>
      {label}
    </p>
    <p className={`text-sm ${value
      ? (isDark ? 'text-white/80 font-medium' : 'text-black/80 font-medium')
      : (isDark ? 'text-white/20 italic' : 'text-black/20 italic')
      }`}>
      {value || placeholder}
    </p>
  </div>
);

const getEmbedUrl = (url: string) => {
  if (!url) return null;

  let fullUrl = url;
  if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
    fullUrl = `https://${fullUrl}`;
  }

  // YouTube
  const ytMatch = fullUrl.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w-]{11})/);
  if (ytMatch) {
    // Standard embed with controls enabled
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&controls=1&rel=0`;
  }

  // Vimeo
  const vimeoMatch = fullUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&controls=1`;
  }

  // Google Drive
  const driveMatch = fullUrl.match(/\/d\/(.*?)\//);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  return fullUrl;
};

const normalizeFeaturedWorkTag = (value: unknown) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "[]") return "";
  return trimmed;
};

const getRoleLabel = (roleData: any) => {
  if (!roleData) return "Not Specified";
  try {
    const roles = typeof roleData === 'string' ? JSON.parse(roleData) : roleData;
    const id = Array.isArray(roles) ? roles[0] : roles;
    const roleOptions: Record<string, string> = {
      "1": "Videographer", "2": "Photographers", "3": "Editor",
    };
    return roleOptions[id] || "Professional";
  } catch (e) {
    return "Professional";
  }
};

const SectionHeader = ({ title, onEdit, isEditing, isDark }: { title: string, onEdit?: () => void, isEditing?: boolean, isDark?: boolean }) => (
  <div className="flex items-center justify-between mb-4 lg:mb-8">
    <h2 className={`text-lg lg:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
      {title}
    </h2>
    <button
      onClick={onEdit}
      className={`p-2 rounded-full transition-all duration-200 ${isEditing
        ? "bg-[#E8D1AB] text-black"
        : isDark
          ? "hover:bg-white/5 text-white/40 hover:text-white"
          : "hover:bg-black/5 text-black/40 hover:text-black"
        }`}
    >
      {isEditing ? <X size={18} /> : <Edit3 size={18} />}
    </button>
  </div>
);

const TabEmptyState = ({ title, description, buttonText, footerText, onClick, isDark }: any) => (
  <div className={`border rounded-lg lg:rounded-2xl h-[500px] flex items-center justify-center relative overflow-hidden ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-neutral-50 border-black/5"
    }`}>
    {/* Background Grid Lines */}
    <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-full border-r last:border-r-0 ${isDark ? "border-white/[0.03] bg-white/[0.01]" : "border-black/[0.02] bg-black/[0.005]"
            }`}
        />
      ))}
    </div>

    <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-6">
      <h2 className={`text-2xl font-bold mb-3 tracking-tight ${isDark ? "text-white" : "text-black"}`}>{title}</h2>
      <p className={`text-sm mb-10 leading-relaxed max-w-md ${isDark ? "text-white/40" : "text-black/40"}`}>{description}</p>

      <button
        onClick={onClick}
        className={`font-bold px-10 py-3.5 rounded-lg lg:rounded-2xl transition-all active:scale-95 shadow-xl ${isDark
          ? "bg-[#1A1A1A] text-white border border-white/10 hover:bg-white hover:text-black"
          : "bg-white text-black border border-black/10 hover:bg-black hover:text-white"
          }`}
      >
        {buttonText}
      </button>

      <p className={`text-xs mt-6 font-medium uppercase tracking-widest ${isDark ? "text-white/30" : "text-black/30"}`}>{footerText}</p>
    </div>
  </div>
);

const FileItem = ({ file, onRemove, isDark }: { file: File, onRemove: () => void, isDark?: boolean }) => (
  <div className={`flex items-center justify-between p-4 border rounded-2xl group transition-all ${isDark
    ? "bg-white/5 border-white/10 hover:bg-white/[0.08]"
    : "bg-black/5 border-black/5 hover:bg-black/[0.08]"
    }`}>
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#E8D1AB]/15 text-[#cbb38b]"
        }`}>
        <FileText size={20} />
      </div>
      <div className="overflow-hidden">
        <p className={`text-sm font-medium truncate max-w-[150px] md:max-w-[300px] ${isDark ? "text-white" : "text-black"}`}>{file.name}</p>
        <p className={`text-xs uppercase tracking-widest ${isDark ? "text-white/40" : "text-black/40"}`}>{(file.size / 1024).toFixed(0)} KB</p>
      </div>
    </div>

    <button
      onClick={onRemove}
      className={`p-2 transition-colors ${isDark ? "text-white/20 hover:text-red-500" : "text-black/20 hover:text-red-500"
        }`}
    >
      <Trash2 size={18} />
    </button>
  </div>
);

export default function ProfilePage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();
  const [activeTab, setActiveTab] = useState("Overview");

  // Modal & Edit States
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const [isSocialLinksModalOpen, setIsSocialLinksModalOpen] = useState(false);
  const [isPortfolioLinksModalOpen, setIsPortfolioLinksModalOpen] = useState(false);
  const [editingPortfolioLinks, setEditingPortfolioLinks] = useState<any[]>([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  // const [socialLinks, setSocialLinks] = useState([]);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [isEditingProfessionalInfo, setIsEditingProfessionalInfo] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  // State for Certificate Preview
  const [previewCert, setPreviewCert] = useState<any>(null);
  // Banner Upload State
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    idsToDelete: number[];
  }>({
    isOpen: false,
    title: "",
    description: "",
    idsToDelete: [],
  });

  // File Upload States
  const [certificates, setCertificates] = useState<File[]>([]);
  const [resume, setResume] = useState<File | null>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Profile State matching API structure
  const [profile, setProfile] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    location: "",
    working_distance: "",
    primary_role: "[]",
    years_of_experience: 0,
    hourly_rate: "0.00",
    bio: "",
    skills: [],
    crew_member_files: []
  });

  const tabs = ["Overview", "Featured Work", "Certificates", "Resume", "Portfolio Links"];

  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    const fetchProfile = async () => {
      if (!crewMemberId) return;
      try {
        const response = await GetMyProfile({ crew_member_id: parseInt(crewMemberId) });
        if (response.data && response.data.error === false) {
          setProfile(response.data.data);
        }
      } catch (err) {
        console.error("Fetching Error:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile.social_media_links) {
      try {
        // API returns a stringified JSON object: "{\"linkedin\":\"...\"}"
        const linksObj = typeof profile.social_media_links === 'string'
          ? JSON.parse(profile.social_media_links)
          : profile.social_media_links;

        const formattedLinks = Object.entries(linksObj || {}).map(([platform, url], index) => {
          const platformInfo = SOCIAL_ICONS.find(i => i.id === platform);
          return {
            id: index,
            platform: platform,
            url: url as string,
            name: platformInfo?.label || platform
          };
        });
        setSocialLinks(formattedLinks);
      } catch (e) {
        console.error("Error parsing social links", e);
      }
    }
  }, [profile.social_media_links]);
  const profilePhotoFile = profile.crew_member_files?.find((f: any) => f.file_type === "profile_photo");
  const profileImageUrl = profilePhotoFile
    ? `${S3_BASE_URL}${profilePhotoFile.file_path}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.first_name || 'default'}`;

  const portfolioBannerFile = profile.crew_member_files?.find(
    (f: any) => f.file_type === "portfolio"
  );

  const portfolioBannerUrl = portfolioBannerFile?.file_path
    ? `${S3_BASE_URL}${portfolioBannerFile.file_path}`
    : null;

  useEffect(() => {
    if (!portfolioBannerFile?.file_path) {
      setMediaPreview(null);
      setMediaType(null);
      return;
    }

    const fullUrl = `${S3_BASE_URL}${portfolioBannerFile.file_path}`;
    setMediaPreview(fullUrl);

    const lowerPath = portfolioBannerFile.file_path.toLowerCase();

    const isVideoFile =
      lowerPath.endsWith(".mp4") ||
      lowerPath.endsWith(".mov") ||
      lowerPath.endsWith(".webm") ||
      lowerPath.endsWith(".avi") ||
      lowerPath.endsWith(".mkv");

    setMediaType(isVideoFile ? "video" : "image");
  }, [portfolioBannerFile]);

  const featuredWorks = profile.crew_member_files?.filter(
    (file: any) => file.file_type === "recent_work"
  ) || [];

  const handleSavePersonalInfo = async () => {
    // 1. Get the ID from localStorage (similar to how you did in useEffect)
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      console.error("No Crew Member ID found");
      return;
    }

    // 2. Construct the payload with ONLY personal info fields
    const payload = {
      crew_member_id: parseInt(crewMemberId),
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone_number: profile.phone_number,
      // Ensure location is a string if the API expects it that way
      location: typeof profile.location === 'object' ? JSON.stringify(profile.location) : profile.location,
      latitude:
        profile.latitude ??
        profile.location?.coordinates?.lat ??
        profile.location?.lat ??
        profile.location?.center?.[1] ??
        null,
      longitude:
        profile.longitude ??
        profile.location?.coordinates?.lng ??
        profile.location?.lng ??
        profile.location?.center?.[0] ??
        null,
      working_distance: profile.working_distance
    };

    try {
      const response = await EditMyProfile(payload);

      if (response.data && response.data.error === false) {
        // Success! Close the editing mode
        setIsEditingPersonalInfo(false);
        // Optional: You could show a success toast here
      } else {
        console.error("API Error:", response.data.message);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  useEffect(() => {
    if (profile.social_media_links) {
      try {
        let linksObj = profile.social_media_links;

        if (typeof linksObj === 'string') {
          linksObj = JSON.parse(linksObj);
          if (typeof linksObj === 'string') {
            linksObj = JSON.parse(linksObj);
          }
        }

        if (linksObj && typeof linksObj === 'object') {
          const formattedLinks = Object.entries(linksObj)
            .filter(([_, url]) => url && String(url).trim() !== "")
            .map(([platform, url], index) => {
              const platformInfo = SOCIAL_ICONS.find(i => i.id === platform.toLowerCase());
              return {
                id: index,
                platform: platform,
                url: url as string,
                name: platformInfo?.label || platform
              };
            });
          setSocialLinks(formattedLinks);
        } else {
          setSocialLinks([]);
        }
      } catch (e) {
        console.error("Error parsing social links:", e);
        setSocialLinks([]);
      }
    } else {
      setSocialLinks([]);
    }
  }, [profile.social_media_links]);

  const formatExternalUrl = (url: string) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };


  const handleSaveProfessionalInfo = async () => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      console.error("No Crew Member ID found");
      return;
    }

    // Construct payload with ONLY professional fields
    // We send primary_role as a stringified array to match how your GET API returns it
    const payload = {
      crew_member_id: parseInt(crewMemberId),
      primary_role: JSON.stringify([profile.primary_role]),
      years_of_experience: parseInt(profile.years_of_experience),
      hourly_rate: profile.hourly_rate,
      bio: profile.bio
    };

    try {
      const response = await EditMyProfile(payload);

      if (response.data && response.data.error === false) {
        setIsEditingProfessionalInfo(false);
        // Optional: Trigger a refresh or show success message
      } else {
        console.error("API Error:", response.data.message);
      }
    } catch (err) {
      console.error("Failed to update professional profile:", err);
    }
  };

  const handleSaveSkills = async () => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    // Extract only the IDs for the API
    const skillIds = profile.skills.map((s: any) => (typeof s === 'object' ? s.id : s));

    const payload = {
      crew_member_id: parseInt(crewMemberId),
      skills: skillIds
    };

    try {
      const response = await EditMyProfile(payload);
      if (response.data && response.data.error === false) {
        setIsEditingSkills(false);
        // Optional: Refresh data here
      }
    } catch (err) {
      console.error("Failed to update skills:", err);
    }
  };

  const handleSaveSocialLinks = async (updatedLinksArray: any[]) => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    // Convert Array [{platform: 'linkedin', url: '...'}] back to Object {linkedin: '...'}
    const linksObject: Record<string, string> = {};
    updatedLinksArray.forEach(item => {
      linksObject[item.platform] = item.url;
    });

    const payload = {
      crew_member_id: parseInt(crewMemberId),
      social_media_links: JSON.stringify(linksObject)
    };

    try {
      const response: any = await EditMyProfile(payload);
      if (response.data && response.data.error === false) {
        setSocialLinks(updatedLinksArray);
        setIsSocialLinksModalOpen(false);
        // Optional: Update local profile state as well
        setProfile((prev: any) => ({ ...prev, social_media_links: JSON.stringify(linksObject) }));
      }
    } catch (err) {
      console.error("Failed to update social links:", err);
    }
  };

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    try {
      setIsPageLoading(true);
      // Calling API with "resume" file_type
      const response: any = await UploadProfileFile(
        "resume",
        [file], // Send as array
        crewMemberId
      );

      if (response.data && response.data.error === false) {
        // Refresh profile to show the new resume
        const updatedProfile = await GetMyProfile({ crew_member_id: parseInt(crewMemberId) });
        if (updatedProfile.data) {
          setProfile(updatedProfile.data.data);
        }
      }
    } catch (err) {
      console.error("Failed to upload resume:", err);
    } finally {
      setIsPageLoading(false); // 🔥 HIDE LOADER
    }
  };

  const getCrewId = () => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.crew_member_id;
  };

  // 1. Function to trigger the modal
  const confirmDelete = (type: 'file' | 'project', data: any) => {
    let ids: number[] = [];
    let title = "Delete File";
    let description = "Are you sure you want to remove this from your profile?";

    if (type === 'project') {
      // CHANGE: Use crew_files_id instead of id
      ids = data.images.map((img: any) => img.crew_files_id);
      title = `Delete "${data.title}"`;
      description = `This will delete all ${data.images.length} media items in this project. This action cannot be undone.`;
    } else {
      // CHANGE: Use crew_files_id instead of id
      ids = [data.crew_files_id];
      title = "Delete Item";
    }

    setDeleteModal({ isOpen: true, title, description, idsToDelete: ids });
  };
  const handleProfileUpdate = (updates: any) => {
    setProfile((prev: any) => ({ ...prev, ...updates }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      toast.error("User ID not found");
      return;
    }

    const localPreview = URL.createObjectURL(file);

    try {
      setIsPageLoading(true);

      setMediaType(file.type.startsWith("video") ? "video" : "image");
      setMediaPreview(localPreview);

      const response: any = await UploadProfileFile(
        "portfolio",
        [file],
        crewMemberId
      );

      if (response?.data && response.data.error === false) {
        toast.success("Portfolio banner updated successfully");

        const updatedProfile = await GetMyProfile({
          crew_member_id: parseInt(crewMemberId),
        });

        if (updatedProfile?.data && updatedProfile.data.error === false) {
          setProfile(updatedProfile.data.data);
        }
      } else {
        toast.error(response?.data?.message || "Upload failed");
        setMediaPreview(portfolioBannerUrl || null);
      }
    } catch (err) {
      console.error("Failed to upload portfolio banner:", err);
      toast.error("An error occurred during upload");
      setMediaPreview(portfolioBannerUrl || null);
    } finally {
      setIsPageLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddProject = async (data: any) => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    try {
      setIsPageLoading(true);

      const response = await UploadProfileFile(
        "recent_work",
        data.files,
        crewMemberId,
        {
          title: data.title,
          tag: data.tags.join(","),
        }
      );

      if (response.data && response.data.error === false) {
        const updatedProfile = await GetMyProfile({
          crew_member_id: parseInt(crewMemberId),
        });

        if (updatedProfile.data) {
          setProfile(updatedProfile.data.data);
        }

        setIsFeaturedModalOpen(false);
      } else {
        console.error("Upload error:", response.data.message);
      }
    } catch (err) {
      console.error("Failed to upload project:", err);
    } finally {
      setIsPageLoading(false);
    }
  };


  const handleUploadCertificates = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    try {
      setIsPageLoading(true);

      const filesArray = Array.from(selectedFiles);

      const response: any = await UploadProfileFile(
        "certifications",
        filesArray,
        crewMemberId
      );

      if (response?.data && response.data.error === false) {
        const updatedProfile = await GetMyProfile({
          crew_member_id: Number(crewMemberId),
        });

        if (updatedProfile?.data) {
          setProfile(updatedProfile.data.data);
        }
      }
    } catch (err) {
      console.error("Failed to upload certificates:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleUploadProfilePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      toast.error("User ID not found");
      return;
    }

    try {
      setIsPageLoading(true);
      const response: any = await UploadProfilePhoto(file, crewMemberId);

      if (response.data && response.data.error === false) {
        toast.success("Profile photo updated successfully");
        const updatedProfile = await GetMyProfile({ crew_member_id: parseInt(crewMemberId) });
        if (updatedProfile.data) {
          setProfile(updatedProfile.data.data);
        }
      } else {
        toast.error(response.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Failed to upload profile photo:", err);
      toast.error("An error occurred during upload");
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleRemovePortfolioBanner = async () => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId || !portfolioBannerFile?.crew_files_id) {
      setMediaPreview(null);
      setMediaType(null);
      return;
    }

    try {
      setIsPageLoading(true);

      await DeleteProfileFile(portfolioBannerFile.crew_files_id, {
        crew_member_id: parseInt(crewMemberId),
      });

      toast.success("Portfolio banner removed successfully");

      const updatedProfile = await GetMyProfile({
        crew_member_id: parseInt(crewMemberId),
      });

      if (updatedProfile?.data && updatedProfile.data.error === false) {
        setProfile(updatedProfile.data.data);
      }
    } catch (err) {
      console.error("Failed to remove portfolio banner:", err);
      toast.error("Failed to remove portfolio banner");
    } finally {
      setIsPageLoading(false);
    }
  };


  const handleExecuteDelete = async () => {
    const crewMemberId = getCrewId();
    if (!crewMemberId || deleteModal.idsToDelete.length === 0) return;

    try {
      setIsPageLoading(true);

      await Promise.all(
        deleteModal.idsToDelete.map((id) =>
          DeleteProfileFile(id, { crew_member_id: parseInt(crewMemberId) })
        )
      );

      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
      setLightboxData((prev) => ({ ...prev, isOpen: false }));
      setPreviewCert(null);

      const response = await GetMyProfile({ crew_member_id: parseInt(crewMemberId) });
      if (response.data && response.data.error === false) {
        setProfile(response.data.data);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsPageLoading(false);
    }
  };


  const certifications = profile.crew_member_files?.filter(
    (f: any) => f.file_type === "certifications"
  ) || [];

  const groupedWorks = profile.crew_member_files
    ?.filter((file: any) => file.file_type === "recent_work")
    .reduce((acc: any[], file: any) => {
      const normalizedTag = normalizeFeaturedWorkTag(file.tag);
      // Matches if both Title and Tag are the same
      const existingProject = acc.find(p =>
        p.title?.toLowerCase() === file.title?.toLowerCase() &&
        p.tag === normalizedTag
      );

      if (existingProject) {
        existingProject.images.push(file);
      } else {
        acc.push({
          title: file.title,
          tag: normalizedTag,
          images: [file]
        });
      }
      return acc;
    }, []);

  const handleAddPortfolioLinks = async (updatedLinks: any[]) => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    try {
      setIsPageLoading(true);

      // We need to identify which links are new and which are updated
      // Existing links have crew_files_id (passed as id in the modal)
      // New links have a temporary id (Date.now())

      const existingLinks = profile.crew_member_files?.filter(
        (f: any) => f.file_type === "link"
      ) || [];

      const newLinks = updatedLinks.filter(l => !existingLinks.find(ex => ex.crew_files_id === l.id));
      const updatedExistingLinks = updatedLinks.filter(l => existingLinks.find(ex => ex.crew_files_id === l.id));

      const editPromises = updatedExistingLinks.map(async (l) => {
        const existing = existingLinks.find(ex => ex.crew_files_id === l.id);
        if (existing && (existing.file_path !== l.url || existing.tag !== l.platform)) {
          return EditPortfolioLink(existing.crew_files_id, {
            crew_member_id: parseInt(crewMemberId),
            url: l.url,
            platform: l.platform,
            title: l.name || "Portfolio Link"
          });
        }
        return Promise.resolve(null);
      });

      // Handle bulk add for new links
      let addPromise = Promise.resolve(null);
      if (newLinks.length > 0) {
        addPromise = AddPortfolioLinks({
          crew_member_id: parseInt(crewMemberId),
          portfolio_links: newLinks.map(l => ({
            url: l.url,
            platform: l.platform
          }))
        }) as any;
      }

      // Also handle deletions if any links were removed IN THE MODAL
      const deletedPromises = existingLinks
        .filter(ex => !updatedLinks.find(l => l.id === ex.crew_files_id))
        .map(ex => DeleteProfileFile(ex.crew_files_id, { crew_member_id: parseInt(crewMemberId) }));

      await Promise.all([...editPromises, addPromise, ...deletedPromises]);

      setIsPortfolioLinksModalOpen(false);
      // Refresh profile
      const updatedProfile = await GetMyProfile({ crew_member_id: parseInt(crewMemberId) });
      if (updatedProfile.data) {
        setProfile(updatedProfile.data.data);
      }
    } catch (err) {
      console.error("Failed to update portfolio links:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  // State for Lightbox Viewer
  const [lightboxData, setLightboxData] = useState<{ isOpen: boolean; project: any; index: number }>({
    isOpen: false,
    project: null,
    index: 0
  });


  return (
    <>
      <Topbar pathname={pathname} />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
        <div className="mx-auto space-y-4 lg:space-y-8">

          {/* TOP PROFILE CARD */}
          <div className={`border rounded-lg lg:rounded-xl p-4 lg:p-8 flex flex-col lg:flex-row gap-8 ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#E5E5E5]"}`}>
            <div className="flex-1 space-y-4 lg:space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`group relative w-15 h-15 lg:w-20 lg:h-20 rounded-full border-2 border-[#E8D1AB] shrink-0 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <input
                      type="file"
                      ref={profilePhotoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleUploadProfilePhoto}
                    />
                    <button
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Camera size={20} className="text-white" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className={`text-lg lg:text-2xl font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
                        {profile.first_name} {profile.last_name}
                      </h1>
                      {profile.is_available === 1 && (
                        <span className="px-3 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-full flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Available
                        </span>
                      )}
                    </div>
                    <p className={`text-sm max-w-md truncate ${isDark ? "text-white/60" : "text-zinc-600"}`}>
                      {profile.bio || "No bio added yet"}
                    </p>
                    <div className={`flex items-center gap-1 text-xs mt-1 ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                      <MapPin size={12} /> {profile.location?.split(',').slice(-2).join(', ') || "Location not set"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.skills?.slice(0, 3).map((skill: any) => (
                  <span
                    key={skill.id}
                    className={`px-2 lg:px-4 py-1.5 border rounded-lg text-xs ${isDark
                      ? "bg-white/5 border-white/10 text-white/60"
                      : "bg-white border-[#E5E5E5] text-zinc-600"
                      }`}
                  >
                    {skill.name}
                  </span>
                ))}
                {profile.skills?.length > 3 && (
                  <span className={`px-4 py-1.5 border rounded-lg text-xs ${isDark
                    ? "bg-white/5 border-white/10 text-white/40"
                    : "bg-white border-[#E5E5E5] text-zinc-400"
                    }`}>
                    +{profile.skills.length - 3} more
                  </span>
                )}
              </div>

              <div className={`text-sm lg:text-base border rounded-lg lg:rounded-2xl flex max-w-sm justify-center capitalize ${isDark ? "bg-white/[0.02] border-white/5" : "bg-[#FDFAF7] border-[#F5EBDA]"}`}>
                <StatBox value={`$${Math.round(profile.hourly_rate)}`} sublabel="/Hour" isDark={isDark} />
                <StatBox value={`${profile.years_of_experience}`} sublabel="Years Exp." isDark={isDark} />
                <StatBox value={profile.working_distance?.split(' ')[1] || "25"} sublabel="Miles Radius" isDark={isDark} />
              </div>

              {/* Social Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.length > 0 ? (
                  socialLinks.map((link) => {
                    const platformInfo = SOCIAL_ICONS.find(i => i.id === link.platform);
                    return (
                      <a
                        key={link.id}
                        href={formatExternalUrl(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <SocialButton
                          icon={platformInfo?.icon || Globe}
                          label={platformInfo?.label || link.name}
                          isDark={isDark}
                        />
                      </a>
                    );
                  })
                ) : (
                  <p className={`text-xs italic ${isDark ? "text-white/20" : "text-zinc-400"}`}>No social links added</p>
                )}

                {/* The Edit Icon for Social Links */}
                <button
                  onClick={() => setIsSocialLinksModalOpen(true)}
                  className={`p-2 rounded-lg lg:rounded-xl border hover:bg-[#E8D1AB] hover:text-black transition-all ${isDark
                    ? "bg-white/5 border-white/10 text-white/40"
                    : "bg-[#FDFAF7] border-[#F1E1C9] text-[#8C8C8C]"
                    }`}
                  title="Edit Social Links"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>

            {/* Banner Media Upload UI */}
            <div
              onClick={() => !mediaPreview && fileInputRef.current?.click()}
              className={`w-full lg:w-[450px] min-h-[150px] lg:min-h-[250px] relative rounded-lg lg:rounded-2xl flex flex-col items-center justify-center p-4 text-center group transition-all overflow-hidden ${mediaPreview
                ? isDark
                  ? 'bg-black border border-white/10 shadow-2xl'
                  : 'bg-white border border-black/10 shadow-2xl'
                : isDark
                  ? 'bg-[#E8D1AB]/5 border-2 border-dashed border-[#E8D1AB]/20 cursor-pointer hover:bg-[#E8D1AB]/10'
                  : 'bg-[#E8D1AB]/10 border-2 border-dashed border-[#E8D1AB]/60 cursor-pointer hover:bg-[#E8D1AB]/15'
                }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
              {!mediaPreview ? (
                <>
                  <div className="relative w-32 h-24 mb-6">
                    <div className={`absolute top-0 left-0 w-16 h-16 rounded-lg rotate-[-10deg] ${isDark ? "bg-[#E8D1AB]/10" : "bg-[#E8D1AB]/15"}`} />
                    <div className={`absolute bottom-0 right-0 w-20 h-12 rounded-lg rotate-[5deg] flex items-center justify-center ${isDark ? "bg-[#E8D1AB]/30" : "bg-[#E8D1AB]/40"}`}>
                      <ImageIcon size={20} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} />
                    </div>
                  </div>
                  <p className={`text-sm font-bold mb-1 ${isDark ? "text-white" : "text-zinc-800"}`}>Upload Profile Banner</p>
                  <p className={`text-xs max-w-[200px] ${isDark ? "text-white/40" : "text-zinc-500"}`}>Showcase your style with a cover photo or video</p>
                </>
              ) : (
                <div className="w-full h-full absolute inset-0 bg-black">
                  {mediaType === "image" ? (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={mediaPreview} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="p-2 bg-white/90 text-black rounded-full"
                      title="Replace Banner"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePortfolioBanner();
                      }}
                      className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                      title="Remove Banner"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* NAVIGATION */}
          <div className={`flex border-b gap-4 lg:gap-8 overflow-x-auto no-scrollbar ${isDark ? "border-white/5" : "border-black/5"
            }`}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 lg:pb-4 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab
                  ? isDark ? 'text-[#E8D1AB]' : 'text-[#0A0A0A]'
                  : isDark
                    ? 'text-white/40 hover:text-white'
                    : 'text-[#737373] hover:text-black'
                  }`}
              >
                {tab}
                {activeTab === tab && <div className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? "bg-[#E8D1AB]" : "bg-[#0A0A0A]"}`} />}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="min-h-[400px] pb-10 lg:pb-20">
            {activeTab === "Overview" && (
              <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* PERSONAL INFORMATION */}
                <div className={`border rounded-lg lg:rounded-2xl p-4 lg:p-8 ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#E5E5E5]"
                  }`}>
                  <SectionHeader
                    title="Personal Information"
                    isEditing={isEditingPersonalInfo}
                    onEdit={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
                    isDark={isDark}
                  />

                  {isEditingPersonalInfo ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <PersonalInfoForm profile={profile} onChange={handleProfileUpdate} />
                      <div className="mt-4 lg:mt-8 flex justify-end">
                        <button
                          onClick={handleSavePersonalInfo}
                          className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-sm lg:text-base text-black font-bold px-4 lg:px-10 py-3 rounded-lg lg:rounded-xl transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 lg:gap-y-8 gap-x-20">
                      <InfoField label="First Name" value={profile.first_name} isDark={isDark} />
                      <InfoField label="Last Name" value={profile.last_name} isDark={isDark} />
                      <InfoField label="Email Address" value={profile.email} isDark={isDark} />
                      <InfoField label="Contact Phone" value={profile.phone_number} placeholder="Add phone number" isDark={isDark} />
                      <InfoField label="Location" value={profile.location} isDark={isDark} />
                      <InfoField label="Working Distance" value={profile.working_distance} placeholder="Add distance radius" isDark={isDark} />
                    </div>
                  )}
                </div>

                {/* PROFESSIONAL DETAILS */}
                <div className={`border rounded-lg lg:rounded-2xl p-4 lg:p-8 ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#E5E5E5]"
                  }`}>
                  <SectionHeader
                    title="Professional Details"
                    isEditing={isEditingProfessionalInfo}
                    onEdit={() => setIsEditingProfessionalInfo(!isEditingProfessionalInfo)}
                    isDark={isDark}
                  />

                  {isEditingProfessionalInfo ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <ProfessionalInfoForm profile={profile} onChange={handleProfileUpdate} />
                      <div className="mt-4 lg:mt-8 flex justify-end">
                        <button
                          onClick={handleSaveProfessionalInfo}
                          className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-sm lg:text-base text-black font-bold px-4 lg:px-10 py-3 rounded-lg lg:rounded-xl transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 lg:gap-y-8 gap-x-12">
                      <InfoField label="Primary Role" value={getRoleLabel(profile.primary_role)} isDark={isDark} />
                      <InfoField label="Experience" value={`${profile.years_of_experience} Years`} isDark={isDark} />
                      <InfoField label="Hourly Rate" value={`$${profile.hourly_rate}`} isDark={isDark} />
                      <div className="col-span-full">
                        <InfoField label="Bio" value={profile.bio} placeholder="Add a professional bio..." isDark={isDark} />
                      </div>
                    </div>
                  )}
                </div>

                {/* SKILLS */}
                <div className={`border rounded-lg lg:rounded-2xl p-4 lg:p-8 ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#E5E5E5]"
                  }`}>
                  <SectionHeader
                    title="Skills"
                    isEditing={isEditingSkills}
                    onEdit={() => setIsEditingSkills(!isEditingSkills)}
                    isDark={isDark}
                  />

                  {isEditingSkills ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <SkillsForm
                        value={profile.skills}
                        primaryRole={profile.primary_role}
                        onChange={(newSkills) => handleProfileUpdate({ skills: newSkills })}
                      />
                      <div className="mt-4 lg:mt-8 flex justify-end">
                        <button
                          onClick={handleSaveSkills}
                          className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-sm lg:text-base text-black font-bold px-4 lg:px-10 py-3 rounded-lg lg:rounded-xl transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {profile.skills?.length > 0 ? (
                        profile.skills.map((skill: any, index: number) => (
                          <span
                            key={skill.id || index}
                            className={`px-2 lg:px-5 py-2.5 border rounded-lg lg:rounded-xl text-sm ${isDark
                              ? "bg-white/5 border-white/10 text-white/80"
                              : "bg-black/5 border-black/10 text-black/80"
                              }`}
                          >
                            {skill.name || skill}
                          </span>
                        ))
                      ) : (
                        <p className={`italic text-sm ${isDark ? "text-white/20" : "text-black/20"}`}>No skills added yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* SECURITY */}
                <div className={`border rounded-lg lg:rounded-2xl p-4 lg:p-8 ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#E5E5E5]"
                  }`}>
                  <SectionHeader
                    title="Security"
                    isEditing={isEditingSecurity}
                    onEdit={() => setIsEditingSecurity(!isEditingSecurity)}
                    isDark={isDark}
                  />

                  {isEditingSecurity ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <SecurityForm onSuccess={() => setIsEditingSecurity(false)} />
                    </div>
                  ) : (
                    <div className={`flex items-center justify-between p-4 border rounded-lg lg:rounded-2xl ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#E8D1AB]/15 text-[#cbb38b]"
                          }`}>
                          <EyeOff size={20} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Password</p>
                          <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>Last changed recently</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingSecurity(true)}
                        className={`text-xs font-bold transition-colors uppercase tracking-wider ${isDark ? "text-[#E8D1AB] hover:text-white" : "text-[#cbb38b] hover:text-black"
                          }`}
                      >
                        Change Password
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FEATURED WORK TAB */}
            {activeTab === "Featured Work" && (
              <div className="animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* ADD NEW PROJECT BOX */}
                  <div
                    onClick={() => setIsFeaturedModalOpen(true)}
                    className={`border-2 border-dashed rounded-lg lg:rounded-2xl h-[350px] flex flex-col items-center justify-center cursor-pointer transition-all group ${isDark
                      ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#E8D1AB]/40"
                      : "border-black/10 bg-black/[0.01] hover:bg-black/[0.03] hover:border-[#E8D1AB]/60"}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                      <Plus size={24} className="text-[#E8D1AB]" />
                    </div>
                    <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}>
                      Add featured work
                    </p>
                  </div>

                  {/* DISPLAY GROUPED PROJECTS */}
                  {groupedWorks?.map((project: any, pIdx: number) => (
                    <div key={pIdx} className="group flex flex-col">
                      <div
                        className={`h-[350px] rounded-lg lg:rounded-2xl overflow-hidden border relative cursor-pointer ${isDark ? "border-white/10 bg-[#111111]" : "border-black/5 bg-neutral-50"}`}
                        onClick={() => setLightboxData({ isOpen: true, project, index: 0 })}
                      >
                        {/* Main Image */}
                        <img
                          src={`${S3_BASE_URL}${project.images[0].file_path}`}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />

                        {/* HOVER OVERLAY */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete('project', project);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-full text-xs font-bold hover:bg-red-50 transition-colors shadow-lg"
                            >
                              <Trash2 size={14} /> Delete Project
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                            >
                              <Edit3 size={16} />
                            </button>
                          </div>

                          <div className="self-center">
                            <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs text-white border border-white/20">
                              {project.images.length} Media Items
                            </div>
                          </div>

                          <div className="flex justify-center gap-1.5">
                            {project.images.slice(0, 5).map((_: any, i: number) => (
                              <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 px-2">
                        <h4 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                          {project.title}
                        </h4>
                        {normalizeFeaturedWorkTag(project?.tag) && (
                          <p className={`text-xs mt-1 font-medium ${isDark ? "text-[#E8D1AB] opacity-80" : "text-[#cbb38b]"}`}>
                            #{project.tag}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {featuredWorks.length === 0 && (
                  <div className="mt-8">
                    <TabEmptyState
                      title="Share your work and get discovered"
                      description="Showcase your latest creations with the perfect image or video."
                      buttonText="Upload Project"
                      footerText="Minimum 1600 × 1200. Max 10MB (images), 20MB (videos)."
                      onClick={() => setIsFeaturedModalOpen(true)}
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>
            )}

            {/* CERTIFICATES TAB */}
            {activeTab === "Certificates" && (
              <div className="animate-in fade-in duration-500">
                <input
                  type="file"
                  ref={certInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleUploadCertificates}
                />

                {certifications.length === 0 ? (
                  <TabEmptyState
                    title="Showcase your certifications"
                    description="Upload your professional credentials and achievements to build trust with clients."
                    buttonText="Add Certificate"
                    footerText="PDF, JPG, DOCX or PNG files. Max 10MB per file."
                    onClick={() => certInputRef.current?.click()}
                    isDark={isDark}
                  />
                ) : (
                  <div className={`border rounded-lg lg:rounded-2xl p-4 lg:p-8 ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#E5E5E5]"
                    }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                      {/* ADD CARD */}
                      <div
                        onClick={() => certInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg lg:rounded-2xl h-[220px] flex flex-col items-center justify-center cursor-pointer transition-all group ${isDark
                          ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#E8D1AB]/40"
                          : "border-black/10 bg-black/[0.01] hover:bg-black/[0.03] hover:border-[#E8D1AB]/60"
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isDark ? "bg-white/5" : "bg-black/5"
                          }`}>
                          <Plus size={20} className="text-[#E8D1AB]" />
                        </div>
                        <p className={`text-sm font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>Add Certificate</p>
                        <p className={`text-xs text-center px-6 ${isDark ? "text-white/40" : "text-black/40"}`}>
                          Highlight achievements with a professional certificate.
                        </p>
                      </div>

                      {/* CERTIFICATE CARDS */}
                      {certifications.map((cert: any, index: number) => {
                        const isPDF = cert.file_path.toLowerCase().endsWith('.pdf');
                        const fileUrl = `${S3_BASE_URL}${cert.file_path}`;

                        return (
                          <div
                            key={cert.id || index}
                            className={`relative group h-[220px] rounded-lg lg:rounded-2xl overflow-hidden border ${isDark ? "border-white/10 bg-[#0A0A0A]" : "border-black/10 bg-neutral-50"}`}
                          >
                            {/* Thumbnail */}
                            {isPDF ? (
                              <div className={`w-full h-full flex flex-col items-center justify-center ${isDark ? "bg-neutral-900 text-white/20" : "bg-neutral-200 text-black/20"}`}>
                                <FileText size={48} />
                                <span className="text-xs mt-2 font-bold uppercase tracking-widest">PDF Document</span>
                              </div>
                            ) : (
                              <img src={fileUrl} alt={`Certificate ${index + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-all" />
                            )}

                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                              <p className="text-xs font-bold text-white">Certificate_{index + 1}</p>
                            </div>

                            {/* HOVER ACTIONS */}
                            <div className="absolute top-4 right-4 flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => setPreviewCert(cert)}
                                className={`p-2 backdrop-blur-md rounded-lg transition-all ${isDark ? "bg-white/10 hover:bg-white text-white hover:text-black " : "bg-black/10 hover:bg-black/30 text-black"}`}
                              >
                                <Eye size={16} />
                              </button>
                              {/* Inside certifications map */}
                              <button
                                onClick={() => confirmDelete('file', cert)}
                                className={`p-2 backdrop-blur-md hover:bg-red-500 rounded-lg transition-all ${isDark ? "text-white bg-white/10 " : "bg-black/10  text-black hover:text-white"}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RESUME TAB */}
            {activeTab === "Resume" && (
              <div className="animate-in fade-in duration-500">
                <input
                  type="file"
                  ref={resumeInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUploadResume}
                />

                {(() => {
                  // Find the resume in the profile data
                  const resumeFile = profile.crew_member_files?.find(
                    (f: any) => f.file_type === "resume"
                  );

                  if (!resumeFile) {
                    return (
                      <TabEmptyState
                        title="Upload your resume"
                        description="Browse or drag and drop a file here to keep your profile updated."
                        buttonText="Select File"
                        footerText="Acceptable file types: PDF, JPG, PNG (max 5MB)"
                        onClick={() => resumeInputRef.current?.click()}
                        isDark={isDark}
                      />
                    );
                  }

                  // RESUME CARD (Wrapped in a flex container ONLY when data exists to keep it centered)
                  return (
                    <div className="flex justify-center py-4 lg:py-10">
                      <div className={`border rounded-[2.5rem] p-12 w-full max-w-lg relative flex flex-col items-center justify-center text-center shadow-2xl ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-black/5"}`}>

                        {/* Delete Icon (Top Right) */}
                        <button
                          onClick={() => confirmDelete('file', resumeFile)}
                          className={`absolute top-6 right-6 p-2.5 rounded-full border transition-all ${isDark
                            ? "bg-white/5 border-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500"
                            : "bg-black/5 border-black/5 text-black/40 hover:bg-red-500/10 hover:text-red-500"
                            }`}
                          title="Delete Resume"
                        >
                          <Trash2 size={18} />
                        </button>

                        {/* File Icon Box */}
                        <div className={`w-16 h-20 border rounded-2xl flex items-center justify-center mb-6 shadow-xl ${isDark ? "bg-white border-white/10" : "bg-neutral-50 border-black/10"
                          }`}>
                          <div className="relative">
                            <FileText size={40} className="text-red-500" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-black">
                              PDF
                            </div>
                          </div>
                        </div>

                        {/* File Details */}
                        <h3 className={`text-xl font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>My Resume</h3>
                        <p className={`text-sm mb-10 font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>
                          Uploaded on {new Date(resumeFile.created_at || Date.now()).toLocaleDateString()}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 w-full">
                          <button
                            onClick={() => window.open(`${S3_BASE_URL}${resumeFile.file_path}`, '_blank')}
                            className={`text-sm lg:text-base w-full font-bold px-5 lg:px-10 py-2.5 lg:py-3.5 rounded-lg lg:rounded-2xl transition-all active:scale-95 shadow-lg ${isDark
                              ? "bg-white text-black hover:bg-[#E8D1AB]"
                              : "bg-black text-white hover:bg-[#cbb38b]"
                              }`}
                          >
                            View File
                          </button>
                          <button
                            onClick={() => resumeInputRef.current?.click()}
                            className={`text-sm lg:text-base w-full font-bold px-5 lg:px-10 py-2.5 lg:py-3.5 rounded-lg lg:rounded-2xl transition-all active:scale-95 border ${isDark
                              ? "bg-transparent text-white border-white/10 hover:bg-white/5"
                              : "bg-transparent text-black border-black/10 hover:bg-black/5"
                              }`}
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* PORTFOLIO TAB */}
            {activeTab === "Portfolio Links" && (
              <div className="animate-in fade-in duration-500">
                {(() => {
                  const portfolioLinks = profile.crew_member_files?.filter((f: any) => f.file_type === "link") || [];
                  if (portfolioLinks.length === 0) {
                    return (
                      <TabEmptyState
                        title="Showcase your portfolio links"
                        description="Add your YouTube, Vimeo, or Google Drive links to showcase your work."
                        buttonText="Add Portfolio Link"
                        footerText="Links will be displayed on your public profile."
                        onClick={() => {
                          setEditingPortfolioLinks([]);
                          setIsPortfolioLinksModalOpen(true);
                        }}
                        isDark={isDark}
                      />
                    );
                  }

                  return (
                    <div className={`border rounded-lg lg:rounded-2xl p-4 lg:p-8 ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#E5E5E5]"
                      }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* ADD CARD */}
                        <div
                          onClick={() => {
                            const mappedLinks = portfolioLinks.map((l: any) => ({
                              id: l.crew_files_id,
                              url: l.file_path,
                              platform: l.tag,
                              name: PORTFOLIO_ICONS.find(p => p.id === l.tag)?.label || l.tag
                            }));
                            setEditingPortfolioLinks(mappedLinks);
                            setIsPortfolioLinksModalOpen(true);
                          }}
                          className={`border-2 border-dashed rounded-lg lg:rounded-2xl h-[220px] lg:h-auto min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition-all group ${isDark
                            ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#E8D1AB]/40"
                            : "border-black/10 bg-black/[0.01] hover:bg-black/[0.03] hover:border-[#E8D1AB]/60"
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isDark ? "bg-white/5" : "bg-black/5"
                            }`}>
                            <Plus size={20} className="text-[#E8D1AB]" />
                          </div>
                          <p className={`text-sm font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>Add Portfolio Link</p>
                          <p className={`text-xs text-center px-6 ${isDark ? "text-white/40" : "text-black/40"}`}>Share your external work links here.</p>
                        </div>

                        {portfolioLinks.map((link: any, index: number) => {
                          const platform = PORTFOLIO_ICONS.find((p) => p.id === link.tag);
                          return (
                            <div
                              key={link.crew_files_id || index}
                              className={`border rounded-2xl p-4 flex flex-col gap-4 group transition-all shadow-xl ${isDark
                                ? "bg-white/5 border-white/10 hover:border-white/20"
                                : "bg-black/5 border-black/5 hover:border-black/20"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                                  }`}>
                                  {platform?.icon ? (
                                    <platform.icon size={24} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} />
                                  ) : (
                                    <Globe size={24} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const mappedLinks = portfolioLinks.map((l: any) => ({
                                        id: l.crew_files_id,
                                        url: l.file_path,
                                        platform: l.tag,
                                        name: PORTFOLIO_ICONS.find(p => p.id === l.tag)?.label || l.tag
                                      }));
                                      setEditingPortfolioLinks(mappedLinks);
                                      setIsPortfolioLinksModalOpen(true);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${isDark ? "text-white/20 hover:text-[#E8D1AB] hover:bg-white/5" : "text-black/20 hover:text-[#cbb38b] hover:bg-black/5"}`}
                                  >
                                    <Pencil size={18} />
                                  </button>
                                  <button
                                    onClick={() => confirmDelete('file', link)}
                                    className={`p-2 rounded-lg transition-all ${isDark ? "text-white/20 hover:text-red-500 hover:bg-red-500/10" : "text-black/20 hover:text-red-500 hover:bg-red-500/5"}`}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
                                  {platform?.label || "Portfolio Link"}
                                </p>
                                <p className={`text-xs truncate ${isDark ? "text-white/40" : "text-black/40"}`}>{link.file_path}</p>
                              </div>

                              <button
                                onClick={() => setPlayingVideo(link.file_path)}
                                className={`w-full border py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn ${isDark
                                  ? "bg-[#1A1A1A] text-white border-white/10 hover:bg-white hover:text-black"
                                  : "bg-white text-black border-black/10 hover:bg-black hover:text-white"
                                  }`}
                              >
                                Play Portfolio
                                <Play size={14} className="fill-current group-hover/btn:scale-110 transition-transform" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* EQUIPMENTS TAB */}
            {activeTab === "Equipments" && (
              <div className="animate-in fade-in duration-500">
                <TabEmptyState
                  title="List your equipment"
                  description="Showcase the professional gear and tools you use to deliver high-quality results."
                  buttonText="Add Equipment"
                  footerText="Cameras, lenses, lighting, or any specialized gear you own."
                  isDark={isDark}
                />
              </div>
            )}

          </div>
        </div>

        {/* FULL SCREEN LIGHTBOX VIEWER */}
        {lightboxData.isOpen && lightboxData.project && (
          <div className={`fixed inset-0 z-[100] backdrop-blur-xl flex flex-col animate-in fade-in duration-300 ${isDark ? "bg-black/95" : "bg-white/95"}`}>
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-6 p-6 lg:p-8">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg lg:text-2xl font-semibold text-white tracking-tight">
                    {lightboxData.project.title}
                  </h3>
                  {normalizeFeaturedWorkTag(lightboxData.project.tag) && (
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isDark
                      ? "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#E8D1AB]"
                      : "border-[#cbb38b]/30 bg-[#cbb38b]/20 text-[#fff]"
                      }`}>
                      {normalizeFeaturedWorkTag(lightboxData.project.tag)}
                    </span>
                  )}
                </div>
                <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                  Media {lightboxData.index + 1} of {lightboxData.project.images.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Inside Lightbox Top Bar */}
                <button
                  onClick={() => confirmDelete('file', lightboxData.project.images[lightboxData.index])}
                  className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} /> Delete This Image
                </button>
                <button
                  onClick={() => setLightboxData({ ...lightboxData, isOpen: false })}
                  className={`rounded-full border p-3 transition-colors ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-black/10 bg-black/5 text-black hover:bg-black/10"}`}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Main Content (Image + Arrows) */}
            <div className="flex-1 relative flex items-center justify-center px-4 py-6 lg:px-20 lg:py-8">
              <button
                className={`absolute left-8 z-10 p-4 rounded-full transition-all active:scale-90 ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"}`}
                onClick={() => setLightboxData({ ...lightboxData, index: (lightboxData.index - 1 + lightboxData.project.images.length) % lightboxData.project.images.length })}
              >
                <ChevronLeft size={32} />
              </button>

              <div className="w-full max-w-5xl">
                <div className={`relative mx-auto flex aspect-[4/3] max-h-[calc(100vh-16rem)] w-full items-center justify-center overflow-hidden rounded-2xl shadow-2xl ${isDark ? "bg-[#050505]" : "bg-neutral-950"}`}>
                  <img
                    src={`${S3_BASE_URL}${lightboxData.project.images[lightboxData.index].file_path}`}
                    className="h-full w-full object-contain"
                    alt="Preview"
                  />
                </div>
              </div>

              <button
                className={`absolute right-8 z-10 p-4 rounded-full transition-all active:scale-90 ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"}`}
                onClick={() => setLightboxData({ ...lightboxData, index: (lightboxData.index + 1) % lightboxData.project.images.length })}
              >
                <ChevronRight size={32} />
              </button>
            </div>

            {/* Bottom Filmstrip Thumbnails */}
            <div className="p-4 lg:p-8 flex justify-center gap-3 overflow-x-auto no-scrollbar">
              {lightboxData.project.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setLightboxData({ ...lightboxData, index: idx })}
                  className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${lightboxData.index === idx
                    ? (isDark ? 'border-[#E8D1AB] scale-110' : 'border-[#cbb38b] scale-110')
                    : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                >
                  <img src={`${S3_BASE_URL}${img.file_path}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CERTIFICATE PREVIEW MODAL */}
        {previewCert && (
          <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl h-full flex flex-col">

              {/* Top Header */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setPreviewCert(null)}
                  className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all"
                >
                  <span className="text-sm font-bold">Close Preview</span>
                  <X size={18} />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 bg-white rounded-2xl overflow-hidden relative shadow-2xl">
                {/* External Link Button (Top Right of Doc) */}
                <button
                  onClick={() => window.open(`${S3_BASE_URL}${previewCert.file_path}`, '_blank')}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-lg transition-all"
                  title="Open in new tab"
                >
                  <Navigation size={20} />
                </button>

                {previewCert.file_path.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(S3_BASE_URL + previewCert.file_path)}&embedded=true`}
                    className="w-full h-full border-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                    <img
                      src={`${S3_BASE_URL}${previewCert.file_path}`}
                      className="max-w-full max-h-full object-contain"
                      alt="Preview"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIDEO PLAYER MODAL */}
        {playingVideo && (
          <div className={`fixed inset-0 z-[120] backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-500 ${isDark ? "bg-black/98" : "bg-white/98"}`}>

            {/* Top Bar - Sticky so the close button is always visible even when scrolling */}
            <div className={`sticky top-0 z-50 flex items-center justify-between p-4 lg:p-10 bg-gradient-to-b to-transparent pointer-events-none ${isDark ? "from-black/95 via-black/80" : "from-white/95 via-white/80"}`}>
              <div className="space-y-1 pointer-events-auto">
                <h3 className={`text-xs lg:text-sm font-black uppercase tracking-[0.3em] ${isDark ? "text-white" : "text-black"}`}>
                  Portfolio Player
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-[#E8D1AB]" : "bg-[#cbb38b]"}`} />
                  <p className={`text-xs uppercase font-bold tracking-widest ${isDark ? "text-white/30" : "text-black/40"}`}>
                    Now Playing
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPlayingVideo(null)}
                className={`p-3 lg:p-4 border rounded-full transition-all active:scale-90 shadow-lg pointer-events-auto ${isDark
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/20"
                    : "bg-black/5 border-black/10 text-black hover:bg-black/10"
                  }`}
              >
                <X size={20} className="lg:w-6 lg:h-6" />
              </button>
            </div>

            {/* Video Container */}
            <div className="w-full max-w-6xl mx-auto px-4 pb-24 pt-2 lg:pt-10">
              <div className={`w-full aspect-video bg-black rounded-xl lg:rounded-[2rem] overflow-hidden border relative ${isDark ? "shadow-[0_0_100px_rgba(0,0,0,0.8)] border-white/10" : "shadow-2xl border-black/10"}`}>
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
        <FeaturedWorkModal
          open={isFeaturedModalOpen}
          onClose={() => setIsFeaturedModalOpen(false)}
          onAdd={handleAddProject}
          isDark={isDark}
        />
        <SocialLinksModal
          open={isSocialLinksModalOpen}
          onClose={() => setIsSocialLinksModalOpen(false)}
          links={socialLinks}
          onChange={handleSaveSocialLinks} // Pass the API handler here
          isDark={isDark}
        />
        <PortfolioLinksModal
          open={isPortfolioLinksModalOpen}
          onClose={() => setIsPortfolioLinksModalOpen(false)}
          links={editingPortfolioLinks}
          onChange={handleAddPortfolioLinks}
          isDark={isDark}
        />
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleExecuteDelete}
          title={deleteModal.title}
          description={deleteModal.description}
          isDark={isDark}
        />
        {isPageLoading && (
          <div className={`fixed inset-0 z-[9999] backdrop-blur-sm flex items-center justify-center ${isDark ? "bg-black/80" : "bg-white/80"}`}>
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[#E8D1AB]" />
              <p className={`text-sm tracking-wide ${isDark ? "text-white/80" : "text-black/80"}`}>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

