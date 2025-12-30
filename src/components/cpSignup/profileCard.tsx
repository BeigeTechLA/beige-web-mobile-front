"use client"; // Ensure this runs only client-side

import { useState } from "react";
import { SOCIAL_ICONS } from "@/app/data/staticData";
import { Zap, Globe } from "lucide-react";
import Link from "next/link"; 
import Image from "next/image"; 

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

const ProfileCard = ({ data }) => {
    console.log(data)
  const role = roleOptions.find(option => option.value === data?.role)?.label || "";
  const skills = data?.skills?.map(skillId => skillOptions.find(option => option.value === skillId)?.label).join(", ");
  const profileImage = data?.profilePreview || "/images/loginsignup/profile_temp.png";

  return (
    <div className="flex flex-col gap-4 flex-grow overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
          <Image
            src={profileImage}
            alt="Profile Image"
            className="w-full h-full object-cover"
            width={48}
            height={48}
          />
        </div>
        <div className="w-2/5">
          <p className="font-semibold text-white">
            {data?.firstName !== "" ? data.firstName : "John"} {data?.lastName !== "" ? data.lastName : "Doe"}
          </p>
          <p className="text-sm text-gray-400">{data?.location || "New York, USA"}</p>
        </div>

        <button
          type="button"
          className="ml-auto flex items-center justify-center gap-2 px-3 py-2 bg-white text-black font-semibold rounded-full text-sm w-2/5 hover:bg-gray-200 transition-colors"
        >
          <Zap className="w-4 h-4 fill-black" />
          View Details
        </button>
      </div>

      {data?.links?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {data?.links.map((link) => (
            <SocMedTab key={link.id} socMedItem={link} />
          ))}
        </div>
      )}

      {Object.keys(data).length !== 0 && (
        <>
          <div className="flex flex-col gap-6">
            <div className="flex gap-6 items-center">
              {data?.hourlyRate !== "" && (
                <div className="flex flex-col gap-[1px] flex-1">
                  <p className="text-base font-medium text-white">${data?.hourlyRate}</p>
                  <p className="text-xs text-gray-400">/Hour</p>
                </div>
              )}

              {data?.yoe !== "" && (
                <div className="flex flex-col gap-[1px] flex-1">
                  <p className="text-base font-medium text-white">{data?.yoe}</p>
                  <p className="text-xs text-gray-400">Experience</p>
                </div>
              )}

              {data?.workingDistance && (
                <div className="flex flex-col gap-[1px] flex-1">
                  <p className="text-base font-medium text-white">{data.workingDistance}</p>
                  <p className="text-xs text-gray-400">Working Distance</p>
                </div>
              )}
            </div>

            <div className="flex gap-6 items-center">
              {data?.email && (
                <div className="flex flex-col gap-[1px] flex-1">
                  <p className="text-base font-medium text-white break-all">{data.email}</p>
                  <p className="text-xs text-gray-400">Email</p>
                </div>
              )}

              {role !== "" && (
                <div className="flex flex-col gap-[1px] flex-1">
                  <p className="text-base font-medium text-white">{role}</p>
                  <p className="text-xs text-gray-400">Role</p>
                </div>
              )}
            </div>
          </div>

          {skills && skills.length !== 0 && (
            <div className="flex gap-6">
              <div className="flex flex-col gap-[1px]">
                <p className="text-base font-medium text-white">{skills}</p>
                <p className="text-xs text-gray-400">Skills</p>
              </div>
            </div>
          )}

          {data?.bio && (
            <div className="flex gap-6">
              <div className="flex flex-col gap-[1px]">
                <p className="text-base font-medium text-white">{data.bio}</p>
                <p className="text-xs text-gray-400">Bio</p>
              </div>
            </div>
          )}

          {data?.equipments && data.equipments.length > 0 && (
            <div className="flex gap-6">
              <div className="flex flex-col gap-[1px]">
                <p className="text-base font-medium text-white">{data.equipments.join(", ")}</p>
                <p className="text-xs text-gray-400">Equipments</p>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-gray-400 text-sm mt-2">
        Let&apos;s complete your profile to help you discover the best opportunities.
      </p>

      {data?.featuredWork?.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          {data.featuredWork.map((work, index) => (
            <div
              key={index}
              className="w-[230px] h-[172px] py-4 px-3 flex items-end bg-center bg-cover bg-no-repeat rounded-lg"
              style={{
                backgroundImage: work?.image ? `url(${work.image})` : "none",
                backgroundColor: work?.image ? "transparent" : "#333",
              }}
            >
              <span className="text-sm font-medium text-white drop-shadow-md">
                {work.title}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full h-[70px] bg-gradient-to-t from-black/40 to-transparent rounded-b-2xl pointer-events-none" />
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