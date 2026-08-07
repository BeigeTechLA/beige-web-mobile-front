/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import MediaUploadForm from "@/components/admin/studios/add-studio/MediaForm";
import OperatingHoursForm from "@/components/admin/studios/add-studio/OperatingHoursForm";
import BudgetForm from "@/components/admin/studios/add-studio/BudgetForm";

const VIEW_CONFIG = {
  address: {
    title: "Space Address",
    subtitle: "The Address will be only shared with the guests to add the space in listings.",
    component: <SpaceAddressForm />
  },
  information: {
    title: "Space Information",
    subtitle: "Everything you need to know about the space — what&apos;s included, what’s allowed, and how it’s set up for your shoot.",
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


export default function AdminStudiosDetailsPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [view, setView] = useState<keyof typeof VIEW_CONFIG>("address");
  const [mediaFiles, setMediaFiles] = useState<
    Array<{ id: string; file?: File; url: string; type: "image" | "video"; status: "selected" | "uploaded" | "uploading" }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

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
            if (!parsed.apartment || !parsed.apartment.trim()) {
              toast.error("Please enter Apartment, Suite, etc");
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
        toast.error("Please upload at least 5 photos or videos");
        return;
      }
      setView('activities');
    } else if (view === 'activities') {
      setView('operations');
    } else if (view === 'operations') {
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

  const studioPayload = {
    studio_name: "Sunset Creative Studio",
    brand_name: "Beige",
    description: "A bright production-ready studio space suitable for photography, video shoots, product shoots, and podcast recording.",
    supported_shoot_types: ["Photography", "Product Shoot", "Videography", "Podcast"],
    suggested_type: "Creative production studio",
    square_feet: 1200,
    height: "12 ft",
    width: "30 ft",
    length: "40 ft",
    main_floor_number: "2",
    overnight_stays_allowed: true,
    security_recording_enabled: true,
    security_recording_description: "Security cameras are installed in shared/common areas only. Recording devices in bathrooms or dressing rooms are prohibited.",
    address: {
      country: "United States",
      line1: "845 S Los Angeles St, Suite 302",
      line2: "",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90014",
      latitude: 34.0401,
      longitude: -118.2542,
      timezone: "America/Los_Angeles",
    },
    hourly_rate: 85,
    overtime_rate: 100,
    minimum_booking_hours: 2,
    buffer_time_minutes: 30,
    parking_options: ["Free Onsite Parking", "Paid Onsite Parking", "Free Street Parking"],
    parking_description: "Free parking available for up to 10 vehicles. Valet service available on weekends.",
    access_features: ["Elevator", "Stairs", "Street Level"],
    facility_features: {
      general: ["Wifi", "Kitchen", "Restroom", "Air conditioning"],
      photography: ["Natural light", "Backdrop", "Lighting kit"],
      videography: ["Sound treated", "Green screen"],
      podcast: ["Podcast table", "Microphones"],
      product: ["Product table", "White backdrop"],
    },
    amenities: ["Wifi", "Kitchen", "Free washer", "Dryer", "Security cameras", "Garden view"],
    activities: ["Production", "Event", "Recreation", "Meetings"],
    space_basics: { guests: 25, bedrooms: 1, beds: 1, bathrooms: 1 },
    description_tags: ["Peaceful", "Podcast Friendly", "Spacious", "Natural Lighting", "Luxury"],
    wifi_name: "Beige Studio WiFi",
    wifi_password: "studio-password",
    preferred_age: "18+",
    pricing_settings: {
      categories: [
        {
          name: "Production",
          hourly_price: 85,
          min_hours: 2,
          max_people_allowed: 25,
          included_types: ["Photo Shoot", "Video Shoot", "Product Shoot"],
        },
      ],
      equipment: [
        {
          name: "Green Screen",
          cost: 50,
        },
      ],
    },
    house_rules: {
      smoking_and_drugs_allowed: false,
      alcohol_allowed: true,
      cooking_allowed: true,
      electricity_usage_allowed: true,
      external_food_allowed: false,
      pets_allowed: false,
      custom_rules: ["No loud music after 9 PM."],
    },
    policies: {
      cancellation_and_refund: {
        cancellation_window_refunded: true,
        host_studio_cancellations: true,
      },
      safety: {
        user_responsibility: true,
        conduct_and_compliance: true,
        trust_and_protection: true,
      },
      cleanliness: {
        studio_expectation: true,
        guest_responsibility: true,
      },
      additional: {
        damage_liability: true,
        health_and_safety: true,
        good_neighbor_policy: true,
      },
    },
    media: [],
    operating_hours: [
      { day_of_week: 0, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
      { day_of_week: 1, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
    ],
  };

  const handleSaveStudio = async () => {
    let dynamicAddress = studioPayload.address;
    if (typeof window !== "undefined") {
      const savedAddress = localStorage.getItem("add_studio_address");
      if (savedAddress) {
        try {
          const parsed = JSON.parse(savedAddress);
          dynamicAddress = {
            country: parsed.country || "United States",
            line1: parsed.address || "845 S Los Angeles St, Suite 302",
            line2: parsed.apartment || "",
            city: parsed.city || "Los Angeles",
            state: parsed.state || "CA",
            zipCode: parsed.zipCode || "90014",
            latitude: parsed.latitude || 34.0401,
            longitude: parsed.longitude || -118.2542,
            timezone: "America/Los_Angeles",
          };
        } catch (e) {
          console.error("Failed to parse saved address from localStorage", e);
        }
      }
    }

    let dynamicBudget = {
      hourlyRate: 85,
      overtimeRate: 100,
      minimumBooking: 2,
      bufferTime: 30
    };
    if (typeof window !== "undefined") {
      const savedBudget = localStorage.getItem("add_studio_budget");
      if (savedBudget) {
        try {
          const parsed = JSON.parse(savedBudget);
          dynamicBudget = {
            hourlyRate: parsed.hourlyRate ? Number(parsed.hourlyRate) : 85,
            overtimeRate: parsed.overtimeRate ? Number(parsed.overtimeRate) : 100,
            minimumBooking: parsed.minimumBooking ? Number(parsed.minimumBooking) : 2,
            bufferTime: parsed.bufferTime ? Number(parsed.bufferTime) : 30
          };
        } catch (e) {
          console.error("Failed to parse saved budget from localStorage", e);
        }
      }
    }

    let dynamicInfo = {
      spaceTitle: "Sunset Creative Studio",
      brandName: "Beige",
      description: "A bright production-ready studio space suitable for photography, video shoots, product shoots, and podcast recording.",
      secondaryTypes: ["Photography", "Product Shoot", "Videography", "Podcast"],
      suggestedType: "Creative production studio",
      dimensions: {
        propertySize: "1200",
        height: "12 ft",
        width: "30 ft",
        length: "40 ft",
        floorNumber: "2",
      },
      overnightStays: true,
      securityEnabled: true,
      securityDesc: "Security cameras are installed in shared/common areas only. Recording devices in bathrooms or dressing rooms are prohibited.",
    };
    if (typeof window !== "undefined") {
      const savedInfo = localStorage.getItem("add_studio_info");
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          dynamicInfo = {
            spaceTitle: parsed.spaceTitle || dynamicInfo.spaceTitle,
            brandName: parsed.brandName || dynamicInfo.brandName,
            description: parsed.description || dynamicInfo.description,
            secondaryTypes: parsed.secondaryTypes || dynamicInfo.secondaryTypes,
            suggestedType: parsed.suggestedType || dynamicInfo.suggestedType,
            dimensions: {
              propertySize: parsed.dimensions?.propertySize || dynamicInfo.dimensions.propertySize,
              height: parsed.dimensions?.height || dynamicInfo.dimensions.height,
              width: parsed.dimensions?.width || dynamicInfo.dimensions.width,
              length: parsed.dimensions?.length || dynamicInfo.dimensions.length,
              floorNumber: parsed.dimensions?.floorNumber || dynamicInfo.dimensions.floorNumber,
            },
            overnightStays: parsed.overnightStays !== undefined ? parsed.overnightStays : dynamicInfo.overnightStays,
            securityEnabled: parsed.securityEnabled !== undefined ? parsed.securityEnabled : dynamicInfo.securityEnabled,
            securityDesc: parsed.securityDesc || dynamicInfo.securityDesc,
          };
        } catch (e) {
          console.error("Failed to parse saved info from localStorage", e);
        }
      }
    }

    const parkingMap: Record<string, string> = {
      "free-onsite": "Free Onsite Parking",
      "paid-onsite": "Paid Onsite Parking",
      "free-street": "Free Street Parking",
      "metered-street": "Metered Street Parking",
      "valet": "Valet",
      "nearby-lot": "Nearby Parking lot",
    };
    const accessMap: Record<string, string> = {
      "elevator": "Elevator",
      "stairs": "Stairs",
      "street-level": "Street Level",
      "freight": "Freight Elevator",
      "handicap": "Wheelchair / Handicap access",
    };
    const amenityMap: Record<string, string> = {
      "wifi": "Wifi",
      "hot-tub": "Hot Tub",
      "fire-pit": "Fire Pit",
      "pool-table": "Pool Table",
      "bbq": "BBQ Grill",
      "fireplace": "Indoor Fireplace",
      "gym": "Gym",
      "patio": "Patio",
      "pool": "Pool",
      "dining": "Outdoor Dining Area",
      "kitchen": "Kitchen",
    };

    let dynamicFeatures = {
      parking: [] as string[],
      description: "Free parking available for up to 10 vehicles. Valet service available on weekends.",
      accessFeatures: [] as string[],
      featureValues: {
        general: ["Wifi", "Kitchen", "Restroom", "Air conditioning"] as string[],
        photography: ["Natural light", "Backdrop", "Lighting kit"] as string[],
        videography: ["Sound treated", "Green screen"] as string[],
        podcast: ["Podcast table", "Microphones"] as string[],
        product: ["Product table", "White backdrop"] as string[],
      }
    };
    if (typeof window !== "undefined") {
      const savedFeatures = localStorage.getItem("add_studio_features");
      if (savedFeatures) {
        try {
          const parsed = JSON.parse(savedFeatures);
          dynamicFeatures = {
            parking: parsed.parking || dynamicFeatures.parking,
            description: parsed.description || dynamicFeatures.description,
            accessFeatures: parsed.accessFeatures || dynamicFeatures.accessFeatures,
            featureValues: {
              general: parsed.featureValues?.general || dynamicFeatures.featureValues.general,
              photography: parsed.featureValues?.photography || dynamicFeatures.featureValues.photography,
              videography: parsed.featureValues?.videography || dynamicFeatures.featureValues.videography,
              podcast: parsed.featureValues?.podcast || dynamicFeatures.featureValues.podcast,
              product: parsed.featureValues?.product || dynamicFeatures.featureValues.product,
            }
          };
        } catch (e) {
          console.error("Failed to parse saved features from localStorage", e);
        }
      }
    }

    const parkingOptions = dynamicFeatures.parking.map(id => parkingMap[id]).filter(Boolean);
    const accessFeatures = dynamicFeatures.accessFeatures.map(id => accessMap[id]).filter(Boolean);

    let dynamicDetails = {
      useDefault: true,
      activities: {
        production: true,
        event: false,
        recreation: false,
        meetings: false,
      },
      counts: {
        guests: 25,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
      },
      amenities: ["wifi", "kitchen"] as string[],
      highlights: ["Peaceful", "Podcast Friendly", "Spacious", "Natural Lighting", "Luxury"] as string[],
    };
    if (typeof window !== "undefined") {
      const savedDetails = localStorage.getItem("add_studio_details");
      if (savedDetails) {
        try {
          const parsed = JSON.parse(savedDetails);
          dynamicDetails = {
            useDefault: parsed.useDefault !== undefined ? parsed.useDefault : dynamicDetails.useDefault,
            activities: parsed.activities || dynamicDetails.activities,
            counts: parsed.counts || dynamicDetails.counts,
            amenities: parsed.amenities || dynamicDetails.amenities,
            highlights: parsed.highlights || dynamicDetails.highlights,
          };
        } catch (e) {
          console.error("Failed to parse saved details from localStorage", e);
        }
      }
    }

    const activitiesList = Object.entries(dynamicDetails.activities)
      .filter(([_, enabled]) => enabled)
      .map(([act]) => act.charAt(0).toUpperCase() + act.slice(1));

    const amenitiesList = dynamicDetails.amenities.map(id => amenityMap[id] || id).filter(Boolean);

    let dynamicOperations = {
      is24Hrs: false,
      selectedDays: ["Monday"] as string[],
      schedule: {} as Record<string, { isOpen: boolean; setHours: boolean }>,
      rules: {
        smoking: false,
        alcohol: true,
        cooking: true,
        electricity: true,
        externalFood: false,
        pets: null as boolean | null,
      },
      customRule: "",
    };
    if (typeof window !== "undefined") {
      const savedOperations = localStorage.getItem("add_studio_operations");
      if (savedOperations) {
        try {
          const parsed = JSON.parse(savedOperations);
          dynamicOperations = {
            is24Hrs: parsed.is24Hrs !== undefined ? parsed.is24Hrs : dynamicOperations.is24Hrs,
            selectedDays: parsed.selectedDays || dynamicOperations.selectedDays,
            schedule: parsed.schedule || dynamicOperations.schedule,
            rules: {
              smoking: parsed.rules?.smoking !== undefined ? parsed.rules.smoking : dynamicOperations.rules.smoking,
              alcohol: parsed.rules?.alcohol !== undefined ? parsed.rules.alcohol : dynamicOperations.rules.alcohol,
              cooking: parsed.rules?.cooking !== undefined ? parsed.rules.cooking : dynamicOperations.rules.cooking,
              electricity: parsed.rules?.electricity !== undefined ? parsed.rules.electricity : dynamicOperations.rules.electricity,
              externalFood: parsed.rules?.externalFood !== undefined ? parsed.rules.externalFood : dynamicOperations.rules.externalFood,
              pets: parsed.rules?.pets !== undefined ? parsed.rules.pets : dynamicOperations.rules.pets,
            },
            customRule: parsed.customRule || dynamicOperations.customRule,
          };
        } catch (e) {
          console.error("Failed to parse saved operations from localStorage", e);
        }
      }
    }

    const dayMap: Record<string, number> = {
      "Sunday": 0,
      "Monday": 1,
      "Tuesday": 2,
      "Wednesday": 3,
      "Thursday": 4,
      "Friday": 5,
      "Saturday": 6,
    };
    const operatingHours = Object.entries(dynamicOperations.schedule).map(([day, config]: [string, any]) => ({
      day_of_week: dayMap[day],
      is_open: config.isOpen,
      opens_at: dynamicOperations.is24Hrs ? "00:00:00" : "10:00:00",
      closes_at: dynamicOperations.is24Hrs ? "23:59:59" : "22:00:00",
    }));

    const houseRules = {
      smoking_and_drugs_allowed: !!dynamicOperations.rules.smoking,
      alcohol_allowed: !!dynamicOperations.rules.alcohol,
      cooking_allowed: !!dynamicOperations.rules.cooking,
      electricity_usage_allowed: !!dynamicOperations.rules.electricity,
      external_food_allowed: !!dynamicOperations.rules.externalFood,
      pets_allowed: !!dynamicOperations.rules.pets,
      custom_rules: dynamicOperations.customRule ? [dynamicOperations.customRule] : [],
    };

    const selectedFiles = mediaFiles.filter((file) => file.file);

    if (selectedFiles.length > 0) {
      try {
        setIsSaving(true);
        toast.loading("Uploading studio media...", { id: "studio-save" });

        const uploadResponse = await studioAdminApi.uploadMedia(selectedFiles.map((file) => file.file as File));
        const uploaded = (uploadResponse as any)?.data?.data ?? (uploadResponse as any)?.data ?? [];
        const uploadedUrls = Array.isArray(uploaded)
          ? uploaded.map((item) => (typeof item === "string" ? item : item?.url)).filter(Boolean)
          : [];

        const nextUploadedUrls = [...uploadedUrls];
        setMediaFiles((current) =>
          current.map((file) =>
            file.file
              ? {
                  ...file,
                  url: nextUploadedUrls.shift() || file.url,
                  status: "uploaded",
                }
              : file
          )
        );

        const payload = {
          ...studioPayload,
          studio_name: dynamicInfo.spaceTitle,
          brand_name: dynamicInfo.brandName,
          description: dynamicInfo.description,
          supported_shoot_types: dynamicInfo.secondaryTypes,
          suggested_type: dynamicInfo.suggestedType,
          square_feet: Number(dynamicInfo.dimensions.propertySize) || 1200,
          height: dynamicInfo.dimensions.height,
          width: dynamicInfo.dimensions.width,
          length: dynamicInfo.dimensions.length,
          main_floor_number: dynamicInfo.dimensions.floorNumber,
          overnight_stays_allowed: dynamicInfo.overnightStays,
          security_recording_enabled: dynamicInfo.securityEnabled,
          security_recording_description: dynamicInfo.securityDesc,
          hourly_rate: dynamicBudget.hourlyRate,
          overtime_rate: dynamicBudget.overtimeRate,
          minimum_booking_hours: dynamicBudget.minimumBooking,
          buffer_time_minutes: dynamicBudget.bufferTime,
          parking_options: parkingOptions.length > 0 ? parkingOptions : ["Free Onsite Parking"],
          parking_description: dynamicFeatures.description,
          access_features: accessFeatures.length > 0 ? accessFeatures : ["Elevator", "Stairs"],
          facility_features: {
            general: dynamicFeatures.featureValues.general,
            photography: dynamicFeatures.featureValues.photography,
            videography: dynamicFeatures.featureValues.videography,
            podcast: dynamicFeatures.featureValues.podcast,
            product: dynamicFeatures.featureValues.product,
          },
          amenities: amenitiesList.length > 0 ? amenitiesList : ["Wifi", "Kitchen"],
          activities: activitiesList.length > 0 ? activitiesList : ["Production"],
          space_basics: {
            guests: dynamicDetails.counts.guests,
            bedrooms: dynamicDetails.counts.bedrooms,
            beds: dynamicDetails.counts.beds,
            bathrooms: dynamicDetails.counts.bathrooms,
          },
          description_tags: dynamicDetails.highlights,
          house_rules: houseRules,
          operating_hours: operatingHours.length > 0 ? operatingHours : [
            { day_of_week: 0, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
            { day_of_week: 1, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
          ],
          pricing_settings: {
            ...studioPayload.pricing_settings,
            categories: [
              {
                name: "Production",
                hourly_price: dynamicBudget.hourlyRate,
                min_hours: dynamicBudget.minimumBooking,
                max_people_allowed: dynamicDetails.counts.guests || 25,
                included_types: ["Photo Shoot", "Video Shoot", "Product Shoot"],
              },
            ],
          },
          address: dynamicAddress,
          latitude: String(dynamicAddress.latitude),
          longitude: String(dynamicAddress.longitude),
          address_line1: dynamicAddress.line1,
          address_line2: dynamicAddress.line2,
          city: dynamicAddress.city,
          state: dynamicAddress.state,
          zip_code: dynamicAddress.zipCode,
          country: dynamicAddress.country,
          media: [
            ...mediaFiles.filter((file) => !file.file && !file.url.startsWith("blob:")).map((file) => ({ url: file.url })),
            ...uploadedUrls.map((url) => ({ url })),
          ],
        };

        await studioAdminApi.createStudio(payload);
        if (typeof window !== "undefined") {
          localStorage.removeItem("add_studio_address");
          localStorage.removeItem("add_studio_budget");
          localStorage.removeItem("add_studio_info");
          localStorage.removeItem("add_studio_features");
          localStorage.removeItem("add_studio_details");
          localStorage.removeItem("add_studio_operations");
        }
        toast.success("Studio created successfully", { id: "studio-save" });
        router.push("/admin/studio-management");
      } catch (error) {
        console.error("Failed to save studio:", error);
        toast.error("Failed to save studio. Please try again.", { id: "studio-save" });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      setIsSaving(true);
      toast.loading("Creating studio...", { id: "studio-save" });
      const payload = {
        ...studioPayload,
        studio_name: dynamicInfo.spaceTitle,
        brand_name: dynamicInfo.brandName,
        description: dynamicInfo.description,
        supported_shoot_types: dynamicInfo.secondaryTypes,
        suggested_type: dynamicInfo.suggestedType,
        square_feet: Number(dynamicInfo.dimensions.propertySize) || 1200,
        height: dynamicInfo.dimensions.height,
        width: dynamicInfo.dimensions.width,
        length: dynamicInfo.dimensions.length,
        main_floor_number: dynamicInfo.dimensions.floorNumber,
        overnight_stays_allowed: dynamicInfo.overnightStays,
        security_recording_enabled: dynamicInfo.securityEnabled,
        security_recording_description: dynamicInfo.securityDesc,
        hourly_rate: dynamicBudget.hourlyRate,
        overtime_rate: dynamicBudget.overtimeRate,
        minimum_booking_hours: dynamicBudget.minimumBooking,
        buffer_time_minutes: dynamicBudget.bufferTime,
        parking_options: parkingOptions.length > 0 ? parkingOptions : ["Free Onsite Parking"],
        parking_description: dynamicFeatures.description,
        access_features: accessFeatures.length > 0 ? accessFeatures : ["Elevator", "Stairs"],
        facility_features: {
          general: dynamicFeatures.featureValues.general,
          photography: dynamicFeatures.featureValues.photography,
          videography: dynamicFeatures.featureValues.videography,
          podcast: dynamicFeatures.featureValues.podcast,
          product: dynamicFeatures.featureValues.product,
        },
        amenities: amenitiesList.length > 0 ? amenitiesList : ["Wifi", "Kitchen"],
        activities: activitiesList.length > 0 ? activitiesList : ["Production"],
        space_basics: {
          guests: dynamicDetails.counts.guests,
          bedrooms: dynamicDetails.counts.bedrooms,
          beds: dynamicDetails.counts.beds,
          bathrooms: dynamicDetails.counts.bathrooms,
        },
        description_tags: dynamicDetails.highlights,
        house_rules: houseRules,
        operating_hours: operatingHours.length > 0 ? operatingHours : [
          { day_of_week: 0, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
          { day_of_week: 1, is_open: true, opens_at: "10:00:00", closes_at: "22:00:00" },
        ],
        pricing_settings: {
          ...studioPayload.pricing_settings,
          categories: [
            {
              name: "Production",
              hourly_price: dynamicBudget.hourlyRate,
              min_hours: dynamicBudget.minimumBooking,
              max_people_allowed: dynamicDetails.counts.guests || 25,
              included_types: ["Photo Shoot", "Video Shoot", "Product Shoot"],
            },
          ],
        },
        address: dynamicAddress,
        latitude: String(dynamicAddress.latitude),
        longitude: String(dynamicAddress.longitude),
        address_line1: dynamicAddress.line1,
        address_line2: dynamicAddress.line2,
        city: dynamicAddress.city,
        state: dynamicAddress.state,
        zip_code: dynamicAddress.zipCode,
        country: dynamicAddress.country,
      };
      await studioAdminApi.createStudio(payload);
      if (typeof window !== "undefined") {
        localStorage.removeItem("add_studio_address");
        localStorage.removeItem("add_studio_budget");
        localStorage.removeItem("add_studio_info");
        localStorage.removeItem("add_studio_features");
        localStorage.removeItem("add_studio_details");
        localStorage.removeItem("add_studio_operations");
      }
      toast.success("Studio created successfully", { id: "studio-save" });
      router.push("/admin/studio-management");
    } catch (error) {
      console.error("Failed to save studio:", error);
      toast.error("Failed to save studio. Please try again.", { id: "studio-save" });
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
            <Link href={"#"}>
              <Button className="h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                Save & Exit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="overflow-hidden pb-30 p-4 lg:p-9" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex justify-between items-center">

          <button
            onClick={() => router.back()}
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
            {view === "media"
              ? React.cloneElement(currentView.component as React.ReactElement, {
                  files: mediaFiles,
                  onFilesChange: setMediaFiles,
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
