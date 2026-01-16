"use client"; // Ensure this runs only client-side

import { useState } from "react";
import { SOCIAL_ICONS } from "@/app/data/staticData";
import { Zap, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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

const ProfileCard = ({ data }) => {
  const rawRoles = data?.roles || (data?.role ? [data.role] : []);

  // Map IDs to labels and join them
  const roleNames = rawRoles
    .map(roleId => roleOptions.find(opt => opt.value === String(roleId))?.label)
    .filter(Boolean) // Remove any undefined results
    .join(", ");
  // --- ROLES LOGIC END ---

  const skills = data?.skills?.map(skillId => skillOptions.find(option => option.value === skillId)?.label).join(", ");
  const profileImage = data?.profilePreview || "/images/loginsignup/Group.png";

  const cleanBio = (value: string) => {
    return value.replace(/[ ]{3,}/g, "  ").replace(/\n{3,}/g, "\n\n")
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide flex flex-col gap-6 pb-20 
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* Profile Header */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-[#1a1a1a] overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
            <Image
              src={profileImage}
              alt="Profile Image"
              fill
              sizes="48px"
              priority
              className="object-contain p-1.0"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">
              {data?.firstName || "John"} {data?.lastName || "Doe"}
            </p>
            <p className="text-sm text-gray-400 truncate">{data?.location || "New York, USA"}</p>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-black font-semibold rounded-full text-sm hover:bg-gray-200 transition-colors shrink-0"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span className="hidden sm:inline">Details</span>
          </button>
        </div>

        {/* Social Links */}
        {data?.links?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {data?.links.map((link) => (
              <SocMedTab key={link.id} socMedItem={link} />
            ))}
          </div>
        )}

        {/* Stats / Details Grid */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data?.hourlyRate && (
              <div className="flex flex-col gap-[1px] md:col-span-1">
                <p className="text-base font-medium text-white">${data?.hourlyRate}</p>
                <p className="text-xs text-gray-400">/Hour</p>
              </div>
            )}
            {data?.yoe && (
              <div className="flex flex-col gap-[1px] md:col-span-1">
                <p className="text-base font-medium text-white">{data?.yoe}</p>
                <p className="text-xs text-gray-400">Experience</p>
              </div>
            )}
            {data?.workingDistance && (
              <div className="flex flex-col gap-[1px] col-span-2 md:col-span-2">
                <p className="text-base font-medium text-white whitespace-nowrap">
                  {data.workingDistance}
                </p>
                <p className="text-xs text-gray-400">Range</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {data?.email && (
              <div className="flex flex-col gap-[1px]">
                <p className="text-base font-medium text-white break-all">{data.email}</p>
                <p className="text-xs text-gray-400">Email</p>
              </div>
            )}
            {roleNames && (
              <div className="flex flex-col gap-[1px]">
                <p className="text-base font-medium text-white">{roleNames}</p>
                <p className="text-xs text-gray-400">Roles</p>
              </div>
            )}
          </div>
          {skills && (
            <div className="flex flex-col gap-[1px]">
              <p className="text-base font-medium text-white">{skills}</p>
              <p className="text-xs text-gray-400">Skills</p>
            </div>
          )}

          {data?.bio && (
            <div className="flex flex-col gap-[1px]">
              <p className="text-base font-medium text-white leading-relaxed whitespace-pre-wrap">{cleanBio(data.bio)}</p>
              <p className="text-xs text-gray-400">Bio</p>
            </div>
          )}

          {data?.equipments?.length > 0 && (
            <div className="flex flex-col gap-[1px]">
              <p className="text-base font-medium text-white">{data.equipmentNames?.join(", ")}</p>
              <p className="text-xs text-gray-400">Equipment</p>
            </div>
          )}
        </div>

        {/* Featured Work Images */}
        {data?.featuredWork?.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Featured Work</p>
            <div className="grid grid-cols-1 gap-4">
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

      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent pointer-events-none rounded-b-[32px]" />
    </div>
  );
};

export default ProfileCard;

const SocMedTab = ({ socMedItem }) => {
  const platform = SOCIAL_ICONS.find((p) => p.id === socMedItem.platform);

  return (
    <div className="flex gap-2 px-3 py-1 border border-[#9C8662] rounded-lg bg-[#1a1a1a]">
      {platform?.src ? (
        <img src={platform.src} alt={platform.label} className="w-5 h-5" />
      ) : platform?.icon ? (
        <platform.icon className="w-5 h-5 text-[#9C8662]" />
      ) : (
        <Globe className="w-5 h-5 text-[#9C8662]" />
      )}
      <span className="text-gray-300 text-sm">
        {socMedItem.name}
      </span>
    </div>
  );
};