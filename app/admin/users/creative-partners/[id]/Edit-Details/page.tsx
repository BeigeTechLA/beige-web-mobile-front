"use client";

import React, { useState, useRef } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    MapPin,
    ChevronDown,
    FileText,
    Award,
    Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Skill {
    id: string;
    name: string;
}

export default function EditUserDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const userId = params?.id as string;

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

    // Files State
    const [workImages, setWorkImages] = useState<File[]>([]);
    const [certifications, setCertifications] = useState<File[]>([]);
    const [resume, setResume] = useState<File | null>(null);
    const [portfolioDoc, setPortfolioDoc] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const workImageInputRef = useRef<HTMLInputElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);
    const portfolioInputRef = useRef<HTMLInputElement>(null);

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
            toast.success("Profile updated successfully");
            router.back();
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleBack = () => {
        router.back();
    };

    const inputClass = "h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white focus-visible:ring-0 placeholder:text-white/35";
    const selectTriggerClass = "h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180";
    const selectContentClass = "border-white/10 bg-[#111111] text-white";

    return (
        <div className="min-h-screen bg-[#101010]">
            <Topbar pathname={pathname} />
            <div className="flex">
                {/* Main Content */}
                <div className="flex-1 p-4 lg:p-6 lg:px-10 lg:py-9">
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 mb-6 text-sm text-white/70 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-white mb-2">
                            Complete Your Profile
                        </h1>
                        <p className="text-sm text-white/50">
                            Increase your visibility and booking potential.
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="rounded-xl border border-white/10 bg-[#101010] p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-white/55">
                                Overall Progress: {progress}%
                            </span>
                            <span className="text-[11px] text-white/55">
                                {completedFields}/{totalFields}
                            </span>
                        </div>
                        <div className="h-1 rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-[#E8D1AB] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-white/40">
                            {completedFields}/{requiredFields} Required Fields | {completedFields}/{totalFields} Total Fields | 0/3 Completion Needs
                        </p>
                    </div>

                    {/* Personal Details Section */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-medium text-white mb-4">Personal Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <fieldset className="rounded-xl border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    First Name
                                </legend>
                                <Input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={inputClass}
                                />
                            </fieldset>

                            <fieldset className="rounded-xl border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Last Name
                                </legend>
                                <Input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={inputClass}
                                />
                            </fieldset>

                            <fieldset className="rounded-xl border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Email Address
                                </legend>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className={inputClass}
                                />
                            </fieldset>

                            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Working Distance
                                </legend>
                                <Select
                                    value={workingDistance}
                                    onValueChange={(value) => setWorkingDistance(value)}
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select distance" />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClass}>
                                        <SelectItem value="Up to 10 Miles">Up to 10 Miles</SelectItem>
                                        <SelectItem value="Up to 25 Miles">Up to 25 Miles</SelectItem>
                                        <SelectItem value="Up to 50 Miles">Up to 50 Miles</SelectItem>
                                        <SelectItem value="Up to 100 Miles">Up to 100 Miles</SelectItem>
                                        <SelectItem value="Any Distance">Any Distance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            <fieldset className="md:col-span-2 rounded-xl border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55 flex items-center gap-2">
                                    Address
                                    <MapPin size={12} className="text-white/30" />
                                </legend>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className={inputClass}
                                />
                            </fieldset>
                        </div>

                        {/* Profile Picture */}
                        <div className="mt-4 rounded-t-xl border-x border-t border-white/25 px-4 pt-1.5 pb-3">
                            <legend className="p-2 text-sm font-normal leading-none text-white">
                                Profile Picture
                            </legend>

                            <p className="mt-2 text-[11px] text-white/40">
                                Add photo to build connection and trust
                            </p>
                        </div>
                        <div className="border-t border-white/25"></div>
                        <div className="rounded-b-xl border-x border-b border-white/25 px-4 py-4">
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0]">
                                    {profilePicture ? (
                                        <img
                                            src={profilePicture}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#222]">
                                            {firstName?.[0]}
                                            {lastName?.[0]}
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

                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white px-4 py-2.5 text-[13px] font-medium text-black transition-colors hover:bg-white/90">
                                        <Upload size={14} />
                                        Upload Profile Picture
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Professional Details Section */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-medium text-white mb-4">Professional Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Primary Role
                                </legend>
                                <Select
                                    value={primaryRole}
                                    onValueChange={(value) => setPrimaryRole(value)}
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClass}>
                                        <SelectItem value="Videographer">Videographer</SelectItem>
                                        <SelectItem value="Photographer">Photographer</SelectItem>
                                        <SelectItem value="Editor">Editor</SelectItem>
                                        <SelectItem value="Director">Director</SelectItem>
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Year of Experience
                                </legend>
                                <Select
                                    value={yearsOfExperience}
                                    onValueChange={(value) => setYearsOfExperience(value)}
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select years" />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClass}>
                                        <SelectItem value="01">01</SelectItem>
                                        <SelectItem value="02">02</SelectItem>
                                        <SelectItem value="03">03</SelectItem>
                                        <SelectItem value="04">04</SelectItem>
                                        <SelectItem value="05">05</SelectItem>
                                        <SelectItem value="06">06</SelectItem>
                                        <SelectItem value="07">07</SelectItem>
                                        <SelectItem value="08">08</SelectItem>
                                        <SelectItem value="09">09</SelectItem>
                                        <SelectItem value="10+">10+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            <fieldset className="md:col-span-2 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Hourly Rate ($)
                                </legend>
                                <Select
                                    value={hourlyRate}
                                    onValueChange={(value) => setHourlyRate(value)}
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select rate" />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClass}>
                                        <SelectItem value="$50 / hr">$50 / hr</SelectItem>
                                        <SelectItem value="$75 / hr">$75 / hr</SelectItem>
                                        <SelectItem value="$100 / hr">$100 / hr</SelectItem>
                                        <SelectItem value="$125 / hr">$125 / hr</SelectItem>
                                        <SelectItem value="$150 / hr">$150 / hr</SelectItem>
                                        <SelectItem value="$175 / hr">$175 / hr</SelectItem>
                                        <SelectItem value="$200 / hr">$200 / hr</SelectItem>
                                        <SelectItem value="$250 / hr">$250 / hr</SelectItem>
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            <fieldset className="md:col-span-2 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Bio / About
                                </legend>
                                <Textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    className="min-h-[96px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[13px] text-white placeholder:text-white/35 focus:ring-0"
                                />
                            </fieldset>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-medium text-white mb-4">Skills</h2>
                        <div className="rounded-[8px] border border-white/25 px-4 pb-4 pt-1.5">
                            <legend className="px-1 text-[11px] leading-none text-white/55">
                                Select your core competencies
                            </legend>
                            <div className="flex gap-3 mt-3">
                                <fieldset className="flex-1 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                                    <Select
                                        value={newSkill}
                                        onValueChange={(value) => setNewSkill(value)}
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Select Skills" />
                                        </SelectTrigger>
                                        <SelectContent className={selectContentClass}>
                                            <SelectItem value="Photo Product">Photo Product</SelectItem>
                                            <SelectItem value="Photo Event">Photo Event</SelectItem>
                                            <SelectItem value="Video Editing">Video Editing</SelectItem>
                                            <SelectItem value="Color Grading">Color Grading</SelectItem>
                                            <SelectItem value="Portrait Photography">Portrait Photography</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </fieldset>
                                <button
                                    onClick={handleAddSkill}
                                    className="h-9 px-4 rounded-[4px] bg-[#E8D1AB] text-[12px] font-medium text-black hover:bg-[#d4c19f] transition-colors flex items-center gap-2"
                                >
                                    <Plus size={14} />
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {skills.map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="inline-flex items-center gap-2 rounded-[4px] border border-white/25 bg-[#1A1A1A] px-3 py-1.5 text-[12px] text-white"
                                    >
                                        {skill.name}
                                        <button
                                            onClick={() => handleRemoveSkill(skill.id)}
                                            className="text-white/60 hover:text-white"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Equipment Ownership Section */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-medium text-white mb-4">Equipment Ownership</h2>
                        <div className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                            <legend className="px-1 text-[11px] leading-none text-white/55">
                                List the gear you own or use
                            </legend>
                            <Select
                                value={equipmentSearch}
                                onValueChange={(value) => setEquipmentSearch(value)}
                            >
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Please type the equipment's name to search" />
                                </SelectTrigger>
                                <SelectContent className={selectContentClass}>
                                    <SelectItem value="Camera Body - Sony A7III">Camera Body - Sony A7III</SelectItem>
                                    <SelectItem value="Camera Body - Canon R5">Camera Body - Canon R5</SelectItem>
                                    <SelectItem value="Lens - 24-70mm f/2.8">Lens - 24-70mm f/2.8</SelectItem>
                                    <SelectItem value="Lens - 70-200mm f/2.8">Lens - 70-200mm f/2.8</SelectItem>
                                    <SelectItem value="Lighting Kit">Lighting Kit</SelectItem>
                                    <SelectItem value="Tripod">Tripod</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Social Engagement Section */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-medium text-white mb-4">Social Engagement</h2>

                        {/* Social & Professional Links */}
                        <div className="rounded-[8px] border border-white/25 px-4 pb-4 pt-1.5 mb-4">
                            <legend className="px-1 text-[11px] leading-none text-white/55">
                                Social & Professional Links*
                            </legend>
                            <p className="text-[11px] text-white/40 mt-1">Add links to your IMDb, LinkedIn, or Instagram</p>
                            <button className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#E8D1AB] hover:text-[#d4c19f]">
                                <Plus size={14} />
                                Add Social links
                            </button>
                        </div>

                        {/* Portfolio Links */}
                        <div className="rounded-[8px] border border-white/25 px-4 pb-4 pt-1.5">
                            <legend className="px-1 text-[11px] leading-none text-white/55">
                                Portfolio Links (Optional)
                            </legend>
                            <p className="text-[11px] text-white/40 mt-1">Add YouTube, Vimeo, or Google Drive links to showcase your portfolio.</p>
                            <button className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#E8D1AB] hover:text-[#d4c19f]">
                                <Plus size={14} />
                                Add Portfolio links
                            </button>
                        </div>
                    </div>

                    {/* Showcase Your Work Section */}
                    <div className="mb-8">
                        <h2 className="mb-1 text-[15px] font-medium text-white">
                            Showcase Your Work*
                        </h2>

                        <p className="mb-4 text-[11px] text-white/55">
                            Upload images of your best work (.png, .jpg, .jpeg, .webp - Max 5).
                        </p>

                        <div className="rounded-[8px] border border-white/25 p-4">
                            {workImages.length === 0 ? (
                                <label className="flex min-h-[117px] w-full cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-white/20 transition-colors hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5">
                                    <input
                                        ref={workImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleWorkImagesUpload}
                                        className="hidden"
                                    />

                                    <div className="flex items-center gap-3 text-white/60">
                                        <Plus size={24} />
                                        <span className="text-xl">Add</span>
                                    </div>
                                </label>
                            ) : (
                                <div className="rounded-[8px] border border-dashed border-white/20 p-4">
                                    <div className="flex gap-4 overflow-x-auto">
                                        {workImages.map((image, index) => (
                                            <div
                                                key={index}
                                                className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg"
                                            >
                                                <img
                                                    src={URL.createObjectURL(image)}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />

                                                <button
                                                    onClick={() => handleRemoveWorkImage(index)}
                                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {workImages.length < 5 && (
                                            <label className="flex h-40 w-40 flex-shrink-0 cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-white/20 transition-colors hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleWorkImagesUpload}
                                                    className="hidden"
                                                />

                                                <Plus size={24} className="text-white/50" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Certifications Section */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-medium text-white mb-1">
                            Certifications (Optional)
                        </h2>
                        <p className="text-[11px] text-white/55 mb-4">Max 10 files</p>
                        <div className="rounded-[8px] border border-white/25 px-4 pb-4 pt-1.5">
                            <div className="space-y-3 mb-4">
                                {certifications.map((cert, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-[8px] bg-[#1A1A1A]">
                                        <div className="flex items-center gap-3">
                                            <Award className="text-[#E8D1AB]" size={16} />
                                            <span className="text-[13px] font-medium text-white">
                                                {cert.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveCertification(index)}
                                            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <label className="w-full py-10 rounded-[8px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5 transition-colors">
                                <input
                                    ref={certInputRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    onChange={handleCertificationsUpload}
                                    className="hidden"
                                />
                                <Upload size={20} className="text-white/50" />
                                <span className="text-[12px] font-medium text-white/50">Upload</span>
                            </label>
                        </div>
                    </div>

                    {/* Upload Documents Section */}
                    <div className="mb-8">
                        <h2 className="text-[15px] font-medium text-white mb-1">
                            Upload Documents (Optional)
                        </h2>
                        <p className="text-[11px] text-white/55 mb-4">Share your resume and portfolio to help studios and clients understand your experience better.</p>
                        <div className="rounded-[8px] border border-white/25 px-4 pb-4 pt-1.5 space-y-4">
                            <label className="w-full py-8 rounded-[8px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5 transition-colors">
                                <input
                                    ref={resumeInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setResume(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <FileText size={20} className="text-white/50" />
                                <span className="text-[12px] font-medium text-white/50">
                                    {resume ? resume.name : "Upload Resume"}
                                </span>
                            </label>
                            <label className="w-full py-8 rounded-[8px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#E8D1AB]/50 hover:bg-[#E8D1AB]/5 transition-colors">
                                <input
                                    ref={portfolioInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setPortfolioDoc(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <Briefcase size={20} className="text-white/50" />
                                <span className="text-[12px] font-medium text-white/50">
                                    {portfolioDoc ? portfolioDoc.name : "Upload Portfolio"}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleBack}
                            variant="outline"
                            className="h-[38px] px-6 rounded-[4px] border border-white/25 bg-transparent text-[12px] font-medium text-white hover:bg-white/5"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="h-[38px] px-6 rounded-[4px] bg-[#E8D1AB] text-[12px] font-medium text-black hover:bg-[#d4c19f]"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}