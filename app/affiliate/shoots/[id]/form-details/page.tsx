"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, User, Mail, Phone, Globe, Calendar, Clock, MapPin, List, Eye, MessageSquare, Info } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function FormDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className={`"flex h-screen items-center justify-center transition-colors duration-300 ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFCF6]"}`}>
        <Loader2 className={`animate-spin ${isDark? "text-[#E5D5B8]":"text-[#D4A75D]"}`} size={40} />
      </div>
    );
  }

  if (!formData || formData.is_submitted === false) {
    return (
      <div className={`flex h-screen flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#FFFCF6] text-black"}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border transition-colors ${isDark ? "bg-white/5 border-white/10" : "bg-[#F4F5F7] border-zinc-200"
          }`}>
          <Info className={isDark ? "text-white/20" : "text-[#0000004D]"} size={40} />
        </div>
        <h2 className="text-lg lg:text-2xl font-bold mb-2">No Submission Found</h2>
        <p className={`max-w-md mb-4 lg:mb-8 text-xs lg:text-sm ${isDark ? "text-white/40" : "text-[#00000099]"}`}>
          {formData?.message || "The client hasn't filled out the project details form for this shoot yet."}
        </p>
        <Button
          onClick={() => router.back()}
          className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-10 lg:h-12 px-4 lg:px-8 rounded-lg lg:rounded-xl font-bold transition-all shadow-sm active:scale-[0.99]"
        >
          Go Back to Shoot
        </Button>
      </div>
    );
  }

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className={`rounded-lg lg:rounded-2xl border overflow-hidden mb-6 transition-all duration-300 ${isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200/80 shadow-sm"
      }`}>
      <div className={`px-6 py-4 flex items-center gap-3 border-b transition-colors ${isDark ? "bg-[#1A1A1A] border-white/5" : "bg-zinc-50/70 border-zinc-100"}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${isDark ? "bg-[#E5D5B8]/10 border-[#E5D5B8]/20" : "bg-[#BFA780]/10 border-[#BFA780]/20"}`}>
          <Icon className={isDark ? "text-[#E5D5B8]":"text-[#D4A75D]"} size={18} />
        </div>
        <h3 className={`lg:text-lg font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-black"
          }`}>{title}</h3>
      </div>
      <div className="p-6 space-y-6">
        {children}
      </div>
    </div>
  );

  // Read-only Data Field Presentation Elements
  const DataItem = ({ label, value, fullWidth = false }: { label: string; value: any; fullWidth?: boolean }) => (
    <div className={`space-y-1 ${fullWidth ? "col-span-full" : ""}`}>
      <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-zinc-400"}`}>{label}</p>

      <div className={`rounded-lg lg:rounded-xl px-4 py-3 border lg:min-h-11 text-sm leading-relaxed transition-all ${isDark ? "text-white/80 bg-white/5 border-white/5" : "text-black bg-zinc-50/50 border-zinc-200/60"}`}>
        {Array.isArray(value) ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {value.map((item, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-0.5 rounded-md border font-medium transition-colors ${isDark ? "bg-[#E5D5B8]/10 text-[#E5D5B8] border-[#E5D5B8]/20" : "bg-[#BFA780]/10 text-[#7C6641] border-[#BFA780]/30"}`}
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
    <div className={`min-h-screen p-4 lg:p-8 overflow-y-auto transition-colors duration-300 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#FAFAFA] text-black"}`}>
      <div className="max-w-4xl mx-auto">

        {/* Dynamic Action Header Area */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              type="button"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 shadow-sm"
                }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className={`text-xl lg:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                Project Form Details
              </h1>
              <p className={`text-sm mt-0.5 ${isDark ? "text-white/40" : "text-zinc-400"
                }`}>
                Reviewing submission for #{id}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border  transition-colors bg-[#E5D5B8]/10 border-[#E5D5B8]/20`}>
            <Sparkles className={isDark ? "text-[#E5D5B8]":"text-[#D4A75D]"} size={16} />
            <span className={`text-xs font-medium tracking-wider ${isDark? "text-[#E5D5B8]":"text-[#D4A75D]"}`}>
              Beige Admin Panel
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
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

        <div className="mt-8 mb-12 flex justify-center">
          <Button
            onClick={() => router.back()}
            className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-10 lg:h-12 px-5 lg:px-10 rounded-xl font-bold transition-all shadow-lg"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}