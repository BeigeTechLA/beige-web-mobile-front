"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Check, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { affiliateApi } from "@/lib/api";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

const shootTypeOptions = [
    "Private Event (Birthday Parties, Family Reunions, Baby Showers, VIP Events)",
    "Corporate Event (Conferences, Trade Shows, Company Retreats, Training, Ceremonies)",
    "Lifestyle Event (Social Gatherings, Concerts, Performances, Sports, Fashion Shows)",
    "Commercial Shoot (Product Photography, Social Media Content, Promotional Video)",
    "Portraiture (Portrait Photography, Family/Lifestyle, Fashion, Creative Projects)",
    "Special Projects (Documentaries, Short Films)",
    "Entertainment (Music Video, Podcast, Dance Performance)",
    "Other:",
];

const locationSpecOptions = ["Indoors", "Outdoors", "Both"];

interface FormData {
    email: string;
    fullName: string;
    phoneNumber: string;
    timeZone: string;
    // Step 3 fields
    onsiteContact: string;
    shootTypes: string[];
    otherShootType: string;
    projectOverview: string;
    numPeople: string;
    shootDate: string;
    additionalDates: string;
    agenda: string;
    startTime: string;
    address: string;
    mapLink: string;
    locationSpec: string[];
    scoutingRefs: string;
    shotList: string;
    visualRefs: string;
    specificInstructions: string;
    dressCode: string;
    // New fields for API
    postProductionIdeas?: string;
    preferredSongs?: string;
    additionalInfo: string;
    wantsToLearnMore?: boolean;
    rating?: number;
}

const initialFormData: FormData = {
    email: "",
    fullName: "",
    phoneNumber: "",
    timeZone: "",
    onsiteContact: "",
    shootTypes: [],
    otherShootType: "",
    projectOverview: "",
    numPeople: "",
    shootDate: "",
    additionalDates: "",
    agenda: "",
    startTime: "",
    address: "",
    mapLink: "",
    locationSpec: [],
    scoutingRefs: "",
    shotList: "",
    visualRefs: "",
    specificInstructions: "",
    dressCode: "",
    // New fields for API
    postProductionIdeas: "",
    preferredSongs: "",
    additionalInfo: "",
    wantsToLearnMore: true,
    rating: 5,
};

const timeZones = [
    "Central Time",
    "Pacific Time",
    "Eastern Time",
    "Mountain Time",
    "Hawaii Time",
    "Other:",
];

interface AffiliateShootDetailsFormProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: number;
    pendingProjects?: any[];
}

export const AffiliateShootDetailsForm = ({ isOpen, onClose, projectId: initialProjectId, pendingProjects = [] }: AffiliateShootDetailsFormProps) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId || pendingProjects[0]?.project_id);

    const handleSubmit = async () => {
        const token = Cookies.get("revure_token");
        if (!token) {
            toast.error("Authentication token missing. Please log in again.");
            return;
        }

        if (!selectedProjectId) {
            toast.error("Please select a project first.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                project_id: selectedProjectId,
                email: formData.email,
                full_name: formData.fullName,
                phone_number: formData.phoneNumber,
                time_zone: formData.timeZone,
                onsite_contact_info: formData.onsiteContact,
                project_types: formData.shootTypes,
                project_type_other: formData.otherShootType,
                brief_overview: formData.projectOverview,
                num_people_attending: formData.numPeople,
                event_date: formData.shootDate,
                additional_dates: formData.additionalDates,
                event_agenda: formData.agenda,
                service_times: formData.startTime,
                location_address: formData.address,
                google_maps_link: formData.mapLink,
                location_specification: formData.locationSpec,
                location_scouting_refs: formData.scoutingRefs,
                shot_list: formData.shotList,
                visual_references: formData.visualRefs,
                specific_instructions: formData.specificInstructions,
                creative_dress_code: formData.dressCode,
                post_production_ideas: formData.postProductionIdeas || "",
                preferred_songs: formData.preferredSongs || "",
                additional_info: formData.additionalInfo,
                wants_to_learn_more: formData.wantsToLearnMore ?? true,
                form_user_friendliness_rating: formData.rating ?? 5,
            };

            const response = await affiliateApi.submitProjectForm(token, payload);

            if (response.success) {
                toast.success(response.message || "Project form submitted successfully!");
                handleClose();
            } else {
                toast.error(response.message || "Failed to submit project form");
            }
        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error("An error occurred while submitting the form");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!selectedProjectId) {
                toast.error("Please select a project");
                return;
            }
            if (!formData.email) {
                toast.error("Please enter your email");
                return;
            }
        }
        if (step === 2) {
            if (!formData.fullName || !formData.phoneNumber || !formData.timeZone) {
                toast.error("Please fill in all required fields (Step 2)");
                return;
            }
        }
        if (step === 3) {
            // Required fields validation for Step 3
            if (
                !formData.onsiteContact ||
                (formData.shootTypes || []).length === 0 ||
                !formData.projectOverview ||
                !formData.numPeople ||
                !formData.shootDate ||
                !formData.agenda ||
                !formData.startTime ||
                !formData.address ||
                (formData.locationSpec || []).length === 0 ||
                !formData.shotList ||
                !formData.visualRefs ||
                !formData.dressCode
            ) {
                toast.error("Please fill in all required fields (Step 3)");
                return;
            }
        }
        if (step === 4) {
            // Step 4 is optional
        }
        if (step === 5) {
            // Required fields for Step 5
            if (formData.wantsToLearnMore === undefined || formData.rating === undefined) {
                toast.error("Please fill in all required fields (Step 5)");
                return;
            }
            handleSubmit();
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleClose = () => {
        onClose();
        // Delay resetting to allow exit animation
        setTimeout(() => {
            setStep(1);
            setFormData(initialFormData);
            setSelectedProjectId(initialProjectId || pendingProjects[0]?.project_id);
        }, 300);
    };

    const handleClear = () => {
        setFormData(initialFormData);
        setStep(1);
        setSelectedProjectId(initialProjectId || pendingProjects[0]?.project_id);
        toast.info("Form cleared");
    };

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl bg-[#0A0A0A] border-white/10 p-0 overflow-hidden shadow-[0_0_50px_rgba(232,209,171,0.1)] max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 lg:p-8 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent flex flex-row items-center justify-between space-y-0 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E8D1AB]/10 flex items-center justify-center border border-[#E8D1AB]/20">
                            <Sparkles className="text-[#E8D1AB]" size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white">Project Details</DialogTitle>
                            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-0.5">Step {step} of 5</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5 px-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? "w-8 bg-[#E8D1AB]" : s < step ? "w-4 bg-[#E8D1AB]/40" : "w-4 bg-white/10"
                                        }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </DialogHeader>

                <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-6 lg:p-10 space-y-8"
                            >
                                <div className="space-y-4">
                                    <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
                                        Welcome Aboard! <br />
                                        <span className="text-[#E8D1AB]">Tell Us About Your Project</span>
                                    </h1>
                                    <div className="space-y-3 text-white/50 text-sm leading-relaxed max-w-md">
                                        <p>Thank you for choosing Beige. We are thrilled to kickstart the planning of your project.</p>
                                        <p className="border-l-2 border-[#E8D1AB]/30 pl-4 py-1 italic">
                                            Please take a few moments to complete this form so we can prepare your shoot flawlessly.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Project Selection Dropdown */}
                                    {pendingProjects.length > 0 && (
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] ml-1">
                                                Select Project <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={selectedProjectId?.toString()}
                                                onValueChange={(value) => setSelectedProjectId(Number(value))}
                                            >
                                                <SelectTrigger className="w-full bg-[#111] border-white/5 text-white h-14 text-lg focus:ring-[#E8D1AB]/50 rounded-2xl px-6 transition-all hover:bg-[#151515]">
                                                    <SelectValue placeholder="Select a project..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                                                    {pendingProjects.map((project) => (
                                                        <SelectItem
                                                            key={project.project_id}
                                                            value={project.project_id.toString()}
                                                            className="focus:bg-[#E8D1AB] focus:text-black cursor-pointer"
                                                        >
                                                            {project.project_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Label htmlFor="email" className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] ml-1">
                                            Email Address <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative group">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="e.g. jaimin@gmail.com"
                                                value={formData.email}
                                                onChange={(e) => updateFormData("email", e.target.value)}
                                                className="bg-[#111] border-white/5 text-white h-14 text-lg focus:border-[#E8D1AB]/50 rounded-2xl px-6 transition-all group-hover:bg-[#151515]"
                                            />
                                            <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-hover:border-white/10 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-6 lg:p-8 space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="fullName" className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                                                Full Name
                                            </Label>
                                            <Input
                                                id="fullName"
                                                placeholder="John Doe"
                                                value={formData.fullName}
                                                onChange={(e) => updateFormData("fullName", e.target.value)}
                                                className="bg-[#111] border-white/5 text-white h-12 focus:border-[#E8D1AB]/50 rounded-xl px-5 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label htmlFor="phone" className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                                                Phone Number
                                            </Label>
                                            <Input
                                                id="phone"
                                                placeholder="+1 (555) 000-0000"
                                                value={formData.phoneNumber}
                                                onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                                                className="bg-[#111] border-white/5 text-white h-12 focus:border-[#E8D1AB]/50 rounded-xl px-5 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                                            Time Zone
                                        </Label>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                                            {timeZones.map((tz) => (
                                                <label
                                                    key={tz}
                                                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${formData.timeZone === tz
                                                        ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-[#E8D1AB]"
                                                        : "bg-[#111] border-white/5 text-white/50 hover:border-white/20 hover:text-white"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="timeZone"
                                                        value={tz}
                                                        checked={formData.timeZone === tz}
                                                        onChange={(e) => updateFormData("timeZone", e.target.value)}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.timeZone === tz ? "border-[#E8D1AB]" : "border-white/20 group-hover:border-white/40"
                                                        }`}>
                                                        {formData.timeZone === tz && (
                                                            <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium">{tz}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-6 lg:p-8 space-y-10"
                            >
                                {/* Section Header */}
                                <div className="rounded-2xl overflow-hidden border border-[#E8D1AB]/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                                    <div className="bg-[#673ab7] p-5">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            YOUR PROJECT
                                        </h3>
                                    </div>
                                    <div className="p-6 bg-[#111]/80 backdrop-blur-md space-y-3">
                                        <p className="text-white/80 text-sm leading-relaxed">
                                            In this section we kindly request that you share <span className="text-white font-bold">all the important details</span> with our production team, to truly <span className="text-white font-bold">understand your vision</span> and deliver the desired results you're hoping for.
                                        </p>
                                    </div>
                                </div>

                                {/* Onsite Contact */}
                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-base font-medium text-white block">
                                            Onsite Point of Contact (Name and Phone Number) <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative group">
                                            <Input
                                                placeholder="Your answer"
                                                value={formData.onsiteContact}
                                                onChange={(e) => updateFormData("onsiteContact", e.target.value)}
                                                className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* About Project - Shoot Types */}
                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            About Your Project <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">What type of shoot or event is your project about?</p>
                                    </div>
                                    <div className="space-y-4">
                                        {shootTypeOptions.map((option) => (
                                            <div key={option} className="flex items-center gap-3">
                                                <Checkbox
                                                    id={option}
                                                    checked={(formData.shootTypes || []).includes(option)}
                                                    onCheckedChange={(checked) => {
                                                        const currentTypes = formData.shootTypes || [];
                                                        const newTypes = checked
                                                            ? [...currentTypes, option]
                                                            : currentTypes.filter((t) => t !== option);
                                                        updateFormData("shootTypes", newTypes);
                                                    }}
                                                    className="w-5 h-5 border-white/20 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB]"
                                                />
                                                <div className="flex-1 flex items-center gap-2">
                                                    <Label htmlFor={option} className="text-sm text-white/80 cursor-pointer whitespace-nowrap">
                                                        {option}
                                                    </Label>
                                                    {option === "Other:" && (formData.shootTypes || []).includes("Other:") && (
                                                        <Input
                                                            placeholder="Your answer"
                                                            value={formData.otherShootType}
                                                            onChange={(e) => updateFormData("otherShootType", e.target.value)}
                                                            className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-6 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all flex-1"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Detail Description for Other */}
                                {(formData.shootTypes || []).includes("Other:") && (
                                    <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                        <div className="space-y-1">
                                            <Label className="text-base font-medium text-white block">
                                                About Your Project
                                            </Label>
                                            <p className="text-sm text-white/70">If you selected the option "Other", please describe your shoot or event.</p>
                                        </div>
                                        <Input
                                            placeholder="Your answer"
                                            value={formData.otherShootType}
                                            onChange={(e) => updateFormData("otherShootType", e.target.value)}
                                            className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
                                        />
                                    </div>
                                )}

                                {/* Overviews */}
                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Brief Overview <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            We invite you to give us an overview about your project by sharing how is it going to be and any other logistical details.
                                            <br />
                                            <span className="italic opacity-80 mt-1 block font-normal">Ex. "My birthday is going to take place at the Nobu restaurant LA from 5pm to 9pm.."</span>
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.projectOverview}
                                        onChange={(e) => updateFormData("projectOverview", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <Label className="text-base font-medium text-white block">
                                        Number of People Attending/Participating <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="Your answer"
                                        value={formData.numPeople}
                                        onChange={(e) => updateFormData("numPeople", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
                                    />
                                </div>

                                {/* Timing */}
                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Date Of Event/Shoot* <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">Please provide the date of your event/shoot.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs text-white/40">Date</span>
                                        <Input
                                            type="date"
                                            value={formData.shootDate}
                                            onChange={(e) => updateFormData("shootDate", e.target.value)}
                                            className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Additional Event/Shoot Date
                                        </Label>
                                        <p className="text-sm text-white/70">If your event/shoot is more than one day, please share the dates below.</p>
                                    </div>
                                    <Input
                                        placeholder="Your answer"
                                        value={formData.additionalDates}
                                        onChange={(e) => updateFormData("additionalDates", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Agenda of the Event <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            Let us know of the program flow of the event to better understand your expectations and align with them.
                                            <br />
                                            Example:
                                            <br />
                                            6 pm: Entrance
                                            <br />
                                            7 pm: Dance
                                            <br />
                                            8 pm: Dinner
                                            <br />
                                            <br />
                                            If you do not have any yet, please write 'TBD'
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.agenda}
                                        onChange={(e) => updateFormData("agenda", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Services Start & End Time <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            Let us know the expected start and end time of your shoot (including time zone of event).
                                            <br />
                                            Example: <span className="italic font-bold">10:00 am (PST) - 1:00 pm (PST)</span>
                                        </p>
                                    </div>
                                    <Input
                                        placeholder="Your answer"
                                        value={formData.startTime}
                                        onChange={(e) => updateFormData("startTime", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
                                    />
                                </div>

                                {/* Location Section */}
                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Location <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            If you know where your event/shoot is going to take place, please share the <span className="font-bold">exact address</span>.
                                            <br />
                                            If it's more than more location, please share the addresses in <span className="font-bold">chronological order</span>.
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.address}
                                        onChange={(e) => updateFormData("address", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <Label className="text-base font-medium text-white block">
                                        Google Map Link of Location
                                    </Label>
                                    <Input
                                        placeholder="Your answer"
                                        value={formData.mapLink}
                                        onChange={(e) => updateFormData("mapLink", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <Label className="text-base font-medium text-white block">
                                        Location Specification <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="space-y-4">
                                        {locationSpecOptions.map((opt) => (
                                            <div key={opt} className="flex items-center gap-3">
                                                <Checkbox
                                                    id={opt}
                                                    checked={(formData.locationSpec || []).includes(opt)}
                                                    onCheckedChange={(checked) => {
                                                        const currentSpecs = formData.locationSpec || [];
                                                        const newSpecs = checked
                                                            ? [...currentSpecs, opt]
                                                            : currentSpecs.filter((t) => t !== opt);
                                                        updateFormData("locationSpec", newSpecs);
                                                    }}
                                                    className="w-5 h-5 border-white/20 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB]"
                                                />
                                                <Label htmlFor={opt} className="text-sm text-white/80 cursor-pointer">{opt}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Location Scouting
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            If you selected the option "Location Scouting", please provide any references of what you're looking for.
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.scoutingRefs}
                                        onChange={(e) => updateFormData("scoutingRefs", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                {/* Shoot Specs */}
                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Shot List <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            If you have a shot list in mind (or an idea of the shots that <span className="italic">must</span> be taken), please share it below.
                                            <br />
                                            Example:
                                            <br />
                                            Close shots of the product
                                            <br />
                                            Wide angle shots of the venue and so on
                                            <br />
                                            <br />
                                            If you do not have any yet, please write 'TBD'
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.shotList}
                                        onChange={(e) => updateFormData("shotList", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Visual References <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            If you have video or photo samples that you'd like to recreate, please share a link for our team to view.
                                            <br />
                                            <br />
                                            You can refer to our previously curated videos
                                            <br />
                                            here: <a href="https://vimeo.com/beigevideo" target="_blank" rel="noopener noreferrer" className="text-[#E8D1AB] underline">https://vimeo.com/beigevideo</a>.
                                            <br />
                                            If you do not have any yet, please write 'TBD'
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.visualRefs}
                                        onChange={(e) => updateFormData("visualRefs", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Specific Instructions
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            Please let us know if you have any specific instructions (or requirements) for our creative partner on the day of the shoot e.g. specific video or photo gear, add-on services, check-in procedures
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.specificInstructions}
                                        onChange={(e) => updateFormData("specificInstructions", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Any Specific Dress Code for your Creative Partner <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            If there isn't any, Please write 'None'. If this is the case, please note your creative partner will show up Casual / Semi - Professional
                                        </p>
                                    </div>
                                    <Input
                                        placeholder="Your answer"
                                        value={formData.dressCode}
                                        onChange={(e) => updateFormData("dressCode", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Additional Information
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            If you have a particular request or any information you'd like us to know about, please share it here
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.additionalInfo}
                                        onChange={(e) => updateFormData("additionalInfo", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 px-6 lg:p-8"
                            >
                                <div className="rounded-xl overflow-hidden border border-[#673ab7]/30">
                                    <div className="bg-[#673ab7] p-4 text-center">
                                        <h3 className="text-white font-bold uppercase tracking-wider text-sm">POST PRODUCTION</h3>
                                    </div>
                                    <div className="bg-[#111] p-6 lg:p-8 text-center">
                                        <p className="text-white/70 text-sm">
                                            If you have a vision for your edited video (or photos), this is the space for you to share!
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Share here your creative ideas for Post Production with us!
                                        </Label>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.postProductionIdeas}
                                        onChange={(e) => updateFormData("postProductionIdeas", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Songs
                                        </Label>
                                        <p className="text-sm text-white/70">
                                            Are there particular songs or audio clips you'd like to include in your edited video?
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Your answer"
                                        value={formData.preferredSongs}
                                        onChange={(e) => updateFormData("preferredSongs", e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 min-h-[40px] focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 px-6 lg:p-8"
                            >
                                <div className="rounded-xl overflow-hidden border border-[#673ab7]/30">
                                    <div className="bg-[#673ab7] p-4 text-center">
                                        <h3 className="text-white font-bold uppercase tracking-wider text-sm">BEIGE PARTNER PROGRAM</h3>
                                    </div>
                                    <div className="bg-[#111] p-6 lg:p-8 space-y-4">
                                        <p className="text-white/70 text-sm leading-relaxed text-center">
                                            The Beige Partner Program is your ticket to earning rewards while spreading the word about our services. By referring friends and businesses, you can earn up to <span className="text-white font-bold">$100*</span> for each friend and up to <span className="text-white font-bold">$250*</span> for each business you bring in, all while granting them access to fantastic Beige Partner discounts. Join us today and be a part of something truly rewarding!
                                        </p>
                                        <p className="text-white/50 text-[10px] italic leading-relaxed text-center">
                                            *Businesses should be registered business booking a shoot to promote their business.
                                            <br />
                                            *The referral bonus will be up to $100 for any shoots that are booked for $1,000 or more; the referral bonus will be up to $250 for any shoots that are booked for $2,500 or more.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            Would you like to learn more? <span className="text-red-500">*</span>
                                        </Label>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: "I'm Interested!", value: true },
                                            { label: "Not Interested", value: false }
                                        ].map((option) => (
                                            <div key={option.label} className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateFormData("wantsToLearnMore", option.value)}
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantsToLearnMore === option.value ? 'border-[#E8D1AB] bg-[#E8D1AB]/10' : 'border-white/20 hover:border-white/40'}`}
                                                >
                                                    {formData.wantsToLearnMore === option.value && <div className="w-2.5 h-2.5 rounded-full bg-[#E8D1AB]" />}
                                                </button>
                                                <span className="text-sm text-white/80 cursor-pointer" onClick={() => updateFormData("wantsToLearnMore", option.value)}>
                                                    {option.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium text-white block">
                                            On a scale of 1-5, how user-friendly was this form? <span className="text-red-500">*</span>
                                        </Label>
                                    </div>
                                    <div className="flex justify-between items-center px-4">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <div key={num} className="flex flex-col items-center gap-2">
                                                <span className="text-xs text-white/50">{num}</span>
                                                <button
                                                    onClick={() => updateFormData("rating", num)}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${formData.rating === num ? 'border-[#E8D1AB] bg-[#E8D1AB]/10' : 'border-white/20 hover:border-white/40'}`}
                                                >
                                                    {formData.rating === num && <div className="w-3 h-3 rounded-full bg-[#E8D1AB]" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 lg:p-8 rounded-2xl bg-[#111]/50 border border-white/5 space-y-4">
                                    <Label className="text-base font-medium text-white block">Rights</Label>
                                    <p className="text-sm text-white/60 leading-relaxed italic">
                                        Please note client owns all rights to all videos in all formats and will be considered "work made for hire." Beige reserves the right to use footage in our corporate reel, but agrees to not send or distribute this file or footage to any 3rd party.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-6 lg:p-8 bg-[#111]/50 border-t border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <Button
                                onClick={handleBack}
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/5 h-10 rounded-lg px-6"
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="bg-white text-black hover:bg-white/90 font-medium h-10 rounded-lg px-6 transition-all min-w-[100px]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                step === 5 ? "Submit" : "Next"
                            )}
                        </Button>
                    </div>

                    <button
                        onClick={handleClear}
                        className="text-[#673ab7] hover:underline transition-all text-sm font-medium"
                    >
                        Clear form
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
