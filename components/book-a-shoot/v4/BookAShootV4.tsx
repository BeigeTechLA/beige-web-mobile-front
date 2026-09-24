"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { pushToDataLayer } from "@/lib/gtm";

import LeaveConfirmationModal from "./components/LeaveConfirmationModal";
import GuidedBookingCard from "./components/GuidedBookingCard";
import FlowInfoCard from "./components/FlowInfoCard";
import AskingServices from "./components/AskingServices";
import EditsNeeded, { EditsConfig } from "./components/EditsNeeded";
import AskingOccasion from "./components/AskingOccassion";
import ScheduleShoot from "./components/ScheduleShoot";
import ShootDetails, { ShootDetailsData } from "./components/ShootDetails";
import MatchMakerStep, { TeamSelectionData } from "./components/MatchMaker";
import CreativeTeam from "./components/CreativeTeam";
import ChooseCreativePartner from "./components/ChooseCreativePartner";
import AddOnsStep, { type AddOnItem } from "./components/AddOnsStep";
import ShootSummaryStep, { ShootSummaryData } from "./components/ShootSummary";
import ConfirmAndPay, { PricingBreakdown } from "./components/ConfirmAndPay";
import BookingConfirmed from "./components/BookingConfirmed";
import BrowseStudioTypes from "./components/BrowseStudioTypes";
import StudioRecommendation from "./components/StudioRecommendations";
import StudiosSelection from "./components/StudiosSelection";
import StudioScheduleSync from "./components/StudioScheduleSync";
import StudioShootDetails, {
  StudioShootDetailsData,
} from "./components/StudioShootDetails";

import { getCreativeTeamError, isLosAngelesLocation, getV4PhotoEditsPerHour, V4_PACKAGE_INCLUSIONS } from "./bookingRules";

import { DEFAULT_V4_SHOOT_TYPE } from "./shootTypes";

import type { Creator } from "@/lib/types";
import type { PricingItem, QuoteCalculation, QuoteLineItem, SelectedItem } from "@/lib/api/pricing";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useCreateGuestBookingV4Mutation,
  useUpdateGuestBookingV4Mutation,
} from "@/lib/redux/features/booking/guestBookingApi";
import {
  useCalculateQuoteFromCreatorsV4Mutation,
  useGetCatalogQuery,
  useSaveQuoteV4Mutation,
} from "@/lib/redux/features/pricing/pricingApi";
import { useTrackEarlyInterestV4Mutation } from "@/lib/redux/features/sales/salesApi";
import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import { parseDate } from "@/src/components/landing/lib/utils";
import { usePageTimer } from "@/lib/utils"
import {
  buildEditTypeCounts,
  getPhotoEditSummary,
  getTotalDurationHours,
  PHOTO_EDIT_ADDON_SET_SIZE,
} from "../v3/utils";
import {
  getSelectedStudiosTotal,
  HOURLY_STUDIO_LIST,
  normalizeSelectedStudios,
  type SelectedStudio,
  serializeStudioMeta,
} from "../v3/studioData";
import {
  behindScenesPhotoEditTypes,
  brandProductPhotoEditTypes,
  commercialEditTypes,
  commercialPhotoEditTypes,
  corporateEventEditTypes,
  corporateEventPhotoEditTypes,
  musicEditTypes,
  musicPhotoEditTypes,
  peopleTeamsPhotoEditTypes,
  podcastEditTypes,
  privateEventEditTypes,
  privateEventPhotoEditTypes,
  shortFilmEditTypes,
  socialContentEditTypes,
  socialContentPhotoEditTypes,
  weddingEditTypes,
  weddingPhotoEditTypes,
} from "@/app/data/shootData";

type BookingDay = {
  date: string;
  startTime?: string;
  endTime?: string;
  start_time?: string;
  end_time?: string;
  duration_hours?: number;
  time_zone?: string;
  timeZone?: string;
};

type LocationDetails = {
  coordinates?: { lat?: number; lng?: number };
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  center?: [number, number];
} | null;

type StudioLeadItem = {
  studio_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  pricing_mode: "hourly" | "weekend";
};

type LeadProgressPayload = {
  booking_id?: number | null;
  guest_email?: string;
  client_name?: string;
  content_type?: string;
  shoot_type?: string;
  start_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  time_zone?: string;
  startDate?: string | null;
  endDate?: string | null;
  booking_type?: "single_day" | "multi_day";
  booking_days?: BookingDay[];
  edits_needed?: boolean;
  video_edit_types?: string[];
  photo_edit_types?: string[];
  location?: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  studio_total?: number;
  studio_items?: StudioLeadItem[];
  role_counts?: Record<string, number>;
  estimated_total?: number;
  pricing_subtotal?: number;
  pricing_line_items?: QuoteLineItem[];
};

type PreviewLineItem = QuoteCalculation["lineItems"][number] & {
  hidden?: boolean;
  item_id?: number | null;
  is_mandatory?: boolean;
};

export interface ScheduleData {
  dateOption: "have-date" | "confirm-later";
  bookingType: "single_day" | "multi_day" | null;
  date: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  bookingDays: BookingDay[];
  location: string;
  locationDetails?: LocationDetails;
}

const ITEM_IDS = {
  videographer: 11,
  photographer: 10,
  cinematographer: 12,
  additionalCamera: 50,
  productionAssistant: 45,
  soundEngineer: 46,
  director: 47,
  gaffer: 48,
};

const ITEM_SLUGS = {
  photoVideoCreator: "photo-video-creator",
};

const CREATIVE_PARTNER_HOURLY_RATE = 250;
const PHOTO_VIDEO_CREATOR_HOURLY_RATE = 350;

const V4_ADD_ON_SLUGS = [
  "v4-additional-camera",
  "v4-teleprompter",
  "v4-drone",
  "v4-lavalier-mics",
  "v4-green-screen",
  "v4-backdrop",
  "v4-additional-lights",
  "v4-next-day-editing",
  "v4-expedited-editing",
];

const V4_ADD_ON_SLUG_SET = new Set(V4_ADD_ON_SLUGS);

const EDITING_SERVICE_PRICES: Record<string, number> = {
  highlight_video_4_7: 350,
  feature_video_10_20: 500,
  full_feature_video_30_40: 500,
  reel_10_60: 250,
  interview_video_1_5: 350,
  music_video_edit: 500,
  edited_photos: 250,
};

const titleize = (value?: string) =>
  String(value || "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toUtcIsoIfValid = (value?: string | null) => {
  if (!value) return undefined;
  const date = parseDate(value);
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : value;
};

const calculateDayHours = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((value) => Number.isNaN(value))) return null;
  const diffMinutes = eh * 60 + em - (sh * 60 + sm);
  return diffMinutes > 0 ? Math.round((diffMinutes / 60) * 100) / 100 : null;
};

const formatDisplayDate = (value?: string | null) => {
  const dateValue = getLocalDatePart(value) || value;
  if (!dateValue) return "Confirm later";
  const parsed = parseDate(dateValue);
  if (!parsed) return dateValue;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDisplayTime = (value?: string | null) => {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getCoordinates = (details?: LocationDetails) => ({
  lat:
    details?.coordinates?.lat ??
    details?.lat ??
    details?.latitude ??
    details?.center?.[1],
  lng:
    details?.coordinates?.lng ??
    details?.lng ??
    details?.longitude ??
    details?.center?.[0],
});

const mapServicesToContentTypes = (services: string[]) => {
  const mapped = services.flatMap((service) => {
    switch (service) {
      case "photography":
        return ["photographer"];
      case "videography":
      case "livestream":
        return ["videographer"];
      case "editing":
        return ["editing"];
      case "studios":
        return ["studio"];
      default:
        return [service];
    }
  });

  return [...new Set(mapped)];
};

const getRecommendedTeam = (services: string[]) => ({
  photographer: services.includes("photography") ? 1 : 0,
  videographer:
    services.includes("videography") || services.includes("livestream") ? 1 : 0,
});

const getServiceDisplayName = (occasion: string, services: string[]) => {
  const occasionName = titleize(occasion);
  const hasPhoto = services.includes("photography");
  const hasVideo = services.includes("videography") || services.includes("livestream");

  if (hasPhoto && hasVideo) return `${occasionName} Photo + Video`;
  if (hasPhoto) return `${occasionName} Photography`;
  if (hasVideo) return `${occasionName} Videography`;

  return `${occasionName} ${titleize(services[0] || "Service")}`;
};

const getPackageDisplayName = (occasion: string, services: string[]) => {
  const occasionName = titleize(occasion);
  const hasPhoto = services.includes("photography");
  const hasVideo = services.includes("videography") || services.includes("livestream");

  if (hasPhoto && hasVideo) return `${occasionName}: Photo + Video`;
  if (hasPhoto) return `${occasionName}: Photography`;
  if (hasVideo) return `${occasionName}: Videography`;

  return `${occasionName}: ${titleize(services[0] || "Service")}`;
};

const getPrimaryCreativeServiceLabel = (services: string[]) => {
  const serviceLabels = services
    .filter((item) => item !== "studios")
    .map((item) => titleize(item));

  if (serviceLabels.length === 0) return "Photography";
  if (serviceLabels.length === 1) return serviceLabels[0];
  if (serviceLabels.length === 2) return serviceLabels.join(" & ");

  return `${serviceLabels.slice(0, -1).join(", ")} & ${serviceLabels[serviceLabels.length - 1]}`;
};

const getRecommendedStudioCategory = (occasion: string) => {
  if (["podcast", "music"].includes(occasion)) return "audio_recording";
  if (["corporate", "private", "wedding"].includes(occasion)) return "events";
  return "production";
};

const getRecommendedStudioCopy = (occasion: string) => {
  const category = getRecommendedStudioCategory(occasion);
  if (category === "audio_recording") {
    return {
      category,
      title: "Audio & Recording",
      description: "Podcasts, music, voiceovers, and other audio projects",
    };
  }
  if (category === "events") {
    return {
      category,
      title: `${titleize(occasion)} Event`,
      description: "Conferences, gatherings, launches, and private events",
    };
  }
  return {
    category,
    title: "Production",
    description: "Shoots, campaigns, interviews, and content creation",
  };
};

const getIncludedPackageOffers = () => V4_PACKAGE_INCLUSIONS;

const isCatalogAddOnItem = (item: PricingItem) => {
  if (!V4_ADD_ON_SLUG_SET.has(item.slug)) return false;
  if (!Number(item.is_active)) return false;
  if (!Number.isFinite(Number(item.rate)) || Number(item.rate) <= 0) return false;
  return true;
};

const cleanCatalogAddOnTitle = (name: string) =>
  name
    .replace(/\s*\((flat rate|per video|per mic|per revision|full day)\)\s*/gi, "")
    .replace(/\s*[-\u2013]\s*/g, " - ")
    .trim();

const getCatalogAddOnDescription = (item: PricingItem, categoryName: string) => {
  if (item.description) return item.description;
  if (item.rate_unit) return item.rate_unit;
  if (item.rate_type === "per_unit") return "Priced per item.";
  if (item.rate_type === "per_day") return "Priced per day.";
  if (item.rate_type === "per_hour") return "Priced per hour.";
  return categoryName;
};

const getStudioListItems = () =>
  HOURLY_STUDIO_LIST.map((studio) => ({
    id: studio.id,
    name: studio.name,
    subtitle: studio.poolType ? `(${studio.poolType})` : "",
    location: studio.location,
    rating: Number(studio.rating || 4.5),
    reviewCount: Number(studio.reviews || 0),
    tags: studio.bestFor?.slice(0, 2) || ["Production-friendly"],
    pricePerHour: Number(studio.priceValue || 0),
    availability: "Available by booking",
    image: studio.image,
    link: `/studios/${studio.id}`,
  }));

const getEditOptionsForShootType = (
  shootType: string,
  canShowVideo: boolean,
  canShowPhoto: boolean
) => {
  let videoEditOptions: { key: string; value: string }[] = [];
  let photoEditOptions: { key: string; value: string; note?: string }[] = [];

  switch (shootType) {
    case "wedding":
      videoEditOptions = weddingEditTypes;
      photoEditOptions = weddingPhotoEditTypes;
      break;
    case "music":
      videoEditOptions = musicEditTypes;
      photoEditOptions = musicPhotoEditTypes;
      break;
    case "commercial":
      videoEditOptions = commercialEditTypes;
      photoEditOptions = commercialPhotoEditTypes;
      break;
    case "podcast":
      videoEditOptions = podcastEditTypes;
      break;
    case "short_film":
      videoEditOptions = shortFilmEditTypes;
      break;
    case "private":
      videoEditOptions = privateEventEditTypes;
      photoEditOptions = privateEventPhotoEditTypes;
      break;
    case "social_content":
      videoEditOptions = socialContentEditTypes;
      photoEditOptions = socialContentPhotoEditTypes;
      break;
    case "brand_product":
      photoEditOptions = brandProductPhotoEditTypes;
      break;
    case "people_teams":
      photoEditOptions = peopleTeamsPhotoEditTypes;
      break;
    case "behind_scenes":
      photoEditOptions = behindScenesPhotoEditTypes;
      break;
    case "studio":
    case "corporate":
    default:
      videoEditOptions = corporateEventEditTypes;
      photoEditOptions = corporateEventPhotoEditTypes;
      break;
  }

  return {
    videoEditOptions: canShowVideo ? videoEditOptions : [],
    photoEditOptions: canShowPhoto ? photoEditOptions : [],
  };
};

export const BookAShootV4 = () => {
  const router = useRouter();
  const { user } = useAuth();

  const { getDurationOnPage } = usePageTimer();

  const [internalStep, setInternalStep] = useState<number>(0);
  // The first service choice owns the journey.  Adding a studio later is an
  // add-on to that journey; it must never silently turn journey 1 into journey 3.
  const [journey, setJourney] = useState<"creative" | "studio-only" | "combined">(
    "creative"
  );
  const [hasChangedStudioType, setHasChangedStudioType] = useState(false);
  const [occasionViewMode, setOccasionViewMode] = useState<"carousel" | "grid">(
    "grid"
  );
  const [studioViewMode, setStudioViewMode] = useState<"stack" | "grid">(
    "grid"
  );
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [draftBookingId, setDraftBookingId] = useState<number | null>(null);
  const [pricingPreview, setPricingPreview] =
    useState<(QuoteCalculation & { creators?: unknown[] }) | null>(null);

  const [bookingState, setBookingState] = useState<{
    email: string;
    selectedServices: string[];
    editsConfig: EditsConfig;
    selectedOccasion: string;
    scheduleData: ScheduleData | null;
    shootDetailsData: ShootDetailsData | null;
    teamSelectionData: TeamSelectionData | null;
    addOnsQuantities: Record<string, number>;
    addOnsSubtotal: number;
    contactInformation: { fullName: string; phoneNumber: string } | null;
    studioCategory: string | null;
    studioCrewCount: string;
    studioShootType: string;
  }>({
    email: "",
    selectedServices: ["photography"],
    editsConfig: {
      needsEdits: true,
      editedPhotosSets: 0,
      videoEditTypes: [],
      photoEditTypes: [],
    },
    selectedOccasion: DEFAULT_V4_SHOOT_TYPE,
    scheduleData: null,
    shootDetailsData: null,
    teamSelectionData: null,
    addOnsQuantities: {},
    addOnsSubtotal: 0,
    contactInformation: null,
    studioCategory: null,
    studioCrewCount: "",
    studioShootType: "",
  });

  const [creativeTeam, setCreativeTeam] = useState<{ [key: string]: number }>(
    getRecommendedTeam(["photography"])
  );
  const [selectedCreatives, setSelectedCreatives] = useState<Creator[]>([]);
  const [letBeigeChoose, setLetBeigeChoose] = useState<boolean>(false);
  const [selectedStudios, setSelectedStudios] = useState<SelectedStudio[]>([]);

  const [createGuestBooking, { isLoading: isBookingLoading }] =
    useCreateGuestBookingV4Mutation();
  const [updateGuestBooking, { isLoading: isUpdatingBooking }] =
    useUpdateGuestBookingV4Mutation();
  const [saveQuote, { isLoading: isQuoteLoading }] = useSaveQuoteV4Mutation();
  const [calculateQuoteFromCreators, { isLoading: isPreviewLoading }] =
    useCalculateQuoteFromCreatorsV4Mutation();
  const [trackEarlyInterest] = useTrackEarlyInterestV4Mutation();

  const isSubmitting =
    isBookingLoading || isUpdatingBooking || isQuoteLoading || isPreviewLoading;

  const isStudioOnlyBooking = journey === "studio-only";
  const isCombinedStudioBooking = journey === "combined";
  const isStudioBooking =
    isStudioOnlyBooking ||
    isCombinedStudioBooking ||
    bookingState.selectedServices.includes("studios");
  const baseContentTypes = mapServicesToContentTypes(bookingState.selectedServices);
  const contentTypes = isStudioBooking
    ? [...new Set([...baseContentTypes, "studio"])]
    : baseContentTypes;
  const selectedHybridCreators = Number(creativeTeam.photoVideoCreator || 0);
  const hasPhotoCoverage =
    contentTypes.includes("photographer") ||
    selectedHybridCreators > 0;
  const hasVideoCoverage =
    contentTypes.includes("videographer") ||
    selectedHybridCreators > 0;
  const canShowVideoEdits =
    hasVideoCoverage || contentTypes.includes("editing");
  const canShowPhotoEdits =
    hasPhotoCoverage || contentTypes.includes("editing");
  const editOptions = getEditOptionsForShootType(
    bookingState.selectedOccasion,
    canShowVideoEdits,
    canShowPhotoEdits
  );
  const { data: pricingCatalog = [] } = useGetCatalogQuery({
    eventType: bookingState.selectedOccasion || "general",
  });
  const addOnsForStep = useMemo<AddOnItem[]>(() => {
    const catalogItemsBySlug = new Map<
      string,
      { item: PricingItem; categoryName: string }
    >();

    pricingCatalog.forEach((category) => {
      (category.items || []).forEach((item) => {
        if (isCatalogAddOnItem(item)) {
          catalogItemsBySlug.set(item.slug, {
            item,
            categoryName: category.name,
          });
        }
      });
    });

    return V4_ADD_ON_SLUGS.map((slug) => catalogItemsBySlug.get(slug))
      .filter(
        (entry): entry is { item: PricingItem; categoryName: string } =>
          Boolean(entry)
      )
      .map(({ item, categoryName }) => ({
        id: String(item.item_id || item.slug),
        slug: item.slug,
        title: cleanCatalogAddOnTitle(item.name),
        description: getCatalogAddOnDescription(item, categoryName),
        price: Number(item.rate) || 0,
      }));
  }, [pricingCatalog]);
  const addOnById = useMemo(
    () => new Map(addOnsForStep.map((addOn) => [addOn.id, addOn])),
    [addOnsForStep]
  );

  const primaryStudio = selectedStudios[0];
  const selectedStudiosTotal = getSelectedStudiosTotal(selectedStudios);
  const durationHours = useMemo(() => {
    if (isCombinedStudioBooking) {
      return getTotalDurationHours(
        bookingState.scheduleData?.bookingType || undefined,
        bookingState.scheduleData?.startDate || undefined,
        bookingState.scheduleData?.endDate || undefined,
        bookingState.scheduleData?.bookingDays || []
      );
    }

    if (isStudioOnlyBooking && primaryStudio?.quantity) return primaryStudio.quantity;
    return getTotalDurationHours(
      bookingState.scheduleData?.bookingType || undefined,
      bookingState.scheduleData?.startDate || undefined,
      bookingState.scheduleData?.endDate || undefined,
      bookingState.scheduleData?.bookingDays || []
    );
  }, [
    bookingState.scheduleData?.bookingDays,
    bookingState.scheduleData?.bookingType,
    bookingState.scheduleData?.endDate,
    bookingState.scheduleData?.startDate,
    isCombinedStudioBooking,
    isStudioOnlyBooking,
    primaryStudio?.quantity,
  ]);
  const safeDurationHours = Math.max(1, durationHours || 0);
  const photoEditSetCount =
    bookingState.editsConfig.photoEditTypes.filter(
      (type) => type === "edited_photos"
    ).length || bookingState.editsConfig.editedPhotosSets || 0;
  const photoEditSummary = getPhotoEditSummary({
    shootType: bookingState.selectedOccasion,
    durationHours: safeDurationHours,
    selectedAddOnSets: photoEditSetCount,
    includedPerHourOverride: canShowPhotoEdits
      ? getV4PhotoEditsPerHour(bookingState.selectedOccasion, safeDurationHours)
      : 0,
  });
  const roundedPhotoEditSummary = {
    includedPerHour: Math.round(photoEditSummary.includedPerHour),
    includedCount: Math.round(photoEditSummary.includedCount),
    extraCount: Math.round(photoEditSummary.extraCount),
    totalCount: Math.round(photoEditSummary.totalCount),
  };
  const selectedVideoEditLabels = (() => {
    const labelByKey = new Map(
      editOptions.videoEditOptions.map((option) => [option.key, option.value])
    );
    const counts = bookingState.editsConfig.videoEditTypes.reduce<Record<string, number>>(
      (acc, slug) => {
        acc[slug] = (acc[slug] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(counts).map(([slug, count]) => {
      const label = labelByKey.get(slug) || titleize(slug);
      return `${label} x${count}`;
    });
  })();
  const videoEditCount = bookingState.editsConfig.videoEditTypes.length;
  const totalEditsText = [
    roundedPhotoEditSummary.totalCount > 0
      ? `${roundedPhotoEditSummary.totalCount} Photos`
      : "",
    videoEditCount > 0
      ? `${videoEditCount} Video${videoEditCount === 1 ? "" : "s"}`
      : "",
  ]
    .filter(Boolean)
    .join(" + ");

  const shouldChooseOwn =
    bookingState.teamSelectionData?.teamOption === "choose-own";
  const packageInclusions = V4_PACKAGE_INCLUSIONS;
  const bookingDetailsStep = 3;
  const editsStep = 4;
  const detailsStep = 5;
  const matchmakerStep = 6;
  const creativeTeamStep = 7;
  const chooseCreativesStep = 8;
  const studioOnlyDetailsStep = 2;
  const studioOnlyTypeStep = 3;
  const studioOnlyScheduleStep = 4;
  const studioOnlySelectionStep = 5;
  const studioOnlySummaryStep = 6;
  const studioOnlyConfirmStep = 7;
  const combinedIntroStep = 2;
  const combinedStudioTypeStep = 3;
  const combinedShootScheduleStep = 4;
  const combinedStudioSelectionStep = 5;
  const combinedOccasionStep = 6;
  const combinedDetailsStep = 7;
  const combinedStudioScheduleStep = 8;
  const combinedEditsStep = 9;
  const combinedMatchmakerStep = 10;
  const combinedCreativeTeamStep = 11;
  const combinedChooseCreativesStep = 12;
  const combinedAddOnsStep = shouldChooseOwn ? 13 : 12;
  const combinedSummaryStep = shouldChooseOwn ? 14 : 13;
  const combinedConfirmStep = shouldChooseOwn ? 15 : 14;
  // Journey 1 can add a studio after its shoot schedule. These steps are kept
  // outside the normal journey-1 sequence so Back always returns to journey 1.
  const creativeStudioRecommendationStep = 12;
  const creativeStudioTypeStep = 13;
  const creativeStudioSelectionStep = 14;
  const creativeStudioScheduleStep = 15;
  const addOnsStep = shouldChooseOwn ? 9 : 8;
  const summaryStep = isStudioOnlyBooking
    ? studioOnlySummaryStep
    : shouldChooseOwn
      ? 10
      : 9;
  const confirmStep = isStudioOnlyBooking
    ? studioOnlyConfirmStep
    : shouldChooseOwn
      ? 11
      : 10;
  const creativeJourneySteps = [
    1,
    2,
    bookingDetailsStep,
    ...(bookingState.selectedServices.includes("studios")
      ? [
        creativeStudioRecommendationStep,
        ...(hasChangedStudioType ? [creativeStudioTypeStep] : []),
        creativeStudioSelectionStep,
        creativeStudioScheduleStep,
      ]
      : []),
    detailsStep,
    matchmakerStep,
    creativeTeamStep,
    editsStep,
    ...(shouldChooseOwn ? [chooseCreativesStep] : []),
    addOnsStep,
    summaryStep,
    confirmStep,
  ];
  const studioOnlyJourneySteps = [
    1,
    studioOnlyDetailsStep,
    studioOnlyTypeStep,
    studioOnlyScheduleStep,
    studioOnlySelectionStep,
    studioOnlySummaryStep,
    studioOnlyConfirmStep,
  ];
  const combinedJourneySteps = [
    1,
    combinedStudioTypeStep,
    combinedShootScheduleStep,
    combinedStudioSelectionStep,
    combinedOccasionStep,
    combinedDetailsStep,
    combinedStudioScheduleStep,
    combinedMatchmakerStep,
    combinedCreativeTeamStep,
    combinedEditsStep,
    ...(shouldChooseOwn ? [combinedChooseCreativesStep] : []),
    combinedAddOnsStep,
    combinedSummaryStep,
    combinedConfirmStep,
  ];
  const currentJourneySteps = isCombinedStudioBooking
    ? combinedJourneySteps
    : isStudioOnlyBooking
      ? studioOnlyJourneySteps
      : creativeJourneySteps;
  const getStepMeta = (step: number) => {
    const stepIndex = currentJourneySteps.indexOf(step);
    const visibleStep = stepIndex >= 0 ? stepIndex + 1 : 1;
    const totalSteps = currentJourneySteps.length || 1;
    const stepNumber = String(visibleStep);

    return {
      stepNumber,
      stepLabel: `STEP ${stepNumber}`,
      completionPercentage: Math.round((visibleStep / totalSteps) * 100),
    };
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [internalStep]);

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
  };

  const getLeadRoleCounts = () => ({
    videographer: Number(creativeTeam.videographer || 0),
    photographer: Number(creativeTeam.photographer || 0),
    cinematographer: Number(creativeTeam.cinematographer || 0),
    photoVideoCreator: Number(creativeTeam.photoVideoCreator || 0),
  });

  const saveLeadProgress = async (payload: LeadProgressPayload) => {
    const guestEmail = payload.guest_email || bookingState.email;
    if (!guestEmail) return;

    try {
      const result = await trackEarlyInterest({
        booking_id: draftBookingId,
        guest_email: guestEmail,
        user_id: user?.id,
        client_name:
          user?.name || bookingState.contactInformation?.fullName || undefined,
        role_counts: getLeadRoleCounts(),
        ...payload,
      }).unwrap();

      if (result?.data?.booking_id) setDraftBookingId(result.data.booking_id);
    } catch (error) {
      console.error("BookAShootV4 lead tracking failed:", error);
    }
  };

  const handleEmailSubmitted = (email: string) => {
    setBookingState((prev) => ({ ...prev, email }));
    setInternalStep(1);

    // add GA event on click of "Continue" in the first step
    pushToDataLayer("generate_lead", {
      value: 0, // Standard parameters
      currency: "USD",
      page_name: "Book-a-shoot Page",  // Custom data schema
      location_in_website: "Guided Booking-Email Card",
      duration_on_page: getDurationOnPage(),
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      booking_id: draftBookingId,
      // email: email,
    });

    // add GA event on initial load
    pushToDataLayer("guided_booking_email_registered", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Guided Booking-Email Card",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
    });

    void saveLeadProgress({ guest_email: email });
  };

  const handleServicesSelected = (services: string[]) => {
    const recommendedTeam = getRecommendedTeam(services);
    const includesStudio = services.includes("studios");
    const isOnlyStudio = services.length === 1 && includesStudio;
    const isCombinedStudio = includesStudio && !isOnlyStudio;
    setJourney(
      isOnlyStudio ? "studio-only" : isCombinedStudio ? "combined" : "creative"
    );
    setHasChangedStudioType(false);
    setCreativeTeam(recommendedTeam);
    setSelectedCreatives([]);
    setLetBeigeChoose(false);
    if (!includesStudio) {
      setSelectedStudios([]);
      setPricingPreview(null);
    }
    setBookingState((prev) => ({
      ...prev,
      selectedServices: services,
      editsConfig: isOnlyStudio
        ? {
          needsEdits: false,
          editedPhotosSets: 0,
          videoEditTypes: [],
          photoEditTypes: [],
        }
        : prev.editsConfig,
      selectedOccasion:
        isOnlyStudio
          ? "studio"
          : !includesStudio && prev.selectedOccasion === "studio"
            ? DEFAULT_V4_SHOOT_TYPE
            : prev.selectedOccasion,
      scheduleData:
        !includesStudio &&
          (selectedStudios.length > 0 || prev.selectedOccasion === "studio")
          ? null
          : prev.scheduleData,
      teamSelectionData: null,
      addOnsQuantities: isOnlyStudio ? {} : prev.addOnsQuantities,
      addOnsSubtotal: isOnlyStudio ? 0 : prev.addOnsSubtotal,
    }));
    setInternalStep(
      isOnlyStudio
        ? studioOnlyDetailsStep
        : isCombinedStudio
          ? combinedIntroStep
          : 2
    );

    pushToDataLayer("booking_services_selected", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Select Services",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      content_type: mapServicesToContentTypes(services).join(",")
    });

    void saveLeadProgress({
      content_type: mapServicesToContentTypes(services).join(","),
      shoot_type: isOnlyStudio ? "studio" : undefined,
    });
  };

  const handleCreativeJourneyStudiosSelected = (studioIds: string[]) => {
    const normalizedStudios = applyScheduleToStudios(
      normalizeSelectedStudios({ selectedStudioIds: studioIds }),
      bookingState.scheduleData
    );

    setSelectedStudios(normalizedStudios);
    setBookingState((prev) => ({
      ...prev,
      // Preserve the customer's creative occasion and their locked journey.
      selectedServices: prev.selectedServices.includes("studios")
        ? prev.selectedServices
        : [...prev.selectedServices, "studios"],
    }));
    setInternalStep(creativeStudioScheduleStep);
  };

  const handleCreativeJourneyStudioRecommendation = () => {
    setBookingState((prev) => ({
      ...prev,
      studioCategory:
        prev.studioCategory || getRecommendedStudioCategory(prev.selectedOccasion),
    }));
    setInternalStep(creativeStudioSelectionStep);
  };

  const handleCreativeJourneyStudioTypeSelected = (studioCategory: string) => {
    setHasChangedStudioType(true);
    setBookingState((prev) => ({ ...prev, studioCategory }));
    setInternalStep(creativeStudioSelectionStep);
  };

  const handleCreativeJourneyStudioScheduleSubmitted = (data: {
    useSameSchedule: boolean;
    bookingType: "single_day" | "multi_day";
    startDate: string | null;
    endDate: string | null;
    bookingDays: Array<{ date: string; startTime?: string; endTime?: string }>;
  }) => {
    const scheduledStudios = applyScheduleToStudios(
      selectedStudios,
      bookingState.scheduleData,
      data.useSameSchedule
        ? undefined
        : {
          bookingType: data.bookingType,
          startDate: data.startDate,
          endDate: data.endDate,
          bookingDays: data.bookingDays,
        }
    );

    setSelectedStudios(scheduledStudios);
    setInternalStep(detailsStep);
  };

  const handleOccasionSelected = (selectedOccasion: string) => {
    setBookingState((prev) => ({
      ...prev,
      selectedOccasion,
      selectedServices:
        selectedOccasion === "studio" && !prev.selectedServices.includes("studios")
          ? [...prev.selectedServices, "studios"]
          : prev.selectedServices,
    }));
    setInternalStep(bookingDetailsStep);

    pushToDataLayer("booking_occasion_selected", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Select Occasion",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      occasion_type: selectedOccasion
    });

    void saveLeadProgress({
      shoot_type: selectedOccasion,
      content_type:
        selectedOccasion === "studio"
          ? [...new Set([...contentTypes, "studio"])].join(",")
          : contentTypes.join(","),
    });
  };

  const handleScheduleSubmitted = (scheduleData: ScheduleData) => {
    const browserTimeZone = getBrowserTimeZone();
    const coords = getCoordinates(scheduleData.locationDetails);

    const removeStudio = journey === "creative" && !isLosAngelesLocation(scheduleData.location, scheduleData.locationDetails);
    if (removeStudio) {
      setSelectedStudios([]);
      setPricingPreview(null);
    }
    setBookingState((prev) => ({
      ...prev,
      scheduleData,
      selectedServices: removeStudio ? prev.selectedServices.filter((service) => service !== "studios") : prev.selectedServices,
      studioCategory: removeStudio ? null : prev.studioCategory,
    }));

    const customProperties = {
      time_zone: browserTimeZone,
      start_date: toUtcIsoIfValid(scheduleData.startDate),
      end_date: toUtcIsoIfValid(scheduleData.endDate),
      start_time: scheduleData.startTime,
      end_time: scheduleData.endTime,
      booking_days: scheduleData.bookingDays.map((day) => `${day.date}; ${day.startTime}-${day.endTime}`).join(", "),
    }

    pushToDataLayer("booking_schedule_submitted", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Shoot Schedule",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      shoot_location: scheduleData.location,
      booking_type: scheduleData.bookingType,
      date_option: scheduleData.dateOption,
      ...(scheduleData.dateOption === "have-date" && customProperties),
    });

    setInternalStep(detailsStep);
    void saveLeadProgress({
      content_type: contentTypes.join(","),
      shoot_type: bookingState.selectedOccasion,
      start_date: getLocalDatePart(scheduleData.startDate),
      start_time: scheduleData.startTime,
      end_time: scheduleData.endTime,
      time_zone: browserTimeZone,
      startDate: scheduleData.startDate ? toUtcIsoIfValid(scheduleData.startDate) : undefined,
      endDate: scheduleData.endDate ? toUtcIsoIfValid(scheduleData.endDate) : undefined,
      booking_type: scheduleData.bookingType || "single_day",
      booking_days: scheduleData.bookingDays.map((day) => ({
        ...day,
        time_zone: day.time_zone || day.timeZone || browserTimeZone,
      })),
      location: scheduleData.location,
      location_latitude: coords.lat,
      location_longitude: coords.lng,
    });
  };

  const handleStudioOnlyDetailsSubmitted = (details: StudioShootDetailsData) => {
    setBookingState((prev) => ({
      ...prev,
      selectedOccasion: "studio",
      shootDetailsData: {
        notes: [details.projectName, details.description]
          .filter((entry) => String(entry || "").trim())
          .join("\n\n"),
        links: [],
      },
      contactInformation: {
        fullName: details.fullName,
        phoneNumber: details.phoneNumber,
      },
    }));
    setInternalStep(studioOnlyTypeStep);
    void saveLeadProgress({
      shoot_type: "studio",
      content_type: "studio",
    });
  };

  const handleStudioTypeSelected = (studioCategory: string) => {
    setBookingState((prev) => ({ ...prev, studioCategory }));
    setInternalStep(studioOnlyScheduleStep);
  };

  const handleStudioOnlyScheduleSubmitted = (scheduleData: ScheduleData) => {
    const browserTimeZone = getBrowserTimeZone();
    const coords = getCoordinates(scheduleData.locationDetails);

    setBookingState((prev) => ({ ...prev, scheduleData }));
    setInternalStep(studioOnlySelectionStep);
    void saveLeadProgress({
      content_type: "studio",
      shoot_type: "studio",
      start_date: getLocalDatePart(scheduleData.startDate),
      start_time: scheduleData.startTime,
      end_time: scheduleData.endTime,
      time_zone: browserTimeZone,
      startDate: scheduleData.startDate ? toUtcIsoIfValid(scheduleData.startDate) : undefined,
      endDate: scheduleData.endDate ? toUtcIsoIfValid(scheduleData.endDate) : undefined,
      booking_type: scheduleData.bookingType || "single_day",
      booking_days: scheduleData.bookingDays.map((day) => ({
        ...day,
        time_zone: day.time_zone || day.timeZone || browserTimeZone,
      })),
      location: scheduleData.location,
      location_latitude: coords.lat,
      location_longitude: coords.lng,
    });
  };

  const handleStudioOnlyStudiosSelected = (studioIds: string[]) => {
    const schedule = bookingState.scheduleData;
    const firstBookingDay = schedule?.bookingDays?.[0];
    const selectedDate =
      getLocalDatePart(schedule?.startDate) ||
      firstBookingDay?.date ||
      undefined;
    const startTime =
      schedule?.startTime ||
      firstBookingDay?.startTime ||
      firstBookingDay?.start_time;
    const endTime =
      schedule?.endTime ||
      firstBookingDay?.endTime ||
      firstBookingDay?.end_time;
    const hours = Math.max(
      1,
      getTotalDurationHours(
        schedule?.bookingType || undefined,
        schedule?.startDate || undefined,
        schedule?.endDate || undefined,
        schedule?.bookingDays || []
      ) || 0
    );
    const normalizedStudios = normalizeSelectedStudios({
      selectedStudioIds: studioIds,
    }).map((studio) => ({
      ...studio,
      selectedDate,
      startTime,
      endTime,
      quantity: hours,
      totalPrice: studio.unitPrice * hours + (studio.cleaningFee || 0),
    }));

    setSelectedStudios(normalizedStudios);
    setBookingState((prev) => ({
      ...prev,
      scheduleData:
        prev.scheduleData && normalizedStudios[0]?.location
          ? {
            ...prev.scheduleData,
            location: normalizedStudios[0].location,
            locationDetails: null,
          }
          : prev.scheduleData,
    }));
    setInternalStep(studioOnlySummaryStep);
    void saveLeadProgress({
      content_type: "studio",
      shoot_type: "studio",
      location: normalizedStudios[0]?.location,
      location_latitude: null,
      location_longitude: null,
      studio_total: getSelectedStudiosTotal(normalizedStudios),
      studio_items: normalizedStudios.map((item) => ({
        studio_id: item.studioId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.totalPrice,
        pricing_mode: item.pricingMode,
      })),
    });
  };

  const applyScheduleToStudios = (
    studios: SelectedStudio[],
    schedule: ScheduleData | null,
    override?: {
      bookingType: "single_day" | "multi_day";
      startDate: string | null;
      endDate: string | null;
      bookingDays: Array<{ date: string; startTime?: string; endTime?: string }>;
    }
  ) => {
    const sourceBookingDays = override?.bookingDays?.length
      ? override.bookingDays
      : schedule?.bookingDays || [];
    const firstBookingDay = sourceBookingDays[0];
    const selectedDate =
      getLocalDatePart(override?.startDate || schedule?.startDate) ||
      firstBookingDay?.date ||
      undefined;
    const startTime =
      getLocalTimePart(override?.startDate) ||
      schedule?.startTime ||
      firstBookingDay?.startTime ||
      firstBookingDay?.start_time;
    const endTime =
      getLocalTimePart(override?.endDate) ||
      schedule?.endTime ||
      firstBookingDay?.endTime ||
      firstBookingDay?.end_time;
    const hours = Math.max(
      1,
      getTotalDurationHours(
        override?.bookingType || schedule?.bookingType || undefined,
        override?.startDate || schedule?.startDate || undefined,
        override?.endDate || schedule?.endDate || undefined,
        sourceBookingDays
      ) || 0
    );

    return studios.map((studio) => ({
      ...studio,
      selectedDate,
      startTime,
      endTime,
      quantity: hours,
      totalPrice: studio.unitPrice * hours + (studio.cleaningFee || 0),
    }));
  };

  const handleCombinedStudioTypeSelected = (studioCategory: string) => {
    setBookingState((prev) => ({ ...prev, studioCategory }));
    setInternalStep(combinedShootScheduleStep);
  };

  const handleCombinedShootScheduleSubmitted = (scheduleData: ScheduleData) => {
    const browserTimeZone = getBrowserTimeZone();
    const coords = getCoordinates(scheduleData.locationDetails);

    setBookingState((prev) => ({ ...prev, scheduleData }));
    setInternalStep(combinedStudioSelectionStep);
    void saveLeadProgress({
      content_type: contentTypes.join(","),
      shoot_type: bookingState.selectedOccasion,
      start_date: getLocalDatePart(scheduleData.startDate),
      start_time: scheduleData.startTime,
      end_time: scheduleData.endTime,
      time_zone: browserTimeZone,
      startDate: scheduleData.startDate ? toUtcIsoIfValid(scheduleData.startDate) : undefined,
      endDate: scheduleData.endDate ? toUtcIsoIfValid(scheduleData.endDate) : undefined,
      booking_type: scheduleData.bookingType || "single_day",
      booking_days: scheduleData.bookingDays.map((day) => ({
        ...day,
        time_zone: day.time_zone || day.timeZone || browserTimeZone,
      })),
      location: scheduleData.location,
      location_latitude: coords.lat,
      location_longitude: coords.lng,
    });
  };

  const handleCombinedStudiosSelected = (studioIds: string[]) => {
    const normalizedStudios = applyScheduleToStudios(
      normalizeSelectedStudios({ selectedStudioIds: studioIds }),
      bookingState.scheduleData
    );
    const primarySelectedStudio = normalizedStudios[0];

    setSelectedStudios(normalizedStudios);
    setBookingState((prev) => ({
      ...prev,
      scheduleData:
        prev.scheduleData && primarySelectedStudio?.location
          ? {
            ...prev.scheduleData,
            location: primarySelectedStudio.location,
            locationDetails: null,
          }
          : prev.scheduleData,
    }));
    setInternalStep(combinedOccasionStep);
    void saveLeadProgress({
      content_type: contentTypes.join(","),
      location: primarySelectedStudio?.location,
      location_latitude: null,
      location_longitude: null,
      studio_total: getSelectedStudiosTotal(normalizedStudios),
      studio_items: normalizedStudios.map((item) => ({
        studio_id: item.studioId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.totalPrice,
        pricing_mode: item.pricingMode,
      })),
    });
  };

  const handleCombinedOccasionSelected = (selectedOccasion: string) => {
    setBookingState((prev) => ({
      ...prev,
      selectedOccasion,
      selectedServices: prev.selectedServices.includes("studios")
        ? prev.selectedServices
        : [...prev.selectedServices, "studios"],
    }));
    setInternalStep(combinedDetailsStep);
    void saveLeadProgress({
      shoot_type: selectedOccasion,
      content_type: contentTypes.join(","),
    });
  };

  const handleCombinedDetailsSubmitted = (shootDetailsData: ShootDetailsData) => {
    setBookingState((prev) => ({ ...prev, shootDetailsData }));
    setInternalStep(combinedStudioScheduleStep);
  };

  const handleCombinedStudioScheduleSubmitted = (data: {
    useSameSchedule: boolean;
    bookingType: "single_day" | "multi_day";
    startDate: string | null;
    endDate: string | null;
    bookingDays: Array<{ date: string; startTime?: string; endTime?: string }>;
  }) => {
    const sourceSchedule = bookingState.scheduleData;
    const scheduledStudios = applyScheduleToStudios(
      selectedStudios,
      sourceSchedule,
      data.useSameSchedule
        ? undefined
        : {
          bookingType: data.bookingType,
          startDate: data.startDate,
          endDate: data.endDate,
          bookingDays: data.bookingDays,
        }
    );

    setSelectedStudios(scheduledStudios);
    setInternalStep(combinedMatchmakerStep);
    void saveLeadProgress({
      content_type: contentTypes.join(","),
      shoot_type: bookingState.selectedOccasion,
      studio_total: getSelectedStudiosTotal(scheduledStudios),
      studio_items: scheduledStudios.map((item) => ({
        studio_id: item.studioId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.totalPrice,
        pricing_mode: item.pricingMode,
      })),
    });
  };

  const handleCombinedEditsSubmitted = (editsConfig: EditsConfig) => {
    setBookingState((prev) => ({ ...prev, editsConfig }));
    setInternalStep(
      shouldChooseOwn ? combinedChooseCreativesStep : combinedAddOnsStep
    );
    void saveLeadProgress({
      edits_needed: editsConfig.needsEdits,
      video_edit_types: editsConfig.videoEditTypes,
      photo_edit_types: editsConfig.photoEditTypes,
    });
  };

  const handleEditsSubmitted = (editsConfig: EditsConfig) => {
    setBookingState((prev) => ({ ...prev, editsConfig }));
    setInternalStep(shouldChooseOwn ? chooseCreativesStep : addOnsStep);

    pushToDataLayer("booking_edits_selected", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Edits Needed",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      edits_needed: editsConfig.needsEdits,
      video_edit_types: editsConfig.videoEditTypes,
      photo_edit_types: editsConfig.photoEditTypes,
    });

    void saveLeadProgress({
      edits_needed: editsConfig.needsEdits,
      video_edit_types: editsConfig.videoEditTypes,
      photo_edit_types: editsConfig.photoEditTypes,
    });
  };

  const handleDetailsSubmitted = (shootDetailsData: ShootDetailsData) => {
    setBookingState((prev) => ({ ...prev, shootDetailsData }));

    pushToDataLayer("booking_shoot_details_submitted", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Shoot Details",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      supporting_links: shootDetailsData.links.join(","),
      notes: shootDetailsData.notes,
    });

    setInternalStep(matchmakerStep);
  };

  const handleTeamSelected = (teamSelectionData: TeamSelectionData) => {
    setLetBeigeChoose(teamSelectionData.teamOption === "best-match");
    if (teamSelectionData.teamOption === "best-match") {
      setSelectedCreatives([]);
    }
    setBookingState((prev) => ({ ...prev, teamSelectionData }));

    pushToDataLayer("booking_matchmaker_submitted", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Matchmaker selection",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      team_selection_type: teamSelectionData.teamOption
    });

    setInternalStep(
      isCombinedStudioBooking ? combinedCreativeTeamStep : creativeTeamStep
    );
  };

  const handleCreativeTeamSubmitted = (updatedTeam: { [key: string]: number }) => {
    const teamError = getCreativeTeamError(bookingState.selectedServices, updatedTeam);
    if (teamError) {
      toast.error(teamError);
      return;
    }
    setCreativeTeam(updatedTeam);

    setInternalStep(isCombinedStudioBooking ? combinedEditsStep : editsStep);
    pushToDataLayer("booking_team_size_submitted", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Creative Team",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      team_size: Object.entries(updatedTeam).map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    });

    setPricingPreview(null);
    void saveLeadProgress({
      content_type: contentTypes.join(","),
      shoot_type: bookingState.selectedOccasion,
      role_counts: {
        videographer: Number(updatedTeam.videographer || 0),
        photographer: Number(updatedTeam.photographer || 0),
        cinematographer: Number(updatedTeam.cinematographer || 0),
        photoVideoCreator: Number(updatedTeam.photoVideoCreator || 0),
      },
    });
  };

  const handleChooseCreativePartnerSubmitted = (
    creatives: Creator[],
    beigeChoice: boolean
  ) => {
    setSelectedCreatives(creatives);
    setLetBeigeChoose(beigeChoice);

    pushToDataLayer("booking_team_selected", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Choose Creative Team",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      beige_choice: beigeChoice,
      creative_ids: creatives.map((creator) => creator.crew_member_id).join(","),
    });

    setInternalStep(isCombinedStudioBooking ? combinedAddOnsStep : addOnsStep);
  };

  const handleAddOnsSubmitted = (
    selectedAddOns: Record<string, number>,
    subtotal: number
  ) => {
    setBookingState((prev) => ({
      ...prev,
      addOnsQuantities: selectedAddOns,
      addOnsSubtotal: subtotal,
    }));

    pushToDataLayer("booking_addons_selected", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Add-on Selection",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      add_ons_quantities: Object.entries(selectedAddOns).map(([key, value]) => `${key}: ${value}`)
        .join(", "),
      add_ons_subtotal: subtotal,
    });

    setInternalStep(isCombinedStudioBooking ? combinedSummaryStep : summaryStep);
  };

  const getSelectedAddOnLabels = () =>
    Object.entries(bookingState.addOnsQuantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([key, quantity]) => {
        const addOn = addOnById.get(key);
        return `${addOn?.title || titleize(key)} x${quantity}`;
      });

  const buildKnownAddOnItems = () => {
    const items: SelectedItem[] = [];

    if (bookingState.selectedOccasion === "podcast") {
      items.push({ item_id: ITEM_IDS.additionalCamera, quantity: 2 });
    }

    if (
      bookingState.selectedOccasion === "short_film" ||
      bookingState.selectedOccasion === "movie"
    ) {
      items.push({ item_id: ITEM_IDS.productionAssistant, quantity: 1 });
      items.push({ item_id: ITEM_IDS.soundEngineer, quantity: 1 });
      items.push({ item_id: ITEM_IDS.director, quantity: 1 });
      items.push({ item_id: ITEM_IDS.gaffer, quantity: 1 });
    }

    return items;
  };

  const buildSelectedCatalogAddOnItems = () =>
    Object.entries(bookingState.addOnsQuantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([key, quantity]) => {
        const addOn = addOnById.get(key);
        return addOn ? { slug: addOn.slug, quantity: Number(quantity) || 0 } : null;
      })
      .filter((item): item is SelectedItem => !!item && item.quantity > 0);

  const buildPricingInputs = () => {
    const roleCounts = {
      videographer: Number(creativeTeam.videographer || 0),
      photographer: Number(creativeTeam.photographer || 0),
      cinematographer: Number(creativeTeam.cinematographer || 0),
      photoVideoCreator: Number(creativeTeam.photoVideoCreator || 0),
    };
    const totalRoleCount = Object.values(roleCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    const useStudioInclusivePricing =
      isStudioBooking && selectedStudios.length > 0 && totalRoleCount === 0;
    const roleItems: SelectedItem[] = [];

    if (!useStudioInclusivePricing) {
      Object.entries(roleCounts).forEach(([role, count]) => {
        const itemId = ITEM_IDS[role as keyof typeof ITEM_IDS];
        if (itemId && count > 0) {
          roleItems.push({ item_id: itemId, quantity: count });
          return;
        }

        const slug = ITEM_SLUGS[role as keyof typeof ITEM_SLUGS];
        if (slug && count > 0) {
          roleItems.push({ slug, quantity: count });
        }
      });
    }

    const addOnItems = useStudioInclusivePricing
      ? []
      : [...buildKnownAddOnItems(), ...buildSelectedCatalogAddOnItems()];
    const customAddOnItems = [];
    const firstBookingDate =
      bookingState.scheduleData?.bookingType === "multi_day" &&
        bookingState.scheduleData?.bookingDays?.length
        ? bookingState.scheduleData.bookingDays
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))[0]?.date
        : null;

    return {
      roleCounts,
      totalRoleCount,
      useStudioInclusivePricing,
      quoteItems: [...roleItems, ...addOnItems],
      addOnItems,
      customAddOnItems,
      // The pricing API requires a positive duration even when a studio is the
      // only selected item. The selected studio's booked duration is used here.
      shootHours: safeDurationHours,
      shootStartDate: isStudioOnlyBooking && primaryStudio?.selectedDate
        ? `${primaryStudio.selectedDate}T00:00:00.000Z`
        : firstBookingDate
          ? `${firstBookingDate}T00:00:00.000Z`
          : toUtcIsoIfValid(bookingState.scheduleData?.startDate),
      studioItems: selectedStudios.map((studio) => ({
        studio_id: studio.studioId,
        name: studio.name,
        quantity: studio.quantity,
        unit_price: studio.unitPrice,
        total: studio.totalPrice,
        pricing_mode: studio.pricingMode,
      })),
    };
  };

  const handleSummarySubmitted = async (contactData: {
    fullName: string;
    phoneNumber: string;
  }) => {
    setBookingState((prev) => ({
      ...prev,
      contactInformation: contactData,
    }));

    const pricingInputs = buildPricingInputs();
    const canPreview =
      pricingInputs.quoteItems.length > 0 ||
      selectedStudiosTotal > 0 ||
      bookingState.editsConfig.videoEditTypes.length > 0 ||
      bookingState.editsConfig.photoEditTypes.length > 0;

    if (canPreview) {
      try {
        const preview = await calculateQuoteFromCreators({
          creator_ids: letBeigeChoose
            ? []
            : selectedCreatives.map((creator) => creator.crew_member_id),
          role_counts: pricingInputs.roleCounts,
          shoot_hours: pricingInputs.shootHours,
          content_type: contentTypes.join(","),
          event_type: bookingState.selectedOccasion || "general",
          shoot_start_date: pricingInputs.shootStartDate,
          video_edit_types: bookingState.editsConfig.needsEdits
            ? buildEditTypeCounts(bookingState.editsConfig.videoEditTypes)
            : [],
          photo_edit_types: bookingState.editsConfig.needsEdits
            ? buildEditTypeCounts(bookingState.editsConfig.photoEditTypes)
            : [],
          add_on_items: pricingInputs.addOnItems,
          custom_add_on_items: pricingInputs.customAddOnItems,
          studio_total: selectedStudiosTotal,
          studio_items: pricingInputs.studioItems,
          apply_self_serve_coverage_pricing: true,
          skip_discount: true,
          skip_margin: true,
        }).unwrap();
        setPricingPreview(preview);
        void saveLeadProgress({
          client_name: contactData.fullName,
          content_type: contentTypes.join(","),
          shoot_type: bookingState.selectedOccasion,
          role_counts: pricingInputs.roleCounts,
          estimated_total: Number(preview.total || 0),
          pricing_subtotal: Number(preview.subtotal || preview.total || 0),
          pricing_line_items: preview.lineItems || [],
          studio_total: selectedStudiosTotal,
          studio_items: pricingInputs.studioItems,
        });
      } catch (error) {
        console.error("BookAShootV4 pricing preview failed:", error);
        setPricingPreview(null);
        const fallbackPricing = getPricingData();
        void saveLeadProgress({
          client_name: contactData.fullName,
          content_type: contentTypes.join(","),
          shoot_type: bookingState.selectedOccasion,
          role_counts: pricingInputs.roleCounts,
          estimated_total: Number(fallbackPricing.totalAmount || 0),
          pricing_subtotal: Number(fallbackPricing.totalAmount || 0),
          studio_total: selectedStudiosTotal,
          studio_items: pricingInputs.studioItems,
        });
      }
    } else {
      const fallbackPricing = getPricingData();
      void saveLeadProgress({
        client_name: contactData.fullName,
        content_type: contentTypes.join(","),
        shoot_type: bookingState.selectedOccasion,
        role_counts: pricingInputs.roleCounts,
        estimated_total: Number(fallbackPricing.totalAmount || 0),
        pricing_subtotal: Number(fallbackPricing.totalAmount || 0),
        studio_total: selectedStudiosTotal,
        studio_items: pricingInputs.studioItems,
      });
    }

    pushToDataLayer("booking_summary_proceed", {
      // type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Shoot Summary",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: contactData.phoneNumber || user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      // full_name: contactData.fullName,
    });

    setInternalStep(isCombinedStudioBooking ? combinedConfirmStep : confirmStep);
  };

  const buildBookingPayload = (quoteId: number | null) => {
    const browserTimeZone = getBrowserTimeZone();
    const schedule = bookingState.scheduleData;
    const contact = bookingState.contactInformation;
    const coords = getCoordinates(schedule?.locationDetails);
    const studioMeta = serializeStudioMeta(selectedStudios);
    const addOnsMeta = getSelectedAddOnLabels();
    const specialInstructions = [
      bookingState.shootDetailsData?.notes,
      addOnsMeta.length ? `Add-ons: ${addOnsMeta.join(", ")}` : "",
      studioMeta,
      selectedStudios.length && bookingState.studioCrewCount ? `Studio cast and crew: ${bookingState.studioCrewCount}` : "",
      selectedStudios.length && bookingState.studioShootType ? `Studio shoot type: ${bookingState.studioShootType}` : "",
    ]
      .filter((entry) => String(entry || "").trim())
      .join("\n\n");
    const bookingDays =
      isStudioOnlyBooking && primaryStudio && primaryStudio.selectedDate
        ? [
          {
            date: primaryStudio.selectedDate,
            start_time: primaryStudio.startTime,
            end_time: primaryStudio.endTime,
            duration_hours: primaryStudio.quantity,
            time_zone: browserTimeZone,
          },
        ]
        : (schedule?.bookingDays || []).map((day) => {
          const start = day.start_time || day.startTime || null;
          const end = day.end_time || day.endTime || null;
          return {
            date: day.date,
            start_time: start,
            end_time: end,
            duration_hours:
              day.duration_hours != null
                ? day.duration_hours
                : calculateDayHours(start, end),
            time_zone: day.time_zone || day.timeZone || browserTimeZone,
          };
        });

    const startDate =
      isStudioOnlyBooking && primaryStudio?.selectedDate
        ? primaryStudio.selectedDate
        : getLocalDatePart(schedule?.startDate);
    const startTime =
      isStudioOnlyBooking && primaryStudio?.startTime
        ? primaryStudio.startTime
        : schedule?.startTime || getLocalTimePart(schedule?.startDate);
    const endTime =
      isStudioOnlyBooking && primaryStudio?.endTime
        ? primaryStudio.endTime
        : schedule?.endTime || getLocalTimePart(schedule?.endDate);
    const startDateTime =
      isStudioOnlyBooking && primaryStudio?.selectedDate && primaryStudio?.startTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.startTime}:00`
        : schedule?.startDate || undefined;
    const endDateTime =
      isStudioOnlyBooking && primaryStudio?.selectedDate && primaryStudio?.endTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.endTime}:00`
        : schedule?.endDate || undefined;
    const crewSize = Object.values(creativeTeam).reduce(
      (sum, count) => sum + Number(count || 0),
      0
    );

    return {
      order_name: `${titleize(bookingState.selectedOccasion || "new")} Shoot - ${contact?.fullName || bookingState.email
        }`,
      guest_email: bookingState.email,
      content_type: contentTypes.join(","),
      shoot_type: bookingState.selectedOccasion,
      booking_type: schedule?.bookingType || "single_day",
      booking_days: bookingDays,
      start_date: startDate,
      start_time: startTime,
      end_time: endTime,
      time_zone: browserTimeZone,
      duration_hours: durationHours || null,
      location:
        isStudioOnlyBooking && primaryStudio?.location
          ? primaryStudio.location
          : schedule?.location || "",
      location_latitude:
        isStudioOnlyBooking && primaryStudio?.lat != null
          ? primaryStudio.lat
          : coords.lat,
      location_longitude:
        isStudioOnlyBooking && primaryStudio?.lng != null
          ? primaryStudio.lng
          : coords.lng,
      quote_id: quoteId || undefined,
      full_name: contact?.fullName,
      phone: contact?.phoneNumber,
      edits_needed: bookingState.editsConfig.needsEdits,
      video_edit_types: bookingState.editsConfig.videoEditTypes,
      photo_edit_types: bookingState.editsConfig.photoEditTypes,
      crew_size: crewSize > 0 ? String(crewSize) : undefined,
      matching_method: letBeigeChoose ? "ai_matchmaker" : "choose_own",
      selected_crew_ids: letBeigeChoose
        ? []
        : selectedCreatives.map((creator) => creator.crew_member_id),
      special_instructions: specialInstructions || undefined,
      reference_links: bookingState.shootDetailsData?.links || [],
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      is_draft: false,
    };
  };

  const handleConfirmAndPay = async (paymentAmount?: number) => {
    if (isSubmitting) return;

    try {
      const pricingInputs = buildPricingInputs();
      let savedQuoteId: number | null = null;
      let savedQuoteTotal: number | null = null;
      const shouldSaveQuote =
        pricingInputs.quoteItems.length > 0 ||
        selectedStudiosTotal > 0 ||
        bookingState.editsConfig.videoEditTypes.length > 0 ||
        bookingState.editsConfig.photoEditTypes.length > 0;

      if (shouldSaveQuote) {
        const savedQuote = await saveQuote({
          items: pricingInputs.quoteItems,
          shootHours: pricingInputs.shootHours,
          eventType: bookingState.selectedOccasion || "general",
          guestEmail: bookingState.email,
          bookingId: draftBookingId || undefined,
          notes: bookingState.shootDetailsData?.notes || undefined,
          shoot_start_date: pricingInputs.shootStartDate,
          studio_total: selectedStudiosTotal,
          studio_items: pricingInputs.studioItems,
          video_edit_types: bookingState.editsConfig.needsEdits
            ? buildEditTypeCounts(bookingState.editsConfig.videoEditTypes)
            : [],
          photo_edit_types: bookingState.editsConfig.needsEdits
            ? buildEditTypeCounts(bookingState.editsConfig.photoEditTypes)
            : [],
          custom_add_on_items: pricingInputs.customAddOnItems,
          apply_self_serve_coverage_pricing: true,
        }).unwrap();

        savedQuoteId = savedQuote.quote_id;
        savedQuoteTotal = savedQuote.total;
      }

      const finalBookingData = buildBookingPayload(savedQuoteId);
      const submissionResult = draftBookingId
        ? await updateGuestBooking({
          id: draftBookingId,
          data: finalBookingData,
        }).unwrap()
        : await createGuestBooking(finalBookingData).unwrap();

      toast.success("Booking secured", {
        description: "Redirecting to secure payment.",
      });

      if (savedQuoteTotal != null) {
        setPricingPreview((prev) =>
          prev ? { ...prev, total: savedQuoteTotal || prev.total } : prev
        );
      }

      const paymentParams = new URLSearchParams({
        shootId: String(submissionResult.booking_id),
      });
      if (paymentAmount && paymentAmount > 0) {
        paymentParams.set("amount", String(paymentAmount));
      }

      pushToDataLayer("booking_payment_proceed", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page",
        location_in_website: "Shoot Summary",
        user_id: user?.id || "Guest",
        user_type: user?.role !== undefined
          ? user?.role
          : "Guest",
        // email: bookingState.email,
        // phone: user?.phone_number || "Unknown",
        duration_on_page: getDurationOnPage(),
        payment_amount: paymentAmount,
      });

      router.replace(`/search-results/payment?${paymentParams.toString()}`);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
          error !== null &&
          "data" in error &&
          typeof (error as { data?: { message?: unknown } }).data?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : "Could not complete booking. Please check your connection.";

      console.error("BookAShootV4 final submission failed:", error);
      toast.error("Submission failed", {
        description: message,
      });
    }
  };

  const handleEditStepByName = (stepName: string) => {
    pushToDataLayer("booking_summary_edit", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "Shoot Summary - Edit",
      user_id: user?.id || "Guest",
      user_type: user?.role !== undefined
        ? user?.role
        : "Guest",
      // email: bookingState.email,
      // phone: user?.phone_number || "Unknown",
      duration_on_page: getDurationOnPage(),
      edit_step: stepName,
    });

    switch (stepName) {
      case "project":
        setInternalStep(1);
        break;
      case "schedule":
        setInternalStep(
          isCombinedStudioBooking
            ? combinedShootScheduleStep
            : isStudioOnlyBooking
              ? studioOnlyScheduleStep
              : bookingDetailsStep
        );
        break;
      case "editing":
        setInternalStep(isCombinedStudioBooking ? combinedEditsStep : editsStep);
        break;
      case "addons":
        setInternalStep(isCombinedStudioBooking ? combinedAddOnsStep : addOnsStep);
        break;
      default:
        break;
    }
  };

  const handleBrowseStudios = (scheduleData?: ScheduleData) => {
    const schedule = scheduleData || bookingState.scheduleData;
    if (!schedule || !isLosAngelesLocation(schedule.location, schedule.locationDetails)) return;
    setBookingState((prev) => ({
      ...prev,
      scheduleData: scheduleData || prev.scheduleData,
      selectedServices: prev.selectedServices.includes("studios")
        ? prev.selectedServices
        : [...prev.selectedServices, "studios"],
    }));
    setInternalStep(creativeStudioRecommendationStep);
  };

  const getPricingData = (): Partial<PricingBreakdown> => {
    const pricingInputs = buildPricingInputs();
    const previewLineItems = (pricingPreview?.lineItems || []) as PreviewLineItem[];
    const sumPreviewLineItems = (predicate: (item: PreviewLineItem) => boolean) =>
      previewLineItems
        .filter(predicate)
        .reduce((sum, item) => sum + Number(item.line_total || 0), 0);
    const previewEditingCost = sumPreviewLineItems(
      (item) => String(item.category_slug || "").toLowerCase() === "editing"
    );
    const previewStudioCost = sumPreviewLineItems(
      (item) => String(item.category_slug || "").toLowerCase() === "studio"
    );
    const previewServiceCost = sumPreviewLineItems((item) => {
      const category = String(item.category_slug || "").toLowerCase();
      return ["services", "photography", "videography", "crew-labor"].includes(category);
    });
    const previewAddOnsCost = sumPreviewLineItems((item) => {
      const category = String(item.category_slug || "").toLowerCase();
      return [
        "equipment-addons",
        "post-production",
        "artist",
        "livestream",
        "travel",
        "scripting",
      ].includes(category);
    });
    const visibleMandatoryFees = previewLineItems.filter((item) => {
      if (!item.is_mandatory) return false;
      const category = String(item.category_slug || "").toLowerCase();
      return ![
        "studio",
        "editing",
        "services",
        "photography",
        "videography",
        "crew-labor",
      ].includes(category);
    });
    const previewMandatoryFees = visibleMandatoryFees
      .map((item) => ({
        name: String(item.item_name || "Mandatory Fee"),
        amount: Number(item.line_total || 0),
      }))
      .filter((fee) => fee.amount > 0);
    const hasFallbackPhotoCoverage =
      Number(creativeTeam.photographer || 0) > 0 ||
      Number(creativeTeam.photoVideoCreator || 0) > 0;
    const hasFallbackVideoCoverage =
      Number(creativeTeam.videographer || 0) > 0 ||
      Number(creativeTeam.photoVideoCreator || 0) > 0;
    const fallbackMandatoryFees =
      hasFallbackPhotoCoverage || hasFallbackVideoCoverage
        ? [
          { name: "Pre-Production Fee", amount: 250 },
          ...(hasFallbackVideoCoverage
            ? [{ name: "Setup Time (up to 45 minutes)", amount: 250 }]
            : []),
        ]
        : [];
    const mandatoryFees = previewMandatoryFees.length > 0
      ? previewMandatoryFees
      : fallbackMandatoryFees;
    const mandatoryFeeCost = mandatoryFees.reduce(
      (sum, fee) => sum + fee.amount,
      0
    );
    const mandatoryFeeText = mandatoryFees.map((fee) => fee.name).join(", ");
    const roleCost =
      (
        Number(creativeTeam.photographer || 0) * CREATIVE_PARTNER_HOURLY_RATE +
        Number(creativeTeam.videographer || 0) * CREATIVE_PARTNER_HOURLY_RATE +
        Number(creativeTeam.cinematographer || 0) * CREATIVE_PARTNER_HOURLY_RATE +
        Number(creativeTeam.photoVideoCreator || 0) * PHOTO_VIDEO_CREATOR_HOURLY_RATE
      ) * Math.max(1, pricingInputs.shootHours || 1);
    const videoEditCount = bookingState.editsConfig.videoEditTypes.length;
    const fallbackEditingServiceCost = bookingState.editsConfig.needsEdits
      ? bookingState.editsConfig.videoEditTypes.reduce(
        (sum, slug) => sum + (EDITING_SERVICE_PRICES[slug] || 0),
        0
      ) + photoEditSetCount * EDITING_SERVICE_PRICES.edited_photos
      : 0;
    const editingServiceCost =
      bookingState.editsConfig.needsEdits && previewLineItems.length > 0
        ? previewEditingCost
        : fallbackEditingServiceCost;
    const addOnsCount = Object.values(bookingState.addOnsQuantities).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
    const selectedAddOnLabels = getSelectedAddOnLabels();
    const addOnsCost = previewLineItems.length > 0
      ? previewAddOnsCost
      : bookingState.addOnsSubtotal;
    const studioCost =
      selectedStudios.length > 0
        ? previewLineItems.length > 0
          ? previewStudioCost
          : selectedStudiosTotal
        : 0;
    const displayedRoleCost = previewLineItems.length > 0 && previewServiceCost > 0
      ? previewServiceCost
      : roleCost;
    const fallbackTotal =
      displayedRoleCost + editingServiceCost + addOnsCost + studioCost + mandatoryFeeCost;
    const totalAmount = pricingPreview?.total ?? fallbackTotal;
    const visibleBreakdownTotal =
      displayedRoleCost + editingServiceCost + addOnsCost + studioCost + mandatoryFeeCost;
    const pricingBalanceCost =
      previewLineItems.length > 0
        ? Math.max(
          0,
          Math.round((totalAmount - visibleBreakdownTotal) * 100) / 100
        )
        : 0;
    const pricingBalanceText = previewLineItems
      .filter((item) => !item.hidden && !item.is_mandatory)
      .filter((item) => {
        const category = String(item.category_slug || "").toLowerCase();
        return ![
          "studio",
          "editing",
          "services",
          "photography",
          "videography",
          "crew-labor",
          "equipment-addons",
          "post-production",
          "artist",
          "livestream",
          "travel",
          "scripting",
        ].includes(category);
      })
      .map((item) => String(item.item_name || "").trim())
      .filter((name) => {
        const lowerName = name.toLowerCase();
        return (
          name &&
          !["photographer", "videographer", "cinematographer"].includes(lowerName) &&
          !lowerName.includes("editing") &&
          !lowerName.includes("photo") &&
          !lowerName.includes("video") &&
          !lowerName.includes("studio") &&
          !lowerName.includes("resort") &&
          !lowerName.includes("location platform") &&
          !selectedAddOnLabels.some((label) =>
            label.toLowerCase().includes(lowerName)
          )
        );
      })
      .filter((name, index, allNames) => allNames.indexOf(name) === index)
      .join(", ");
    const roleTitleParts = [
      creativeTeam.photographer ? `Photographer x${creativeTeam.photographer}` : "",
      creativeTeam.videographer ? `Videographer x${creativeTeam.videographer}` : "",
      creativeTeam.photoVideoCreator
        ? `Hybrid Shooter (Photo + Video) x${creativeTeam.photoVideoCreator}`
        : "",
    ].filter(Boolean);
    const packageOffers = getIncludedPackageOffers();
    const summaryRows = previewLineItems.length > 0
      ? previewLineItems.filter((item) => !item.hidden && Number(item.line_total) !== 0).map((item) => ({
        label: `${item.item_name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`,
        amount: Number(item.line_total),
      }))
      : [
        ...(displayedRoleCost > 0 ? [{ label: `${roleTitleParts.join(", ")} · ${safeDurationHours} ${safeDurationHours === 1 ? "hour" : "hours"}`, amount: displayedRoleCost }] : []),
        { label: "Editing Services", amount: editingServiceCost },
        ...(addOnsCost > 0 ? [{ label: selectedAddOnLabels.join(", ") || "Add-ons", amount: addOnsCost }] : []),
        ...(studioCost > 0 ? [{ label: selectedStudios.map((studio) => studio.name).join(", ") || "Studio", amount: studioCost }] : []),
        ...mandatoryFees.map((fee) => ({ label: fee.name, amount: fee.amount })),
      ];
    const difference = Math.round((totalAmount - summaryRows.reduce((sum, row) => sum + row.amount, 0)) * 100) / 100;
    if (difference !== 0) summaryRows.push({ label: difference < 0 ? "Discount / adjustments" : "Production / adjustments", amount: difference });

    const filteredPackageOffers = packageOffers.filter(
      (offer) => !/setup time/i.test(offer) || !summaryRows.some((row) => /setup time/i.test(row.label))
    );

    return {
      summaryRows,
      serviceHeading: isStudioOnlyBooking ? "Studio Services" : `${getPrimaryCreativeServiceLabel(bookingState.selectedServices)} Services`,
      packageName: isStudioOnlyBooking ? selectedStudios.map((studio) => studio.name).join(", ") : getServiceDisplayName(bookingState.selectedOccasion, bookingState.selectedServices),
      crewLabel: roleTitleParts.join(", "),
      studioCrewSize: selectedStudios.length > 0 ? bookingState.studioCrewCount : "",
      serviceName:
        selectedStudios.length > 0
          ? selectedStudios.map((studio) => studio.name).join(", ")
          : getServiceDisplayName(
            bookingState.selectedOccasion,
            bookingState.selectedServices
          ),
      baseServiceCost: selectedStudios.length > 0 ? studioCost : displayedRoleCost,
      showBaseServiceCost: selectedStudios.length > 0,
      packageOffers: filteredPackageOffers,
      photosIncluded: roundedPhotoEditSummary.includedCount,
      extraPhotoUnitsText: `Extra Photo Units x${photoEditSetCount}`,
      extraPhotosCount: roundedPhotoEditSummary.extraCount,
      totalPhotosCount: roundedPhotoEditSummary.totalCount,
      totalEditsText: totalEditsText || "No edits selected",
      videoEditUnitsText: selectedVideoEditLabels.join(", "),
      videoEditsCount: videoEditCount,
      editingServiceCost,
      creativeRoleTitle: roleTitleParts.join(", ") || "Studio Booking",
      creativeRoleCost: displayedRoleCost,
      showCreativeRoleCost: displayedRoleCost > 0,
      addOnsCount,
      addOnsCost,
      addOnsText:
        selectedAddOnLabels.length > 0
          ? selectedAddOnLabels.join(", ")
          : "No add-ons selected",
      studioCost,
      studioText:
        selectedStudios.length > 0
          ? selectedStudios
            .map((studio) => `${studio.name} x${studio.quantity}`)
            .join(", ")
          : "",
      mandatoryFeeCost,
      mandatoryFeeText,
      mandatoryFees,
      pricingBalanceCost,
      pricingBalanceText,
      totalAmount,
      depositAmount: Math.min(500, totalAmount || 500),
    };
  };

  const getSummaryData = (): ShootSummaryData => {
    const serviceName = getServiceDisplayName(
      bookingState.selectedOccasion,
      bookingState.selectedServices
    );
    const occasionName =
      bookingState.selectedOccasion === "studio"
        ? "Studio"
        : `${titleize(bookingState.selectedOccasion)} Event`;
    const schedule = bookingState.scheduleData;
    const dateStr =
      schedule?.dateOption === "confirm-later"
        ? "Confirm later"
        : schedule?.bookingType === "multi_day" && schedule.bookingDays.length
          ? `${schedule.bookingDays.length} Days - ${schedule.bookingDays
            .map((day) => formatDisplayDate(day.date))
            .join(", ")}`
          : `Single Day - ${formatDisplayDate(
            (isStudioOnlyBooking ? primaryStudio?.selectedDate : undefined) ||
              schedule?.startDate
          )}`;
    const durationLabel = `${durationHours || 0} Hour Duration`;
    const timeStr =
      schedule?.dateOption === "confirm-later"
        ? "Confirm later"
        : `${formatDisplayTime(
          (isStudioOnlyBooking ? primaryStudio?.startTime : undefined) ||
            schedule?.startTime
        )} - ${formatDisplayTime(
          (isStudioOnlyBooking ? primaryStudio?.endTime : undefined) ||
            schedule?.endTime
        )} (${durationLabel})`;
    const formattedAddOns = getSelectedAddOnLabels();
    const studioAddOns = selectedStudios.map(
      (studio) => `${studio.name} - $${studio.totalPrice.toLocaleString()}`
    );
    return {
      project: {
        service: serviceName,
        occasion: occasionName,
        description: bookingState.shootDetailsData?.notes || "No description added",
      },
      schedule: {
        date: dateStr,
        startAndEndTime: timeStr,
        location:
          primaryStudio?.location ||
          bookingState.scheduleData?.location ||
          "Location to be confirmed",
      },
      editingServices: {
        photoEditsLabel: bookingState.editsConfig.needsEdits
          ? `Edited Photos ${roundedPhotoEditSummary.includedCount} Included + ${roundedPhotoEditSummary.extraCount} Added`
          : "No edits selected",
        videoEditsLabel:
          bookingState.editsConfig.needsEdits && selectedVideoEditLabels.length > 0
            ? selectedVideoEditLabels.join(", ")
            : "",
        totalPhotos: `You'll Receive ${totalEditsText || "No edits selected"}`,
      },
      addOns:
        [...formattedAddOns, ...studioAddOns].length > 0
          ? [...formattedAddOns, ...studioAddOns]
          : ["No add-ons selected"],
      includedServices: getIncludedPackageOffers(),
    };
  };

  const renderStep = () => {
    if (isCombinedStudioBooking) {
      const studioCards = getStudioListItems();
      const selectedStudioIds = selectedStudios.map((studio) => studio.studioId);
      const selectedStudioCard =
        studioCards.find((studio) => studio.id === selectedStudios[0]?.studioId) ||
        studioCards[0];
      const primaryService = getPrimaryCreativeServiceLabel(
        bookingState.selectedServices
      );

      switch (internalStep) {
        case 0:
          return (
            <GuidedBookingCard
              initialEmail={bookingState.email || user?.email || ""}
              onContinue={handleEmailSubmitted}
              imageSrc="/images/misc/BookingFlow/GuidedBookingImg.png"
            />
          );
        case 1:
          return (
            <AskingServices
              onContinue={handleServicesSelected}
              onBack={() => setInternalStep(0)}
              initialSelected={bookingState.selectedServices}
              stepNumber={getStepMeta(1).stepNumber}
              completionPercentage={getStepMeta(1).completionPercentage}
            />
          );
        case combinedIntroStep:
          return (
            <FlowInfoCard
              onContinue={() => setInternalStep(combinedStudioTypeStep)}
              onBack={() => setInternalStep(1)}
              service={primaryService}
            />
          );
        case combinedStudioTypeStep:
          return (
            <BrowseStudioTypes
              initialCrewCount={bookingState.studioCrewCount}
              initialShootType={bookingState.studioShootType}
              onCrewCountChange={(studioCrewCount) => setBookingState((prev) => ({ ...prev, studioCrewCount }))}
              onShootTypeChange={(studioShootType) => setBookingState((prev) => ({ ...prev, studioShootType }))}
              onContinue={handleCombinedStudioTypeSelected}
              onBack={() => setInternalStep(combinedIntroStep)}
              initialSelectedKey={bookingState.studioCategory || "production"}
              title="What kind of space do you need?"
              subtitle="Choose the setup that best fits your project."
              stepNumber={getStepMeta(combinedStudioTypeStep).stepNumber}
              completionPercentage={getStepMeta(combinedStudioTypeStep).completionPercentage}
              showCrewInput
              showShootType
            />
          );
        case combinedShootScheduleStep:
          return (
            <ScheduleShoot
              onContinue={handleCombinedShootScheduleSubmitted}
              onBack={() => setInternalStep(combinedStudioTypeStep)}
              onBrowseStudios={() => toast.info("Choose your studio after setting the shoot schedule.")}
              initialData={bookingState.scheduleData}
              isStudioFlow
              showStudioCreatorBanner={false}
              stepNumber={getStepMeta(combinedShootScheduleStep).stepNumber}
              completionPercentage={getStepMeta(combinedShootScheduleStep).completionPercentage}
            />
          );
        case combinedStudioSelectionStep:
          return (
            <StudiosSelection
              onContinue={handleCombinedStudiosSelected}
              onBack={() => setInternalStep(combinedShootScheduleStep)}
              studios={studioCards}
              initialSelectedStudioIds={selectedStudioIds}
              initialViewMode={studioViewMode}
              onViewModeChange={setStudioViewMode}
              stepNumber={getStepMeta(combinedStudioSelectionStep).stepNumber}
              completionPercentage={getStepMeta(combinedStudioSelectionStep).completionPercentage}
            />
          );
        case combinedOccasionStep:
          return (
            <AskingOccasion
              onContinue={handleCombinedOccasionSelected}
              onBack={() => setInternalStep(combinedStudioSelectionStep)}
              initialSelected={bookingState.selectedOccasion}
              initialViewMode={occasionViewMode}
              onViewModeChange={setOccasionViewMode}
              title="What are you shooting in the studio?"
              subtitle="Select what you need the studio for and we'll tailor the rest of your booking accordingly."
              stepNumber={getStepMeta(combinedOccasionStep).stepNumber}
              completionPercentage={getStepMeta(combinedOccasionStep).completionPercentage}
            />
          );
        case combinedDetailsStep:
          return (
            <ShootDetails
              onContinue={handleCombinedDetailsSubmitted}
              onBack={() => setInternalStep(combinedOccasionStep)}
              initialNotes={bookingState.shootDetailsData?.notes || ""}
              initialLinks={bookingState.shootDetailsData?.links || []}
              stepNumber={getStepMeta(combinedDetailsStep).stepNumber}
              completionPercentage={getStepMeta(combinedDetailsStep).completionPercentage}
            />
          );
        case combinedStudioScheduleStep:
          return (
            <StudioScheduleSync
              onContinue={handleCombinedStudioScheduleSubmitted}
              onBack={() => setInternalStep(combinedDetailsStep)}
              initialScheduleData={bookingState.scheduleData}
              selectedStudio={
                selectedStudioCard
                  ? {
                    name: selectedStudioCard.name,
                    subtitle: selectedStudioCard.subtitle,
                    location: selectedStudioCard.location,
                    rating: selectedStudioCard.rating,
                    reviewCount: selectedStudioCard.reviewCount,
                    tags: selectedStudioCard.tags,
                    pricePerHour: selectedStudioCard.pricePerHour,
                    availability: selectedStudioCard.availability,
                    image: selectedStudioCard.image,
                    link: selectedStudioCard.link,
                  }
                  : undefined
              }
              stepNumber={getStepMeta(combinedStudioScheduleStep).stepNumber}
              completionPercentage={getStepMeta(combinedStudioScheduleStep).completionPercentage}
            />
          );
        case combinedEditsStep:
          return (
            <EditsNeeded
              onContinue={handleCombinedEditsSubmitted}
              onBack={() => setInternalStep(combinedCreativeTeamStep)}
              initialConfig={bookingState.editsConfig}
              baseFreePhotos={roundedPhotoEditSummary.includedCount}
              photosPerSet={PHOTO_EDIT_ADDON_SET_SIZE}
              durationLabel={`${safeDurationHours} ${safeDurationHours === 1 ? "Hour" : "Hours"} Duration`}
              videoEditOptions={editOptions.videoEditOptions}
              photoEditOptions={editOptions.photoEditOptions}
              showVideoEdits={canShowVideoEdits}
              showPhotoEdits={canShowPhotoEdits}
              stepLabel={getStepMeta(combinedEditsStep).stepLabel}
              progressPercent={getStepMeta(combinedEditsStep).completionPercentage}
            />
          );
        case combinedMatchmakerStep:
          return (
            <MatchMakerStep
              onContinue={handleTeamSelected}
              onBack={() => setInternalStep(combinedStudioScheduleStep)}
              initialOption={
                bookingState.teamSelectionData?.teamOption || "best-match"
              }
              packageTitle={`${titleize(bookingState.selectedOccasion)} - ${primaryService}`}
              step={getStepMeta(combinedMatchmakerStep).stepNumber}
              completionPercentage={getStepMeta(combinedMatchmakerStep).completionPercentage}
            />
          );
        case combinedCreativeTeamStep:
          return (
            <CreativeTeam
              initialCounts={creativeTeam}
              selectedServices={bookingState.selectedServices}
              stepNumber={getStepMeta(combinedCreativeTeamStep).stepNumber}
              completionPercentage={getStepMeta(combinedCreativeTeamStep).completionPercentage}
              onBack={() => setInternalStep(combinedMatchmakerStep)}
              onContinue={handleCreativeTeamSubmitted}
            />
          );
        case combinedChooseCreativesStep:
          return shouldChooseOwn ? (
            <ChooseCreativePartner
              onBack={() => setInternalStep(combinedEditsStep)}
              onContinue={handleChooseCreativePartnerSubmitted}
              requiredCount={Object.values(creativeTeam).reduce(
                (sum, count) => sum + Number(count || 0),
                0
              )}
              contentTypes={contentTypes}
              locationLatitude={getCoordinates(bookingState.scheduleData?.locationDetails).lat}
              locationLongitude={getCoordinates(bookingState.scheduleData?.locationDetails).lng}
              requiredRoles={{
                video: Number(creativeTeam.videographer || 0),
                photo: Number(creativeTeam.photographer || 0),
                hybrid: Number(creativeTeam.photoVideoCreator || 0),
              }}
              initialSelectedCreatives={selectedCreatives}
              initialLetBeigeChoose={letBeigeChoose}
              stepNumber={getStepMeta(combinedChooseCreativesStep).stepNumber}
              completionPercentage={getStepMeta(combinedChooseCreativesStep).completionPercentage}
            />
          ) : (
            <AddOnsStep
              onBack={() => setInternalStep(combinedEditsStep)}
              onContinue={handleAddOnsSubmitted}
              initialAddOns={bookingState.addOnsQuantities}
              addOns={addOnsForStep}
              stepNumber={getStepMeta(combinedAddOnsStep).stepNumber}
              completionPercentage={getStepMeta(combinedAddOnsStep).completionPercentage}
            />
          );
        case 13:
          return shouldChooseOwn ? (
            <AddOnsStep
              onBack={() => setInternalStep(combinedChooseCreativesStep)}
              onContinue={handleAddOnsSubmitted}
              initialAddOns={bookingState.addOnsQuantities}
              addOns={addOnsForStep}
              stepNumber={getStepMeta(combinedAddOnsStep).stepNumber}
              completionPercentage={getStepMeta(combinedAddOnsStep).completionPercentage}
            />
          ) : (
            <ShootSummaryStep
              onBack={() => setInternalStep(combinedAddOnsStep)}
              onContinue={handleSummarySubmitted}
              onEditStep={handleEditStepByName}
              summaryData={getSummaryData()}
              initialContact={bookingState.contactInformation}
              stepNumber={getStepMeta(combinedSummaryStep).stepNumber}
              completionPercentage={getStepMeta(combinedSummaryStep).completionPercentage}
            />
          );
        case 14:
          return shouldChooseOwn ? (
            <ShootSummaryStep
              onBack={() => setInternalStep(combinedAddOnsStep)}
              onContinue={handleSummarySubmitted}
              onEditStep={handleEditStepByName}
              summaryData={getSummaryData()}
              initialContact={bookingState.contactInformation}
              stepNumber={getStepMeta(combinedSummaryStep).stepNumber}
              completionPercentage={getStepMeta(combinedSummaryStep).completionPercentage}
            />
          ) : (
            <ConfirmAndPay
              onBack={() => setInternalStep(combinedSummaryStep)}
              onConfirmAndPay={handleConfirmAndPay}
            isSubmitting={isSubmitting}
              onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
              pricingData={getPricingData()}
              stepNumber={getStepMeta(combinedConfirmStep).stepNumber}
              completionPercentage={getStepMeta(combinedConfirmStep).completionPercentage}
            />
          );
        case 15:
          return shouldChooseOwn ? (
            <ConfirmAndPay
              onBack={() => setInternalStep(combinedSummaryStep)}
              onConfirmAndPay={handleConfirmAndPay}
            isSubmitting={isSubmitting}
              onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
              pricingData={getPricingData()}
              stepNumber={getStepMeta(combinedConfirmStep).stepNumber}
              completionPercentage={getStepMeta(combinedConfirmStep).completionPercentage}
            />
          ) : (
            <BookingConfirmed />
          );
        default:
          return null;
      }
    }

    switch (internalStep) {
      case 0:
        return (
          <GuidedBookingCard
            initialEmail={bookingState.email || user?.email || ""}
            onContinue={handleEmailSubmitted}
            imageSrc="/images/misc/BookingFlow/GuidedBookingImg.png"
          />
        );
      case 1:
        return (
          <AskingServices
            onContinue={handleServicesSelected}
            onBack={() => setInternalStep(0)}
            initialSelected={bookingState.selectedServices}
            stepNumber={getStepMeta(1).stepNumber}
            completionPercentage={getStepMeta(1).completionPercentage}
          />
        );
      case 2:
        return isStudioOnlyBooking ? (
          <StudioShootDetails
            onContinue={handleStudioOnlyDetailsSubmitted}
            onBack={() => setInternalStep(1)}
            initialProjectName=""
            initialDescription={bookingState.shootDetailsData?.notes || ""}
            initialFullName={bookingState.contactInformation?.fullName || ""}
            initialPhoneNumber={bookingState.contactInformation?.phoneNumber || ""}
            stepNumber={getStepMeta(studioOnlyDetailsStep).stepNumber}
            completionPercentage={getStepMeta(studioOnlyDetailsStep).completionPercentage}
          />
        ) : (
          <AskingOccasion
            onContinue={handleOccasionSelected}
            onBack={() => setInternalStep(1)}
            initialSelected={bookingState.selectedOccasion}
            initialViewMode={occasionViewMode}
            onViewModeChange={setOccasionViewMode}
            stepNumber={getStepMeta(2).stepNumber}
            completionPercentage={getStepMeta(2).completionPercentage}
          />
        );
      case bookingDetailsStep:
        return isStudioOnlyBooking ? (
          <BrowseStudioTypes
            initialCrewCount={bookingState.studioCrewCount}
            initialShootType={bookingState.studioShootType}
            onCrewCountChange={(studioCrewCount) => setBookingState((prev) => ({ ...prev, studioCrewCount }))}
            onShootTypeChange={(studioShootType) => setBookingState((prev) => ({ ...prev, studioShootType }))}
            onContinue={handleStudioTypeSelected}
            onBack={() => setInternalStep(studioOnlyDetailsStep)}
            initialSelectedKey={bookingState.studioCategory || "production"}
            title="What kind of space do you need?"
            subtitle="Choose the setup that best fits your project."
            stepNumber={getStepMeta(studioOnlyTypeStep).stepNumber}
            completionPercentage={getStepMeta(studioOnlyTypeStep).completionPercentage}
            showCrewInput
          />
        ) : (
          <ScheduleShoot
            onContinue={handleScheduleSubmitted}
            onBack={() => setInternalStep(2)}
            onBrowseStudios={handleBrowseStudios}
            initialData={bookingState.scheduleData}
            stepNumber={getStepMeta(bookingDetailsStep).stepNumber}
            completionPercentage={getStepMeta(bookingDetailsStep).completionPercentage}
          />
        );
      case creativeStudioRecommendationStep: {
        const recommendation = getRecommendedStudioCopy(
          bookingState.selectedOccasion
        );

        return (
          <StudioRecommendation
            initialCrewCount={bookingState.studioCrewCount}
            onCrewCountChange={(studioCrewCount) => setBookingState((prev) => ({ ...prev, studioCrewCount }))}
            onContinue={handleCreativeJourneyStudioRecommendation}
            onChangeStudioType={() => {
              setHasChangedStudioType(true);
              setInternalStep(creativeStudioTypeStep);
            }}
            onBack={() => setInternalStep(bookingDetailsStep)}
            occasionTitle={`${titleize(bookingState.selectedOccasion)} Event`}
            recommendedStudioType={recommendation.title}
            recommendedStudioDescription={recommendation.description}
            stepNumber={getStepMeta(creativeStudioRecommendationStep).stepNumber}
            completionPercentage={getStepMeta(creativeStudioRecommendationStep).completionPercentage}
          />
        );
      }
      case creativeStudioTypeStep:
        return (
          <BrowseStudioTypes
            initialCrewCount={bookingState.studioCrewCount}
            initialShootType={bookingState.studioShootType}
            onCrewCountChange={(studioCrewCount) => setBookingState((prev) => ({ ...prev, studioCrewCount }))}
            onShootTypeChange={(studioShootType) => setBookingState((prev) => ({ ...prev, studioShootType }))}
            onContinue={handleCreativeJourneyStudioTypeSelected}
            onBack={() => setInternalStep(creativeStudioRecommendationStep)}
            initialSelectedKey={
              bookingState.studioCategory ||
              getRecommendedStudioCategory(bookingState.selectedOccasion)
            }
            occasionTitle={`${titleize(bookingState.selectedOccasion)} Shoots`}
            stepNumber={getStepMeta(creativeStudioTypeStep).stepNumber}
            completionPercentage={getStepMeta(creativeStudioTypeStep).completionPercentage}
          />
        );
      case creativeStudioSelectionStep:
        return (
          <StudiosSelection
            onContinue={handleCreativeJourneyStudiosSelected}
            onBack={() =>
              setInternalStep(
                hasChangedStudioType
                  ? creativeStudioTypeStep
                  : creativeStudioRecommendationStep
              )
            }
            studios={getStudioListItems()}
            initialSelectedStudioIds={selectedStudios.map((studio) => studio.studioId)}
            initialViewMode={studioViewMode}
            onViewModeChange={setStudioViewMode}
            stepNumber={getStepMeta(creativeStudioSelectionStep).stepNumber}
            completionPercentage={getStepMeta(creativeStudioSelectionStep).completionPercentage}
          />
        );
      case creativeStudioScheduleStep: {
        const selectedStudioCard = getStudioListItems().find(
          (studio) => studio.id === selectedStudios[0]?.studioId
        );

        return (
          <StudioScheduleSync
            onContinue={handleCreativeJourneyStudioScheduleSubmitted}
            onBack={() => setInternalStep(creativeStudioSelectionStep)}
            initialScheduleData={bookingState.scheduleData}
            selectedStudio={
              selectedStudioCard
                ? {
                  ...selectedStudioCard,
                  image: selectedStudios[0]?.image || selectedStudioCard.image,
                }
                : undefined
            }
            stepNumber={getStepMeta(creativeStudioScheduleStep).stepNumber}
            completionPercentage={getStepMeta(creativeStudioScheduleStep).completionPercentage}
          />
        );
      }
      case editsStep:
        return isStudioOnlyBooking ? (
          <ScheduleShoot
            onContinue={handleStudioOnlyScheduleSubmitted}
            onBack={() => setInternalStep(studioOnlyTypeStep)}
            onBrowseStudios={() => toast.info("You can add creators after selecting a studio.")}
            isStudioFlow
            initialData={bookingState.scheduleData}
            stepNumber={getStepMeta(studioOnlyScheduleStep).stepNumber}
            completionPercentage={getStepMeta(studioOnlyScheduleStep).completionPercentage}
          />
        ) : (
          <EditsNeeded
            onContinue={handleEditsSubmitted}
            onBack={() => setInternalStep(creativeTeamStep)}
            initialConfig={bookingState.editsConfig}
            baseFreePhotos={roundedPhotoEditSummary.includedCount}
            photosPerSet={PHOTO_EDIT_ADDON_SET_SIZE}
            durationLabel={`${safeDurationHours} ${safeDurationHours === 1 ? "Hour" : "Hours"} Duration`}
            videoEditOptions={editOptions.videoEditOptions}
            photoEditOptions={editOptions.photoEditOptions}
            showVideoEdits={canShowVideoEdits}
            showPhotoEdits={canShowPhotoEdits}
            stepLabel={getStepMeta(editsStep).stepLabel}
            progressPercent={getStepMeta(editsStep).completionPercentage}
          />
        );
      case detailsStep:
        return isStudioOnlyBooking ? (
          <StudiosSelection
            onContinue={handleStudioOnlyStudiosSelected}
            onBack={() => setInternalStep(studioOnlyScheduleStep)}
            studios={HOURLY_STUDIO_LIST.map((studio) => ({
              id: studio.id,
              name: studio.name,
              subtitle: studio.poolType ? `(${studio.poolType})` : "",
              location: studio.location,
              rating: Number(studio.rating || 4.5),
              reviewCount: Number(studio.reviews || 0),
              tags: studio.bestFor?.slice(0, 2) || ["Production-friendly"],
              pricePerHour: Number(studio.priceValue || 0),
              availability: "Available by booking",
              image: studio.image,
              link: `/studios/${studio.id}`,
            }))}
            initialViewMode={studioViewMode}
            onViewModeChange={setStudioViewMode}
            stepNumber={getStepMeta(studioOnlySelectionStep).stepNumber}
            completionPercentage={getStepMeta(studioOnlySelectionStep).completionPercentage}
          />
        ) : (
          <ShootDetails
            onContinue={handleDetailsSubmitted}
            onBack={() =>
              setInternalStep(
                bookingState.selectedServices.includes("studios")
                  ? creativeStudioScheduleStep
                  : bookingDetailsStep
              )
            }
            initialNotes={bookingState.shootDetailsData?.notes || ""}
            initialLinks={bookingState.shootDetailsData?.links || []}
            stepNumber={getStepMeta(detailsStep).stepNumber}
            completionPercentage={getStepMeta(detailsStep).completionPercentage}
          />
        );
      case matchmakerStep:
        return isStudioOnlyBooking ? (
          <ShootSummaryStep
            onBack={() => setInternalStep(studioOnlySelectionStep)}
            onContinue={handleSummarySubmitted}
            onEditStep={handleEditStepByName}
            summaryData={getSummaryData()}
            initialContact={bookingState.contactInformation}
            stepNumber={getStepMeta(studioOnlySummaryStep).stepNumber}
            completionPercentage={getStepMeta(studioOnlySummaryStep).completionPercentage}
          />
        ) : (
          <MatchMakerStep
            onContinue={handleTeamSelected}
            onBack={() => setInternalStep(detailsStep)}
            initialOption={
              bookingState.teamSelectionData?.teamOption || "best-match"
            }
            packageTitle={getPackageDisplayName(
              bookingState.selectedOccasion,
              bookingState.selectedServices
            )}
            packageInclusions={packageInclusions}
            showStudioCallout={selectedStudios.length > 0}
            step={getStepMeta(matchmakerStep).stepNumber}
            completionPercentage={getStepMeta(matchmakerStep).completionPercentage}
          />
        );
      case creativeTeamStep:
        return isStudioOnlyBooking ? (
          <ConfirmAndPay
            onBack={() => setInternalStep(studioOnlySummaryStep)}
            onConfirmAndPay={handleConfirmAndPay}
            isSubmitting={isSubmitting}
            onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
            pricingData={getPricingData()}
            stepNumber={getStepMeta(studioOnlyConfirmStep).stepNumber}
            completionPercentage={getStepMeta(studioOnlyConfirmStep).completionPercentage}
          />
        ) : (
          <CreativeTeam
            initialCounts={creativeTeam}
            selectedServices={bookingState.selectedServices}
            stepNumber={getStepMeta(creativeTeamStep).stepNumber}
            completionPercentage={getStepMeta(creativeTeamStep).completionPercentage}
            onBack={() => setInternalStep(matchmakerStep)}
            onContinue={handleCreativeTeamSubmitted}
          />
        );
      case chooseCreativesStep:
        return shouldChooseOwn ? (
          <ChooseCreativePartner
            onBack={() => setInternalStep(editsStep)}
            onContinue={handleChooseCreativePartnerSubmitted}
            requiredCount={Object.values(creativeTeam).reduce(
              (sum, count) => sum + Number(count || 0),
              0
            )}
            contentTypes={contentTypes}
            locationLatitude={getCoordinates(bookingState.scheduleData?.locationDetails).lat}
            locationLongitude={getCoordinates(bookingState.scheduleData?.locationDetails).lng}
            requiredRoles={{
              video: Number(creativeTeam.videographer || 0),
              photo: Number(creativeTeam.photographer || 0),
              hybrid: Number(creativeTeam.photoVideoCreator || 0),
            }}
            initialSelectedCreatives={selectedCreatives}
            initialLetBeigeChoose={letBeigeChoose}
            stepNumber={getStepMeta(chooseCreativesStep).stepNumber}
            completionPercentage={getStepMeta(chooseCreativesStep).completionPercentage}
          />
        ) : (
          <AddOnsStep
            onBack={() => setInternalStep(editsStep)}
            onContinue={handleAddOnsSubmitted}
            initialAddOns={bookingState.addOnsQuantities}
            addOns={addOnsForStep}
            stepNumber={getStepMeta(addOnsStep).stepNumber}
            completionPercentage={getStepMeta(addOnsStep).completionPercentage}
          />
        );
      case 9:
        return shouldChooseOwn ? (
          <AddOnsStep
            onBack={() => setInternalStep(chooseCreativesStep)}
            onContinue={handleAddOnsSubmitted}
            initialAddOns={bookingState.addOnsQuantities}
            addOns={addOnsForStep}
            stepNumber={getStepMeta(addOnsStep).stepNumber}
            completionPercentage={getStepMeta(addOnsStep).completionPercentage}
          />
        ) : (
          <ShootSummaryStep
            onBack={() => setInternalStep(addOnsStep)}
            onContinue={handleSummarySubmitted}
            onEditStep={handleEditStepByName}
            summaryData={getSummaryData()}
            initialContact={bookingState.contactInformation}
            stepNumber={getStepMeta(summaryStep).stepNumber}
            completionPercentage={getStepMeta(summaryStep).completionPercentage}
          />
        );
      case 10:
        return shouldChooseOwn ? (
          <ShootSummaryStep
            onBack={() => setInternalStep(addOnsStep)}
            onContinue={handleSummarySubmitted}
            onEditStep={handleEditStepByName}
            summaryData={getSummaryData()}
            initialContact={bookingState.contactInformation}
            stepNumber={getStepMeta(summaryStep).stepNumber}
            completionPercentage={getStepMeta(summaryStep).completionPercentage}
          />
        ) : (
          <ConfirmAndPay
            onBack={() => setInternalStep(summaryStep)}
            onConfirmAndPay={handleConfirmAndPay}
            isSubmitting={isSubmitting}
            onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
            pricingData={getPricingData()}
            stepNumber={getStepMeta(confirmStep).stepNumber}
            completionPercentage={getStepMeta(confirmStep).completionPercentage}
          />
        );
      case 11:
        return shouldChooseOwn ? (
          <ConfirmAndPay
            onBack={() => setInternalStep(summaryStep)}
            onConfirmAndPay={handleConfirmAndPay}
            isSubmitting={isSubmitting}
            onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
            pricingData={getPricingData()}
            stepNumber={getStepMeta(confirmStep).stepNumber}
            completionPercentage={getStepMeta(confirmStep).completionPercentage}
          />
        ) : (
          <BookingConfirmed />
        );
      case 12:
        return <BookingConfirmed />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#101010] min-h-screen text-white selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />

      <LeaveConfirmationModal
        isOpen={showLeaveModal}
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowLeaveModal(false)}
      />

      <main className="relative pt-24 lg:pt-30 2xl:pt-32 pb-8 min-h-screen flex flex-col items-center justify-center w-full">
        <div className="w-full relative mx-auto">{renderStep()}</div>
      </main>

      <Footer />
    </div>
  );
};

export default BookAShootV4;
