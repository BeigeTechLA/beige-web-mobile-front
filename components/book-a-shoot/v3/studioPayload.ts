import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import type { BookingDataV3 } from "./types";
import type { SelectedStudio } from "./studioData";

type StudioItemPayload = {
  studio_id: string;
  name: string;
  location?: string;
  image?: string;
  pricing_mode: "hourly" | "weekend";
  pricing_category?: string;
  pricing_label?: string;
  unit_price: number;
  quantity: number;
  total: number;
  price_label?: string;
  selected_date?: string;
  start_time?: string;
  end_time?: string;
  time_zone?: string;
  studio_booking_type?: "single_day" | "multi_day";
  booking_days?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    time_zone?: string;
  }>;
  cast_and_crew_count?: number;
  update_studio_datetime?: boolean;
  lat?: number;
  lng?: number;
};

const getCrewCount = (data: BookingDataV3) =>
  data.selectedCrewIds?.length || Object.values(data.roleCounts || {}).reduce((sum, count) => sum + Number(count || 0), 0);

const buildStudioItem = (
  studio: SelectedStudio,
  crewCount: number,
  bookingType: BookingDataV3["bookingType"] = "single_day",
  bookingDays: BookingDataV3["bookingDays"] = [],
  includeImage = true,
  includePriceLabel = true,
  includeLatLng = true,
  includeDateTimeUpdate = true,
  includeTimeZone = true,
): StudioItemPayload => {
  const resolvedQuantity =
    bookingType === "multi_day" && bookingDays?.length
      ? bookingDays.reduce((sum, day) => sum + Number(day.durationHours || 0), 0)
      : Number(studio.quantity || 0);
  const resolvedTotal = Number.isFinite(resolvedQuantity)
    ? resolvedQuantity * Number(studio.unitPrice || 0)
    : Number(studio.totalPrice || 0);
  const timeZone = getBrowserTimeZone();

  return {
    studio_id: studio.studioId,
    name: studio.name,
    location: studio.location,
    ...(includeImage ? { image: studio.image } : {}),
    pricing_mode: studio.pricingMode,
    pricing_category: studio.pricingCategory,
    pricing_label: studio.pricingLabel,
    unit_price: studio.unitPrice,
    quantity: resolvedQuantity,
    total: resolvedTotal,
    ...(includePriceLabel ? { price_label: studio.priceLabel } : {}),
    selected_date: studio.selectedDate,
    start_time: studio.startTime,
    end_time: studio.endTime,
    ...(includeTimeZone ? { time_zone: timeZone } : {}),
    studio_booking_type: bookingType || "single_day",
    booking_days:
      bookingType === "multi_day"
        ? (bookingDays || []).map((day) => ({
            date: day.date,
            start_time: day.startTime,
            end_time: day.endTime,
            duration_hours: day.durationHours,
            time_zone: day.timeZone || timeZone,
          }))
        : [],
    cast_and_crew_count: crewCount,
    ...(includeDateTimeUpdate ? { update_studio_datetime: true } : {}),
    ...(includeLatLng ? { lat: studio.lat, lng: studio.lng } : {}),
  };
};

export const buildStudioLeadPayload = (data: BookingDataV3) => {
  const selectedStudios = data.selectedStudios || [];
  const crewCount = getCrewCount(data);

  return {
    studio_total: selectedStudios.reduce((sum, studio) => sum + Number(studio.totalPrice || 0), 0),
    studio_items: selectedStudios.map((studio) =>
      buildStudioItem(studio, crewCount, data.bookingType, data.bookingDays, true, true, true, true, true),
    ),
  };
};

export const buildStudioQuotePayload = (data: BookingDataV3) => {
  const selectedStudios = data.selectedStudios || [];
  const crewCount = getCrewCount(data);

  return {
    studio_total: selectedStudios.reduce((sum, studio) => sum + Number(studio.totalPrice || 0), 0),
    studio_items: selectedStudios.map((studio) =>
      buildStudioItem(studio, crewCount, data.bookingType, data.bookingDays, false, false, true, true, true),
    ),
  };
};

export const buildStudioFinalizePayload = (data: BookingDataV3) => {
  const selectedStudios = data.selectedStudios || [];
  const crewCount = getCrewCount(data);
  const primaryStudio = selectedStudios[0];

  return {
    studio_total: selectedStudios.reduce((sum, studio) => sum + Number(studio.totalPrice || 0), 0),
    studio_items: selectedStudios.map((studio) =>
      buildStudioItem(studio, crewCount, data.bookingType, data.bookingDays, true, true, true, true, false),
    ),
    start_date_time:
      primaryStudio?.selectedDate && primaryStudio?.startTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.startTime}:00`
        : undefined,
    end_date_time:
      primaryStudio?.selectedDate && primaryStudio?.endTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.endTime}:00`
        : undefined,
    crew_size: String(crewCount || 0),
    matching_method: crewCount > 0 ? "manual_selection" : "studio_only",
    selected_crew_ids: data.selectedCrewIds || [],
  };
};

export const buildStudioTimingPayload = (data: BookingDataV3) => {
  const primaryStudio = data.selectedStudios?.[0];
  return {
    start_date: primaryStudio?.selectedDate || getLocalDatePart(data.startDate),
    start_time: primaryStudio?.startTime || getLocalTimePart(data.startDate),
    end_time: primaryStudio?.endTime || getLocalTimePart(data.endDate),
    time_zone: getBrowserTimeZone(),
    duration_hours: primaryStudio?.quantity || 0,
  };
};
