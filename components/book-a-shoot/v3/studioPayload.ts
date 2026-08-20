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

const calculateDurationHours = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return 0;
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  if (
    !Number.isFinite(startHours) ||
    !Number.isFinite(startMinutes) ||
    !Number.isFinite(endHours) ||
    !Number.isFinite(endMinutes)
  ) {
    return 0;
  }
  const minutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  return minutes > 0 ? Number((minutes / 60).toFixed(2)) : 0;
};

const getStudioDurationHours = (
  studio: SelectedStudio,
  bookingType: BookingDataV3["bookingType"] = "single_day",
  bookingDays: BookingDataV3["bookingDays"] = [],
) => {
  if (bookingType === "multi_day") {
    return (bookingDays || []).reduce(
      (sum, day) => sum + Number(day.durationHours || calculateDurationHours(day.startTime, day.endTime) || 0),
      0,
    );
  }

  return calculateDurationHours(studio.startTime, studio.endTime) || Number(studio.quantity || 0);
};

const getCrewCount = (data: BookingDataV3) =>
  data.selectedCrewIds?.length || Object.values(data.roleCounts || {}).reduce((sum, count) => sum + Number(count || 0), 0);

export const resolveBookingSchedule = (
  data: Pick<BookingDataV3, "startDate" | "endDate" | "bookingType" | "bookingDays">,
  studio?: SelectedStudio | null,
) => {
  const firstCompleteDay =
    data.bookingType === "multi_day"
      ? (data.bookingDays || []).find((day) => day.date && day.startTime && day.endTime)
      : null;

  return {
    selectedDate:
      firstCompleteDay?.date ||
      studio?.selectedDate ||
      getLocalDatePart(data.startDate),
    startTime:
      firstCompleteDay?.startTime ||
      studio?.startTime ||
      getLocalTimePart(data.startDate),
    endTime:
      firstCompleteDay?.endTime ||
      studio?.endTime ||
      getLocalTimePart(data.endDate),
  };
};

const buildStudioItem = (
  studio: SelectedStudio,
  crewCount: number,
  schedule: ReturnType<typeof getPrimaryStudioSchedule>,
  bookingType: BookingDataV3["bookingType"] = "single_day",
  bookingDays: BookingDataV3["bookingDays"] = [],
  includeImage = true,
  includePriceLabel = true,
  includeLatLng = true,
  includeDateTimeUpdate = true,
  includeTimeZone = true,
): StudioItemPayload => {
  const resolvedQuantity = getStudioDurationHours(studio, bookingType, bookingDays);
  const resolvedTotal = Number((resolvedQuantity * Number(studio.unitPrice || 0)).toFixed(2));
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
    selected_date: schedule.selectedDate,
    start_time: schedule.startTime,
    end_time: schedule.endTime,
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
  const schedule = resolveBookingSchedule(data, selectedStudios[0]);
  const studioTotal = selectedStudios.reduce(
    (sum, studio) => sum + getStudioDurationHours(studio, data.bookingType, data.bookingDays) * Number(studio.unitPrice || 0),
    0,
  );

  return {
    studio_total: Number(studioTotal.toFixed(2)),
    studio_items: selectedStudios.map((studio) =>
      buildStudioItem(studio, crewCount, resolveBookingSchedule(data, studio), data.bookingType, data.bookingDays, true, true, true, true, true),
    ),
    ...schedule,
  };
};

export const buildStudioQuotePayload = (data: BookingDataV3) => {
  const selectedStudios = data.selectedStudios || [];
  const crewCount = getCrewCount(data);
  const schedule = resolveBookingSchedule(data, selectedStudios[0]);
  const studioTotal = selectedStudios.reduce(
    (sum, studio) => sum + getStudioDurationHours(studio, data.bookingType, data.bookingDays) * Number(studio.unitPrice || 0),
    0,
  );

  return {
    studio_total: Number(studioTotal.toFixed(2)),
    studio_items: selectedStudios.map((studio) =>
      buildStudioItem(studio, crewCount, resolveBookingSchedule(data, studio), data.bookingType, data.bookingDays, false, false, true, true, true),
    ),
    ...schedule,
  };
};

export const buildStudioFinalizePayload = (data: BookingDataV3) => {
  const selectedStudios = data.selectedStudios || [];
  const crewCount = getCrewCount(data);
  const primaryStudio = selectedStudios[0];
  const studioTotal = selectedStudios.reduce(
    (sum, studio) => sum + getStudioDurationHours(studio, data.bookingType, data.bookingDays) * Number(studio.unitPrice || 0),
    0,
  );
  const primarySchedule = resolveBookingSchedule(data, primaryStudio);

  return {
    studio_total: Number(studioTotal.toFixed(2)),
    studio_items: selectedStudios.map((studio) =>
      buildStudioItem(studio, crewCount, resolveBookingSchedule(data, studio), data.bookingType, data.bookingDays, true, true, true, true, true),
    ),
    start_date_time: primarySchedule.selectedDate && primarySchedule.startTime
      ? `${primarySchedule.selectedDate}T${primarySchedule.startTime}:00`
      : undefined,
    end_date_time: primarySchedule.selectedDate && primarySchedule.endTime
      ? `${primarySchedule.selectedDate}T${primarySchedule.endTime}:00`
      : undefined,
    crew_size: String(crewCount || 0),
    matching_method: crewCount > 0 ? "manual_selection" : "studio_only",
    selected_crew_ids: data.selectedCrewIds || [],
  };
};

export const buildStudioTimingPayload = (data: BookingDataV3) => {
  const primaryStudio = data.selectedStudios?.[0];
  const schedule = resolveBookingSchedule(data, primaryStudio);
  return {
    start_date: schedule.selectedDate,
    start_time: schedule.startTime,
    end_time: schedule.endTime,
    time_zone: getBrowserTimeZone(),
    duration_hours: primaryStudio?.quantity || 0,
  };
};
