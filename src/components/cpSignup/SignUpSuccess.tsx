'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, Globe, ArrowRight, Mail, HardDrive } from "lucide-react"; // Added Mail and HardDrive
import { SOCIAL_ICONS } from "@/app/data/staticData";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

const roleOptions = [
  { value: "1", label: "Director" },
  { value: "2", label: "Camera Operator" },
  { value: "3", label: "Audio Engineer" },
  { value: "4", label: "Lighting Technician" },
  { value: "5", label: "Video Editor" },
  { value: "6", label: "Stream Engineer" },
  { value: "7", label: "Production Manager" },
  { value: "8", label: "Graphics Designer" },
  { value: "9", label: "Videographer" },
  { value: "10", label: "Photographers" },
];

const skillOptions = [
  { value: "13", label: "Director" },
  { value: "12", label: "Livestream Audio" },
  { value: "2", label: "Video Event" },
  { value: "3", label: "Video Music" },
  { value: "4", label: "Video Lifestyle" },
  { value: "5", label: "Photo Portrait" },
  { value: "6", label: "Photo Product" },
  { value: "7", label: "Photo Event" },
  { value: "8", label: "Photo Lifestyle" },
  { value: "9", label: "Audio Engineer" },
  { value: "10", label: "Creative Director" },
  { value: "11", label: "Livestream Director" },
  { value: "1", label: "Video Commercial" },
  { value: "14", label: "Video Weddings" },
  { value: "15", label: "Photo Weddings" },
  { value: "16", label: "Portrait Photo" },
  { value: "17", label: "Cinematographer" },
];

export default function SignupSuccess({ data }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const roleLabel = roleOptions.find(opt => opt.value === data?.role)?.label || "Creative";
  const skillLabels = data?.skills?.map(id => skillOptions.find(opt => opt.value === id)?.label).filter(Boolean).join(", ");
  const profileImage = data?.profilePreview || "/images/loginsignup/profile_temp.png";
  
  // Format equipment names for display
  const equipmentLabels = data?.equipmentNames?.length > 0 ? data.equipmentNames.join(", ") : null;

  const handleGoToDashboard = async () => {
    if (!data?.email || !data?.password) {
      toast.error("Missing credentials. Please try logging in manually.");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const result = await login({ email: data.email, password: data.password });
      toast.success(result.message || "Login successful!");
      const userTypeId = result?.user?.user_type_id;
      if (userTypeId === 1) router.push('/affiliate/dashboard');
      else if (userTypeId === 2) router.push('/creator/dashboard/request');
      else router.push('/dashboard');
    } catch (error) {
      toast.error("Auto-login failed.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#0A0A0A] px-4 py-12">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-16 h-16 bg-[#E8D1AB]/10 border border-[#E8D1AB]/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#E8D1AB]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Profile Completed!</h1>
        <p className="text-white/50 max-w-md text-sm">Review your live creative profile below.</p>
      </div>

      {/* DETAILED PROFILE CARD */}
      <div className="w-full max-w-xl bg-[#111111] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl mb-10">
        
        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8 
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Header Info */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
              <div className="absolute -bottom-1 -right-1 bg-[#E8D1AB] rounded-full p-1.5 border-2 border-[#111111]">
                <Zap size={14} className="text-black fill-black" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-white truncate">{data?.firstName} {data?.lastName}</h3>
              
              {/* Location */}
              <p className="text-white/50 flex items-center gap-1.5 text-sm mt-1">
                <Globe size={14} className="text-[#E8D1AB]" />
                {data?.location || "Location not set"}
              </p>
              
              {/* Email Address */}
              <p className="text-white/50 flex items-center gap-1.5 text-sm mt-1 truncate">
                <Mail size={14} className="text-[#E8D1AB]" />
                {data?.email || "Email not provided"}
              </p>
            </div>
            <span className="hidden sm:block bg-[#E8D1AB]/10 border border-[#E8D1AB]/30 text-[#E8D1AB] text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shrink-0">
              {roleLabel}
            </span>
          </div>

          {/* Socials */}
          {data?.links?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {data.links.map((link) => {
                const platform = SOCIAL_ICONS.find((p) => p.id === link.platform);
                return (
                  <div key={link.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
                    {platform?.src ? <img src={platform.src} className="w-4 h-4" /> : <Globe size={14} className="text-[#E8D1AB]" />}
                    {link.name}
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-white/5">
            <div className="flex flex-col"><p className="text-white text-lg font-semibold">${data?.hourlyRate || "0"}</p><p className="text-xs text-white/40 uppercase">Hourly Rate</p></div>
            <div className="flex flex-col"><p className="text-white text-lg font-semibold">{data?.yoe || "0"} Years</p><p className="text-xs text-white/40 uppercase">Experience</p></div>
            <div className="flex flex-col"><p className="text-white text-lg font-semibold">{data?.workingDistance || "Remote"}</p><p className="text-xs text-white/40 uppercase">Range</p></div>
          </div>

          {/* Bio, Skills & Equipment */}
          <div className="space-y-6">
            {skillLabels && (
              <div className="space-y-1">
                <p className="text-[10px] text-[#E8D1AB] uppercase font-bold">Skills</p>
                <p className="text-white/80 text-sm">{skillLabels}</p>
              </div>
            )}

            {/* Equipment Names Section */}
            {equipmentLabels && (
              <div className="space-y-1">
                <p className="text-[10px] text-[#E8D1AB] uppercase font-bold">Equipment</p>
                <p className="text-white/80 text-sm">{equipmentLabels}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-[10px] text-[#E8D1AB] uppercase font-bold">Bio</p>
              <p className="text-white/60 text-sm leading-relaxed">{data?.bio || "No bio provided."}</p>
            </div>
          </div>

          {/* Featured Work Grid */}
          {data?.featuredWork?.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] text-[#E8D1AB] uppercase font-bold tracking-wider">
                Featured Portfolio
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {data.featuredWork.map((work, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group bg-white/5">
                    <img src={work.image || "/images/placeholder.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={work.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <p className="absolute bottom-2 left-2 right-2 text-white text-[10px] md:text-xs font-medium truncate">
                      {work.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Fade */}
        <div className="h-12 w-full bg-gradient-to-t from-[#111111] to-transparent pointer-events-none -mt-12" />
      </div>

      {/* Button */}
      <div className="w-full max-w-xs">
        <Button disabled={loading} onClick={handleGoToDashboard} className="w-full h-14 rounded-full bg-[#E8D1AB] text-black font-bold hover:bg-[#dccaa9] flex items-center justify-center gap-2 group">
          {loading ? "Loading..." : "Go To Dashboard"}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}