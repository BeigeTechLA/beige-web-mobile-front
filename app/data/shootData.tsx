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

export const weddingEditTypes: { key: string; value: string }[] = [
  { key: "highligh_video", value: "Highlight Video (4-7 minutes)" },
  { key: "mini_feature_video", value: "Feature Video (10-20 minutes)" },
  { key: "full_feature_video", value: "Full Feature Video (30-40 minutes)" },
  { key: "reel", value: "Reel (10-60 seconds)" },
  { key: "extra_photos", value: "Extra Edited Photos (25 photos)" },
  { key: "subtitles", value: "Subtitles" },
  { key: "translation", value: "Translation (per language) - Subtitles" },
];

export const musicEditTypes: { key: string; value: string }[] = [
  { key: "music_video_basic", value: "Music Video - Basic" },
  { key: "music_video_complex", value: "Music Video - Complex" },
  { key: "reel", value: "Reel (30-60 seconds)" },
  { key: "subtitles", value: "Subtitles" },
  {
    key: "translation_subtitles",
    value: "Translation (Per language - Subtitles)",
  },
  {
    key: "special_effects_basic",
    value: "Special Effects - Basic (Included)",
  },
  {
    key: "special_effects_complex",
    value: "Special Effects - Complex",
  },
];

export const commercialEditTypes: { key: string; value: string }[] = [
  { key: "commercial_basic", value: "Commercial - Basic" },
  { key: "commercial_complex", value: "Commercial - Complex" },
  { key: "reel", value: "Reel (30-60 seconds)" },
  { key: "voiceover_under_2_min", value: "Voiceover (Under 2 minutes)" },
  {
    key: "voiceover_over_2_min",
    value: "Voiceover (Over 2 minutes, up to 15 minutes)",
  },
  { key: "subtitles", value: "Subtitles" },
  {
    key: "translation_subtitles",
    value: "Translation (Per language - Subtitles)",
  },
];

export const tvSeriesEditTypes: { key: string; value: string }[] = [
  {
    key: "tv_series_up_to_30_min", value: "TV Series (Per episode - 30 minutes or less)",
  },
  {
    key: "tv_series_additional_10_min",
    value: "TV Series (Per episode - Each additional 10 minutes after first 30 minutes)",
  },
  {
    key: "highlight_video",
    value: "Highlight Video (4-7 minutes)",
  },
  { key: "reel", value: "Reel (30-60 seconds)" },
  { key: "subtitles", value: "Subtitles" },
  {
    key: "translation_subtitles",
    value: "Translation (Per language - Subtitles)",
  },
];

export const podcastEditTypes: { key: string; value: string }[] = [
  { key: "podcast_full_episode", value: "Podcast - Full Episode" },
  { key: "podcast_short_reel", value: "Podcast - Short Reel" },
  { key: "voiceover_under_2_min", value: "Voiceover (Under 2 minutes)" },
  { key: "subtitles", value: "Subtitles" },
  {
    key: "translation_subtitles",
    value: "Translation (Per language - Subtitles)",
  },
];

export const shortFilmEditTypes: { key: string; value: string }[] = [
  {
    key: "short_film_up_to_5_min",
    value: "Short Film (5 minutes or less)",
  },
  {
    key: "short_film_5_to_10_min",
    value: "Short Film (More than 5 minutes, up to 10 minutes)",
  },
  { key: "subtitles", value: "Subtitles" },
  {
    key: "translation_subtitles",
    value: "Translation (Per language - Subtitles)",
  },
  {
    key: "special_effects_basic",
    value: "Special Effects - Basic (Included)",
  },
  {
    key: "special_effects_complex",
    value: "Special Effects - Complex",
  },
];

export const movieEditTypes: { key: string; value: string }[] = [
  {
    key: "movie_up_to_30_min",
    value: "Movie (30 minutes or less)",
  },
  {
    key: "movie_additional_10_min",
    value: "Movie (Each additional 10 minutes after first 30 minutes)",
  },
  {
    key: "trailer_reel",
    value: "Trailer / Reel (30-60 seconds)",
  },
  { key: "subtitles", value: "Subtitles" },
  {
    key: "translation_subtitles",
    value: "Translation (Per language - Subtitles)",
  },
  {
    key: "special_effects_basic",
    value: "Special Effects - Basic (Included)",
  },
  {
    key: "special_effects_complex",
    value: "Special Effects - Complex",
  },
];

export const corporateEventEditTypes: { key: string; value: string }[] = [
  {
    key: "highlight_video",
    value: "Highlight Video (4-7 minutes)",
  },
  {
    key: "feature_video",
    value: "Feature Video (10-20 minutes)",
  },
  {
    key: "full_feature_video",
    value: "Full Feature Video (20-40 minutes)",
  },
  { key: "reel", value: "Reel (30-60 seconds)" },
  { key: "voiceover_under_2_min", value: "Voiceover (Under 2 minutes)" },
  { key: "subtitles", value: "Subtitles" },
];

export const privateEventEditTypes: { key: string; value: string }[] = [
  {
    key: "highlight_video",
    value: "Highlight Video (4-7 minutes)",
  },
  {
    key: "feature_video",
    value: "Feature Video (10-20 minutes)",
  },
  {
    key: "full_feature_video",
    value: "Full Feature Video (20-40 minutes)",
  },
  { key: "reel", value: "Reel (30-60 seconds)" },
  { key: "subtitles", value: "Subtitles" },
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