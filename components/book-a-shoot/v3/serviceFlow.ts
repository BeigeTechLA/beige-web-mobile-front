import type { BookingDataV3 } from "./types";
import { getSelectedStudiosTotal, normalizeSelectedStudios } from "./studioData";

export type BookAShootServiceType =
  | "photography"
  | "videography"
  | "studios"
  | "videography_studios";

export const getBookAShootServiceType = (data: BookingDataV3): BookAShootServiceType => {
  const hasStudio = data.shootType === "studio" || Boolean(data.selectedStudios?.length || data.selectedStudioIds?.length);
  const hasVideo = data.contentType.includes("videographer") || data.contentType.includes("cinematographer");

  if (hasVideo && hasStudio) return "videography_studios";
  if (hasStudio) return "studios";
  if (hasVideo) return "videography";
  return "photography";
};

export const buildStudioDetails = (data: BookingDataV3) => {
  const selectedStudios = normalizeSelectedStudios(data);
  const primaryStudio = selectedStudios[0];

  if (!primaryStudio) return null;

  return {
    studio_id: primaryStudio.studioId,
    studio_name: primaryStudio.name,
    studio_location: primaryStudio.location,
    package: primaryStudio.pricingLabel || primaryStudio.priceLabel || "Studio Rental",
    slot: primaryStudio.startTime && primaryStudio.endTime ? `${primaryStudio.startTime} - ${primaryStudio.endTime}` : undefined,
    duration: primaryStudio.quantity || 0,
    price: primaryStudio.totalPrice || getSelectedStudiosTotal(selectedStudios),
    selected_studios: selectedStudios,
  };
};

export const buildVideographyDetails = (data: BookingDataV3, duration = 8) => {
  const hasVideo = data.contentType.includes("videographer") || data.contentType.includes("cinematographer");

  if (!hasVideo) return null;

  return {
    package: data.studioShootType || data.shootType || "Basic Videography",
    duration,
    eventType: data.studioShootType || data.shootType || "Video Production",
    price: 0,
    addons: data.videoEditTypes || [],
  };
};

export const buildCrewRolesForServiceType = (data: BookingDataV3) => {
  const serviceType = getBookAShootServiceType(data);
  const videographerCount = Math.max(1, data.videographyCount || data.roleCounts?.videographer || 1);
  const studioCount = Math.max(1, data.selectedStudios?.length || data.selectedStudioIds?.length || data.roleCounts?.studio || 1);

  if (serviceType === "videography") return { videographer: videographerCount };
  if (serviceType === "studios") return { studio: studioCount };
  if (serviceType === "videography_studios") return { videographer: videographerCount, studio: studioCount };

  return { photographer: Math.max(1, data.photographyCount || data.roleCounts?.photographer || 1) };
};

export const buildServicePricing = (
  studioDetails?: ReturnType<typeof buildStudioDetails>,
  videographyDetails?: ReturnType<typeof buildVideographyDetails>,
) => {
  if (!studioDetails && !videographyDetails) return undefined;

  const studioPrice = Number(studioDetails?.price || 0);
  const videographyPrice = Number(videographyDetails?.price || 0);

  return {
    studioPrice,
    videographyPrice,
    total: studioPrice + videographyPrice,
  };
};
