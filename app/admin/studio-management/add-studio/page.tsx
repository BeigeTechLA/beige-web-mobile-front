"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { usePathname, useRouter } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

import Topbar from "@/components/admin/Topbar";

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
      // router.back();
      console.log("Studio Saved! Implement your save logic here.");
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
              // disabled={!canPrimaryAction || isCreatingQuoteDraft}
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