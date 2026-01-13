type Option = {
  label: string;
  value: string;
};

// ============================================
// SHOOT TYPES CATEGORIZED
// ============================================

export const videoShootTypes: { key: string; title: string; details: string; image: string; stats: Option[] }[] = [
  {
    key: "corporate", title: "Corporate Event", details: "Conferences, summits, company offsites", image: "/images/categories/corporate.jpg", stats: [
      { label: "People", value: "50-2K" },
      { label: "Duration", value: "3-8 hrs" }
    ]
  },
  {
    key: "wedding", title: "Wedding", details: "Ceremony and reception", image: "/images/categories/wedding.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "private", title: "Private Event", details: "Parties, celebrations", image: "/images/categories/private.jpg", stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" }
    ]
  },
  {
    key: "commercial", title: "Commercial & Advertising", details: "Brand ads, promos, campaigns", image: "/images/categories/commercial.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "social_content", title: "Social Content", details: "Reels, TikToks, Youtube", image: "/images/categories/social_content.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "podcast", title: "Podcasts & Shows", details: "Video podcasts, livestreams", image: "/images/categories/podcast.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "music", title: "Music Videos", details: "Artists-led productions", image: "/images/categories/music.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "short_film", title: "Short Films & Narrative", details: "Scripted, cinematic stories", image: "/images/categories/short_film.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
];

export const photoShootTypes: { key: string; title: string; details: string; image: string; stats: Option[] }[] = [
  {
    key: "corporate", title: "Corporate Events", details: "Conferences, summits, company offsites", image: "/images/categories/corporate.jpg", stats: [
      { label: "People", value: "50-2K" },
      { label: "Duration", value: "3-8 hrs" }
    ]
  },
  {
    key: "wedding", title: "Weddings", details: "Ceremony and reception", image: "/images/categories/wedding.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "private", title: "Private Events", details: "Parties, celebrations", image: "/images/categories/private.jpg", stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" }
    ]
  },
  {
    key: "brand_product", title: "Brand & Product", details: "Product photography, campaigns", image: "/images/categories/commercial.jpg", stats: [
      { label: "People", value: "N/A" },
      { label: "Duration", value: "3-8 hrs" }
    ]
  },
  {
    key: "social_content", title: "Social Content", details: "Instagram, LinkedIn, etc.", image: "/images/categories/social_content.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "people_teams", title: "People & Teams", details: "Headshots, team photos", image: "/images/categories/people_teams.jpg", stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" }
    ]
  },
  {
    key: "behind_scenes", title: "Behind-the-Scenes", details: "Candid shots, process", image: "/images/categories/behind_scenes.jpg", stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" }
    ]
  },
];

export const hybridShootTypes: { key: string; title: string; details: string; image: string; stats: Option[] }[] = [
  {
    key: "corporate", title: "Corporate Event", details: "Conferences, summits, company offsites", image: "/images/categories/corporate.jpg", stats: [
      { label: "People", value: "50-2K" },
      { label: "Duration", value: "3-8 hrs" }
    ]
  },
  {
    key: "wedding", title: "Wedding", details: "Ceremony and reception", image: "/images/categories/wedding.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "private", title: "Private Event", details: "Parties, celebrations", image: "/images/categories/private.jpg", stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" }
    ]
  },
  {
    key: "social_content", title: "Social Content", details: "Reels, TikToks, Youtube", image: "/images/categories/social_content.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "music", title: "Music Videos", details: "Artists-led productions", image: "/images/categories/music.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "brand_product", title: "Brand & Product", details: "Product photography, campaigns", image: "/images/categories/commercial.jpg", stats: [
      { label: "People", value: "N/A" },
      { label: "Duration", value: "3-8 hrs" }
    ]
  },
  {
    key: "commercial", title: "Commercial & Advertising", details: "Brand ads, promos, campaigns", image: "/images/categories/commercial.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" }
    ]
  },
  {
    key: "behind_scenes", title: "Behind-the-Scenes", details: "Candid shots, process", image: "/images/categories/behind_scenes.jpg", stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" }
    ]
  },
];

export const newshootTypes: { key: string; title: string; details: string; image: string; stats: Option[] }[] = [
  {
    key: "music", title: "Music Video", details: "Artists-led productions", image: "/images/categories/music.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "6-10 hrs" }
    ]
  },
  {
    key: "wedding", title: "Wedding", details: "Ceremony and reception", image: "/images/categories/wedding.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "6-10 hrs" }
    ]
  },
  {
    key: "commercial", title: "Commercial & Advertising", details: "Brand ads, promos, campaigns", image: "/images/categories/commercial.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "6-10 hrs" }
    ]
  },
  {
    key: "social_content", title: "Social Content", details: "Reels, TikToks, Youtube", image: "/images/categories/social_content.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "6-10 hrs" }
    ]
  },
  {
    key: "podcast", title: "Podcasts & Shows", details: "Video podcasts, livestreams", image: "/images/categories/podcast.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "6-10 hrs" }
    ]
  },
  {
    key: "short_film", title: "Short Films & Narrative", details: "Scripted, cinematic stories", image: "/images/categories/short_film.jpg", stats: [
      { label: "People", value: "50-300" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "6-10 hrs" }
    ]
  },
  {
    key: "corporate", title: "Corporate Events", details: "Conferences, summits, company offsites", image: "/images/categories/corporate.jpg", stats: [
      { label: "People", value: "50-2K" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "3-8 hrs" }
    ]
  },
  {
    key: "private", title: "Private Events", details: "Parties, celebrations", image: "/images/categories/private.jpg", stats: [
      { label: "People", value: "10-100" },
      { label: "Highlight Reel", value: "6-10 hrs" },
      { label: "Videographer", value: "6-10 hrs" },
      { label: "Hours", value: "2-5 hrs" }
    ]
  },
];

export const shootTypes: { key: string; value: string }[] = [
  { key: "music", value: "Music Video" },
  { key: "wedding", value: "Wedding" },
  { key: "commercial", value: "Commercial" },
  { key: "tv", value: "TV Series" },
  { key: "podcast", value: "Podcast" },
  { key: "short_film", value: "Short Films" },
  { key: "movie", value: "Movies" },
  { key: "corporate", value: "Corporate Events" },
  { key: "private", value: "Private Events" },
];

// ============================================
// VIDEO EDIT TYPES
// ============================================

export const corporateEventEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "mini_highlight_1_2", value: "Mini Highlight Video (1-2 mins)" },
  { key: "highlight_4_7", value: "Highlight Video (4-7 min)" },
  { key: "feature_30_40", value: "Feature Video (30-40 min)" },
];

export const weddingEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "mini_highlight_1_2", value: "Mini Highlight Video (1-2 mins)" },
  { key: "highlight_4_7", value: "Highlight Video (4-7 min)" },
  { key: "feature_30_40", value: "Feature Video (30-40 min)" },
];

export const privateEventEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "mini_highlight_1_2", value: "Mini Highlight Video (1-2 mins)" },
  { key: "highlight_4_7", value: "Highlight Video (4-7 min)" },
  { key: "feature_30_40", value: "Feature Video (30-40 min)" },
];

export const commercialEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "commercial_2_4", value: "Commercial (2 min-4 min)" },
  { key: "commercial_4_10", value: "Commercial (4 min-10 min)" },
];

export const socialContentEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "social_reel_2_4", value: "Social Media Reel (2 min-4 min)" },
];

export const podcastEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "full_podcast_15_30", value: "Full Length Podcast (15 min-30 min)" },
  { key: "full_podcast_30_60", value: "Longer Full Length Podcast (30 min-60 min)" },
];

export const musicEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "music_video_2_3", value: "Edited Music Video (2-3 min)" },
  { key: "music_video_vfx_2_3", value: "Edited Music Video with VFX (2-3 min)" },
];

export const shortFilmEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
  { key: "short_film_2_5", value: "Edited Short Film (2 Min-5 Min)" },
  { key: "short_film_5_10", value: "Edited Short Film (5 Min-10 Min)" },
];

// Legacy movie and TV types (keeping for backward compatibility)
export const tvSeriesEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
];

export const movieEditTypes: { key: string; value: string }[] = [
  { key: "social_reel_15_30", value: "Social Media Reel (15 sec-30 sec)" },
  { key: "social_reel_30_90", value: "Social Media Reel (30 sec-90 sec)" },
];

// ============================================
// PHOTO EDIT TYPES
// ============================================

export const corporateEventPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export const weddingPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "50 edited photos per hour for weddings" },
];

export const privateEventPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export const brandProductPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export const socialContentPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export const peopleTeamsPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export const behindScenesPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export const musicPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export const commercialPhotoEditTypes: { key: string; value: string; note?: string }[] = [
  { key: "edited_photos", value: "Edited Photos", note: "25 edited photos per hour" },
];

export type Addon = {
  id: string;
  label: string;
  price: number;
  isFlatRate?: boolean;
};

export const weddingEquipmentAddOns: Addon[] = [
  { id: "camera", label: "Additional Camera (flat rate)", price: 385 },
  { id: "teleprompter", label: "Teleprompter", price: 275 },
  { id: "drone", label: "Drone – Non-Corporate", price: 550 },
  { id: "lav", label: "Additional Lavalier Microphones (per mic)", price: 275 },
  { id: "lights", label: "Additional Lights", price: 385 },
  { id: "drive", label: "Hard Drive (flat rate)", price: 550 },
];

export const weddingEditingPostProductionAddOns: Addon[] = [
  { id: "sameDayEdit", label: "Same-Day Editing (per video)", price: 1100 },
  { id: "nextDayEdit", label: "Next-Day Editing (per video)", price: 825 },
  { id: "expeditedEdit", label: "Expedited Editing – 1 Week (per video)", price: 550 },
  { id: "additionalRevisions", label: "Additional Revisions (Editing)", price: 275 },
  { id: "photoAlbum", label: "Photo Album", price: 550 },
  { id: "onsiteEditor", label: "Onsite Editor (full day)", price: 1100 },
];

export const weddingArtistAddOns: Addon[] = [
  { id: "actorUpTo4hrs", label: "Actor (4 hours or less)", price: 385 },
  { id: "actor5to8hrs", label: "Actor (5–8 hours)", price: 770 },

  { id: "dancerUpTo4hrs", label: "Dancer (4 hours or less)", price: 385 },
  { id: "dancer5to8hrs", label: "Dancer (5–8 hours)", price: 770 },

  { id: "makeupUpTo4hrs", label: "Makeup Artist (up to 4 hours)", price: 1100 },
  { id: "makeup5to8hrs", label: "Makeup Artist (5–8 hours)", price: 2200 },

  { id: "hairUpTo4hrs", label: "Hair Stylist (up to 4 hours)", price: 1100 },
  { id: "hair5to8hrs", label: "Hair Stylist (5–8 hours)", price: 2200 },

  {
    id: "hairMakeupUpTo4hrs",
    label: "Hair + Makeup (one person doing both) – up to 4 hours",
    price: 1650,
  },
  {
    id: "hairMakeup5to8hrs",
    label: "Hair + Makeup (one person doing both) – 5 to 8 hours",
    price: 3300,
  },

  { id: "artistTravel", label: "Travel", price: 275 },
];

export const crewAndLaborAddOns: Addon[] = [
  { id: "production_assistant", label: "Production Assistant (per hour)", price: 220 },
  { id: "sound_engineer", label: "Sound Engineer (per hour)", price: 275 },
  { id: "director", label: "Director (per hour)", price: 275 },
  { id: "gaffer", label: "Gaffer – Lighting Technician (per hour)", price: 275 },
  { id: "onsite_editor", label: "Onsite Editor (full day)", price: 1100 },
];
export const equipmentAddOns: Addon[] = [
  { id: "additional_camera", label: "Additional Camera (flat rate)", price: 385 },
  { id: "teleprompter", label: "Teleprompter", price: 275 },
  { id: "drone_corporate", label: "Drone – Corporate", price: 1100 },
  { id: "drone_non_corporate", label: "Drone – Non-Corporate", price: 550 },
  { id: "lav_mic", label: "Additional Lavalier Microphones (per mic)", price: 275 },
  { id: "additional_lights", label: "Additional Lights", price: 385 },
  { id: "hard_drive", label: "Hard Drive (flat rate)", price: 550 },
];
export const artistAddOns: Addon[] = [
  { id: "actor_4hrs", label: "Actor (4 hours or less)", price: 385 },
  { id: "actor_8hrs", label: "Actor (5–8 hours)", price: 770 },
  { id: "dancer_4hrs", label: "Dancer (4 hours or less)", price: 385 },
  { id: "dancer_8hrs", label: "Dancer (5–8 hours)", price: 770 },
  { id: "makeup_4hrs", label: "Makeup Artist (up to 4 hours)", price: 1100 },
  { id: "makeup_8hrs", label: "Makeup Artist (5–8 hours)", price: 2200 },
  { id: "hair_4hrs", label: "Hair Stylist (up to 4 hours)", price: 1100 },
  { id: "hair_8hrs", label: "Hair Stylist (5–8 hours)", price: 2200 },
  {
    id: "hair_makeup_4hrs",
    label: "Hair + Makeup (one person doing both) – up to 4 hours",
    price: 1650,
  },
  {
    id: "hair_makeup_8hrs",
    label: "Hair + Makeup (one person doing both) – 5 to 8 hours",
    price: 3300,
  },
  { id: "artist_travel", label: "Travel", price: 275 },
];
export const scriptingAddOns: Addon[] = [
  { id: "script_10", label: "Script (0–10 minutes)", price: 550 },
  { id: "script_29", label: "Script (10–29 minutes)", price: 825 },
  { id: "script_60", label: "Script (30 minutes – 1 hour)", price: 1100 },
  { id: "script_travel", label: "Travel", price: 275 },
];
export const editingPostProductionAddOns: Addon[] = [
  { id: "same_day_edit", label: "Same-Day Editing (per video)", price: 1100 },
  { id: "next_day_edit", label: "Next-Day Editing (per video)", price: 825 },
  { id: "expedited_edit", label: "Expedited Editing – 1 Week (per video)", price: 550 },
  { id: "additional_revisions", label: "Additional Revisions (Editing)", price: 275 },
  { id: "photo_album", label: "Photo Album", price: 550 },
];
export const studioAndBackgroundAddOns: Addon[] = [
  { id: "green_screen", label: "Green Screen (flat rate per screen)", price: 550 },
  { id: "backdrop", label: "Backdrop (flat rate per backdrop)", price: 550 },
  {
    id: "photo_studio_basic",
    label: "Photo Studio Reservation – Basic (per hour)",
    price: 440,
  },
  {
    id: "video_studio_advanced",
    label: "Video Studio Reservation – Advanced (per hour)",
    price: 440,
  },
];
export const liveStreamAddons: Addon[] = [
  { id: "iphone_first_hour", label: "Livestream – iPhone (first hour)", price: 1100 },
  { id: "iphone_additional_hour", label: "Livestream – iPhone (additional hour)", price: 275 },
  { id: "4kcamera_first_hour", label: "Livestream – 4K Camera (first hour)", price: 1650 },
  { id: "4kcamera_additional_hour", label: "Livestream – 4K Camera (additional hour)", price: 550 },
];

export const studio: { key: string; value: string }[] = [
  { key: "studio1", value: "Studio 1" },
  { key: "studio2", value: "Studio 2" },
  { key: "studio3", value: "Studio 3" },
  { key: "studio4", value: "Studio 4" },
];