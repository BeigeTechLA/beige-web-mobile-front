"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { adminApi } from "@/lib/api";

import Topbar from "@/components/admin/Topbar";

import TermsConditions from "@/components/admin/studios/add-studio/TermsConditions";
import SpaceDetailsForm from "@/components/admin/studios/add-studio/SpaceDetailsForm";
import ParkingForm from "@/components/admin/studios/add-studio/ParkingForm";
import SpaceInformationForm from "@/components/admin/studios/add-studio/SpaceInformationForm";
import SpaceAddressForm from "@/components/admin/studios/add-studio/SpaceAddressForm";
import MediaUploadForm from "@/components/admin/studios/add-studio/MediaForm";
import OperatingHoursForm from "@/components/admin/studios/add-studio/OperatingHoursForm";
import BudgetForm from "@/components/admin/studios/add-studio/BudgetForm";

const createDefaultStudioData = () => ({
  studio_name: "",
  brand_name: "",
  description: "",
  supported_shoot_types: [],
  suggested_type: "",
  square_feet: 0,
  height: "",
  width: "",
  length: "",
  main_floor_number: "",
  overnight_stays_allowed: true,
  security_recording_enabled: true,
  security_recording_description: "",
  address: {
    country: "United States",
    line1: "",
    line2: "",
    city: "",
    state: "CA",
    zipCode: "",
    latitude: 34.0401,
    longitude: -118.2542,
    timezone: "America/Los_Angeles"
  },
  location: "",
  hourly_rate: 85,
  overtime_rate: 100,
  minimum_booking_hours: 2,
  buffer_time_minutes: 30,
  parking_options: [],
  access_features: [],
  facility_features: {
    general: [],
    photography: [],
    videography: [],
    podcast: [],
    product: []
  },
  amenities: [],
  activities: [],
  space_basics: {
    guests: 25,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1
  },
  description_tags: [],
  wifi_name: "",
  wifi_password: "",
  preferred_age: "18+",
  pricing_settings: {
    categories: [],
    equipment: []
  },
  house_rules: {
    smoking_and_drugs_allowed: false,
    alcohol_allowed: true,
    cooking_allowed: true,
    electricity_usage_allowed: true,
    external_food_allowed: false,
    pets_allowed: false,
    custom_rules: []
  },
  policies: {
    cancellation_and_refund: {
      cancellation_window_refunded: true,
      host_studio_cancellations: true
    },
    safety: {
      user_responsibility: true,
      conduct_and_compliance: true,
      trust_and_protection: true
    },
    cleanliness: {
      studio_expectation: true,
      guest_responsibility: true
    },
    additional: {
      damage_liability: true,
      health_and_safety: true,
      good_neighbor_policy: true
    }
  },
  media: [],
  operating_hours: []
});

const normalizeArray = (value: any, fallback: any[] = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const STUDIO_MEDIA_BASE_URL = "https://d2jhn32fsulyac.cloudfront.net/";

const normalizeMediaUrl = (url: unknown) => {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^(blob:|https?:\/\/|data:)/i.test(trimmed)) return trimmed;
  const normalizedPath = trimmed.replace(/^assets\/studio\//i, "").replace(/^\/+/, "");
  return `${STUDIO_MEDIA_BASE_URL}${normalizedPath}`;
};

const normalizeObject = (value: any, fallback: Record<string, any> = {}) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const normalizeAddressFromRaw = (raw: any, defaultAddress: Record<string, any>) => {
  const nestedAddress = normalizeObject(raw?.address, {});
  const locationDetails = normalizeObject(raw?.locationDetails, {});
  const source = {
    ...defaultAddress,
    ...nestedAddress,
    ...locationDetails,
    line1: nestedAddress?.line1 ?? locationDetails?.line1 ?? raw?.line1 ?? raw?.address_line1 ?? raw?.street_address ?? "",
    line2: nestedAddress?.line2 ?? locationDetails?.line2 ?? raw?.line2 ?? raw?.address_line2 ?? "",
    city: nestedAddress?.city ?? locationDetails?.city ?? raw?.city ?? raw?.address_city ?? "",
    state: nestedAddress?.state ?? locationDetails?.state ?? raw?.state ?? raw?.address_state ?? defaultAddress.state,
    zipCode: nestedAddress?.zipCode ?? locationDetails?.zipCode ?? raw?.zipCode ?? raw?.zip_code ?? raw?.postal_code ?? "",
    country: nestedAddress?.country ?? locationDetails?.country ?? raw?.country ?? raw?.address_country ?? defaultAddress.country,
    latitude: Number(
      nestedAddress?.latitude ??
      locationDetails?.latitude ??
      raw?.latitude ??
      raw?.address_latitude ??
      defaultAddress.latitude
    ) || defaultAddress.latitude,
    longitude: Number(
      nestedAddress?.longitude ??
      locationDetails?.longitude ??
      raw?.longitude ??
      raw?.address_longitude ??
      defaultAddress.longitude
    ) || defaultAddress.longitude,
    timezone:
      nestedAddress?.timezone ??
      locationDetails?.timezone ??
      raw?.timezone ??
      raw?.address_timezone ??
      defaultAddress.timezone,
  };

  return source;
};

const normalizeStudioForForm = (raw: any) => {
  const defaultData = createDefaultStudioData();
  const address = normalizeAddressFromRaw(raw, defaultData.address);
  const locationFromFields = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean).join(", ");

  return {
    ...defaultData,
    ...raw,
    supported_shoot_types: normalizeArray(raw?.supported_shoot_types, []),
    parking_options: normalizeArray(raw?.parking_options, []),
    access_features: normalizeArray(raw?.access_features, []),
    amenities: normalizeArray(raw?.amenities, []),
    activities: normalizeArray(raw?.activities, []),
    description_tags: normalizeArray(raw?.description_tags, []),
    media: normalizeArray(raw?.media, []).map((item: any, index: number) => (
      typeof item === "string"
        ? { studio_media_id: index, url: normalizeMediaUrl(item), is_cover: index === 0 }
        : {
            ...item,
            url: normalizeMediaUrl(item?.url),
          }
    )),
    operating_hours: normalizeArray(raw?.operating_hours, []),
    facility_features: normalizeObject(raw?.facility_features, defaultData.facility_features),
    space_basics: normalizeObject(raw?.space_basics, defaultData.space_basics),
    pricing_settings: normalizeObject(raw?.pricing_settings, defaultData.pricing_settings),
    house_rules: normalizeObject(raw?.house_rules, defaultData.house_rules),
    policies: normalizeObject(raw?.policies, defaultData.policies),
    address,
    location: raw?.location || raw?.full_address || raw?.formatted_address || locationFromFields,
    square_feet: Number(raw?.square_feet ?? 0),
    hourly_rate: Number(raw?.hourly_rate ?? defaultData.hourly_rate),
    overtime_rate: Number(raw?.overtime_rate ?? defaultData.overtime_rate),
    minimum_booking_hours: Number(raw?.minimum_booking_hours ?? defaultData.minimum_booking_hours),
    buffer_time_minutes: Number(raw?.buffer_time_minutes ?? defaultData.buffer_time_minutes),
  };
};

const getViewConfig = (studioData: any, setStudioData: any, isDark: boolean) => ({
  address: {
    title: "Space Address",
    subtitle: "The Address will be only shared with the guests to add the space in listings.",
    component: <SpaceAddressForm studioData={studioData} setStudioData={setStudioData} isDark={isDark} />
  },
  information: {
    title: "Space Information",
    subtitle: "Everything you need to know about the space — what's included, what’s allowed, and how it’s set up for your shoot.",
    component: <SpaceInformationForm studioData={studioData} setStudioData={setStudioData} isDark={isDark} />,
  },
  features: {
    title: "Describe Parking Option",
    subtitle: "Are there parking options at or near your space?",
    component: <ParkingForm studioData={studioData} setStudioData={setStudioData} isDark={isDark} />,
  },
  media: {
    title: "Add Photos and Videos",
    subtitle: "Drag to Reorder. 5 Photos are required for your listing.",
    component: <MediaUploadForm studioData={studioData} setStudioData={setStudioData} isDark={isDark} />,
  },
  activities: {
    title: "What activities would u like to host?",
    subtitle: "You can choose how guest will use your space. Tap yes to host the activities which will improve space visibility on search.  ",
    component: <SpaceDetailsForm studioData={studioData} setStudioData={setStudioData} isDark={isDark} />,
  },
  operations: {
    title: "What are your operating hours?",
    subtitle: "Operating hours are the days and hours of the week that your space is open to host booking (i.e. your general availability). Guests will not be able to book times outside of your operating hours. Learn More",
    component: <OperatingHoursForm studioData={studioData} setStudioData={setStudioData} isDark={isDark} />,
  },
  budget: {
    title: "Set your budget",
    subtitle: "Specify your project budget to optimize studio availability, crew allocation, and overall booking alignment.",
    component: <BudgetForm studioData={studioData} setStudioData={setStudioData} isDark={isDark} />,
  },
  terms: {
    title: "Cancellation & Refund Policy",
    subtitle: "To balance flexibility for creators with fairness to studio operators:",
    component: <TermsConditions studioData={studioData} setStudioData={setStudioData} isDark={isDark} />,
  },
});


export default function AdminStudiosDetailsPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editStudioId = searchParams.get("id");
  const isEditMode = Boolean(editStudioId);

  const [view, setView] = useState<keyof ReturnType<typeof getViewConfig>>("address");
  const [isSaving, setIsSaving] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(isEditMode);
  const [studioData, setStudioData] = useState<any>(createDefaultStudioData());

  // Extract current view details
  const viewConfig = useMemo(() => getViewConfig(studioData, setStudioData, isDark), [studioData, isDark]);
  const currentView = viewConfig[view];

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

  const buildStudioPayload = (data: any) => {
    const address = data?.address || {};
    const latitude = Number(address.latitude);
    const longitude = Number(address.longitude);
    const addressText = [address.line1, address.line2, address.city, address.state, address.zipCode, address.country]
      .filter(Boolean)
      .join(", ");
    const media = Array.isArray(data.media)
      ? data.media
          .map((item: any) => {
            const url = normalizeMediaUrl(typeof item === "string" ? item : item?.url);
            if (!url || String(url).startsWith("blob:")) return null;

            return {
              url,
              is_cover: Boolean(item?.is_cover),
              type: item?.type,
            };
          })
          .filter(Boolean)
      : [];

    return {
      ...data,
      square_feet: Number(data.square_feet) || 0,
      hourly_rate: Number(data.hourly_rate) || 0,
      overtime_rate: Number(data.overtime_rate) || 0,
      minimum_booking_hours: Number(data.minimum_booking_hours) || 0,
      buffer_time_minutes: Number(data.buffer_time_minutes) || 0,
      address: {
        ...address,
        latitude: Number.isFinite(latitude) ? latitude : 0,
        longitude: Number.isFinite(longitude) ? longitude : 0,
      },
      location: addressText || undefined,
      country: address.country,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      timezone: address.timezone,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      supported_shoot_types: Array.isArray(data.supported_shoot_types) ? data.supported_shoot_types : [],
      media,
      operating_hours: Array.isArray(data.operating_hours) ? data.operating_hours : [],
    };
  };

  useEffect(() => {
    if (!isEditMode || !editStudioId) {
      setIsPrefilling(false);
      return;
    }

    let active = true;

    const loadStudio = async () => {
      setIsPrefilling(true);
      try {
        const response = await adminApi.getStudioById(editStudioId);
        if (!active) return;

        if (response?.success && response?.data) {
          setStudioData(normalizeStudioForForm(response.data));
        } else {
          toast.error(response?.error || "Failed to load studio data");
        }
      } catch (error) {
        console.error("Failed to load studio for editing:", error);
        toast.error("Failed to load studio data");
      } finally {
        if (active) setIsPrefilling(false);
      }
    };

    void loadStudio();

    return () => {
      active = false;
    };
  }, [editStudioId, isEditMode]);

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
      setView('information');
    } else if (view === 'information') {
      setView('features');
    } else if (view === 'features') {
      setView('media');
    } else if (view === 'media') {
      setView('activities');
    } else if (view === 'activities') {
      setView('operations');
    } else if (view === 'operations') {
      setView('budget');
    } else if (view === 'budget') {
      setView('terms');
    } else {
      handleSaveStudio();
    }
  };

  const handleSaveStudio = async () => {
    try {
      if (Array.isArray(studioData.media) && studioData.media.some((item: any) => String(item?.status || "").toLowerCase() === "uploading")) {
        toast.error("Please wait for media upload to finish");
        return;
      }

      setIsSaving(true);
      const payload = buildStudioPayload(studioData);
      const response = isEditMode && editStudioId
        ? await adminApi.updateStudio(editStudioId, payload)
        : await adminApi.createStudio(payload);
      if (response?.success) {
        toast.success(isEditMode ? "Studio updated successfully!" : "Studio created successfully!");
        router.push(isEditMode && editStudioId ? `/admin/studio-management/${editStudioId}` : "/admin/studio-management");
      } else {
        toast.error(response?.error || (isEditMode ? "Failed to update studio" : "Failed to create studio"));
      }
    } catch (error) {
      console.error("Save Studio Error:", error);
      toast.error("An unexpected error occurred while saving the studio");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPrefilling) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E8D1AB]" size={28} />
      </div>
    );
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button
              className="h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]"
              onClick={handleSaveStudio}
              disabled={isSaving || isPrefilling}
            >
              {isEditMode ? "Save Changes" : "Save & Exit"}
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
            {currentView.component}
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
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Saving...</span>
                </div>
              ) : (
                view === "terms"
                  ? (isEditMode ? "Save changes" : "Save studio")
                  : "Continue"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
