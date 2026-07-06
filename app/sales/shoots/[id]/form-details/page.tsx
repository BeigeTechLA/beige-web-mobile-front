"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, Calendar, Eye, MessageSquare, Info, MapPin } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function SalesFormDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useResolvedTheme();

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
      <div className={`flex h-screen items-center justify-center transition-colors duration-300 ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFCF6]"}`}>
        <Loader2 className={`animate-spin ${isDark ? "text-[#E5D5B8]" : "text-[#D4A75D]"}`} size={40} />
      </div>
    );
  }

  if (!formData || formData.is_submitted === false) {
    return (
      <div className={`flex h-screen flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#FFFCF6] text-black"}`}>
        <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full border transition-colors ${isDark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-[#F4F5F7]"}`}>
          <Info className={isDark ? "text-white/20" : "text-[#0000004D]"} size={40} />
        </div>
        <h2 className="mb-2 text-lg font-bold lg:text-2xl">No Submission Found</h2>
        <p className={`mb-4 max-w-md text-xs lg:mb-8 lg:text-sm ${isDark ? "text-white/40" : "text-[#00000099]"}`}>
          {formData?.message || "The client hasn't filled out the project details form for this shoot yet."}
        </p>
        <Button
          onClick={() => router.back()}
          className="h-10 rounded-lg bg-[#E5D5B8] px-4 font-bold text-black shadow-sm transition-all hover:bg-[#d4c3a3] active:scale-[0.99] lg:h-12 lg:px-8 lg:rounded-xl"
        >
          Go Back to Shoot
        </Button>
      </div>
    );
  }

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className={`mb-6 overflow-hidden rounded-lg border transition-all duration-300 lg:rounded-2xl ${isDark ? "border-white/5 bg-[#111]" : "border-zinc-200/80 bg-white shadow-sm"}`}>
      <div className={`flex items-center gap-3 border-b px-6 py-4 transition-colors ${isDark ? "border-white/5 bg-[#1A1A1A]" : "border-zinc-100 bg-zinc-50/70"}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-[#E5D5B8]/20 bg-[#E5D5B8]/10" : "border-[#BFA780]/20 bg-[#BFA780]/10"}`}>
          <Icon className={isDark ? "text-[#E5D5B8]" : "text-[#D4A75D]"} size={18} />
        </div>
        <h3 className={`font-bold uppercase tracking-wider lg:text-lg ${isDark ? "text-white" : "text-black"}`}>{title}</h3>
      </div>
      <div className="space-y-6 p-6">{children}</div>
    </div>
  );

  const DataItem = ({ label, value, fullWidth = false }: { label: string; value: any; fullWidth?: boolean }) => (
    <div className={`space-y-1 ${fullWidth ? "col-span-full" : ""}`}>
      <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-zinc-400"}`}>{label}</p>
      <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed transition-all lg:min-h-11 lg:rounded-xl ${isDark ? "border-white/5 bg-white/5 text-white/80" : "border-zinc-200/60 bg-zinc-50/50 text-black"}`}>
        {Array.isArray(value) ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {value.map((item, idx) => (
              <span
                key={idx}
                className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${isDark ? "border-[#E5D5B8]/20 bg-[#E5D5B8]/10 text-[#E5D5B8]" : "border-[#BFA780]/30 bg-[#BFA780]/10 text-[#7C6641]"}`}
              >
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
    <div className={`min-h-screen overflow-y-auto p-4 transition-colors duration-300 lg:p-8 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#FAFAFA] text-black"}`}>
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-95 ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className={`text-xl font-bold tracking-tight lg:text-3xl ${isDark ? "text-white" : "text-black"}`}>
                Project Form Details
              </h1>
              <p className={`mt-0.5 text-sm ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                Reviewing submission for #{id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#E5D5B8]/20 bg-[#E5D5B8]/10 px-4 py-2 transition-colors">
            <Sparkles className={isDark ? "text-[#E5D5B8]" : "text-[#D4A75D]"} size={16} />
            <span className={`text-xs font-medium tracking-wider ${isDark ? "text-[#E5D5B8]" : "text-[#D4A75D]"}`}>
              Beige Sales Panel
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <Section title="Project Overview" icon={Info}>
            <DataItem label="Project Types" value={formData.project_types} fullWidth />
            {formData.project_type_other && <DataItem label="Other Project Type" value={formData.project_type_other} fullWidth />}
            <DataItem label="Brief Overview" value={formData.brief_overview} fullWidth />
            <DataItem label="People Attending" value={formData.num_people_attending} />
            <DataItem label="Onsite Contact Info" value={formData.onsite_contact_info} fullWidth />
          </Section>

          <Section title="Location" icon={MapPin}>
            <DataItem label="Address" value={formData.location_address} fullWidth />
            <DataItem label="Location Specifications" value={formData.location_specification} fullWidth />
            <DataItem label="Scouting References" value={formData.location_scouting_refs} fullWidth />
          </Section>

          <Section title="Timing & Schedule" icon={Calendar}>
            <DataItem label="Event Agenda" value={formData.event_agenda} fullWidth />
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
        </div>

        <div className="mb-12 mt-8 flex justify-center">
          <Button
            onClick={() => router.back()}
            className="h-10 rounded-xl bg-[#E5D5B8] px-5 font-bold text-black shadow-lg transition-all hover:bg-[#d4c3a3] lg:h-12 lg:px-10"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
