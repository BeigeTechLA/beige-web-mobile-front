"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";

import LeaveConfirmationModal from "./components/LeaveConfirmationModal";
import GuidedBookingCard from "./components/GuidedBookingCard";
import AskingServices from "./components/AskingServices";
import EditsNeeded, { EditsConfig } from "./components/EditsNeeded";
import AskingOccasion from "./components/AskingOccassion";
import ScheduleShoot from "./components/ScheduleShoot";
import StudioSelection from "./components/StudioSelection";
import ShootDetails, { ShootDetailsData } from "./components/ShootDetails";
import MatchMakerStep, { TeamSelectionData } from "./components/MatchMaker";
import CreativeTeam from "./components/CreativeTeam";
import ChooseCreativePartner from "./components/ChooseCreativePartner";
import AddOnsStep from "./components/AddOnsStep";
import ShootSummaryStep, { ShootSummaryData } from "./components/ShootSummary";
import ConfirmAndPay, { PricingBreakdown } from "./components/ConfirmAndPay";
import BookingConfirmed from "./components/BookingConfirmed";
import StudioRecommendations from "./components/StudioRecommendations";
import BrowseStudioTypes from "./components/BrowseStudioTypes";
import StudioAddSuccess from "./components/StudioAddSuccess";
import StudiosSelection from "./components/StudiosSelection";
import StudioScheduleSync from "./components/StudioScheduleSync";
import StudioShootDetails, {
  StudioShootDetailsData,
} from "./components/StudioShootDetails";

import type { Creator } from "@/lib/types";
import type { QuoteCalculation, SelectedItem } from "@/lib/api/pricing";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useCreateGuestBookingV4Mutation,
  useUpdateGuestBookingV4Mutation,
} from "@/lib/redux/features/booking/guestBookingApi";
import {
  useCalculateQuoteFromCreatorsV4Mutation,
  useSaveQuoteV4Mutation,
} from "@/lib/redux/features/pricing/pricingApi";
import { useTrackEarlyInterestV4Mutation } from "@/lib/redux/features/sales/salesApi";
import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import { parseDate } from "@/src/components/landing/lib/utils";
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

const ADD_ON_LABELS: Record<string, string> = {
  additional_camera: "Additional Camera",
  teleprompter: "Teleprompter",
  drone: "Drone",
  lavalier_mics: "Additional Lavalier Microphones",
  green_screen: "Green Screen",
  backdrop: "Backdrop",
  additional_lights: "Additional Lights",
  next_day_editing: "Next-Day Editing",
  expedited_editing: "Expedited Editing",
};

const ADD_ON_PRICES: Record<string, number> = {
  additional_camera: 350,
  teleprompter: 250,
  drone: 500,
  lavalier_mics: 250,
  green_screen: 500,
  backdrop: 500,
  additional_lights: 350,
  next_day_editing: 750,
  expedited_editing: 500,
};

const CREATIVE_PARTNER_HOURLY_RATE = 250;

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

  const [internalStep, setInternalStep] = useState<number>(0);
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
  }>({
    email: "",
    selectedServices: ["photography"],
    editsConfig: {
      needsEdits: true,
      editedPhotosSets: 0,
      videoEditTypes: [],
      photoEditTypes: [],
    },
    selectedOccasion: "corporate",
    scheduleData: null,
    shootDetailsData: null,
    teamSelectionData: null,
    addOnsQuantities: { additional_camera: 1 },
    addOnsSubtotal: 350,
    contactInformation: null,
    studioCategory: null,
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

  const isStudioBooking =
    bookingState.selectedOccasion === "studio" ||
    bookingState.selectedServices.includes("studios");
  const isStudioOnlyBooking =
    bookingState.selectedServices.length === 1 &&
    bookingState.selectedServices.includes("studios");
  const baseContentTypes = mapServicesToContentTypes(bookingState.selectedServices);
  const contentTypes = isStudioBooking
    ? [...new Set([...baseContentTypes, "studio"])]
    : baseContentTypes;
  const canShowVideoEdits =
    contentTypes.includes("videographer") || contentTypes.includes("editing");
  const canShowPhotoEdits =
    contentTypes.includes("photographer") || contentTypes.includes("editing");
  const editOptions = getEditOptionsForShootType(
    bookingState.selectedOccasion,
    canShowVideoEdits,
    canShowPhotoEdits
  );

  const primaryStudio = selectedStudios[0];
  const selectedStudiosTotal = getSelectedStudiosTotal(selectedStudios);
  const durationHours = useMemo(() => {
    if (primaryStudio?.quantity) return primaryStudio.quantity;
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

  const shouldChooseOwn =
    bookingState.teamSelectionData?.teamOption === "choose-own";
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [internalStep]);

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
  };

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
    void saveLeadProgress({ guest_email: email });
  };

  const handleServicesSelected = (services: string[]) => {
    const recommendedTeam = getRecommendedTeam(services);
    const includesStudio = services.includes("studios");
    const isOnlyStudio = services.length === 1 && includesStudio;
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
          ? "corporate"
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
    setInternalStep(isOnlyStudio ? studioOnlyDetailsStep : 2);
    void saveLeadProgress({
      content_type: mapServicesToContentTypes(services).join(","),
      shoot_type: isOnlyStudio ? "studio" : undefined,
    });
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
    void saveLeadProgress({
      shoot_type: selectedOccasion,
      content_type:
        selectedOccasion === "studio"
          ? [...new Set([...contentTypes, "studio"])].join(",")
          : contentTypes.join(","),
    });
  };

  const handleStudioSubmitted = (studios: SelectedStudio[]) => {
    const normalizedStudios = normalizeSelectedStudios({ selectedStudios: studios });
    const studio = normalizedStudios[0];
    const browserTimeZone = getBrowserTimeZone();
    const nextScheduleData: ScheduleData | null = studio
      ? {
          dateOption: "have-date",
          bookingType: "single_day",
          date:
            studio.selectedDate && studio.startTime
              ? `${studio.selectedDate}T${studio.startTime}:00`
              : null,
          startDate:
            studio.selectedDate && studio.startTime
              ? `${studio.selectedDate}T${studio.startTime}:00`
              : null,
          endDate:
            studio.selectedDate && studio.endTime
              ? `${studio.selectedDate}T${studio.endTime}:00`
              : null,
          startTime: studio.startTime || null,
          endTime: studio.endTime || null,
          bookingDays: [
            {
              date: studio.selectedDate || "",
              startTime: studio.startTime,
              endTime: studio.endTime,
              duration_hours: studio.quantity,
              time_zone: browserTimeZone,
            },
          ].filter((day) => day.date),
          location: studio.location,
        }
      : null;

    setSelectedStudios(normalizedStudios);
    setBookingState((prev) => ({
      ...prev,
      selectedOccasion: "studio",
      selectedServices: prev.selectedServices.includes("studios")
        ? prev.selectedServices
        : [...prev.selectedServices, "studios"],
      scheduleData: nextScheduleData,
    }));
    setInternalStep(editsStep);

    if (studio) {
      void saveLeadProgress({
        content_type: [...new Set([...contentTypes, "studio"])].join(","),
        shoot_type: "studio",
        start_date: studio.selectedDate,
        start_time: studio.startTime,
        end_time: studio.endTime,
        time_zone: browserTimeZone,
        startDate: nextScheduleData?.startDate
          ? toUtcIsoIfValid(nextScheduleData.startDate)
          : undefined,
        endDate: nextScheduleData?.endDate
          ? toUtcIsoIfValid(nextScheduleData.endDate)
          : undefined,
        booking_type: "single_day",
        booking_days: nextScheduleData?.bookingDays || [],
        location: studio.location,
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
    }
  };

  const handleScheduleSubmitted = (scheduleData: ScheduleData) => {
    const browserTimeZone = getBrowserTimeZone();
    const coords = getCoordinates(scheduleData.locationDetails);

    setBookingState((prev) => ({ ...prev, scheduleData }));
    setInternalStep(editsStep);
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
    setInternalStep(studioOnlySummaryStep);
    void saveLeadProgress({
      content_type: "studio",
      shoot_type: "studio",
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

  const handleEditsSubmitted = (editsConfig: EditsConfig) => {
    setBookingState((prev) => ({ ...prev, editsConfig }));
    setInternalStep(detailsStep);
    void saveLeadProgress({
      edits_needed: editsConfig.needsEdits,
      video_edit_types: editsConfig.videoEditTypes,
      photo_edit_types: editsConfig.photoEditTypes,
    });
  };

  const handleDetailsSubmitted = (shootDetailsData: ShootDetailsData) => {
    setBookingState((prev) => ({ ...prev, shootDetailsData }));
    setInternalStep(matchmakerStep);
  };

  const handleTeamSelected = (teamSelectionData: TeamSelectionData) => {
    setLetBeigeChoose(teamSelectionData.teamOption === "best-match");
    if (teamSelectionData.teamOption === "best-match") {
      setSelectedCreatives([]);
    }
    setBookingState((prev) => ({ ...prev, teamSelectionData }));
    setInternalStep(creativeTeamStep);
  };

  const handleCreativeTeamSubmitted = (updatedTeam: { [key: string]: number }) => {
    setCreativeTeam(updatedTeam);

    if (bookingState.teamSelectionData?.teamOption === "choose-own") {
      setInternalStep(chooseCreativesStep);
      return;
    }

    setLetBeigeChoose(true);
    setSelectedCreatives([]);
    setInternalStep(8);
  };

  const handleChooseCreativePartnerSubmitted = (
    creatives: Creator[],
    beigeChoice: boolean
  ) => {
    setSelectedCreatives(creatives);
    setLetBeigeChoose(beigeChoice);
    setInternalStep(addOnsStep);
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
    setInternalStep(summaryStep);
  };

  const getSelectedAddOnLabels = () =>
    Object.entries(bookingState.addOnsQuantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([key, quantity]) => `${ADD_ON_LABELS[key] || titleize(key)} x${quantity}`);

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

  const buildCustomAddOnItems = () =>
    Object.entries(bookingState.addOnsQuantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([key, quantity]) => {
        const qty = Number(quantity) || 0;
        const unitPrice = ADD_ON_PRICES[key] || 0;

        return {
          key,
          name: ADD_ON_LABELS[key] || titleize(key),
          quantity: qty,
          unit_price: unitPrice,
          total: unitPrice * qty,
        };
      })
      .filter((item) => item.quantity > 0 && item.total > 0);

  const buildPricingInputs = () => {
    const roleCounts = {
      videographer: Number(creativeTeam.videographer || 0),
      photographer: Number(creativeTeam.photographer || 0),
      cinematographer: Number(creativeTeam.cinematographer || 0),
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
        }
      });
    }

    const addOnItems = useStudioInclusivePricing ? [] : buildKnownAddOnItems();
    const customAddOnItems = useStudioInclusivePricing ? [] : buildCustomAddOnItems();
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
      shootHours: useStudioInclusivePricing ? 0 : safeDurationHours,
      shootStartDate: primaryStudio?.selectedDate
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
          skip_discount: true,
          skip_margin: true,
        }).unwrap();
        setPricingPreview(preview);
      } catch (error) {
        console.error("BookAShootV4 pricing preview failed:", error);
        setPricingPreview(null);
      }
    }

    setInternalStep(confirmStep);
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
    ]
      .filter((entry) => String(entry || "").trim())
      .join("\n\n");
    const bookingDays =
      primaryStudio && primaryStudio.selectedDate
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

    const startDate = primaryStudio?.selectedDate || getLocalDatePart(schedule?.startDate);
    const startTime = primaryStudio?.startTime || schedule?.startTime || getLocalTimePart(schedule?.startDate);
    const endTime = primaryStudio?.endTime || schedule?.endTime || getLocalTimePart(schedule?.endDate);
    const startDateTime =
      primaryStudio?.selectedDate && primaryStudio?.startTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.startTime}:00`
        : schedule?.startDate || undefined;
    const endDateTime =
      primaryStudio?.selectedDate && primaryStudio?.endTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.endTime}:00`
        : schedule?.endDate || undefined;
    const crewSize = Object.values(creativeTeam).reduce(
      (sum, count) => sum + Number(count || 0),
      0
    );

    return {
      order_name: `${titleize(bookingState.selectedOccasion || "new")} Shoot - ${
        contact?.fullName || bookingState.email
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
      location: primaryStudio?.location || schedule?.location || "",
      location_latitude: primaryStudio?.lat ?? coords.lat,
      location_longitude: primaryStudio?.lng ?? coords.lng,
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
    switch (stepName) {
      case "project":
        setInternalStep(1);
        break;
      case "schedule":
        setInternalStep(bookingDetailsStep);
        break;
      case "editing":
        setInternalStep(editsStep);
        break;
      case "addons":
        setInternalStep(addOnsStep);
        break;
      default:
        break;
    }
  };

  const handleBrowseStudios = () => {
    setBookingState((prev) => ({
      ...prev,
      selectedOccasion: "studio",
      selectedServices: prev.selectedServices.includes("studios")
        ? prev.selectedServices
        : [...prev.selectedServices, "studios"],
    }));
    setInternalStep(bookingDetailsStep);
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
      if (!item.is_mandatory || item.hidden) return false;
      const category = String(item.category_slug || "").toLowerCase();
      return !["studio", "editing", "services", "photography", "videography"].includes(category);
    });
    const mandatoryFeeCost = visibleMandatoryFees.reduce(
      (sum, item) => sum + Number(item.line_total || 0),
      0
    );
    const mandatoryFeeText = visibleMandatoryFees
      .map((item) => item.item_name)
      .filter(Boolean)
      .join(", ");
    const roleCost =
      pricingInputs.totalRoleCount *
      CREATIVE_PARTNER_HOURLY_RATE *
      Math.max(1, pricingInputs.shootHours || 1);
    const videoEditCount = bookingState.editsConfig.videoEditTypes.length;
    const fallbackEditingServiceCost = bookingState.editsConfig.needsEdits
      ? videoEditCount * 500 + photoEditSetCount * 125
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
    const studioCost = previewLineItems.length > 0
      ? previewStudioCost
      : selectedStudiosTotal;
    const displayedRoleCost = previewLineItems.length > 0 && previewServiceCost > 0
      ? previewServiceCost
      : roleCost;
    const fallbackTotal =
      displayedRoleCost + editingServiceCost + addOnsCost + studioCost + mandatoryFeeCost;
    const totalAmount = pricingPreview?.total ?? fallbackTotal;
    const roleTitleParts = [
      creativeTeam.photographer ? `Photographer x${creativeTeam.photographer}` : "",
      creativeTeam.videographer ? `Videographer x${creativeTeam.videographer}` : "",
    ].filter(Boolean);

    return {
      serviceName:
        selectedStudios.length > 0
          ? selectedStudios.map((studio) => studio.name).join(", ")
          : `${titleize(bookingState.selectedOccasion)} ${titleize(
              bookingState.selectedServices[0] || "Service"
            )}`,
      baseServiceCost: studioCost,
      packageOffers: [
        "All Raw Images, Lighting & Insurance Provided",
        "Up to 45 Minutes Setup Time",
        "Digital Delivery",
      ],
      photosIncluded: roundedPhotoEditSummary.includedCount,
      extraPhotoUnitsText: `Extra Photo Units x${photoEditSetCount}`,
      extraPhotosCount: roundedPhotoEditSummary.extraCount,
      totalPhotosCount: roundedPhotoEditSummary.totalCount,
      videoEditUnitsText: selectedVideoEditLabels.join(", "),
      videoEditsCount: videoEditCount,
      editingServiceCost,
      creativeRoleTitle: roleTitleParts.join(", ") || "Studio Booking",
      creativeRoleCost: displayedRoleCost,
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
      totalAmount,
      depositAmount: Math.min(500, totalAmount || 500),
    };
  };

  const getSummaryData = (): ShootSummaryData => {
    const serviceName =
      bookingState.selectedServices.length > 0
        ? bookingState.selectedServices.map(titleize).join(" & ")
        : "Photography";
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
              primaryStudio?.selectedDate || schedule?.startDate
            )}`;
    const durationLabel = `${durationHours || 0} Hour Duration`;
    const timeStr =
      schedule?.dateOption === "confirm-later"
        ? "Confirm later"
        : `${formatDisplayTime(primaryStudio?.startTime || schedule?.startTime)} - ${formatDisplayTime(
            primaryStudio?.endTime || schedule?.endTime
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
        totalPhotos: `You'll Receive ${roundedPhotoEditSummary.totalCount} Photos`,
      },
      addOns:
        [...formattedAddOns, ...studioAddOns].length > 0
          ? [...formattedAddOns, ...studioAddOns]
          : ["No add-ons selected"],
      includedServices: [
        "All Raw Images, Lighting & Insurance Provided",
        "Up to 45 Minutes Setup Time",
        "Digital Delivery",
      ],
    };
  };

  const renderStep = () => {
    switch (internalStep) {
      case 0:
        return (
          <GuidedBookingCard
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
            stepNumber="01"
            completionPercentage={35}
          />
        ) : (
          <AskingOccasion
            onContinue={handleOccasionSelected}
            onBack={() => setInternalStep(1)}
            initialSelected={bookingState.selectedOccasion}
          />
        );
      case bookingDetailsStep:
        return isStudioOnlyBooking ? (
          <BrowseStudioTypes
            onContinue={handleStudioTypeSelected}
            onBack={() => setInternalStep(studioOnlyDetailsStep)}
            initialSelectedKey={bookingState.studioCategory || "production"}
            title="What kind of space do you need?"
            subtitle="Choose the setup that best fits your project."
            stepNumber="02"
            completionPercentage={50}
            showCrewInput
          />
        ) : isStudioBooking ? (
          <StudioSelection
            onContinue={handleStudioSubmitted}
            onBack={() => setInternalStep(2)}
            initialSelectedStudios={selectedStudios}
          />
        ) : (
          <ScheduleShoot
            onContinue={handleScheduleSubmitted}
            onBack={() => setInternalStep(2)}
            onBrowseStudios={handleBrowseStudios}
            initialData={bookingState.scheduleData}
          />
        );
      case editsStep:
        return isStudioOnlyBooking ? (
          <ScheduleShoot
            onContinue={handleStudioOnlyScheduleSubmitted}
            onBack={() => setInternalStep(studioOnlyTypeStep)}
            onBrowseStudios={() => toast.info("You can add creators after selecting a studio.")}
            isStudioFlow
            initialData={bookingState.scheduleData}
            stepNumber="03"
            completionPercentage={70}
          />
        ) : (
          <EditsNeeded
            onContinue={handleEditsSubmitted}
            onBack={() => setInternalStep(bookingDetailsStep)}
            initialConfig={bookingState.editsConfig}
            baseFreePhotos={roundedPhotoEditSummary.includedCount}
            photosPerSet={PHOTO_EDIT_ADDON_SET_SIZE}
            durationLabel={`${safeDurationHours} Hour Duration`}
            videoEditOptions={editOptions.videoEditOptions}
            photoEditOptions={editOptions.photoEditOptions}
            showVideoEdits={canShowVideoEdits}
            showPhotoEdits={canShowPhotoEdits}
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
            stepNumber="04"
            completionPercentage={85}
          />
        ) : (
          <ShootDetails
            onContinue={handleDetailsSubmitted}
            onBack={() => setInternalStep(editsStep)}
            initialNotes={bookingState.shootDetailsData?.notes || ""}
            initialLinks={bookingState.shootDetailsData?.links || []}
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
          />
        ) : (
          <MatchMakerStep
            onContinue={handleTeamSelected}
            onBack={() => setInternalStep(detailsStep)}
            initialOption={
              bookingState.teamSelectionData?.teamOption || "best-match"
            }
            packageTitle={`${titleize(bookingState.selectedOccasion)} - ${titleize(
              bookingState.selectedServices[0]
            )}`}
          />
        );
      case creativeTeamStep:
        return isStudioOnlyBooking ? (
          <ConfirmAndPay
            onBack={() => setInternalStep(studioOnlySummaryStep)}
            onConfirmAndPay={handleConfirmAndPay}
            onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
            pricingData={getPricingData()}
          />
        ) : (
          <CreativeTeam
            initialCounts={creativeTeam}
            onBack={() => setInternalStep(matchmakerStep)}
            onContinue={handleCreativeTeamSubmitted}
          />
        );
      case chooseCreativesStep:
        return shouldChooseOwn ? (
          <ChooseCreativePartner
            onBack={() => setInternalStep(creativeTeamStep)}
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
            }}
            initialSelectedCreatives={selectedCreatives}
            initialLetBeigeChoose={letBeigeChoose}
          />
        ) : (
          <AddOnsStep
            onBack={() => setInternalStep(creativeTeamStep)}
            onContinue={handleAddOnsSubmitted}
            initialAddOns={bookingState.addOnsQuantities}
          />
        );
      case 9:
        return shouldChooseOwn ? (
          <AddOnsStep
            onBack={() => setInternalStep(chooseCreativesStep)}
            onContinue={handleAddOnsSubmitted}
            initialAddOns={bookingState.addOnsQuantities}
          />
        ) : (
          <ShootSummaryStep
            onBack={() => setInternalStep(addOnsStep)}
            onContinue={handleSummarySubmitted}
            onEditStep={handleEditStepByName}
            summaryData={getSummaryData()}
            initialContact={bookingState.contactInformation}
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
          />
        ) : (
          <ConfirmAndPay
            onBack={() => setInternalStep(summaryStep)}
            onConfirmAndPay={handleConfirmAndPay}
            onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
            pricingData={getPricingData()}
          />
        );
      case 11:
        return shouldChooseOwn ? (
          <ConfirmAndPay
            onBack={() => setInternalStep(summaryStep)}
            onConfirmAndPay={handleConfirmAndPay}
            onConnectTeam={() => toast.info("The Beige team will reach out shortly.")}
            pricingData={getPricingData()}
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

      <main className="relative pt-24 lg:pt-32 pb-8 min-h-screen flex flex-col items-center justify-center w-full">
        <div className="w-full relative mx-auto">{renderStep()}</div>
      </main>

      <Footer />
    </div>
  );
};

export default BookAShootV4;
