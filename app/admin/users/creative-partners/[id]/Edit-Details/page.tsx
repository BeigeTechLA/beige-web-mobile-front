"use client";

import React, { useState, useRef, useEffect } from "react";
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
    PlusCircle,
    Globe,
    Trash2,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Added adminApi to the import
import { GetProfileCompletion, adminApi, completeCrewMemberProfile } from "@/lib/api";
import Image from "next/image";
import { formatCreatorRoles } from "@/lib/creatorRoles";
//import { CREATOR_ROLE_OPTIONS } from "@/lib/creatorRoles";
import { distanceOptions, PORTFOLIO_ICONS, SOCIAL_ICONS } from "@/app/data/staticData";
import { roleOptions, videographerSkills, photographerSkills, editorSkills } from "@/app/data/staticData";
import {
    LocationPicker,
    darkThemeColors,
    lightThemeColors
} from "@/src/components/booking/v2/component/LocationPicker";
import AddSkills from "@/src/components/cpSignup/addSkills";
import AddEquipments from "@/src/components/cpSignup/addEquipment";
import SocialLinksModal from "@/src/components/cpSignup/SocialLinksModal";
import PortfolioLinksModal from "@/src/components/cpSignup/PortfolioLinksModal";
import FeaturedWork from "@/src/components/cpSignup/FeaturedWork";
import AddCertification from "@/src/components/cpSignup/AddCertification";
import UploadResumePortfolio from "@/src/components/cpSignup/UploadResumePortfolio";
import CropProfileModal from "@/src/components/cpSignup/cropProfileModal";
import { compressImage } from "@/lib/utils";

interface Skill {
    id: string;
    name: string;
}

interface SelectedImageState {
    file: File;
    preview: string;
}


export default function EditUserDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const userId = params?.id as string;

    const isDark = true;

    // Personal Details State (Initialized as blank)

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [workingDistance, setWorkingDistance] = useState("");
    const [address, setAddress] = useState("");
    const [locationLatitude, setLocationLatitude] = useState<string | null>(null);
    const [locationLongitude, setLocationLongitude] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [longitude, setLongitude] = useState("");
    const [latitude, setLatitude] = useState("");

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || "Unknown Partner";
    // Professional Details State (Initialized as blank)
    const [primaryRoles, setPrimaryRoles] = useState<string[]>([]);
    const [yearsOfExperience, setYearsOfExperience] = useState("");
    const [hourlyRate, setHourlyRate] = useState("");
    const [bio, setBio] = useState("");

    // Skills State
    const [skills, setSkills] = useState<Skill[]>([]);
    const [newSkill, setNewSkill] = useState<string[]>([]);
    const [allSkills, setAllSkills] = useState<Skill[]>([]); // To store skills from API

    // Equipment State
    const [equipmentIds, setEquipmentIds] = useState<string[]>([]);
    const [equipmentNames, setEquipmentNames] = useState<string[]>([]);

    // Files State
    const [workImages, setWorkImages] = useState<File[]>([]);
    const [certifications, setCertifications] = useState([]);
    const [resume, setResume] = useState<any>(null);
    const [portfolio, setPortfolio] = useState<any[]>([]);
    const [profileProgress, setProfileProgress] = useState<any>(null);
    const [socialModalOpen, setSocialModalOpen] = useState(false);
    const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
    const [links, setLinks] = useState([]);
    const [portfolioLinks, setPortfolioLinks] = useState([]);
    const [featuredWork, setFeaturedWork] = useState([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const workImageInputRef = useRef<HTMLInputElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);
    const portfolioInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleDocumentMouseDown = (event: MouseEvent) => {
            const activeElement = document.activeElement as HTMLElement | null;
            if (!activeElement) return;

            const activeTag = activeElement.tagName;
            if (!["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) return;

            const target = event.target as HTMLElement | null;
            if (!target) return;

            if (activeElement.contains(target) || target.closest("input, textarea, select")) {
                return;
            }

            activeElement.blur();
        };

        document.addEventListener("mousedown", handleDocumentMouseDown);
        return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
    }, []);

    const progress = profileProgress?.overall_progress_percent ?? 0;
    const currentStep = profileProgress?.required_fields?.complete ?? 0;
    const totalSteps = profileProgress?.required_fields?.total ?? 0;
    const requiredCompleted = profileProgress?.required_fields?.complete ?? 0;
    const requiredTotal = profileProgress?.required_fields?.total ?? 0;
    const totalCompleted = profileProgress?.total_fields?.complete ?? 0;
    const totalFields = profileProgress?.total_fields?.total ?? 0;
    const completionNeeds = profileProgress?.completion_needs?.complete ?? 0;
    const completTotal = profileProgress?.completion_needs?.total ?? 0;
    const fieldsComplete = profileProgress?.fields_complete ?? "0/0";



    const parseSocialLinks = (value: string) => {
        if (!value) return [];

        try {
            let parsed = JSON.parse(value);

            if (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
            }

            return Object.entries(parsed).map(([platform, url], index) => ({
                id: index + 1,
                platform,
                name:
                    SOCIAL_ICONS.find(s => s.id === platform)?.label ??
                    platform,
                url,
            }));
        } catch {
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Profile Progress
                const progressRes = await GetProfileCompletion(userId);
                if (!progressRes.error) {
                    setProfileProgress(progressRes.data);
                }

                // 2. Fetch Crew Member Detail
                // Note: Assuming 'cleanId' in your prompt refers to the crew member's ID passed as 'userId' in route params
                const detailRes = await adminApi.getCrewMemberDetail(userId);
                if (!detailRes.error && detailRes.data) {
                    const data = detailRes.data;

                    const baseUrl =
                        process.env.NEXT_PUBLIC_S3_PREFIX ||
                        "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

                    const groupedWorks = Object.values(
                        (data.crew_member_files || [])
                            .filter((f: any) => f.file_type === "recent_work")
                            .reduce((acc: any, file: any) => {
                                const key = file.title || "Untitled";

                                if (!acc[key]) {
                                    acc[key] = {
                                        id: crypto.randomUUID(),
                                        title: key,
                                        tags: file.tag ? [file.tag] : [],
                                        previews: [],
                                    };
                                }

                                acc[key].previews.push(baseUrl + file.file_path);

                                return acc;
                            }, {})
                    );

                    setFeaturedWork(groupedWorks);

                    // Map basic fields
                    setFirstName(data.first_name || "");
                    setLastName(data.last_name || "");
                    setPhoneNumber(data.phone_number || "");
                    setEmail(data.email || "");
                    setBio(data.bio || "");

                    let location = data.location || "";
                    try {
                        while (
                            typeof location === "string" &&
                            (location.startsWith('"') || location.startsWith("'"))
                        ) {
                            location = JSON.parse(location);
                        }
                    } catch (err) {
                        console.error(err);
                    }

                    setAddress(location);

                    // Map Working Distance to match Select options
                    if (data.working_distance) {
                        const lower = data.working_distance.toLowerCase();
                        if (lower.includes("Upto 25 miles")) setWorkingDistance("Upto 25 Miles");
                        else if (lower.includes("Upto 50 miles")) setWorkingDistance("Upto 50 Miles");
                        else if (lower.includes("Upto 100 miles")) setWorkingDistance("Upto 100 Miles");
                        else if (lower.includes("any")) setWorkingDistance("Any Distance");
                        else setWorkingDistance(data.working_distance);
                    }

                    // Map Profile Picture
                    if (data.crew_member_files && data.crew_member_files.length > 0) {
                        const profileFile = data.crew_member_files.find((f: any) => f.file_type === "profile_photo");
                        if (profileFile) {
                            // TODO: Adjust the base URL according to your environment variable
                            const baseUrl = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";
                            setProfilePicture(baseUrl + profileFile.file_path);
                        }
                    }

                    // Map Years of Experience to match Select options ("01", "02" ... "10+")
                    if (data.years_of_experience !== null && data.years_of_experience !== undefined) {
                        const years = parseInt(data.years_of_experience.toString());
                        if (years >= 10) {
                            setYearsOfExperience("10+");
                        } else {
                            setYearsOfExperience(years.toString().padStart(2, '0'));
                        }
                    }

                    // Map Hourly Rate to match Select options ("$50 / hr", "$200 / hr", etc.)
                    if (data.hourly_rate) {
                        setHourlyRate(String(parseFloat(data.hourly_rate)));
                    }

                    if (data.primary_role) {
                        setPrimaryRoles(JSON.parse(data.primary_role));
                    }

                    // Map Skills
                    if (data.skills?.length) {
                        const selectedSkillIds = data.skills.map((s: any) => s.id.toString());
                        setNewSkill(selectedSkillIds);
                        setSkills(
                            data.skills.map((s: any) => ({
                                id: s.id.toString(),
                                name: s.name,
                            }))
                        );
                    }

                    if (Array.isArray(data.equipment_ownership)) {
                        setEquipmentIds(
                            data.equipment_ownership.map((item: any) =>
                                item.equipment_id.toString()
                            )
                        );

                        setEquipmentNames(
                            data.equipment_ownership.map((item: any) =>
                                item.equipment_name
                            )
                        );
                    }

                    if (data.social_media_links) {
                        setLinks(parseSocialLinks(data.social_media_links));
                    }

                    const portfolioLinks = (data.crew_member_files || [])
                        .filter((file: any) => file.file_type === "portfolio_link")
                        .map((file: any, index: number) => ({
                            id: index + 1,
                            platform: file.tag || "custom",
                            name:
                                file.title ||
                                PORTFOLIO_ICONS.find(
                                    p => p.id === file.tag
                                )?.label ||
                                "Untitled",
                            url: file.file_path,
                        }));

                    setPortfolioLinks(portfolioLinks);

                    const certs = (data.crew_member_files || [])
                        .filter((f: any) => f.file_type === "certifications")
                        .map((f: any, index: number) => ({
                            id: `cert-${index}`,
                            name: f.file_path.split("/").pop(),
                            size: "",
                            url: baseUrl + f.file_path,
                            file: null,
                        }));

                    setCertifications(certs);

                    const resumeFile = data.crew_member_files.find(
                        (f: any) => f.file_type === "resume"
                    );

                    if (resumeFile) {
                        setResume({
                            id: "resume",
                            name: resumeFile.file_path.split("/").pop(),
                            size: "",
                            url: baseUrl + resumeFile.file_path,
                            file: null,
                        });
                    }


                    const portfolioFiles = (data.crew_member_files || [])
                        .filter((f: any) => f.file_type === "portfolio")
                        .map((f: any, index: number) => ({
                            id: `portfolio-${index}`,
                            name: f.file_path.split("/").pop(),
                            size: "",
                            url: baseUrl + f.file_path,
                            file: null,
                        }));

                    setPortfolio(portfolioFiles);

                }

                // 3. Fetch Skills for the dropdown
                const skillsRes = await adminApi.getSkills();
                if (!skillsRes.error && skillsRes.data) {
                    setAllSkills(skillsRes.data.map((s: any) => ({ id: s.id.toString(), name: s.name })));
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load crew member details");
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    useEffect(() => {
        return () => {
            if (
                profilePicture &&
                profilePicture.startsWith("blob:")
            ) {
                URL.revokeObjectURL(profilePicture);
            }
        };
    }, [profilePicture]);

    const mergeUniqueSkills = (...lists) => {
        const map = new Map();
        lists.flat().forEach((skill) => {
            if (skill && !map.has(skill.value)) {
                map.set(skill.value, skill);
            }
        });
        return Array.from(map.values());
    };

    const getSkillOptionsByRole = () => {
        const listsToMerge = [];

        if (primaryRoles.includes("1")) {
            listsToMerge.push(videographerSkills);
        }

        if (primaryRoles.includes("2")) {
            listsToMerge.push(photographerSkills);
        }

        if (primaryRoles.includes("3")) {
            listsToMerge.push(editorSkills);
        }

        if (listsToMerge.length === 0) {
            return [];
        }

        return mergeUniqueSkills(...listsToMerge);
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            // --- FILE SIZE VALIDATION (5MB) ---
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File is too large. Maximum size allowed is 5MB.");
                // Reset the input so the user can try again
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            // ----------------------------------

            try {
                setIsCompressing(true);
                const compressedFile = await compressImage(file);

                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedImage({
                        file: compressedFile,
                        preview: reader.result as string
                    });
                    setCropModalOpen(true);
                    setIsCompressing(false);
                };

                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Compression failed:", error);
                setIsCompressing(false);
                toast.error("Failed to process image.");
            }
        }
    };

    const handleCropSave = (blob: Blob, previewUrl: string) => {
        const file = new File(
            [blob],
            selectedImage?.file?.name || "profile.jpg",
            {
                type: blob.type || "image/jpeg",
            }
        );

        setProfilePhotoFile(file);
        setProfilePicture(previewUrl);

        setCropModalOpen(false);
        setSelectedImage(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const handleSave = async () => {
        try {
            const socialMediaLinks = Object.fromEntries(
                links.map(link => [link.platform, link.url])
            );

            const response = await completeCrewMemberProfile(Number(userId), {
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
                location: address,
                latitude: locationLatitude,
                longitude: locationLongitude,
                working_distance: workingDistance,

                primary_role: primaryRoles,

                years_of_experience:
                    yearsOfExperience === "10+"
                        ? 10
                        : Number(yearsOfExperience),

                hourly_rate: Number(hourlyRate),

                bio,

                skills: newSkill,

                equipment_ownership: equipmentIds,

                // DON'T JSON.stringify here if your API helper already does it.
                social_media_links: socialMediaLinks,

                portfolio_links: portfolioLinks.map(link => ({
                    platform: link.platform,
                    url: link.url,
                })),

                certifications: [],

                availability: [],

                profile_photo: profilePhotoFile || undefined,

                portfolio: portfolio
                    .filter(item => item.file instanceof File)
                    .map(item => item.file),

                certification_files: certifications
                    .filter(item => item.file instanceof File)
                    .map(item => item.file),

                recent_work: featuredWork.flatMap(item => item.files || []),
            });

            console.log("Profile Update Response:", response);

            if (!response) {
                toast.error("No response received from server.");
                return;
            }

            if (response.error === false || response.success === true) {
                toast.success(response.message || "Profile updated successfully");
                router.back();
                return;
            }

            toast.error(
                response.message ||
                response.error ||
                "Failed to update profile."
            );

        } catch (error: any) {
            console.error("Profile Update Error:", error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong while updating the profile."
            );
        }
    };

    const handleBack = () => {
        router.back();
    };

    const toggleRole = (value: string) => {
        setPrimaryRoles(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    const selectedRoleLabels = primaryRoles.length > 0
        ? roleOptions
            .filter(role => primaryRoles.includes(role.value))
            .map(role => role.label)
            .join(", ")
        : "";

    const deleteLink = (id) => {
        setLinks((prev) => prev.filter((l) => l.id !== id));
    };

    const deletePortfolioLink = (id) => {
        setPortfolioLinks((prev) => prev.filter((l) => l.id !== id));
    };


    const inputClass = "h-9 w-full rounded-none border-0 bg-[#101010] px-0 py-0 text-base text-white placeholder:text-white/35 shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-none";
    const selectTriggerClass = "h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-base text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180";
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
                    <div className="rounded-2xl border border-[#E8D1AB]/30 bg-[#171717] p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#E8D1AB]">
                                Overall Progress: {progress}%
                            </span>
                            <span className="text-sm text-[#E8D1AB]">
                                {fieldsComplete}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#2B2B2B]">
                            <div
                                className="h-full rounded-full bg-[#E8D1AB] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-[#818181]">
                            {requiredCompleted}/{requiredTotal} Required Fields | {totalCompleted}/{totalFields} Total Fields | {completionNeeds}/{completTotal} Completion Needs
                        </p>
                    </div>

                    {/* Personal Details Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-medium text-white mb-4">Personal Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <fieldset className="rounded-2xl border border-white/30 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/60">
                                    First Name
                                </legend>
                                <Input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Enter first name"
                                    className={inputClass}
                                />
                            </fieldset>

                            <fieldset className="rounded-2xl border border-white/30 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/60">
                                    Last Name
                                </legend>
                                <Input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Enter last name"
                                    className={inputClass}
                                />
                            </fieldset>

                            <fieldset className="rounded-2xl border border-white/30 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/60">
                                    Email Address
                                </legend>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    disabled
                                    placeholder="Enter email address"
                                    className={inputClass}
                                />
                            </fieldset>
                            <fieldset className="rounded-2xl border border-white/30 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/60">
                                    Phone Number
                                </legend>
                                <Input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter phone number"
                                    className={inputClass}
                                />
                            </fieldset>

                            <fieldset className="rounded-2xl border border-white/25 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Working Distance
                                </legend>
                                <Select
                                    value={workingDistance}
                                    onValueChange={(value) => setWorkingDistance(value)}
                                >
                                    <SelectTrigger className={`${inputClass} text-left flex items-center border-white/20`}>
                                        <SelectValue placeholder="Select travel radius" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
                                        {distanceOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="focus:bg-[#E8D1AB] focus:text-black">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>

                                </Select>
                            </fieldset>

                            <fieldset className="md:col-span-2">
                                <LocationPicker
                                    value={address}
                                    onChange={(selectedAddress, details) => {
                                        setAddress(selectedAddress);
                                        const nextLatitude =
                                            details?.coordinates?.lat ?? details?.lat ?? details?.center?.[1] ?? null;
                                        const nextLongitude =
                                            details?.coordinates?.lng ?? details?.lng ?? details?.center?.[0] ?? null;
                                        setLocationLatitude(
                                            typeof nextLatitude === "number" && Number.isFinite(nextLatitude)
                                                ? nextLatitude.toString()
                                                : ""
                                        );

                                        setLocationLongitude(
                                            typeof nextLongitude === "number" && Number.isFinite(nextLongitude)
                                                ? nextLongitude.toString()
                                                : ""
                                        );
                                    }}
                                    placeholder="Search for an address"
                                    label="Address*"
                                    colors={isDark ? darkThemeColors : lightThemeColors}

                                />
                            </fieldset>
                        </div>

                        {/* Profile Picture */}
                        <div className="mt-4 rounded-t-2xl border-x border-t border-white/25 pb-4.5">
                            <div className="px-6.5 pt-6.5">
                                <legend className="text-base font-normal leading-none text-white">
                                    Profile Picture
                                </legend>
                                <p className="text-sm text-white/60">
                                    Add photo to build connection and trust
                                </p>
                            </div>
                        </div>
                        <div className="border-t border-white/25"></div>
                        <div className="rounded-b-2xl border-x border-b border-white/25 pt-4.5">
                            <div className="flex items-center gap-4 px-6.5 pb-6.5">
                                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0]">
                                    {profilePicture ? (
                                        <Image
                                            src={profilePicture}
                                            alt={fullName}
                                            fill
                                            sizes="20px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div
                                            className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isDark ? "bg-[#222] text-[#444]" : "bg-gray-100 text-gray-400"
                                                }`}
                                        >
                                            {fullName
                                                .split(" ")
                                                .map((n: string) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .substring(0, 2)}
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

                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90">
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
                            <fieldset className="rounded-2xl border border-white/25 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/55">
                                    Primary Role
                                </legend>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            className={`${selectTriggerClass} flex w-full items-center justify-between`}
                                        >
                                            <span
                                                className={
                                                    selectedRoleLabels
                                                        ? "text-white"
                                                        : "text-white/35"
                                                }
                                            >
                                                {selectedRoleLabels || "Select role"}
                                            </span>

                                            <ChevronDown className="h-4 w-4 opacity-70" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        align="start"
                                        className="w-[var(--radix-popover-trigger-width)] border-white/10 bg-[#111111] p-2"
                                    >
                                        <div className="space-y-1">
                                            {roleOptions.map((role) => (
                                                <div
                                                    key={role.value}
                                                    onClick={() => toggleRole(role.value)}
                                                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-white/10"
                                                >
                                                    <Checkbox
                                                        checked={primaryRoles.includes(role.value)}
                                                        onCheckedChange={() => toggleRole(role.value)}
                                                        className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                                    />

                                                    <span className="text-sm text-white">
                                                        {role.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </fieldset>

                            <fieldset className="rounded-2xl border border-white/25 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/55">
                                    Year of Experience
                                </legend>
                                <Select
                                    value={yearsOfExperience}
                                    onValueChange={(value) => setYearsOfExperience(value)}
                                >
                                    <SelectTrigger className={`${inputClass} text-left flex items-center border-white/20`}>
                                        <SelectValue placeholder="Select years" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
                                        <SelectItem value="01" className="focus:bg-[#E8D1AB] focus:text-black">01</SelectItem>
                                        <SelectItem value="02" className="focus:bg-[#E8D1AB] focus:text-black">02</SelectItem>
                                        <SelectItem value="03" className="focus:bg-[#E8D1AB] focus:text-black">03</SelectItem>
                                        <SelectItem value="04" className="focus:bg-[#E8D1AB] focus:text-black">04</SelectItem>
                                        <SelectItem value="05" className="focus:bg-[#E8D1AB] focus:text-black">05</SelectItem>
                                        <SelectItem value="06" className="focus:bg-[#E8D1AB] focus:text-black">06</SelectItem>
                                        <SelectItem value="07" className="focus:bg-[#E8D1AB] focus:text-black">07</SelectItem>
                                        <SelectItem value="08" className="focus:bg-[#E8D1AB] focus:text-black">08</SelectItem>
                                        <SelectItem value="09" className="focus:bg-[#E8D1AB] focus:text-black">09</SelectItem>
                                        <SelectItem value="10+" className="focus:bg-[#E8D1AB] focus:text-black">10+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            <fieldset className="md:col-span-2 rounded-2xl border border-white/30 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/60">
                                    Hourly Rate ($)
                                </legend>

                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    placeholder="Enter hourly rate"
                                    className={inputClass}
                                />
                            </fieldset>

                            <fieldset className="md:col-span-2 rounded-2xl border border-white/25 px-6.5 pb-3 pt-1.5">
                                <legend className="px-1 text-base leading-none text-white/55">
                                    Bio / About
                                </legend>
                                <Textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    placeholder="Tell clients about your experience and skills"
                                    className="min-h-[96px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-sm text-white placeholder:text-white/35 focus:ring-0"
                                />
                            </fieldset>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="mb-8">
                        <div className="rounded-2xl border border-white/25 p-6.5">
                            <h2 className="text-base font-medium text-white">Skills</h2>
                            <legend className="mb-2 text-sm leading-none text-white/55">
                                Select your core competencies
                            </legend>

                            <AddSkills
                                options={getSkillOptionsByRole()}
                                value={newSkill}
                                onChange={setNewSkill}
                                bg="bg-[#101010]"
                            />
                        </div>
                    </div>

                    {/* Equipment Ownership Section */}
                    <div className="mb-8">
                        <div className="rounded-2xl border border-white/25 p-6.5">
                            <h2 className="text-[15px] text-white">Equipment Ownership</h2>
                            <legend className="text-[11px] leading-none text-white/55">
                                List the gear you own or use
                            </legend>
                            <div className="flex gap-3 mt-3">
                                <AddEquipments
                                    value={equipmentIds}
                                    names={equipmentNames}
                                    onChange={(ids, names) => {
                                        setEquipmentIds(ids);
                                        setEquipmentNames(names);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Engagement Section */}
                    <div className="mb-8">
                        <h2 className="text-xl text-white mb-4">Social Engagement</h2>

                        {/* Social & Professional Links */}
                        <div className="rounded-2xl border border-white/25 p-6.5 mb-4">
                            <legend className="text-base leading-none text-white">
                                Social & Professional Links*
                            </legend>
                            <p className="text-sm text-white/60 mt-1 mb-2">Add links to your IMDb, LinkedIn, or Instagram</p>
                            {links.map((link) => (
                                <SocMedLink key={link.id} socmedItem={link} deleteLink={deleteLink} />
                            ))}
                            <button
                                type="button"
                                className="mt-3  inline-flex items-center gap-2 text-sm text-[#E8D1AB] hover:text-[#DCD1BE] transition-colors"
                                onClick={() => setSocialModalOpen(true)}
                            >
                                <div className="p-1.5 rounded-full border border-[#E8D1AB]/30 group-hover:bg-[#E8D1AB]/10">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span>Add Social links</span>
                            </button>
                        </div>

                        {/* Portfolio Links */}
                        <div className="rounded-2xl border border-white/25 p-6.5">
                            <legend className="text-base leading-none text-white">
                                Portfolio Links (Optional)
                            </legend>
                            <p className="text-sm text-white/60 mt-1 mb-2">Add YouTube, Vimeo, or Google Drive links to showcase your portfolio.</p>
                            {portfolioLinks.map((link) => (
                                <PortfolioLinkItem key={link.id} item={link} deleteLink={deletePortfolioLink} />
                            ))}
                            <button
                                type="button"
                                className="mt-3  inline-flex items-center gap-2 text-sm text-[#E8D1AB] hover:text-[#DCD1BE] transition-colors"
                                onClick={() => setPortfolioModalOpen(true)}
                            >
                                <div className="p-1.5 rounded-full border border-[#E8D1AB]/30 group-hover:bg-[#E8D1AB]/10">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span>Add Portfolio links</span>
                            </button>
                        </div>
                    </div>

                    {/* Showcase Your Work Section */}
                    <div className="mb-8">
                        <div className="rounded-2xl border border-white/25 p-6.5">
                            <FeaturedWork
                                value={featuredWork}
                                onChange={setFeaturedWork}
                                darkTheme={true}
                            />
                        </div>
                    </div>

                    {/* Certifications Section */}
                    <div className="mb-8">
                        <AddCertification
                            value={certifications}
                            onChange={setCertifications}
                            bg="lg:p-6.5 bg-[#101010]"
                        />

                    </div>

                    {/* Upload Documents Section */}
                    <div className="mb-8">
                        <UploadResumePortfolio
                            resume={resume}
                            setResume={setResume}
                            portfolio={portfolio}
                            setPortfolio={setPortfolio}
                            bgColour="lg:p-6.5 bg-[#101010]"
                            buttonBgColour="bg-white/5 hover:bg-white/10"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleBack}
                            variant="outline"
                            className="h-[38px] px-6 rounded-lg border border-white/25 bg-transparent text-[12px] text-white hover:bg-white/5"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="h-[38px] px-6 rounded-lg bg-[#E8D1AB] text-[12px] text-black hover:bg-[#d4c19f]"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {cropModalOpen && selectedImage && (
                <CropProfileModal
                    image={selectedImage.preview}
                    onClose={() => setCropModalOpen(false)}
                    onSave={handleCropSave}
                />
            )}

            <SocialLinksModal
                open={socialModalOpen}
                onClose={() => setSocialModalOpen(false)}
                links={links}
                onChange={setLinks}
                isDark={true}
            />

            <PortfolioLinksModal
                open={portfolioModalOpen}
                onClose={() => setPortfolioModalOpen(false)}
                links={portfolioLinks}
                onChange={setPortfolioLinks}
                isDark={true}
            />

        </div>
    );
}

const PortfolioLinkItem = ({ item, deleteLink }: { item: any, deleteLink: (id: any) => void }) => {
    const platform = PORTFOLIO_ICONS.find((p) => p.id === item.platform);
    return (
        <div className="mb-1 w-full flex-shrink-0 flex items-center justify-between bg-white/5 border border-white/10 px-3 py-2 rounded-[12px] hover:border-white/30 transition-all">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#1A1A1A] border border-white/10">
                    {platform?.icon ? (
                        <platform.icon className="w-5 h-5 text-[#E8D1AB]" />
                    ) : (
                        <Globe className="w-5 h-5 text-[#E8D1AB]" />
                    )}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-medium">
                        {item.name}
                    </span>
                    <span className="text-white/40 text-xs truncate">
                        {item.url}
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={() => deleteLink(item.id)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-red-500/10 group transition-colors"
            >
                <Trash2 size={18} className="text-white/40 group-hover:text-red-500" />
            </button>
        </div>
    );
};


const SocMedLink = ({ socmedItem, deleteLink }: { socmedItem: any, deleteLink: (id: any) => void }) => {
    const platform = SOCIAL_ICONS.find((p) => p.id === socmedItem.platform);
    return (
        <div className="mb-1 w-full flex-shrink-0 flex items-center justify-between bg-white/5 border border-white/10 px-3 py-2 rounded-[12px] hover:border-white/30 transition-all">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#1A1A1A] border border-white/10">
                    {platform?.src ? (
                        <img src={platform.src} alt="" className="w-5 h-5" />
                    ) : platform?.icon ? (
                        <platform.icon className="w-5 h-5 text-[#E8D1AB]" />
                    ) : (
                        <Globe className="w-5 h-5 text-[#E8D1AB]" />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-medium">
                        {socmedItem.name}
                    </span>
                    <span className="text-white/40 text-xs truncate">
                        {socmedItem.url}
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={() => deleteLink(socmedItem.id)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-red-500/10 group transition-colors"
            >
                <Trash2 size={18} className="text-white/40 group-hover:text-red-500" />
            </button>
        </div>
    );
};
