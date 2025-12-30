'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, Globe, ArrowRight } from "lucide-react";
import { SOCIAL_ICONS } from "@/app/data/staticData";

const getShortLocation = (location) => {
  if (!location) return "California, US";
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const country = parts[parts.length - 1];
    const city = parts[parts.length - 3] || parts[parts.length - 2];
    return `${city}, ${country}`;
  }
  return location;
};

export default function SignupSuccess({ data }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Profile image fallback
  const profileImage = data?.profilePreview || "/images/loginsignup/profile_temp.png";

  const handleGoToDashboard = () => {
    setLoading(true);
    // Add navigation logic here
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0A0A0A] px-4 py-10">
      
      {/* SUCCESS ICON & BADGE */}
      <div className="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-[#E8D1AB]/10 border border-[#E8D1AB]/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-[#E8D1AB]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 text-center">
          Profile Completed.
        </h1>
        <p className="text-white/50 text-center max-w-md">
          Your creative profile is now live! You can now be discovered by top production teams and filmmakers.
        </p>
      </div>

      {/* THE UPDATED DARK THEME PROFILE PREVIEW CARD */}
      <div className="w-full max-w-[480px] bg-[#111111] border border-white/10 rounded-[32px] p-6 shadow-2xl mb-12 transform transition-all hover:scale-[1.02]">
        
        {/* HEADER: Avatar & Name */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profileImage}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover border border-white/10"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#E8D1AB] rounded-full p-1 border-2 border-[#111111]">
                <Zap size={12} className="text-black" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {data?.firstName || "John"} {data?.lastName || "Doe"}
              </h3>
              <p className="text-sm text-white/40 flex items-center gap-1">
                <Globe size={14} />
                {getShortLocation(data?.location)}
              </p>
            </div>
          </div>
          <span className="bg-white/5 border border-white/10 text-white/60 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
            Creative
          </span>
        </div>

        {/* STATS: Rate & Experience */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Hourly Rate</p>
            <p className="text-[#E8D1AB] text-lg font-bold">${data?.hourlyRate || "0"}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Experience</p>
            <p className="text-white text-lg font-bold">{data?.yoe || "0"} Years</p>
          </div>
        </div>

        {/* BIO */}
        <div className="mb-8">
          <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
            {data?.bio || "Creative professional ready to collaborate on innovative film and production projects."}
          </p>
        </div>

        {/* SOCIAL PILLS */}
        {data?.links?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {data.links.slice(0, 3).map((link) => {
              const platform = SOCIAL_ICONS.find((p) => p.id === link.platform);
              return (
                <div key={link.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/80">
                  {platform?.src ? (
                    <img src={platform.src} alt="" className="w-3.5 h-3.5 opacity-80" />
                  ) : (
                    <Globe size={14} className="text-[#E8D1AB]" />
                  )}
                  {link.name}
                </div>
              );
            })}
          </div>
        )}

        {/* FEATURED WORK PREVIEW */}
        {data?.featuredWork?.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {data.featuredWork.slice(0, 2).map((work, index) => (
              <div key={index} className="relative group overflow-hidden rounded-xl h-24 border border-white/10">
                <img
                  src={work.image || "/images/placeholder.png"}
                  alt={work.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md justify-center">
        <Button
          disabled={loading}
          onClick={handleGoToDashboard}
          className="h-14 px-8 rounded-full bg-[#E8D1AB] text-black font-bold hover:bg-[#dccaa9] transition-all flex items-center justify-center gap-2 text-base group"
        >
          {loading ? "Loading..." : "Go To Dashboard"}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}