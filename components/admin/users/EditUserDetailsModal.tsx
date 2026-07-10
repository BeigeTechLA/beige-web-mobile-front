"use client";

import React, { useState, useRef } from "react";
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    MapPin,
    ChevronDown,
    Image as ImageIcon,
    FileText,
    Award,
    Link as LinkIcon,
    Globe,
    Briefcase,
    DollarSign,
    Calendar,
    Search
} from "lucide-react";
import { toast } from "sonner";

interface EditUserDetailsModalProps {
    userId?: string | number;
    isOpen?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
    isDark?: boolean;
}

interface Skill {
    id: string;
    name: string;
}

interface SocialLink {
    id: string;
    platform: string;
    url: string;
}

interface PortfolioLink {
    id: string;
    platform: string;
    url: string;
}

export default function EditUserDetailsModal({
    userId,
    isOpen = false,
    onSuccess,
    onCancel,
    isDark = true
}: EditUserDetailsModalProps) {
    // Personal Details State
    const [firstName, setFirstName] = useState("Ethan");
    const [lastName, setLastName] = useState("Carter");
    const [email, setEmail] = useState("ethanc4519@yahoo.com");
    const [workingDistance, setWorkingDistance] = useState("Up to 10 Miles");
    const [address, setAddress] = useState("218 East 5th Street, Los Angeles, California 90013, United States");
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    // Professional Details State
    const [primaryRole, setPrimaryRole] = useState("Videographer");
    const [yearsOfExperience, setYearsOfExperience] = useState("05");
    const [hourlyRate, setHourlyRate] = useState("$150 / hr");
    const [bio, setBio] = useState("A creative photographer with experience in events, lifestyle, and commercial shoots. Passionate about storytelling through visuals and committed to delivering.");

    // Skills State
    const [skills, setSkills] = useState<Skill[]>([
        { id: "1", name: "Photo Product" },
        { id: "2", name: "Photo Event" }
    ]);
    const [newSkill, setNewSkill] = useState("");

    // Equipment State
    const [equipmentSearch, setEquipmentSearch] = useState("");

    // Social Links State
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([]);

    // Files State
    const [workImages, setWorkImages] = useState<File[]>([]);
    const [certifications, setCertifications] = useState<File[]>([]);
    const [resume, setResume] = useState<File | null>(null);
    const [portfolioDoc, setPortfolioDoc] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const workImageInputRef = useRef<HTMLInputElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);

    // Progress calculation
    const progress = 43;
    const completedFields = 3;
    const requiredFields = 4;
    const totalFields = 7;

    const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            setSkills([...skills, { id: Date.now().toString(), name: newSkill.trim() }]);
            setNewSkill("");
        }
    };

    const handleRemoveSkill = (id: string) => {
        setSkills(skills.filter(skill => skill.id !== id));
    };

    const handleAddSocialLink = () => {
        setSocialLinks([...socialLinks, { id: Date.now().toString(), platform: "", url: "" }]);
    };

    const handleAddPortfolioLink = () => {
        setPortfolioLinks([...portfolioLinks, { id: Date.now().toString(), platform: "", url: "" }]);
    };

    const handleRemoveSocialLink = (id: string) => {
        setSocialLinks(socialLinks.filter(link => link.id !== id));
    };

    const handleRemovePortfolioLink = (id: string) => {
        setPortfolioLinks(portfolioLinks.filter(link => link.id !== id));
    };

    const handleWorkImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (workImages.length + files.length > 5) {
            toast.error("You can only upload maximum 5 images");
            return;
        }
        setWorkImages([...workImages, ...files]);
    };

    const handleRemoveWorkImage = (index: number) => {
        setWorkImages(workImages.filter((_, i) => i !== index));
    };

    const handleCertificationsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (certifications.length + files.length > 10) {
            toast.error("You can only upload maximum 10 files");
            return;
        }
        setCertifications([...certifications, ...files]);
    };

    const handleRemoveCertification = (index: number) => {
        setCertifications(certifications.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            // Save logic here
            toast.success("Profile updated successfully");
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const inputClass = `w-full h-14 rounded-xl border px-4 text-sm transition-all outline-none ${isDark
        ? "border-white/10 bg-[#101010] text-white placeholder:text-white/30 focus:border-[#E8D1AB]/50"
        : "border-[#E3E3E3] bg-white text-black placeholder:text-black/30 focus:border-[#E8D1AB]"
        }`;

    const labelClass = `text-sm font-medium mb-2 block ${isDark ? "text-white/90" : "text-black/80"}`;

    const sectionTitleClass = `text-lg lg:text-xl font-semibold mb-6 ${isDark ? "text-white" : "text-black"}`;

    const cardClass = `rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#101010]" : "border-[#E3E3E3] bg-white"}`;

    if (!isOpen) return null;

    return (
        <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
            {/* Backdrop */}
            < div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onCancel?.()
                }
            />

            {/* Modal Content */}
            <div className="relative min-h-screen">
                <div className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-[#F4F5F7]"}`}>
                    {/* Top Navigation */}
                    <div className={`border-b ${isDark ? "border-white/10 bg-[#0A0A0A]" : "border-[#E3E3E3] bg-white"}`}>
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-8">
                                <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>BEIGE</span>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={isDark ? "text-white/50" : "text-black/50"}>Creative Partner Profile Details</span>
                                    <span className={isDark ? "text-white/30" : "text-black/30"}>/</span>
                                    <span className={`font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#B8941F]"}`}>Edit Details</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto px-6 py-8">
                        {/* Back Button */}
                        <button
                            onClick={() => onCancel ? onCancel() : window.history.back()}
                            className={`flex items-center gap-2 mb-8 text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
                                }`}
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className={`text-2xl lg:text-3xl font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                                Complete Your Profile
                            </h1>
                            <p className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                                Increase your visibility and booking potential.
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className={`rounded-2xl border p-5 mb-10 ${isDark ? "border-white/10 bg-[#101010]" : "border-[#E3E3E3] bg-white"}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-sm font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>
                                    Overall Progress: {progress}%
                                </span>
                                <span className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                                    {completedFields}/{totalFields}
                                </span>
                            </div>
                            <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                                <div
                                    className="h-full rounded-full bg-[#E8D1AB] transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className={`mt-3 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                                {completedFields}/{requiredFields} Required Fields | {completedFields}/{totalFields} Total Fields | 0/3 Completion Needs
                            </p>
                        </div>

                        {/* Personal Details Section */}
                        <div className="mb-10">
                            <h2 className={sectionTitleClass}>Personal Details</h2>
                            <div className={cardClass}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                    <div>
                                        <label className={labelClass}>First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className={inputClass}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className={inputClass}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={inputClass}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Working Distance</label>
                                        <div className="relative">
                                            <select
                                                value={workingDistance}
                                                onChange={(e) => setWorkingDistance(e.target.value)}
                                                className={`${inputClass} appearance-none cursor-pointer`}
                                            >
                                                <option>Up to 10 Miles</option>
                                                <option>Up to 25 Miles</option>
                                                <option>Up to 50 Miles</option>
                                                <option>Up to 100 Miles</option>
                                                <option>Any Distance</option>
                                            </select>
                                            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <label className={labelClass}>Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className={`${inputClass} pr-12`}
                                            placeholder="Enter address"
                                        />
                                        <MapPin className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-white/30" : "text-black/30"}`} />
                                    </div>
                                </div>

                                {/* Profile Picture */}
                                <div className={`border-t pt-5 ${isDark ? "border-white/10" : "border-[#E3E3E3]"}`}>
                                    <div className="mb-2">
                                        <label className={labelClass}>Profile Picture</label>
                                        <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                                            Add photo to build connection and trust
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0]">
                                            {profilePicture ? (
                                                <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-[#222] font-semibold text-lg">
                                                    {firstName?.[0]}{lastName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <label className="cursor-pointer">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProfilePictureUpload}
                                                className="hidden"
                                            />
                                            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${isDark
                                                ? "border-white/10 bg-white text-black hover:bg-white/90"
                                                : "border-[#E3E3E3] bg-white text-black hover:bg-gray-50"
                                                }`}>
                                                <Upload size={16} />
                                                Upload Profile Picture
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Details Section */}
                        <div className="mb-10">
                            <h2 className={sectionTitleClass}>Professional Details</h2>
                            <div className={cardClass}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                    <div>
                                        <label className={labelClass}>Primary Role</label>
                                        <div className="relative">
                                            <select
                                                value={primaryRole}
                                                onChange={(e) => setPrimaryRole(e.target.value)}
                                                className={`${inputClass} appearance-none cursor-pointer`}
                                            >
                                                <option>Videographer</option>
                                                <option>Photographer</option>
                                                <option>Editor</option>
                                                <option>Director</option>
                                            </select>
                                            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Year of Experience</label>
                                        <div className="relative">
                                            <select
                                                value={yearsOfExperience}
                                                onChange={(e) => setYearsOfExperience(e.target.value)}
                                                className={`${inputClass} appearance-none cursor-pointer`}
                                            >
                                                <option value="01">01</option>
                                                <option value="02">02</option>
                                                <option value="03">03</option>
                                                <option value="04">04</option>
                                                <option value="05">05</option>
                                                <option value="06">06</option>
                                                <option value="07">07</option>
                                                <option value="08">08</option>
                                                <option value="09">09</option>
                                                <option value="10+">10+</option>
                                            </select>
                                            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <label className={labelClass}>Hourly Rate ($)</label>
                                    <div className="relative">
                                        <select
                                            value={hourlyRate}
                                            onChange={(e) => setHourlyRate(e.target.value)}
                                            className={`${inputClass} appearance-none cursor-pointer`}
                                        >
                                            <option>$50 / hr</option>
                                            <option>$75 / hr</option>
                                            <option>$100 / hr</option>
                                            <option>$125 / hr</option>
                                            <option>$150 / hr</option>
                                            <option>$175 / hr</option>
                                            <option>$200 / hr</option>
                                            <option>$250 / hr</option>
                                        </select>
                                        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Bio / About</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={4}
                                        className={`${inputClass} resize-none`}
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="mb-10">
                            <h2 className={sectionTitleClass}>Skills</h2>
                            <div className={cardClass}>
                                <p className={`text-sm mb-4 ${isDark ? "text-white/50" : "text-black/50"}`}>
                                    Select your core competencies
                                </p>
                                <div className="flex gap-3 mb-4">
                                    <div className="relative flex-1">
                                        <select
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            className={`${inputClass} appearance-none cursor-pointer`}
                                        >
                                            <option value="">Select Skills</option>
                                            <option>Photo Product</option>
                                            <option>Photo Event</option>
                                            <option>Video Editing</option>
                                            <option>Color Grading</option>
                                            <option>Portrait Photography</option>
                                        </select>
                                        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                    </div>
                                    <button
                                        onClick={handleAddSkill}
                                        className={`h-14 px-6 rounded-xl font-medium transition-colors ${isDark
                                            ? "bg-[#E8D1AB] text-black hover:bg-[#d4c19f]"
                                            : "bg-[#E8D1AB] text-black hover:bg-[#d4c19f]"
                                            }`}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill) => (
                                        <span
                                            key={skill.id}
                                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDark
                                                ? "border-white/10 bg-[#1A1A1A] text-white"
                                                : "border-[#E3E3E3] bg-white text-black"
                                                }`}
                                        >
                                            {skill.name}
                                            <button
                                                onClick={() => handleRemoveSkill(skill.id)}
                                                className={`hover:${isDark ? "text-white" : "text-black"}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Equipment Ownership Section */}
                        <div className="mb-10">
                            <h2 className={sectionTitleClass}>Equipment Ownership</h2>
                            <div className={cardClass}>
                                <p className={`text-sm mb-4 ${isDark ? "text-white/50" : "text-black/50"}`}>
                                    List the gear you own or use
                                </p>
                                <div className="relative">
                                    <select
                                        value={equipmentSearch}
                                        onChange={(e) => setEquipmentSearch(e.target.value)}
                                        className={`${inputClass} appearance-none cursor-pointer`}
                                    >
                                        <option value="">Please type the equipment's name to search</option>
                                        <option>Camera Body - Sony A7III</option>
                                        <option>Camera Body - Canon R5</option>
                                        <option>Lens - 24-70mm f/2.8</option>
                                        <option>Lens - 70-200mm f/2.8</option>
                                        <option>Lighting Kit</option>
                                        <option>Tripod</option>
                                    </select>
                                    <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                </div>
                            </div>
                        </div>

                        {/* Social Engagement Section */}
                        <div className="mb-10">
                            <h2 className={sectionTitleClass}>Social Engagement</h2>

                            {/* Social & Professional Links */}
                            <div className={`${cardClass} mb-5`}>
                                <div className="mb-4">
                                    <label className={`${labelClass} flex items-center gap-1`}>
                                        Social & Professional Links
                                        <span className="text-[#E8D1AB]">*</span>
                                    </label>
                                    <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                                        Add links to your IMDb, LinkedIn, or Instagram
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {socialLinks.map((link) => (
                                        <div key={link.id} className="flex gap-3">
                                            <div className="relative flex-1">
                                                <select className={`${inputClass} appearance-none`}>
                                                    <option>Instagram</option>
                                                    <option>LinkedIn</option>
                                                    <option>IMDb</option>
                                                    <option>YouTube</option>
                                                    <option>Vimeo</option>
                                                </select>
                                                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                            </div>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                className={`${inputClass} flex-[2]`}
                                            />
                                            <button
                                                onClick={() => handleRemoveSocialLink(link.id)}
                                                className={`h-14 w-14 rounded-xl border flex items-center justify-center transition-colors ${isDark
                                                    ? "border-white/10 text-white/50 hover:bg-white/5"
                                                    : "border-[#E3E3E3] text-black/50 hover:bg-black/5"
                                                    }`}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddSocialLink}
                                    className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${isDark ? "text-[#E8D1AB] hover:text-[#d4c19f]" : "text-[#B8941F] hover:text-[#9a7d1a]"
                                        }`}
                                >
                                    <Plus size={16} />
                                    Add Social links
                                </button>
                            </div>

                            {/* Portfolio Links */}
                            <div className={cardClass}>
                                <div className="mb-4">
                                    <label className={labelClass}>Portfolio Links (Optional)</label>
                                    <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                                        Add YouTube, Vimeo, or Google Drive links to showcase your portfolio.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {portfolioLinks.map((link) => (
                                        <div key={link.id} className="flex gap-3">
                                            <div className="relative flex-1">
                                                <select className={`${inputClass} appearance-none`}>
                                                    <option>YouTube</option>
                                                    <option>Vimeo</option>
                                                    <option>Google Drive</option>
                                                    <option>Personal Website</option>
                                                </select>
                                                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? "text-white/40" : "text-black/40"}`} />
                                            </div>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                className={`${inputClass} flex-[2]`}
                                            />
                                            <button
                                                onClick={() => handleRemovePortfolioLink(link.id)}
                                                className={`h-14 w-14 rounded-xl border flex items-center justify-center transition-colors ${isDark
                                                    ? "border-white/10 text-white/50 hover:bg-white/5"
                                                    : "border-[#E3E3E3] text-black/50 hover:bg-black/5"
                                                    }`}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddPortfolioLink}
                                    className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${isDark ? "text-[#E8D1AB] hover:text-[#d4c19f]" : "text-[#B8941F] hover:text-[#9a7d1a]"
                                        }`}
                                >
                                    <Plus size={16} />
                                    Add Portfolio links
                                </button>
                            </div>
                        </div>

                        {/* Showcase Your Work Section */}
                        <div className="mb-10">
                            <h2 className={`${sectionTitleClass} flex items-center gap-1`}>
                                Showcase Your Work
                                <span className="text-[#E8D1AB]">*</span>
                            </h2>
                            <div className={cardClass}>
                                <p className={`text-sm mb-4 ${isDark ? "text-white/50" : "text-black/50"}`}>
                                    Upload images of your best work (.png, .jpg, .jpeg, .webp - Max 5).
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    {workImages.map((image, index) => (
                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-[#1A1A1A]">
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt={`Work ${index + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                onClick={() => handleRemoveWorkImage(index)}
                                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {workImages.length < 5 && (
                                        <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${isDark
                                            ? "border-white/20 hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5"
                                            : "border-[#E3E3E3] hover:border-[#E8D1AB] hover:bg-[#E8D1AB]/5"
                                            }`}>
                                            <input
                                                ref={workImageInputRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleWorkImagesUpload}
                                                className="hidden"
                                            />
                                            <Plus size={24} className={isDark ? "text-white/50" : "text-black/50"} />
                                            <span className={`text-sm font-medium ${isDark ? "text-white/50" : "text-black/50"}`}>Add</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Certifications Section */}
                        <div className="mb-10">
                            <h2 className={sectionTitleClass}>Certifications (Optional)</h2>
                            <div className={cardClass}>
                                <p className={`text-sm mb-4 ${isDark ? "text-white/50" : "text-black/50"}`}>
                                    Max 10 files
                                </p>
                                <div className="space-y-3 mb-4">
                                    {certifications.map((cert, index) => (
                                        <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${isDark ? "bg-[#1A1A1A]" : "bg-[#F9F9F9]"}`}>
                                            <div className="flex items-center gap-3">
                                                <Award className={isDark ? "text-[#E8D1AB]" : "text-[#B8941F]"} size={20} />
                                                <span className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                                    {cert.name}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCertification(index)}
                                                className={`p-2 rounded-lg transition-colors ${isDark ? "text-white/40 hover:bg-white/5" : "text-black/40 hover:bg-black/5"}`}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <label className={`w-full py-12 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${isDark
                                    ? "border-white/20 hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5"
                                    : "border-[#E3E3E3] hover:border-[#E8D1AB] hover:bg-[#E8D1AB]/5"
                                    }`}>
                                    <input
                                        ref={certInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={handleCertificationsUpload}
                                        className="hidden"
                                    />
                                    <Upload size={24} className={isDark ? "text-white/50" : "text-black/50"} />
                                    <span className={`text-sm font-medium ${isDark ? "text-white/50" : "text-black/50"}`}>Upload</span>
                                </label>
                            </div>
                        </div>

                        {/* Upload Documents Section */}
                        <div className="mb-10">
                            <h2 className={sectionTitleClass}>Upload Documents (Optional)</h2>
                            <div className={cardClass}>
                                <p className={`text-sm mb-6 ${isDark ? "text-white/50" : "text-black/50"}`}>
                                    Share your resume and portfolio to help studios and clients understand your experience better.
                                </p>
                                <div className="space-y-4">
                                    <label className={`w-full py-10 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${isDark
                                        ? "border-white/20 hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5"
                                        : "border-[#E3E3E3] hover:border-[#E8D1AB] hover:bg-[#E8D1AB]/5"
                                        }`}>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setResume(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <FileText size={24} className={isDark ? "text-white/50" : "text-black/50"} />
                                        <span className={`text-sm font-medium ${isDark ? "text-white/50" : "text-black/50"}`}>
                                            {resume ? resume.name : "Upload Resume"}
                                        </span>
                                    </label>
                                    <label className={`w-full py-10 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${isDark
                                        ? "border-white/20 hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5"
                                        : "border-[#E3E3E3] hover:border-[#E8D1AB] hover:bg-[#E8D1AB]/5"
                                        }`}>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setPortfolioDoc(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <Briefcase size={24} className={isDark ? "text-white/50" : "text-black/50"} />
                                        <span className={`text-sm font-medium ${isDark ? "text-white/50" : "text-black/50"}`}>
                                            {portfolioDoc ? portfolioDoc.name : "Upload Portfolio"}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={() => onCancel ? onCancel() : window.history.back()}
                                className={`h-14 px-8 rounded-xl border font-medium text-base transition-colors ${isDark
                                    ? "border-[#8E8E8E] text-white hover:bg-white/5"
                                    : "border-[#E3E3E3] bg-white text-black hover:bg-black/5"
                                    }`}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSave}
                                className="h-14 px-8 rounded-xl bg-[#E8D1AB] text-black font-semibold text-base hover:bg-[#d4c19f] transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}