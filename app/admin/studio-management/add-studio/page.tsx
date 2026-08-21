/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { studioAdminApi, adminApi } from "@/lib/api";

import TermsConditions from "@/components/admin/studios/add-studio/TermsConditions";
import SpaceDetailsForm from "@/components/admin/studios/add-studio/SpaceDetailsForm";
import ParkingForm from "@/components/admin/studios/add-studio/ParkingForm";
import SpaceInformationForm from "@/components/admin/studios/add-studio/SpaceInformationForm";
import SpaceAddressForm from "@/components/admin/studios/add-studio/SpaceAddressForm";
import MediaUploadForm, { type MediaFile } from "@/components/admin/studios/add-studio/MediaForm";
import OperatingHoursForm from "@/components/admin/studios/add-studio/OperatingHoursForm";
import BudgetForm from "@/components/admin/studios/add-studio/BudgetForm";
import { buildStudioPayload } from "@/lib/adminStudioPayload";

const S3_PREFIX = String(process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/+$/, "");

const safeJson = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const asStringArray = (value: unknown): string[] => {
  const parsed = safeJson<unknown>(value, []);
  return Array.isArray(parsed)
    ? parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item): item is string => Boolean(item))
    : [];
};

const resolveMediaUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!S3_PREFIX) return null;
  return `${S3_PREFIX}/${value.replace(/^\/+/, "")}`;
};

const mapYesNo = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeChoice = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_/\\-]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");

const pickMatchingChoices = (source: unknown, options: string[], aliases: Record<string, string[]> = {}) => {
  const values = asStringArray(source);
  const optionLookup = new Map<string, string>();
  options.forEach((option) => {
    optionLookup.set(normalizeChoice(option), option);
  });

  const aliasLookup = new Map<string, string>();
  Object.entries(aliases).forEach(([canonical, candidateAliases]) => {
    candidateAliases.forEach((alias) => {
      aliasLookup.set(normalizeChoice(alias), canonical);
    });
  });

  return values
    .map((value) => {
      const normalized = normalizeChoice(value);
      return optionLookup.get(normalized) || aliasLookup.get(normalized) || null;
    })
    .filter((item): item is string => Boolean(item));
};

const normalizeTimeValue = (value: unknown) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : trimmed;
};

const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toApiTime = (value: unknown) => {
  const normalized = normalizeTimeValue(value);
  return normalized ? `${normalized}:00` : null;
};

const getOperatingHoursValidationError = (operations: {
  is24Hrs: boolean;
  selectedDays: string[];
  schedule: Record<
    string,
    {
      isOpen: boolean;
      setHours: boolean;
      opensAt?: string;
      closesAt?: string;
    }
  >;
}) => {
  if (operations.is24Hrs) return "";

  for (const day of operations.selectedDays) {
    const config = operations.schedule?.[day];
    if (!config?.isOpen) continue;

    const opensAt = normalizeTimeValue(config.opensAt);
    const closesAt = normalizeTimeValue(config.closesAt);

    if (!opensAt || !closesAt) {
      return `Please set opening and closing time for ${day}.`;
    }

    if (opensAt >= closesAt) {
      return `${day}: opening time must be before closing time.`;
    }
  }

  return "";
};

const buildOperatingHoursPayload = (operations: {
  is24Hrs: boolean;
  selectedDays: string[];
  schedule: Record<
    string,
    {
      isOpen: boolean;
      setHours: boolean;
      opensAt?: string;
      closesAt?: string;
    }
  >;
}) =>
  dayMap.flatMap((day, dayOfWeek) => {
    const config = operations.schedule?.[day];
    const isOpen =
      operations.selectedDays.includes(day) && Boolean(config?.isOpen);

    if (!isOpen) return [];

    if (operations.is24Hrs) {
      return [
        {
          day_of_week: dayOfWeek,
          is_open: true,
          opens_at: "00:00:00",
          closes_at: "23:59:00",
        },
      ];
    }

    const opensAt = toApiTime(config?.opensAt);
    const closesAt = toApiTime(config?.closesAt);

    if (!opensAt || !closesAt) return [];

    return [
      {
        day_of_week: dayOfWeek,
        is_open: true,
        opens_at: opensAt,
        closes_at: closesAt,
      },
    ];
  });

const VIEW_CONFIG = {
  address: {
    title: "Space Address",
    subtitle: "The Address will be only shared with the guests to add the space in listings.",
    component: <SpaceAddressForm />
  },
  information: {
    title: "Space Information",
    subtitle: "Everything you need to know about the space — what’s included, what’s allowed, and how it’s set up for your shoot.",
    component: <SpaceInformationForm />,
  },
  features: {
    title: "Describe Parking Option",
    subtitle: "Are there parking options at or near your space?",
    component: <ParkingForm />,
  },
  media: {
    title: "Add Photos and Videos",
    subtitle: "Drag to Reorder. 5 Photos are required for your listing.",
    component: <MediaUploadForm />,
  },
  activities: {
    title: "What activities would u like to host?",
    subtitle: "You can choose how guest will use your space. Tap yes to host the activities which will improve space visibility on search.  ",
    component: <SpaceDetailsForm />,
  },
  operations: {
    title: "What are your operating hours?",
    subtitle: "Operating hours are the days and hours of the week that your space is open to host booking (i.e. your general availability). Guests will not be able to book times outside of your operating hours. Learn More",
    component: <OperatingHoursForm />,
  },
  budget: {
    title: "Set your budget",
    subtitle: "Specify your project budget to optimize studio availability, crew allocation, and overall booking alignment.",
    component: <BudgetForm />,
  },
  terms: {
    title: "Cancellation & Refund Policy",
    subtitle: "To balance flexibility for creators with fairness to studio operators:",
    component: <TermsConditions />,
  },
};

const DRAFT_KEY = "add_studio_draft_v1";

const createEmptyDraft = () => ({
  step1: {
    address: {
      country: "United States",
      address: "",
      apartment: "",
      city: "",
      state: "CA",
      zipCode: "",
      latitude: 34.0401,
      longitude: -118.2542,
    },
    spaceInfo: {
      spaceTitle: "",
      brandName: "",
      description: "",
      secondaryTypes: [] as string[],
      suggestedType: "",
      dimensions: {
        propertySize: "",
        height: "",
        width: "",
        length: "",
        floorNumber: "",
      },
      overnightStays: false,
      securityEnabled: false,
      securityDesc: "",
    },
    features: {
      parking: [] as string[],
      description: "",
      accessFeatures: [] as string[],
      activeSections: {
        access: false,
        general: false,
        photography: false,
        videography: false,
        podcast: false,
        product: false,
      },
      featureValues: {
        general: [] as string[],
        photography: [] as string[],
        videography: [] as string[],
        podcast: [] as string[],
        product: [] as string[],
      },
    },
    details: {
      useDefault: false,
      activities: {
        production: false,
        event: false,
        recreation: false,
        meetings: false,
      },
      counts: {
        guests: 0,
        bedrooms: 0,
        beds: 0,
        bathrooms: 0,
      },
      amenities: [] as string[],
      highlights: [] as string[],
    },
    operations: {
      is24Hrs: false,
      selectedDays: [] as string[],
      schedule: {} as Record<
        string,
        {
          isOpen: boolean;
          setHours: boolean;
          opensAt?: string;
          closesAt?: string;
        }
      >,
      rules: {
        smoking: null as boolean | null,
        alcohol: null as boolean | null,
        cooking: null as boolean | null,
        electricity: null as boolean | null,
        externalFood: null as boolean | null,
        pets: null as boolean | null,
      },
      customRule: "",
      studio: "",
      openingTime: "",
      closingTime: "",
    },
    budget: {
      hourlyRate: "",
      overtimeRate: "",
      minimumBooking: "",
      bufferTime: "",
      categories: [] as Array<{
        id: string;
        name: string;
        price: string;
        includes: string[];
        minHours: number;
        maxPeopleAllowed: number;
      }>,
      equipmentItems: [] as Array<{ id: string; name: string; cost: string }>,
    },
    terms: {} as Record<string, boolean>,
  },
});

const buildPoliciesPayload = (terms: Record<string, boolean>) => ({
  cancellation_and_refund: {
    cancellation_window_refunded: !!terms["window-refunded"],
    host_studio_cancellations: !!terms["host-cancellations"],
  },
  safety: {
    user_responsibility: !!terms["user-responsibility"],
    conduct_and_compliance: !!terms["conduct-compliance"],
    trust_and_protection: !!terms["trust-protection"],
  },
  cleanliness: {
    studio_expectation: !!terms["studio-expectations"],
    guest_responsibility: !!terms["guest-responsibility"],
  },
  additional: {
    damage_liability: !!terms["damage-liability"],
    health_and_safety: !!terms["health-safety"],
    good_neighbor_policy: !!terms["good-neighbor-policy"],
  },
});


export default function AdminStudiosDetailsPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const studioId = params?.id ? String(params.id) : null;
  const hasClearedDraftRef = useRef(false);

  const [view, setView] = useState<keyof typeof VIEW_CONFIG>("address");
  const [draft, setDraft] = useState(createEmptyDraft);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isHydratingEdit, setIsHydratingEdit] = useState(false);
  const hasLoadedDraftRef = useRef(false);

  const handleAddressChange = useCallback((next: typeof draft.step1.address) => {
    setDraft((prev) => ({ ...prev, step1: { ...prev.step1, address: next } }));
  }, []);

  const handleSpaceInfoChange = useCallback((next: typeof draft.step1.spaceInfo) => {
    setDraft((prev) => ({ ...prev, step1: { ...prev.step1, spaceInfo: next } }));
  }, []);

  const handleFeaturesChange = useCallback((next: typeof draft.step1.features) => {
    setDraft((prev) => ({ ...prev, step1: { ...prev.step1, features: next } }));
  }, []);

  const handleDetailsChange = useCallback((next: typeof draft.step1.details) => {
    setDraft((prev) => ({ ...prev, step1: { ...prev.step1, details: next } }));
  }, []);

  const handleOperationsChange = useCallback((next: typeof draft.step1.operations) => {
    setDraft((prev) => ({ ...prev, step1: { ...prev.step1, operations: next } }));
  }, []);

  const handleBudgetChange = useCallback((next: typeof draft.step1.budget) => {
    setDraft((prev) => ({ ...prev, step1: { ...prev.step1, budget: next } }));
  }, []);

  const handleTermsChange = useCallback((next: typeof draft.step1.terms) => {
    setDraft((prev) => ({ ...prev, step1: { ...prev.step1, terms: next } }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!studioId && !hasClearedDraftRef.current) {
      setDraft(createEmptyDraft());
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem("add_studio_address");
      localStorage.removeItem("add_studio_info");
      localStorage.removeItem("add_studio_features");
      localStorage.removeItem("add_studio_details");
      localStorage.removeItem("add_studio_operations");
      localStorage.removeItem("add_studio_budget");
      hasClearedDraftRef.current = true;
      return;
    }

    if (hasLoadedDraftRef.current) {
      return;
    }

    hasLoadedDraftRef.current = true;

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setDraft((prev) => ({
          ...prev,
          ...parsedDraft,
          step1: {
            ...prev.step1,
            ...(parsedDraft.step1 || {}),
          },
        }));
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }

    const scrollToTop = () => {
      const scrollContainer = document.querySelector("main");
      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTo({ top: 0, left: 0, behavior: "auto" });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const rafId = window.requestAnimationFrame(scrollToTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [view, studioId]);

  useEffect(() => {
    if (typeof window === "undefined" || !studioId) return;

    let active = true;
    setIsHydratingEdit(true);

    const loadStudio = async () => {
      const response = await adminApi.getStudioById(studioId);
      if (!active) return;

      const data = response.success ? response.data : null;
      if (!data) {
        toast.error(response.error || "Failed to load studio details");
        setIsHydratingEdit(false);
        return;
      }

      const supportedShootTypes = pickMatchingChoices(
        data.supported_shoot_types,
        ["Photography", "Product Shoot", "Videography", "Podcast"],
        {
          Photography: ["photo", "photoshoot", "photo shoot"],
          "Product Shoot": ["product", "product shoot"],
          Videography: ["video", "video shoot", "videography"],
          Podcast: ["podcast", "podcasting"],
        },
      );
      const parkingOptions = pickMatchingChoices(
        data.parking_options,
        ["free-onsite", "paid-onsite", "free-street", "metered-street", "valet", "nearby-lot"],
        {
          "free-onsite": ["free onsite parking", "onsite free parking"],
          "paid-onsite": ["paid onsite parking", "onsite paid parking"],
          "free-street": ["free street parking"],
          "metered-street": ["metered street parking"],
          valet: ["valet parking", "valet"],
          "nearby-lot": ["nearby parking lot", "nearby lot"],
        },
      );
      const accessFeatures = pickMatchingChoices(
        data.access_features,
        ["elevator", "stairs", "street-level", "freight", "handicap"],
        {
          elevator: ["elevator"],
          stairs: ["stairs"],
          "street-level": ["street level", "street-level"],
          freight: ["freight elevator", "freight"],
          handicap: ["wheelchair / handicap access", "wheelchair handicap access", "handicap", "wheelchair access"],
        },
      );
      const facilityFeatures = safeJson<Record<string, string[]>>(data.facility_features, {
        general: [],
        photography: [],
        videography: [],
        podcast: [],
        product: [],
      });
      const activities = pickMatchingChoices(
        data.activities,
        ["Production", "Event", "Recreation", "Meetings"],
        {
          Production: ["production"],
          Event: ["event"],
          Recreation: ["recreation"],
          Meetings: ["meetings", "meeting"],
        },
      );
      const amenities = pickMatchingChoices(
        data.amenities,
        ["wifi", "hot-tub", "fire-pit", "pool-table", "bbq", "fireplace", "gym", "patio", "pool", "dining"],
        {
          wifi: ["wifi", "high speed wifi"],
          "hot-tub": ["hot tub"],
          "fire-pit": ["fire pit"],
          "pool-table": ["pool table"],
          bbq: ["bbq grill", "bbq"],
          fireplace: ["indoor fireplace", "fireplace"],
          gym: ["gym"],
          patio: ["patio"],
          pool: ["pool"],
          dining: ["outdoor dining area", "dining"],
        },
      );
      const descriptionTags = pickMatchingChoices(
        data.description_tags,
        ["Peaceful", "Podcast Friendly", "Spacious", "Pet Friendly", "Natural Lightning", "Luxury"],
        {
          "Podcast Friendly": ["podcast friendly"],
          "Natural Lightning": ["natural lighting", "natural lightning"],
        },
      );
      const houseRules = safeJson<Record<string, unknown>>(data.house_rules, {});
      const policies = safeJson<Record<string, unknown>>(data.policies, {});
      const pricingSettings = safeJson<Record<string, unknown>>(data.pricing_settings, {});
      const categories = Array.isArray(pricingSettings.categories)
        ? pricingSettings.categories
            .map((item: any) => ({
              id: String(item?.id || item?.name || `category-${Math.random().toString(36).slice(2, 8)}`),
              name: String(item?.name || ""),
              price: String(item?.hourly_price ?? item?.price ?? ""),
              includes: asStringArray(item?.included_types || item?.includes),
              minHours: Math.max(
                1,
                Number(item?.minHours ?? item?.min_hours ?? item?.minimum_hours ?? 1) || 1,
              ),
              maxPeopleAllowed: Math.max(
                1,
                Number(item?.maxPeopleAllowed ?? item?.max_people_allowed ?? 1) || 1,
              ),
            }))
            .filter((item) => item.name)
        : [];
      const equipmentItems = Array.isArray(pricingSettings.equipment)
        ? pricingSettings.equipment
            .map((item: any) => ({
              id: String(item?.id || item?.name || `equipment-${Math.random().toString(36).slice(2, 8)}`),
              name: String(item?.name || ""),
              cost: String(item?.cost ?? ""),
            }))
            .filter((item) => item.name)
        : [];
      const media = Array.isArray(data.media) ? data.media : [];
      const nextMediaFiles = media
        .map((item: any, index: number) => {
          const url = resolveMediaUrl(item?.url);
          if (!url) return null;
          return {
            id: String(item?.studio_media_id || item?.id || `${item?.sort_order ?? index}-${url}`),
            url,
            filePath: String(item?.file_path || item?.path || item?.filepath || url),
            thumbnailUrl: item?.thumbnail_url || null,
            type: String(item?.media_type || "").startsWith("video") ? "video" : "image",
            status: "uploaded" as const,
          };
        })
        .filter((item): item is { id: string; url: string; type: "image" | "video"; status: "uploaded" } => Boolean(item))
        .sort((a, b) => {
          const aSort = media.find((item: any) => String(item?.studio_media_id || item?.id || "") === a.id)?.sort_order ?? 0;
          const bSort = media.find((item: any) => String(item?.studio_media_id || item?.id || "") === b.id)?.sort_order ?? 0;
          return Number(aSort) - Number(bSort);
        });

      const termsMap = {
        "window-refunded": mapYesNo((policies as any)?.cancellation_and_refund?.cancellation_window_refunded, false),
        "host-cancellations": mapYesNo((policies as any)?.cancellation_and_refund?.host_studio_cancellations, false),
        "user-responsibility": mapYesNo((policies as any)?.safety?.user_responsibility, false),
        "conduct-compliance": mapYesNo((policies as any)?.safety?.conduct_and_compliance, false),
        "trust-protection": mapYesNo((policies as any)?.safety?.trust_and_protection, false),
        "studio-expectations": mapYesNo((policies as any)?.cleanliness?.studio_expectation, false),
        "guest-responsibility": mapYesNo((policies as any)?.cleanliness?.guest_responsibility, false),
        "damage-liability": mapYesNo((policies as any)?.additional?.damage_liability, false),
        "health-safety": mapYesNo((policies as any)?.additional?.health_and_safety, false),
        "good-neighbor-policy": mapYesNo((policies as any)?.additional?.good_neighbor_policy, false),
      };

      setDraft({
        step1: {
          address: {
            country: String(data.country || "United States"),
            address: String(data.address_line1 || ""),
            apartment: String(data.address_line2 || ""),
            city: String(data.city || ""),
            state: String(data.state || ""),
            zipCode: String(data.zip_code || ""),
            latitude: Number(data.latitude ?? 34.0401),
            longitude: Number(data.longitude ?? -118.2542),
          },
          spaceInfo: {
            spaceTitle: String(data.studio_name || ""),
            brandName: String(data.brand_name || ""),
            description: String(data.description || ""),
            secondaryTypes: supportedShootTypes,
            suggestedType: String(data.suggested_type || ""),
            dimensions: {
              propertySize: String(data.square_feet || ""),
              height: String(data.height || ""),
              width: String(data.width || ""),
              length: String(data.length || ""),
              floorNumber: String(data.main_floor_number || ""),
            },
            overnightStays: mapYesNo(data.overnight_stays_allowed, false),
            securityEnabled: mapYesNo(data.security_recording_enabled, false),
            securityDesc: String(data.security_recording_description || ""),
          },
          features: {
            parking: parkingOptions,
            description: String(data.parking_description || ""),
            accessFeatures,
            activeSections: {
              access: accessFeatures.length > 0,
              general: (facilityFeatures.general || []).length > 0,
              photography: (facilityFeatures.photography || []).length > 0,
              videography: (facilityFeatures.videography || []).length > 0,
              podcast: (facilityFeatures.podcast || []).length > 0,
              product: (facilityFeatures.product || []).length > 0,
            },
            featureValues: {
              general: facilityFeatures.general || [],
              photography: facilityFeatures.photography || [],
              videography: facilityFeatures.videography || [],
              podcast: facilityFeatures.podcast || [],
              product: facilityFeatures.product || [],
            },
          },
          details: {
            useDefault: activities.length > 0,
            activities: {
              production: activities.includes("Production"),
              event: activities.includes("Event"),
              recreation: activities.includes("Recreation"),
              meetings: activities.includes("Meetings"),
            },
            counts: {
              guests: Number((safeJson<Record<string, unknown>>(data.space_basics, {}) as any)?.guests || 0),
              bedrooms: Number((safeJson<Record<string, unknown>>(data.space_basics, {}) as any)?.bedrooms || 0),
              beds: Number((safeJson<Record<string, unknown>>(data.space_basics, {}) as any)?.beds || 0),
              bathrooms: Number((safeJson<Record<string, unknown>>(data.space_basics, {}) as any)?.bathrooms || 0),
            },
            amenities,
            highlights: descriptionTags.slice(0, 2),
          },
          operations: {
            is24Hrs: Array.isArray(data.operating_hours) && data.operating_hours.length > 0
              ? data.operating_hours.every((item: any) => Boolean(item?.is_open) && normalizeTimeValue(item?.opens_at) === "00:00" && normalizeTimeValue(item?.closes_at) === "23:59")
              : false,
            selectedDays: Array.isArray(data.operating_hours)
              ? data.operating_hours
                  .filter((item: any) => Boolean(item?.is_open))
                  .map((item: any) => dayMap[Number(item?.day_of_week)])
                  .filter((day): day is string => Boolean(day))
              : [],
            schedule: Array.isArray(data.operating_hours)
              ? data.operating_hours.reduce(
                  (
                    acc: Record<
                      string,
                      {
                        isOpen: boolean;
                        setHours: boolean;
                        opensAt?: string;
                        closesAt?: string;
                      }
                    >,
                    item: any,
                  ) => {
                    const day = dayMap[Number(item?.day_of_week)];
                    if (!day) return acc;

                    const isOpen = Boolean(item?.is_open);
                    const opensAt = normalizeTimeValue(item?.opens_at);
                    const closesAt = normalizeTimeValue(item?.closes_at);

                    acc[day] = {
                      isOpen,
                      setHours: isOpen && Boolean(opensAt && closesAt),
                      opensAt: isOpen ? opensAt : "",
                      closesAt: isOpen ? closesAt : "",
                    };

                    return acc;
                  },
                  {},
                )
              : {},
            rules: {
              smoking: typeof houseRules?.smoking_and_drugs_allowed === "boolean" ? houseRules.smoking_and_drugs_allowed : null,
              alcohol: typeof houseRules?.alcohol_allowed === "boolean" ? houseRules.alcohol_allowed : null,
              cooking: typeof houseRules?.cooking_allowed === "boolean" ? houseRules.cooking_allowed : null,
              electricity: typeof houseRules?.electricity_usage_allowed === "boolean" ? houseRules.electricity_usage_allowed : null,
              externalFood: typeof houseRules?.external_food_allowed === "boolean" ? houseRules.external_food_allowed : null,
              pets: typeof houseRules?.pets_allowed === "boolean" ? houseRules.pets_allowed : null,
            },
            customRule: asStringArray((houseRules as any)?.custom_rules).join(" "),
            studio: String(data.studio_name || ""),
            openingTime: normalizeTimeValue(Array.isArray(data.operating_hours) ? data.operating_hours.find((item: any) => Boolean(item?.is_open))?.opens_at : ""),
            closingTime: normalizeTimeValue(Array.isArray(data.operating_hours) ? data.operating_hours.find((item: any) => Boolean(item?.is_open))?.closes_at : ""),
          },
          budget: {
            hourlyRate: String(data.hourly_rate ?? ""),
            overtimeRate: String(data.overtime_rate ?? ""),
            minimumBooking:
              data.minimum_booking_hours != null
                ? String(Number(data.minimum_booking_hours))
                : "",
            bufferTime: String(data.buffer_time_minutes ?? ""),
            categories:
              categories.length > 0
                ? categories
                : createEmptyDraft().step1.budget.categories,
            equipmentItems:
              equipmentItems.length > 0
                ? equipmentItems
                : createEmptyDraft().step1.budget.equipmentItems,
          },
          terms: termsMap,
        },
      });
      setMediaFiles(nextMediaFiles);
      setIsHydratingEdit(false);
    };

    loadStudio().catch((error) => {
      console.error("Failed to load studio details", error);
      if (active) {
        setIsHydratingEdit(false);
      }
    });

    return () => {
      active = false;
    };
  }, [studioId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  // Extract current view details
  const currentView = VIEW_CONFIG[view];

  const progressValue =
    view === "address"
      ? 0
      : view === "information"
        ? 10
        : view === "features"
          ? 30
          : view === "media"
            ? 40
            : view === "activities"
              ? 50
              : view === "operations"
                ? 60
                : view === "budget"
                  ? 70
                  : 100;

  const stepNumber = ["address", "information", "features"].includes(
    view,
  )
    ? 1
    : ["activities", "operations", "media"].includes(view)
      ? 2
      : 3;

  const progressLabel = `${progressValue}%`;

  const progressSegmentWidths = [0, 1, 2].map((segmentIndex) => {
    const segmentSize = 100 / 3;
    const segmentStart = segmentIndex * segmentSize;
    const segmentFill = Math.max(
      0,
      Math.min(((progressValue - segmentStart) / segmentSize) * 100, 100),
    );

    return `${segmentFill}%`;
  });

  const handleBack = () => {
    if (view === 'terms') {
      setView('budget');
    } else if (view === 'information') {
      setView('address');
    } else if (view === 'features') {
      setView('information');
    } else if (view === 'media') {
      setView('features');
    } else if (view === 'activities') {
      setView('media');
    } else if (view === 'operations') {
      setView('activities');
    } else if (view === 'budget') {
      setView('operations');
    } else {
      router.back();
    }
  };

  const handleContinue = () => {
    if (view === 'address') {
      if (typeof window !== "undefined") {
        const savedAddress = localStorage.getItem("add_studio_address");
        if (savedAddress) {
          try {
            const parsed = JSON.parse(savedAddress);
            if (!parsed.address || !parsed.address.trim()) {
              toast.error("Please enter Address");
              return;
            }
            if (!parsed.city || !parsed.city.trim()) {
              toast.error("Please enter City");
              return;
            }
            if (!parsed.state || !parsed.state.trim()) {
              toast.error("Please select State");
              return;
            }
            if (!parsed.zipCode || !parsed.zipCode.trim()) {
              toast.error("Please enter Zip Code");
              return;
            }
          } catch (e) {
            console.error("Failed to parse address data for validation", e);
          }
        } else {
          toast.error("Please fill in the required address fields");
          return;
        }
      }
      setView('information');
    } else if (view === 'information') {
      if (typeof window !== "undefined") {
        const savedInfo = localStorage.getItem("add_studio_info");
        if (savedInfo) {
          try {
            const parsed = JSON.parse(savedInfo);
            if (!parsed.spaceTitle || !parsed.spaceTitle.trim()) {
              toast.error("Please enter Space Title");
              return;
            }
          } catch (e) {
            console.error("Failed to parse info data for validation", e);
          }
        } else {
          toast.error("Please enter Space Title");
          return;
        }
      }
      setView('features');
    } else if (view === 'features') {
      setView('media');
    } else if (view === 'media') {
      if (mediaFiles.length < 5) {
        setMediaError("Please upload at least 5 photos or videos before continuing.");
        toast.error("Please upload at least 5 photos or videos");
        return;
      }
      setMediaError("");
      setView('activities');
    } else if (view === 'activities') {
      setView('operations');
    } else if (view === 'operations') {
      const operatingHoursError = getOperatingHoursValidationError(
        draft.step1.operations,
      );

      if (operatingHoursError) {
        toast.error(operatingHoursError);
        return;
      }

      setView('budget');
    } else if (view === 'budget') {
      if (typeof window !== "undefined") {
        const savedBudget = localStorage.getItem("add_studio_budget");
        if (savedBudget) {
          try {
            const parsed = JSON.parse(savedBudget);
            if (!parsed.hourlyRate || !parsed.hourlyRate.trim()) {
              toast.error("Please enter Hourly Rate ($)");
              return;
            }
            if (!parsed.overtimeRate || !parsed.overtimeRate.trim()) {
              toast.error("Please enter Overtime Rate ($)");
              return;
            }
            if (!parsed.minimumBooking || !parsed.minimumBooking.trim()) {
              toast.error("Please select Minimum Booking");
              return;
            }
            if (!parsed.bufferTime || !parsed.bufferTime.trim()) {
              toast.error("Please select Buffer Time");
              return;
            }
          } catch (e) {
            console.error("Failed to parse budget data for validation", e);
          }
        } else {
          toast.error("Please fill in the required fields");
          return;
        }
      }
      setView('terms');
    } else {
      void handleSaveStudio();
    }
  };

  const handleSaveStudio = async () => {
    const isEditMode = Boolean(studioId);
    let nextMediaFiles = mediaFiles;

    try {
      setIsSaving(true);
      toast.loading(isEditMode ? "Updating studio..." : "Creating studio...", { id: "studio-save" });

      const pendingFiles = mediaFiles.filter((file) => file.file);
      if (pendingFiles.length > 0) {
        const uploadResponse = await studioAdminApi.uploadMedia(pendingFiles.map((file) => file.file as File));
        const uploadedItems = Array.isArray((uploadResponse as any)?.data?.data)
          ? (uploadResponse as any).data.data
          : Array.isArray((uploadResponse as any)?.data)
            ? (uploadResponse as any).data
            : [];

        let uploadIndex = 0;
        nextMediaFiles = mediaFiles.map((file) => {
          if (!file.file) return file;
          const uploadedItem = uploadedItems[uploadIndex++];
          const url = typeof uploadedItem === "string" ? uploadedItem : uploadedItem?.url || file.url;
          const filePath = typeof uploadedItem === "object" && uploadedItem
            ? String(uploadedItem.file_path || uploadedItem.path || uploadedItem.filepath || "")
            : "";
          const thumbnailUrl = typeof uploadedItem === "object" && uploadedItem
            ? uploadedItem.thumbnail_url || uploadedItem.thumbnailUrl || null
            : null;
          return {
            ...file,
            file: undefined,
            url,
            filePath: filePath || file.filePath || url,
            thumbnailUrl,
            status: "uploaded",
            error: undefined,
          };
        });
        setMediaFiles(nextMediaFiles);
      }

      const operatingHoursError = getOperatingHoursValidationError(
        draft.step1.operations,
      );

      if (operatingHoursError) {
        toast.error(operatingHoursError, { id: "studio-save" });
        return;
      }

      const payload = buildStudioPayload(draft.step1, nextMediaFiles, isEditMode ? studioId : null) as Record<string, unknown>;

      // Per-day schedule is authoritative. Never copy one global time to all days.
      payload.operating_hours = buildOperatingHoursPayload(
        draft.step1.operations,
      );

      if (isEditMode) {
        await studioAdminApi.updateStudio(studioId as string, payload);
      } else {
        await studioAdminApi.createStudio(payload);
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("add_studio_address");
        localStorage.removeItem("add_studio_budget");
        localStorage.removeItem("add_studio_info");
        localStorage.removeItem("add_studio_features");
        localStorage.removeItem("add_studio_details");
        localStorage.removeItem("add_studio_operations");
      }

      toast.success(isEditMode ? "Studio updated successfully" : "Studio created successfully", { id: "studio-save" });
      router.push("/admin/studio-management");
    } catch (error) {
      console.error("Failed to save studio:", error);
      toast.error("Failed to save studio. Please try again.", { id: "studio-save" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    const isEditMode = Boolean(studioId);
    let nextMediaFiles = mediaFiles;

    try {
      setIsSaving(true);
      toast.loading("Saving your progress...", { id: "studio-save" });

      const pendingFiles = mediaFiles.filter((file) => file.file);
      if (pendingFiles.length > 0) {
        const uploadResponse = await studioAdminApi.uploadMedia(pendingFiles.map((file) => file.file as File));
        const uploadedItems = Array.isArray((uploadResponse as any)?.data?.data)
          ? (uploadResponse as any).data.data
          : Array.isArray((uploadResponse as any)?.data)
            ? (uploadResponse as any).data
            : [];

        let uploadIndex = 0;
        nextMediaFiles = mediaFiles.map((file) => {
          if (!file.file) return file;
          const uploadedItem = uploadedItems[uploadIndex++];
          const url = typeof uploadedItem === "string" ? uploadedItem : uploadedItem?.url || file.url;
          const filePath = typeof uploadedItem === "object" && uploadedItem
            ? String(uploadedItem.file_path || uploadedItem.path || uploadedItem.filepath || "")
            : "";
          const thumbnailUrl = typeof uploadedItem === "object" && uploadedItem
            ? uploadedItem.thumbnail_url || uploadedItem.thumbnailUrl || null
            : null;
          return {
            ...file,
            file: undefined,
            url,
            filePath: filePath || file.filePath || url,
            thumbnailUrl,
            status: "uploaded",
            error: undefined,
          };
        });
        setMediaFiles(nextMediaFiles);
      }

      const operatingHoursError = getOperatingHoursValidationError(
        draft.step1.operations,
      );

      if (operatingHoursError) {
        toast.error(operatingHoursError, { id: "studio-save" });
        return;
      }

      const payload = buildStudioPayload(draft.step1, nextMediaFiles, isEditMode ? studioId : null) as Record<string, unknown>;

      // Per-day schedule is authoritative. Never copy one global time to all days.
      payload.operating_hours = buildOperatingHoursPayload(
        draft.step1.operations,
      );
      await (isEditMode
        ? studioAdminApi.updateStudio(studioId as string, payload)
        : studioAdminApi.createStudio(payload));

      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem("add_studio_address");
        localStorage.removeItem("add_studio_budget");
        localStorage.removeItem("add_studio_info");
        localStorage.removeItem("add_studio_features");
        localStorage.removeItem("add_studio_details");
        localStorage.removeItem("add_studio_operations");
      }

      toast.success("Progress saved", { id: "studio-save" });
      router.push("/admin/studio-management");
    } catch (error) {
      console.error("Failed to save studio progress:", error);
      toast.error("Failed to save progress. Please try again.", { id: "studio-save" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button
              className="h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]"
              onClick={() => void handleSaveAndExit()}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save & Exit"}
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden pb-30 p-4 lg:p-9" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex justify-between items-center">

          <button
            onClick={handleBack}
            className={` transition-colors flex items-center gap-2 mb-3 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="mb-2">
            <span className={`text-sm font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Step {stepNumber} - {progressLabel} Completed
            </span>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="flex gap-3 my-4 lg:my-9">
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[0] }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[1] }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[2] }}
            />
          </div>
        </div>

        {/* Main Form */}
        <div>
          <div>
            <h1 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>
              {currentView.title}
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              {currentView.subtitle}
            </p>
          </div>
          {/* Dynamic Component Rendering */}
          <div className="mt-3 lg:mt-6">
            {view === "address"
              ? React.cloneElement(currentView.component as React.ReactElement, {
                  value: draft.step1.address,
                  onChange: handleAddressChange,
                })
              : view === "information"
                ? React.cloneElement(currentView.component as React.ReactElement, {
                    value: draft.step1.spaceInfo,
                    onChange: handleSpaceInfoChange,
                  })
                : view === "features"
                  ? React.cloneElement(currentView.component as React.ReactElement, {
                      value: draft.step1.features,
                      onChange: handleFeaturesChange,
                    })
                : view === "media"
                    ? React.cloneElement(currentView.component as React.ReactElement, {
                        files: mediaFiles,
                        onFilesChange: setMediaFiles,
                        error: mediaError,
                        onError: setMediaError,
                      })
                    : view === "activities"
                      ? React.cloneElement(currentView.component as React.ReactElement, {
                          value: draft.step1.details,
                          onChange: handleDetailsChange,
                        })
                      : view === "operations"
                        ? React.cloneElement(currentView.component as React.ReactElement, {
                            value: draft.step1.operations,
                            onChange: handleOperationsChange,
                          })
                          : view === "budget"
                          ? React.cloneElement(currentView.component as React.ReactElement, {
                              value: draft.step1.budget,
                              onChange: handleBudgetChange,
                            })
                          : view === "terms"
                            ? React.cloneElement(currentView.component as React.ReactElement, {
                                value: draft.step1.terms,
                                onChange: handleTermsChange,
                              })
                    : currentView.component}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 mt-8 pb-4">
            <Button
              variant="outline"
              className="border border-[#8E8E8E] text-white hover:bg-[#181818] h-[62px] min-w-[166px] rounded-xl text-xl font-medium bg-transparent transition-all"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              className={`bg-[#E8D1AB] text-[#101010] h-[62px] min-w-[166px] rounded-xl text-xl font-bold transition-all shadow-md`}
              disabled={isSaving}
              onClick={handleContinue}
            >
              {view === "terms" ? "Save studio" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
