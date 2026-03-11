"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, User, Mail, Phone, Globe, Calendar, Clock, MapPin, List, Eye, MessageSquare, Info, Star } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FormDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFormDetails = async () => {
            try {
                const response = await adminApi.getProjectForm(id);
                if (response?.success || response?.data) {
                    setFormData(response.data || response);
                } else if (response?.is_submitted === false) {
                    setFormData({ is_submitted: false, message: response.message });
                } else {
                    toast.error(response?.message || "Failed to fetch form details");
                }
            } catch (error) {
                console.error("Failed to fetch form details:", error);
                toast.error("An error occurred while fetching form details");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchFormDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
                <Loader2 className="animate-spin text-[#E5D5B8]" size={40} />
            </div>
        );
    }

    if (!formData || formData.is_submitted === false) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#0A0A0A] text-white p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                    <Info className="text-white/20" size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Submission Found</h2>
                <p className="text-white/40 max-w-md mb-8">
                    {formData?.message || "The client hasn't filled out the project details form for this shoot yet."}
                </p>
                <Button onClick={() => router.back()} className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-12 px-8 rounded-xl font-bold transition-all">
                    Go Back to Shoot
                </Button>
            </div>
        );
    }

    const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
        <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden mb-6">
            <div className="bg-[#1A1A1A] px-6 py-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#E5D5B8]/10 flex items-center justify-center border border-[#E5D5B8]/20">
                    <Icon className="text-[#E5D5B8]" size={18} />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{title}</h3>
            </div>
            <div className="p-6 space-y-6">
                {children}
            </div>
        </div>
    );

    const DataItem = ({ label, value, fullWidth = false }: { label: string; value: any; fullWidth?: boolean }) => (
        <div className={cn("space-y-1", fullWidth ? "col-span-full" : "")}>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</p>
            <div className="text-white/80 bg-white/5 rounded-xl px-4 py-3 border border-white/5 min-h-[44px]">
                {Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {value.map((item, idx) => (
                            <span key={idx} className="bg-[#E5D5B8]/10 text-[#E5D5B8] text-xs px-2 py-1 rounded-md border border-[#E5D5B8]/20">
                                {item}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap">{value || "N/A"}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold">Project Form Details</h1>
                            <p className="text-white/40 text-sm">Reviewing submission for #{id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#E5D5B8]/10 rounded-full border border-[#E5D5B8]/20">
                        <Sparkles className="text-[#E5D5B8]" size={16} />
                        <span className="text-[#E5D5B8] text-sm font-medium">Beige Admin Panel</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <Section title="Contact Information" icon={User}>
                        <DataItem label="Full Name" value={formData.full_name} />
                        <DataItem label="Email Address" value={formData.email} />
                        <DataItem label="Phone Number" value={formData.phone_number} />
                        <DataItem label="Time Zone" value={formData.time_zone} />
                        <DataItem label="Onsite Contact Info" value={formData.onsite_contact_info} fullWidth />
                    </Section>

                    <Section title="Project Overview" icon={Info}>
                        <DataItem label="Project Types" value={formData.project_types} fullWidth />
                        {formData.project_type_other && <DataItem label="Other Project Type" value={formData.project_type_other} fullWidth />}
                        <DataItem label="Brief Overview" value={formData.brief_overview} fullWidth />
                        <DataItem label="People Attending" value={formData.num_people_attending} />
                    </Section>

                    <Section title="Timing & Schedule" icon={Calendar}>
                        <DataItem label="Event Date" value={formData.event_date} />
                        <DataItem label="Service Times" value={formData.service_times} />
                        <DataItem label="Additional Dates" value={formData.additional_dates} fullWidth />
                        <DataItem label="Event Agenda" value={formData.event_agenda} fullWidth />
                    </Section>

                    <Section title="Location" icon={MapPin}>
                        <DataItem label="Address" value={formData.location_address} fullWidth />
                        <DataItem label="Google Maps Link" value={formData.google_maps_link} fullWidth />
                        <DataItem label="Location Specifications" value={formData.location_specification} fullWidth />
                        <DataItem label="Scouting References" value={formData.location_scouting_refs} fullWidth />
                    </Section>

                    <Section title="Creative Requirements" icon={Eye}>
                        <DataItem label="Shot List" value={formData.shot_list} fullWidth />
                        <DataItem label="Visual References" value={formData.visual_references} fullWidth />
                        <DataItem label="Specific Instructions" value={formData.specific_instructions} fullWidth />
                        <DataItem label="Dress Code" value={formData.creative_dress_code} fullWidth />
                    </Section>

                    <Section title="Post Production" icon={MessageSquare}>
                        <DataItem label="Post Production Ideas" value={formData.post_production_ideas} fullWidth />
                        <DataItem label="Preferred Songs" value={formData.preferred_songs} fullWidth />
                        <DataItem label="Additional Information" value={formData.additional_info} fullWidth />
                    </Section>

                    <Section title="Internal Feedback" icon={Star}>
                        <DataItem label="Wants to learn more" value={formData.wants_to_learn_more ? "Yes" : "No"} />
                        <DataItem label="Form Rating" value={`${formData.form_user_friendliness_rating || 0} / 5`} />
                    </Section>
                </div>

                <div className="mt-8 mb-12 flex justify-center">
                    <Button
                        onClick={() => router.back()}
                        className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-12 px-10 rounded-xl font-bold transition-all shadow-lg"
                    >
                        Finished Reviewing
                    </Button>
                </div>
            </div>
        </div>
    );
}
