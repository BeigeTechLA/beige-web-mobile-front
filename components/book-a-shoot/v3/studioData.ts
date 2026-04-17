export type StudioPricingMode = "weekend" | "hourly";

export type SelectedStudio = {
  studioId: string;
  name: string;
  location: string;
  image: string;
  pricingMode: StudioPricingMode;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  priceLabel: string;
  nights?: number;
  selectedDate?: string;
  startTime?: string;
  endTime?: string;
};

export type StudioCatalogItem = {
  id: string;
  name: string;
  beds: number;
  baths: number;
  poolType: string;
  location: string;
  priceLabel: string;
  priceValue?: number;
  rating: string;
  reviews?: number;
  image: string;
  images?: string[];
  dates?: string;
  nights?: number;
  pricingMode: StudioPricingMode;
};

export const WEEKEND_STUDIO_LIST: StudioCatalogItem[] = [
  {
    id: "beige-palm-desert-golf",
    name: "Beige Palm Desert Golf",
    beds: 4,
    baths: 3,
    poolType: "Large Pool",
    location: "Woodland Hills, Los Angeles,",
    priceLabel: "$50,000 / Weekend",
    priceValue: 50000,
    rating: "4.5",
    reviews: 120,
    dates: "Fri, 17 Jan -> Mon, 20 Jan",
    nights: 3,
    image: "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert-golf/IMG_8701.jpeg",
    images: [
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert-golf/IMG_8701.jpeg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert-golf/IMG_8703.jpeg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert-golf/IMG_8705.jpeg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert-golf/IMG_8709.jpeg",
    ],
    pricingMode: "weekend",
  },
  {
    id: "beige-palm-desert",
    name: "Beige Palm Desert",
    beds: 4,
    baths: 2,
    poolType: "Small Pool",
    location: "Woodland Hills, Los Angeles,",
    priceLabel: "$45,000 / Weekend",
    priceValue: 45000,
    rating: "4.5",
    reviews: 120,
    dates: "Fri, 17 Jan -> Mon, 20 Jan",
    nights: 3,
    image: "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert/IMG_7840.jpg",
    images: [
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert/IMG_7840.jpg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert/IMG_7838.jpg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert/IMG_7841.jpg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/palm-desert/IMG_7842.jpg",
    ],
    pricingMode: "weekend",
  },
  {
    id: "beige-billionaire-estate",
    name: "Beige Billionaire Estate",
    beds: 7,
    baths: 6,
    poolType: "Large Pool",
    location: "Woodland Hills, Los Angeles,",
    priceLabel: "$100,000 / Weekend",
    priceValue: 100000,
    rating: "4.5",
    reviews: 120,
    dates: "Fri, 17 Jan -> Mon, 20 Jan",
    nights: 3,
    image: "https://d1pgtgqp0jru64.cloudfront.net/resort/billionaire-estate/DSC02235.JPG",
    images: [
      "https://d1pgtgqp0jru64.cloudfront.net/resort/billionaire-estate/DSC02235.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/billionaire-estate/DSC02275.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/billionaire-estate/DSC02280.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/billionaire-estate/DSC02281.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/billionaire-estate/DSC02286.JPG",
    ],
    pricingMode: "weekend",
  },
  {
    id: "beige-desert-ranch",
    name: "Beige Desert Ranch",
    beds: 5,
    baths: 4,
    poolType: "Small Pool",
    location: "Woodland Hills, Los Angeles,",
    priceLabel: "$60,000 / Weekend",
    priceValue: 60000,
    rating: "4.5",
    reviews: 120,
    dates: "Fri, 17 Jan -> Mon, 20 Jan",
    nights: 3,
    image: "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-ranch/DSC02176.JPG",
    images: [
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-ranch/DSC02176.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-ranch/DSC02189.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-ranch/DSC02194.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-ranch/DSC02196.JPG",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-ranch/DSC02197.JPG",
    ],
    pricingMode: "weekend",
  },
];

export const HOURLY_STUDIO_LIST: StudioCatalogItem[] = [
  {
    id: "beige-desert-oasis",
    name: "Beige Desert Oasis",
    beds: 4,
    baths: 4,
    poolType: "Large Pool",
    location: "Woodland Hills, Los Angeles,",
    priceLabel: "From $1,000/Hr",
    priceValue: 1000,
    rating: "4.5",
    reviews: 120,
    image: "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-oasis/aim_media_group_high_v2-10.jpg",
    images: [
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-oasis/aim_media_group_high_v2-10.jpg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-oasis/aim_media_group_high_v2-11.jpg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-oasis/aim_media_group_high_v2-12.jpg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-oasis/aim_media_group_high_v2-13.jpg",
      "https://d1pgtgqp0jru64.cloudfront.net/resort/desert-oasis/aim_media_group_high_v2-14.jpg",
    ],
    pricingMode: "hourly",
  },
];

const STUDIO_BY_ID = new Map(
  [...WEEKEND_STUDIO_LIST, ...HOURLY_STUDIO_LIST].map((studio) => [studio.id, studio]),
);

export const STUDIO_META_MARKER = "[BEIGE_STUDIO_META]";

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const timeToMinutes = (time = "") => {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

export const calculateHourlyDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return 0;
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / 60));
};

export const getStudioById = (studioId: string) => STUDIO_BY_ID.get(studioId);

export const upsertSelectedStudio = (
  current: SelectedStudio[] = [],
  next: SelectedStudio,
) => {
  const filtered = current.filter((studio) => studio.studioId !== next.studioId);
  return [...filtered, next];
};

export const removeSelectedStudio = (current: SelectedStudio[] = [], studioId: string) =>
  current.filter((studio) => studio.studioId !== studioId);

export const buildWeekendStudioSelection = (studio: StudioCatalogItem): SelectedStudio => {
  const quantity = safeNumber(studio.nights, 1);
  const totalPrice = safeNumber(studio.priceValue, 0);

  return {
    studioId: studio.id,
    name: studio.name,
    location: studio.location,
    image: studio.image,
    pricingMode: "weekend",
    unitPrice: quantity > 0 ? totalPrice / quantity : totalPrice,
    quantity,
    totalPrice,
    priceLabel: studio.priceLabel,
    nights: quantity,
  };
};

export const buildHourlyStudioSelection = (
  studio: StudioCatalogItem,
  details: {
    selectedDate: string;
    startTime: string;
    endTime: string;
  },
): SelectedStudio => {
  const durationHours = calculateHourlyDuration(details.startTime, details.endTime);
  const unitPrice = safeNumber(studio.priceValue, 0);
  const totalPrice = unitPrice * durationHours;

  return {
    studioId: studio.id,
    name: studio.name,
    location: studio.location,
    image: studio.image,
    pricingMode: "hourly",
    unitPrice,
    quantity: durationHours,
    totalPrice,
    priceLabel: studio.priceLabel,
    selectedDate: details.selectedDate,
    startTime: details.startTime,
    endTime: details.endTime,
  };
};

export const normalizeSelectedStudios = (payload: {
  selectedStudios?: SelectedStudio[];
  selectedStudioIds?: string[];
}) => {
  if (Array.isArray(payload.selectedStudios) && payload.selectedStudios.length) {
    return payload.selectedStudios.filter((studio) => !!studio?.studioId);
  }

  if (!Array.isArray(payload.selectedStudioIds)) return [];

  return payload.selectedStudioIds
    .map((studioId) => getStudioById(studioId))
    .filter((studio): studio is StudioCatalogItem => !!studio)
    .map((studio) =>
      studio.pricingMode === "hourly"
        ? {
            studioId: studio.id,
            name: studio.name,
            location: studio.location,
            image: studio.image,
            pricingMode: "hourly" as const,
            unitPrice: safeNumber(studio.priceValue, 0),
            quantity: 0,
            totalPrice: 0,
            priceLabel: studio.priceLabel,
          }
        : buildWeekendStudioSelection(studio),
    );
};

export const getSelectedStudiosTotal = (selectedStudios: SelectedStudio[] = []) =>
  selectedStudios.reduce((sum, studio) => sum + safeNumber(studio.totalPrice, 0), 0);

export const serializeStudioMeta = (selectedStudios: SelectedStudio[] = []) => {
  if (!selectedStudios.length) return "";
  return `${STUDIO_META_MARKER}${JSON.stringify(selectedStudios)}`;
};

export const parseStudioMeta = (text?: string | null): SelectedStudio[] => {
  if (!text) return [];
  const markerIndex = text.indexOf(STUDIO_META_MARKER);
  if (markerIndex === -1) return [];
  const raw = text.slice(markerIndex + STUDIO_META_MARKER.length).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((studio) => studio && typeof studio.studioId === "string")
      .map((studio) => ({
        studioId: String(studio.studioId),
        name: String(studio.name || ""),
        location: String(studio.location || ""),
        image: String(studio.image || ""),
        pricingMode: studio.pricingMode === "hourly" ? "hourly" : "weekend",
        unitPrice: safeNumber(studio.unitPrice, 0),
        quantity: safeNumber(studio.quantity, 0),
        totalPrice: safeNumber(studio.totalPrice, 0),
        priceLabel: String(studio.priceLabel || ""),
        nights: safeNumber(studio.nights, 0) || undefined,
        selectedDate: studio.selectedDate ? String(studio.selectedDate) : undefined,
        startTime: studio.startTime ? String(studio.startTime) : undefined,
        endTime: studio.endTime ? String(studio.endTime) : undefined,
      }));
  } catch {
    return [];
  }
};
