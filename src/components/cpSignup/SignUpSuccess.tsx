'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, Globe, ArrowRight, Mail, HardDrive } from "lucide-react"; // Added Mail and HardDrive
import { SOCIAL_ICONS } from "@/app/data/staticData";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import type { FeaturedWorkItem } from "./FeaturedWork";

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

// Swiper Styles
import 'swiper/css';
import 'swiper/css/pagination';
import styles from './FeaturedWork.module.css'

const roleOptions = [
  { value: "9", label: "Videographer" },
  { value: "10", label: "Photographers" },
  { value: "11", label: "Editor" },
];

const skillOptions = [
 {
    value: "18",
    label: "Corporate Events",
    description: "Conferences, summits, company offsites",
  },
  {
    value: "19",
    label: "Weddings",
    description: "Ceremony, reception, highlight films",
  },
  {
    value: "20",
    label: "Private Events",
    description: "Parties, birthdays, celebrations",
  },
  {
    value: "21",
    label: "Commercial & Advertising",
    description: "Brand ads, promos, campaigns",
  },
  {
    value: "22",
    label: "Social Content",
    description: "Reels, TikToks, YouTube",
  },
  {
    value: "23",
    label: "Podcasts & Shows",
    description: "Video podcasts, livestreams",
  },
  {
    value: "24",
    label: "Music Videos",
    description: "Artist-led productions",
  },
  {
    value: "25",
    label: "Short Films & Narrative",
    description: "Scripted, cinematic stories",
  },
  {
    value: "26",
    label: "Brand & Product",
    description: "Products, lifestyle, e-commerce",
  },
  {
    value: "27",
    label: "People & Teams",
    description: "Headshots and portraits",
  },
  {
    value: "28",
    label: "Behind-the-Scenes",
    description: "Candid, production moments",
  },
  {
    value: "29",
    label: "Corporate Event Video Editor",
    description: "Conferences, summits, company offsites",
  },
  {
    value: "30",
    label: "Wedding Video Editor",
    description: "Ceremony, reception, highlight films",
  },
  {
    value: "31",
    label: "Private Event Video Editor",
    description: "Parties, birthdays, celebrations",
  },
  {
    value: "32",
    label: "Commercial & Advertising Video Editor",
    description: "Brand ads, promos, campaigns",
  },
  {
    value: "33",
    label: "Social Content Video Editor",
    description: "Reels, TikToks, YouTube",
  },
  {
    value: "34",
    label: "Podcasts & Shows Video Editor",
    description: "Video podcasts, livestreams",
  },
  {
    value: "35",
    label: "Music Videos Video Editor",
    description: "Artist-led productions",
  },
  {
    value: "36",
    label: "Short Films & Narrative Video Editor",
    description: "Scripted, cinematic stories",
  },

  // --- Photo Editing ---
  {
    value: "37",
    label: "Corporate Events Photo Editor",
    description: "Conferences, company gatherings",
  },
  {
    value: "38",
    label: "Weddings Photo Editor",
    description: "Ceremony and reception",
  },
  {
    value: "39",
    label: "Private Events Photo Editor",
    description: "Parties, celebrations",
  },
  {
    value: "40",
    label: "Brand & Product Photo Editor",
    description: "Products, lifestyle, e-commerce",
  },
  {
    value: "41",
    label: "Social Content Photo Editor",
    description: "Content for social platforms",
  },
  {
    value: "42",
    label: "People & Teams Photo Editor",
    description: "Headshots and portraits",
  },
  {
    value: "43",
    label: "Behind-the-Scenes Photo Editor",
    description: "Candid, production moments",
  },
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
      else if (userTypeId === 2) router.push('/creator/dashboard');
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Application Completed.</h1>
        <p className="text-white/50 max-w-md text-sm">Our team will review and get back to you shortly.</p>
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
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {data.featuredWork.map((work: FeaturedWorkItem, index: number) => {
                  const images = work.previews?.length ? work.previews : work.image ? [work.image] : [];

                  return (
                    <div
                      key={index}
                      className="w-full aspect-video relative rounded-xl overflow-hidden bg-zinc-900 group"
                    >
                      {images.length > 0 ? (
                        <Swiper
                          modules={[Pagination]}
                          pagination={{ clickable: true }}
                          className={`${styles.featuredSwiper} w-full h-full`}
                        >
                          {images.map((src, idx) => (
                            <SwiperSlide key={idx}>
                              <img
                                src={src}
                                alt={`${work.title} ${idx}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                              />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Globe className="w-8 h-8 text-white/10" />
                        </div>
                      )}

                      {/* Content Overlays */}
                      {/* <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10 pointer-events-none" /> */}
                      <span className="absolute bottom-4 left-4 z-20 text-sm font-medium text-white pointer-events-none">
                        {work.title}
                      </span>
                    </div>
                  );
                })}

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