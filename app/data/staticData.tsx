import { Linkedin, Globe } from "lucide-react";

export const roleOptions = [
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

export const skillOptions = [
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
  { value: "14", label: "Video Weddings"},
  { value: "15", label: "Photo Weddings" },
  { value: "16", label: "Portrait Photo" },
  { value: "17", label: "Cinematographer" },
];

export const distanceOptions = [
  { value: "Upto 10 miles", label: "Upto 10 Miles" },
  { value: "10-20 miles", label: "10-20 Miles" },
  { value: "20-50 miles", label: "20-50 Miles" },
];

export const SOCIAL_ICONS = [
  { id: "facebook", label: "Facebook", src: "/images/socmed/fb.svg" },
  { id: "instagram", label: "Instagram", src: "/images/socmed/instagram.svg" },
  { id: "tiktok", label: "TikTok", src: "/images/socmed/tiktok.svg" },
  { id: "behance", label: "Behance", src: "/images/socmed/Behance.svg" },
  { id: "dribbble", label: "Dribbble", src: "/images/socmed/Dribble.svg" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "twitter", label: "Twitter / X", src: "/images/socmed/Twitter.svg" },
  { id: "custom", label: "Other / Custom URL", icon: Globe },
];

export const platformNames = {
  1: "Twitch",
  2: "Youtube",
  3: "Facebook",
  4: "Twitter",
  5: "LinkedIn",
  6: "Custom RTMP",
};
