import type { MediaFile } from "@/components/admin/studios/add-studio/MediaForm";

type StudioDraft = any;

const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return fallback;
};

export const buildStudioPayload = (
  draft: StudioDraft,
  mediaFiles: MediaFile[],
  studioId?: string | number | null,
) => {
  const media = mediaFiles
    .filter((file) => file.url && !file.url.startsWith("blob:"))
    .map((file, index) => ({
      url: file.url,
      file_path: file.filePath || file.url,
      sort_order: index,
      media_type: file.type,
    }));

  const operating_hours = (draft.operations?.selectedDays || []).map((day: string) => ({
    day_of_week: dayMap.indexOf(day),
    is_open: true,
    opens_at: draft.operations?.openingTime || "10:00:00",
    closes_at: draft.operations?.closingTime || "22:00:00",
  })).filter((item: any) => item.day_of_week >= 0);

  return {
    ...(studioId ? { studio_id: studioId } : {}),
    studio_name: draft.spaceInfo?.spaceTitle || "",
    brand_name: draft.spaceInfo?.brandName || "",
    description: draft.spaceInfo?.description || "",
    supported_shoot_types: draft.spaceInfo?.secondaryTypes || [],
    suggested_type: draft.spaceInfo?.suggestedType || "",
    square_feet: toNumber(draft.spaceInfo?.dimensions?.propertySize, 0),
    height: draft.spaceInfo?.dimensions?.height || "",
    width: draft.spaceInfo?.dimensions?.width || "",
    length: draft.spaceInfo?.dimensions?.length || "",
    main_floor_number: draft.spaceInfo?.dimensions?.floorNumber || "",
    overnight_stays_allowed: toBool(draft.spaceInfo?.overnightStays, false),
    security_recording_enabled: toBool(draft.spaceInfo?.securityEnabled, false),
    security_recording_description: draft.spaceInfo?.securityDesc || "",
    hourly_rate: toNumber(draft.budget?.hourlyRate, 0),
    overtime_rate: toNumber(draft.budget?.overtimeRate, 0),
    minimum_booking_hours: toNumber(draft.budget?.minimumBooking, 0),
    buffer_time_minutes: toNumber(draft.budget?.bufferTime, 0),
    parking_options: draft.features?.parking || [],
    parking_description: draft.features?.description || "",
    access_features: draft.features?.accessFeatures || [],
    facility_features: draft.features?.featureValues || {},
    amenities: draft.details?.amenities || [],
    activities: Object.entries(draft.details?.activities || {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name),
    space_basics: draft.details?.counts || {},
    description_tags: draft.details?.highlights || [],
    house_rules: {
      smoking_and_drugs_allowed: toBool(draft.operations?.rules?.smoking, false),
      alcohol_allowed: toBool(draft.operations?.rules?.alcohol, false),
      cooking_allowed: toBool(draft.operations?.rules?.cooking, false),
      electricity_usage_allowed: toBool(draft.operations?.rules?.electricity, false),
      external_food_allowed: toBool(draft.operations?.rules?.externalFood, false),
      pets_allowed: toBool(draft.operations?.rules?.pets, false),
      custom_rules: draft.operations?.customRule ? [draft.operations.customRule] : [],
    },
    policies: {
      cancellation_and_refund: {
        cancellation_window_refunded: !!draft.terms?.["window-refunded"],
        host_studio_cancellations: !!draft.terms?.["host-cancellations"],
      },
      safety: {
        user_responsibility: !!draft.terms?.["user-responsibility"],
        conduct_and_compliance: !!draft.terms?.["conduct-compliance"],
        trust_and_protection: !!draft.terms?.["trust-protection"],
      },
      cleanliness: {
        studio_expectation: !!draft.terms?.["studio-expectations"],
        guest_responsibility: !!draft.terms?.["guest-responsibility"],
      },
      additional: {
        damage_liability: !!draft.terms?.["damage-liability"],
        health_and_safety: !!draft.terms?.["health-safety"],
        good_neighbor_policy: !!draft.terms?.["good-neighbor-policy"],
      },
    },
    operating_hours: operating_hours.length
      ? operating_hours
      : [
          { day_of_week: 0, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
          { day_of_week: 1, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
        ],
    pricing_settings: {
      categories: draft.budget?.categories || [],
      equipment: draft.budget?.equipmentItems || [],
    },
    address: {
      country: draft.address?.country || "United States",
      line1: draft.address?.address || "",
      line2: draft.address?.apartment || "",
      city: draft.address?.city || "",
      state: draft.address?.state || "",
      zipCode: draft.address?.zipCode || "",
      latitude: draft.address?.latitude || 0,
      longitude: draft.address?.longitude || 0,
      timezone: "America/Los_Angeles",
    },
    latitude: String(draft.address?.latitude || 0),
    longitude: String(draft.address?.longitude || 0),
    address_line1: draft.address?.address || "",
    address_line2: draft.address?.apartment || "",
    city: draft.address?.city || "",
    state: draft.address?.state || "",
    zip_code: draft.address?.zipCode || "",
    country: draft.address?.country || "United States",
    media,
  };
};
