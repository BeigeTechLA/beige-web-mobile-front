import { Linkedin, Globe, Youtube, Video, HardDrive } from "lucide-react";

export const roleOptions = [
  // { value: "1", label: "Director" },
  // { value: "2", label: "Camera Operator" },
  // { value: "3", label: "Audio Engineer" },
  // { value: "4", label: "Lighting Technician" },
  // { value: "5", label: "Video Editor" },
  // { value: "6", label: "Stream Engineer" },
  // { value: "7", label: "Production Manager" },
  // { value: "8", label: "Graphics Designer" },
  { value: "1", label: "Videographer" },
  { value: "2", label: "Photographers" },
  { value: "3", label: "Editor" },
];

// export const skillOptions = [
//   { value: "13", label: "Director" },
//   { value: "12", label: "Livestream Audio" },
//   { value: "2", label: "Video Event" },
//   { value: "3", label: "Video Music" },
//   { value: "4", label: "Video Lifestyle" },
//   { value: "5", label: "Photo Portrait" },
//   { value: "6", label: "Photo Product" },
//   { value: "7", label: "Photo Event" },
//   { value: "8", label: "Photo Lifestyle" },
//   { value: "9", label: "Audio Engineer" },
//   { value: "10", label: "Creative Director" },
//   { value: "11", label: "Livestream Director" },
//   { value: "1", label: "Video Commercial" },
//   { value: "14", label: "Video Weddings"},
//   { value: "15", label: "Photo Weddings" },
//   { value: "16", label: "Portrait Photo" },
//   { value: "17", label: "Cinematographer" },
// ];

export const videographerSkills = [
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
];

export const photographerSkills = [
  {
    value: "18",
    label: "Corporate Events",
    description: "Conferences, company gatherings",
  },
  {
    value: "19",
    label: "Weddings",
    description: "Ceremony and reception",
  },
  {
    value: "20",
    label: "Private Events",
    description: "Parties, celebrations",
  },
  {
    value: "26",
    label: "Brand & Product",
    description: "Products, lifestyle, e-commerce",
  },
  {
    value: "22",
    label: "Social Content",
    description: "Content for social platforms",
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
];

export const editorSkills = [
  // --- Video Editing ---
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

export const distanceOptions = [
  { value: "Upto 50 miles", label: "Upto 50 Miles" },
  { value: "Upto 75 miles", label: "Upto 75 miles" },
  { value: "Upto 100 miles", label: "Upto 100 miles" },
  { value: "I’m open to traveling ", label: "I’m open to traveling " },
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

export const PORTFOLIO_ICONS = [
  { id: "google_drive", label: "Google Drive", icon: HardDrive },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "vimeo", label: "Vimeo", icon: Video },
];

export const platformNames = {
  1: "Twitch",
  2: "Youtube",
  3: "Facebook",
  4: "Twitter",
  5: "LinkedIn",
  6: "Custom RTMP",
};
