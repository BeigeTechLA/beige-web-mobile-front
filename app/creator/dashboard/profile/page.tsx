"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Linkedin,
  Globe,
  Edit3,
  Image as ImageIcon,
  Play,
  Plus,
  X,
  Eye,
  FileText,
  Trash2,
  CheckCircle,
  Phone,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Loader2,
  EyeOff
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useChangePasswordMutation } from "@/lib/redux/features/auth/authApi";
import SecurityForm from "@/src/components/cpSignup/SecurityForm";

import FeaturedWorkModal from "@/src/components/cpSignup/FeaturedWorkModal";
import SocialLinksModal from "@/src/components/cpSignup/SocialLinksModal";
import PersonalInfoForm from "@/src/components/cpSignup/PersonalInfoForm";
import ProfessionalInfoForm from "@/src/components/cpSignup/ProfessionalInfoForm";
import SkillsForm from "@/src/components/cpSignup/SkillsForm";
import { GetMyProfile, EditMyProfile, UploadProfileFile, DeleteProfileFile } from "@/lib/api";
import { SOCIAL_ICONS } from "@/app/data/staticData";
import DeleteConfirmationModal from "@/src/components/cpSignup/DeleteConfirmationModal";

// --- CONSTANTS ---
const S3_BASE_URL = "https://beigexmemehouse.s3.amazonaws.com/beige/";

// --- REUSABLE SUB-COMPONENTS ---
const StatBox = ({ value, sublabel }: { value: string, sublabel: string }) => (
  <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-r-0 px-4 py-2">
    <p className="text-lg font-bold text-white">{value}</p>
    <p className="text-[10px] text-white/40 uppercase tracking-widest">{sublabel}</p>
  </div>
);

const SocialButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
  >
    <Icon size={16} className="text-[#E8D1AB]" />
    <span className="text-xs font-medium text-white/80">{label}</span>
  </button>
);

const InfoField = ({ label, value, placeholder }: { label: string, value?: any, placeholder?: string }) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm ${value ? 'text-white/80 font-medium' : 'text-white/20 italic'}`}>
      {value || placeholder}
    </p>
  </div>
);

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

const SectionHeader = ({ title, onEdit, isEditing }: { title: string, onEdit?: () => void, isEditing?: boolean }) => (
  <div className="flex items-center justify-between mb-4 lg:mb-8">
    <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">{title}</h2>
    <button
      onClick={onEdit}
      className={`p-2 rounded-full transition-all duration-200 ${isEditing
        ? "bg-[#E8D1AB] text-black"
        : "hover:bg-white/5 text-white/40 hover:text-white"
        }`}
    >
      {isEditing ? <X size={18} /> : <Edit3 size={18} />}
    </button>
  </div>
);

const TabEmptyState = ({ title, description, buttonText, footerText, onClick }: any) => (
  <div className="bg-[#0A0A0A] border border-white/5 rounded-lg lg:rounded-2xl h-[500px] flex items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-full border-r border-white/[0.03] last:border-r-0 bg-white/[0.01]" />
      ))}
    </div>
    <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-6">
      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-md">{description}</p>
      <button
        onClick={onClick}
        className="bg-[#1A1A1A] text-white border border-white/10 hover:bg-white hover:text-black font-bold px-10 py-3.5 rounded-lg lg:rounded-2xl transition-all active:scale-95 shadow-xl"
      >
        {buttonText}
      </button>
      <p className="text-[10px] text-white/30 mt-6 font-medium uppercase tracking-widest">{footerText}</p>
    </div>
  </div>
);

const FileItem = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/[0.08] transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-[#E8D1AB]/10 rounded-lg flex items-center justify-center text-[#E8D1AB]">
        <FileText size={20} />
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium text-white truncate max-w-[150px] md:max-w-[300px]">{file.name}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
    </div>
    <button onClick={onRemove} className="p-2 text-white/20 hover:text-red-500 transition-colors">
      <Trash2 size={18} />
    </button>
  </div>
);

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Modal & Edit States
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const [isSocialLinksModalOpen, setIsSocialLinksModalOpen] = useState(false);
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

  const tabs = ["Overview", "Featured Work", "Certificates", "Resume"];

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
      const response = await EditMyProfile(payload);
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
      const response = await UploadProfileFile(
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaType(file.type.startsWith("video") ? "video" : "image");
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleAddProject = async (data: any) => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    try {
      setIsPageLoading(true); // ✅ START LOADER

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
      setIsPageLoading(false); // ✅ STOP LOADER
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
      setIsPageLoading(true); // 🔥 SHOW LOADER

      const filesArray = Array.from(selectedFiles);

      const response = await UploadProfileFile(
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
      setIsPageLoading(false); // 🔥 HIDE LOADER
    }
  };


  const handleExecuteDelete = async () => {
    const crewMemberId = getCrewId();
    if (!crewMemberId || deleteModal.idsToDelete.length === 0) return;

    try {
      setIsPageLoading(true); // ✅ START LOADER

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
      setIsPageLoading(false); // ✅ STOP LOADER
    }
  };


  const certifications = profile.crew_member_files?.filter(
    (f: any) => f.file_type === "certifications"
  ) || [];

  const groupedWorks = profile.crew_member_files
    ?.filter((file: any) => file.file_type === "recent_work")
    .reduce((acc: any[], file: any) => {
      // Matches if both Title and Tag are the same
      const existingProject = acc.find(p =>
        p.title?.toLowerCase() === file.title?.toLowerCase() &&
        p.tag === file.tag
      );

      if (existingProject) {
        existingProject.images.push(file);
      } else {
        acc.push({
          title: file.title,
          tag: file.tag,
          images: [file]
        });
      }
      return acc;
    }, []);

  // State for Lightbox Viewer
  const [lightboxData, setLightboxData] = useState<{ isOpen: boolean; project: any; index: number }>({
    isOpen: false,
    project: null,
    index: 0
  });

  // Logic for profile photo
  const profilePhotoFile = profile.crew_member_files?.find((f: any) => f.file_type === "profile_photo");
  const profileImageUrl = profilePhotoFile
    ? `${S3_BASE_URL}${profilePhotoFile.file_path}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.first_name || 'default'}`;


  return (
    // <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E8D1AB] selection:text-black">
    <>
      <div className="mx-auto space-y-4 lg:space-y-8">

        {/* TOP PROFILE CARD */}
        <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-xl p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4 lg:space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-15 h-15 lg:w-20 lg:h-20 rounded-full bg-zinc-800 overflow-hidden border-2 border-[#E8D1AB] shrink-0">
                  <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-lg lg:text-2xl font-bold">{profile.first_name} {profile.last_name}</h1>
                    {profile.is_available === 1 && (
                      <span className="px-3 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Available
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm max-w-md truncate">{profile.bio || "No bio added yet"}</p>
                  <div className="flex items-center gap-1 text-white/40 text-xs mt-1">
                    <MapPin size={12} /> {profile.location?.split(',').slice(-2).join(', ') || "Location not set"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.skills?.slice(0, 3).map((skill: any) => (
                <span key={skill.id} className="px-2 lg:px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60">{skill.name}</span>
              ))}
              {profile.skills?.length > 3 && <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/40">+{profile.skills.length - 3} more</span>}
            </div>

            <div className="bg-white/[0.02] text-sm lg:text-base border border-white/5 rounded-lg lg:rounded-2xl flex max-w-sm capitalize">
              <StatBox value={`$${Math.round(profile.hourly_rate)}`} sublabel="/Hour" />
              <StatBox value={`${profile.years_of_experience}`} sublabel="Years Exp." />
              <StatBox value={profile.working_distance?.split(' ')[1] || "25"} sublabel="Miles Radius" />
            </div>

            {/* Find the Social Buttons section in your JSX (inside the Top Profile Card) */}
            <div className="flex flex-wrap items-center gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => {
                  const platformInfo = SOCIAL_ICONS.find(i => i.id === link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SocialButton
                        icon={platformInfo?.icon || Globe}
                        label={platformInfo?.label || link.name}
                      />
                    </a>
                  );
                })
              ) : (
                <p className="text-xs text-white/20 italic">No social links added</p>
              )}

              {/* The Edit Icon for Social Links */}
              <button
                onClick={() => setIsSocialLinksModalOpen(true)}
                className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-[#E8D1AB] hover:text-black transition-all text-white/40"
                title="Edit Social Links"
              >
                <Edit3 size={14} />
              </button>
            </div>
          </div>

          {/* Banner Media Upload UI */}
          <div
            onClick={() => !mediaPreview && fileInputRef.current?.click()}
            className={`w-full lg:w-[450px] min-h-[150px] lg:min-h-[250px] relative rounded-lg lg:rounded-2xl flex flex-col items-center justify-center p-4 text-center group transition-all overflow-hidden
              ${mediaPreview ? 'bg-black border border-white/10 shadow-2xl' : 'bg-[#E8D1AB]/5 border-2 border-dashed border-[#E8D1AB]/20 cursor-pointer hover:bg-[#E8D1AB]/10'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            {!mediaPreview ? (
              <>
                <div className="relative w-32 h-24 mb-6">
                  <div className="absolute top-0 left-0 w-16 h-16 bg-[#E8D1AB]/20 rounded-lg rotate-[-10deg]" />
                  <div className="absolute bottom-0 right-0 w-20 h-12 bg-[#E8D1AB]/40 rounded-lg rotate-[5deg] flex items-center justify-center">
                    <ImageIcon size={20} className="text-[#E8D1AB]" />
                  </div>
                </div>
                <p className="text-sm font-bold text-white mb-1">Upload Profile Banner</p>
                <p className="text-[10px] text-white/40 max-w-[200px]">Showcase your style with a cover photo or video</p>
              </>
            ) : (
              <div className="w-full h-full absolute inset-0 bg-black">
                {mediaType === "image" ? (
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={mediaPreview} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button onClick={(e) => { e.stopPropagation(); setMediaPreview(null); }} className="p-2 bg-red-500/90 text-white rounded-full"><X size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex border-b border-white/5 gap-4 lg:gap-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 lg:pb-4 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#E8D1AB]' : 'text-white/40 hover:text-white'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E8D1AB]" />}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="min-h-[400px] pb-10 lg:pb-20">
          {activeTab === "Overview" && (
            <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* PERSONAL INFORMATION */}
              <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl p-4 lg:p-8">
                <SectionHeader
                  title="Personal Information"
                  isEditing={isEditingPersonalInfo}
                  onEdit={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
                />

                {isEditingPersonalInfo ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <PersonalInfoForm profile={profile} onChange={handleProfileUpdate} />
                    <div className="mt-4 lg:mt-8 flex justify-end">
                      {/* CHANGED: onClick now calls handleSavePersonalInfo */}
                      <button
                        onClick={handleSavePersonalInfo}
                        className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-sm lg:text-base text-black font-bold px-4 lg:px-10 py-3 rounded-lg lg:rounded-xl transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 lg:gap-y-10 gap-x-20">
                    <InfoField label="First Name" value={profile.first_name} />
                    <InfoField label="Last Name" value={profile.last_name} />
                    <InfoField label="Email Address" value={profile.email} />
                    <InfoField label="Contact Phone" value={profile.phone_number} placeholder="Add phone number" />
                    <InfoField label="Location" value={profile.location} />
                    <InfoField label="Working Distance" value={profile.working_distance} placeholder="Add distance radius" />
                  </div>
                )}
              </div>

              {/* PROFESSIONAL DETAILS */}
              <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl p-4 lg:p-8">
                <SectionHeader
                  title="Professional Details"
                  isEditing={isEditingProfessionalInfo}
                  onEdit={() => setIsEditingProfessionalInfo(!isEditingProfessionalInfo)}
                />

                {isEditingProfessionalInfo ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <ProfessionalInfoForm profile={profile} onChange={handleProfileUpdate} />
                    <div className="mt-4 lg:mt-8 flex justify-end">
                      {/* UPDATED: Calls handleSaveProfessionalInfo */}
                      <button
                        onClick={handleSaveProfessionalInfo}
                        className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-sm lg:text-base text-black font-bold px-4 lg:px-10 py-3 rounded-lg lg:rounded-xl transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 lg:gap-y-10 gap-x-12">
                    <InfoField label="Primary Role" value={getRoleLabel(profile.primary_role)} />
                    <InfoField label="Experience" value={`${profile.years_of_experience} Years`} />
                    <InfoField label="Hourly Rate" value={`$${profile.hourly_rate}`} />
                    <div className="col-span-full">
                      <InfoField label="Bio" value={profile.bio} placeholder="Add a professional bio..." />
                    </div>
                  </div>
                )}
              </div>

              {/* SKILLS */}
              <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl p-4 lg:p-8">
                <SectionHeader
                  title="Skills"
                  isEditing={isEditingSkills}
                  onEdit={() => setIsEditingSkills(!isEditingSkills)}
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
                          className="px-2 lg:px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg lg:rounded-xl text-sm text-white/80"
                        >
                          {skill.name || skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-white/20 italic text-sm">No skills added yet.</p>
                    )}
                  </div>
                )}
              </div>

              {/* SECURITY */}
              <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl p-4 lg:p-8">
                <SectionHeader
                  title="Security"
                  isEditing={isEditingSecurity}
                  onEdit={() => setIsEditingSecurity(!isEditingSecurity)}
                />

                {isEditingSecurity ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <SecurityForm onSuccess={() => setIsEditingSecurity(false)} />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg lg:rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#E8D1AB]/10 rounded-lg flex items-center justify-center text-[#E8D1AB]">
                        <EyeOff size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Password</p>
                        <p className="text-xs text-white/40">Last changed recently</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingSecurity(true)}
                      className="text-xs font-bold text-[#E8D1AB] hover:text-white transition-colors uppercase tracking-wider"
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
                  className="border-2 border-dashed border-white/10 rounded-lg lg:rounded-2xl h-[350px] flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#E8D1AB]/40 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus size={24} className="text-[#E8D1AB]" />
                  </div>
                  <p className="text-sm font-bold text-white uppercase tracking-widest">Add featured work</p>
                </div>

                {/* DISPLAY GROUPED PROJECTS */}
                {groupedWorks?.map((project: any, pIdx: number) => (
                  <div key={pIdx} className="group flex flex-col">
                    <div
                      className="h-[350px] rounded-lg lg:rounded-2xl overflow-hidden border border-white/10 bg-[#111] relative cursor-pointer"
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
                          {/* Inside groupedWorks map */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete('project', project); // project contains all image objects
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-full text-[10px] font-bold hover:bg-red-50 transition-colors shadow-lg"
                          >
                            <Trash2 size={14} /> Delete Project
                          </button>
                          <button className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors shadow-lg">
                            <Edit3 size={16} />
                          </button>
                        </div>

                        <div className="self-center">
                          <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-white border border-white/20">
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
                      <h4 className="text-base font-bold text-white tracking-tight">{project.title}</h4>
                      {
                        project?.tag &&
                        <p className="text-xs text-[#E8D1AB] mt-1 opacity-80 font-medium">#{project.tag}</p>
                      }
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
                />
              ) : (
                <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl p-4 lg:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* ADD CARD */}
                    <div
                      onClick={() => certInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-lg lg:rounded-2xl h-[220px] flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#E8D1AB]/40 cursor-pointer transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={20} className="text-[#E8D1AB]" />
                      </div>
                      <p className="text-sm font-bold text-white mb-1">Add Certificate</p>
                      <p className="text-[10px] text-white/40 text-center px-6">Highlight achievements with a professional certificate.</p>
                    </div>

                    {/* CERTIFICATE CARDS */}
                    {certifications.map((cert: any, index: number) => {
                      const isPDF = cert.file_path.toLowerCase().endsWith('.pdf');
                      const fileUrl = `${S3_BASE_URL}${cert.file_path}`;

                      return (
                        <div key={cert.id || index} className="relative group h-[220px] rounded-lg lg:rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0A]">
                          {/* Thumbnail (For PDF we show a placeholder or icon, for image we show the img) */}
                          {isPDF ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/20">
                              <FileText size={48} />
                              <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">PDF Document</span>
                            </div>
                          ) : (
                            <img src={fileUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-all" />
                          )}

                          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                            <p className="text-xs font-bold text-white">Certificate_{index + 1}</p>
                          </div>

                          {/* HOVER ACTIONS */}
                          <div className="absolute top-4 right-4 flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => setPreviewCert(cert)}
                              className="p-2 bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-lg transition-all"
                            >
                              <Eye size={16} />
                            </button>
                            {/* Inside certifications map */}
                            <button
                              onClick={() => confirmDelete('file', cert)}
                              className="p-2 bg-white/10 backdrop-blur-md hover:bg-red-500 text-white rounded-lg transition-all"
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
            <div className="animate-in fade-in duration-500"> {/* Removed flex-center classes here */}
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
                    />
                  );
                }

                // RESUME CARD (Wrapped in a flex container ONLY when data exists to keep it centered)
                return (
                  <div className="flex justify-center py-4 lg:py-10">
                    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-12 w-full max-w-lg relative flex flex-col items-center justify-center text-center shadow-2xl">

                      {/* Delete Icon (Top Right) */}
                      <button
                        onClick={() => confirmDelete('file', resumeFile)}
                        className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 rounded-full border border-white/5 transition-all"
                        title="Delete Resume"
                      >
                        <Trash2 size={18} />
                      </button>

                      {/* File Icon Box */}
                      <div className="w-16 h-20 bg-white border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <div className="relative">
                          <FileText size={40} className="text-red-500" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-black">
                            PDF
                          </div>
                        </div>
                      </div>

                      {/* File Details */}
                      <h3 className="text-xl font-bold text-white mb-1">My Resume</h3>
                      <p className="text-sm text-white/40 mb-10 font-medium">
                        Uploaded on {new Date(resumeFile.created_at || Date.now()).toLocaleDateString()}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => window.open(`${S3_BASE_URL}${resumeFile.file_path}`, '_blank')}
                          className="bg-white text-black font-bold px-10 py-3.5 rounded-2xl hover:bg-[#E8D1AB] transition-all active:scale-95 shadow-lg"
                        >
                          View File
                        </button>
                        <button
                          onClick={() => resumeInputRef.current?.click()}
                          className="bg-transparent text-white border border-white/10 font-bold px-10 py-3.5 rounded-2xl hover:bg-white/5 transition-all active:scale-95"
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
          {/* EQUIPMENTS TAB */}
          {activeTab === "Equipments" && (
            <div className="animate-in fade-in duration-500">
              <TabEmptyState
                title="List your equipment"
                description="Showcase the professional gear and tools you use to deliver high-quality results."
                buttonText="Add Equipment"
                footerText="Cameras, lenses, lighting, or any specialized gear you own."
              />
            </div>
          )}

        </div>
      </div>

      {/* FULL SCREEN LIGHTBOX VIEWER */}
      {lightboxData.isOpen && lightboxData.project && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-6">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">{lightboxData.project.title}</h3>
              <p className="text-xs text-white/40">Media {lightboxData.index + 1} of {lightboxData.project.images.length}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Inside Lightbox Top Bar */}
              <button
                onClick={() => confirmDelete('file', lightboxData.project.images[lightboxData.index])}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={16} /> Delete This Image
              </button>
              <button
                onClick={() => setLightboxData({ ...lightboxData, isOpen: false })}
                className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Main Content (Image + Arrows) */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <button
              className="absolute left-8 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-90"
              onClick={() => setLightboxData({ ...lightboxData, index: (lightboxData.index - 1 + lightboxData.project.images.length) % lightboxData.project.images.length })}
            >
              <ChevronLeft size={32} />
            </button>

            <div className="max-w-5xl w-full h-full flex items-center justify-center">
              <img
                src={`${S3_BASE_URL}${lightboxData.project.images[lightboxData.index].file_path}`}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                alt="Preview"
              />
            </div>

            <button
              className="absolute right-8 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-90"
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
                className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${lightboxData.index === idx ? 'border-[#E8D1AB] scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
              >
                <img src={`${S3_BASE_URL}${img.file_path}`} className="w-full h-full object-cover" />
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

      <FeaturedWorkModal
        open={isFeaturedModalOpen}
        onClose={() => setIsFeaturedModalOpen(false)}
        onAdd={handleAddProject}
      />
      <SocialLinksModal
        open={isSocialLinksModalOpen}
        onClose={() => setIsSocialLinksModalOpen(false)}
        links={socialLinks}
        onChange={handleSaveSocialLinks} // Pass the API handler here
      />
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteModal.title}
        description={deleteModal.description}
      />
      {isPageLoading && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#E8D1AB]" />
            <p className="text-sm tracking-wide text-white/80">
            </p>
          </div>
        </div>
      )}
    </>
    // </div>
  );
}