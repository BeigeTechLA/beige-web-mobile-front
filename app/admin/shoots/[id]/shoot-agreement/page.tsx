"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import { SendAgreementModal } from "@/components/admin/shoot-details/SendAgreementModal";
import ShootAgreementSuccessModal from "@/components/admin/shoot-details/ShootAgreementSuccessModal";

import {
  Step1ModeSelection,
  CPDetail,
  AgreementCreationMode,
} from "@/components/admin/shoot-details/Step1AgreementTypeSelection";
import {
  Step2AgreementDetails,
  ClauseSection,
} from "@/components/admin/shoot-details/Step2AgreementDetails";
import { Step3ReviewAgreement } from "@/components/admin/shoot-details/Step3ReviewAgreement";

const CP_LIST: CPDetail[] = [
  {
    id: "cp-1",
    name: "Ethan Cole",
    role: "Lead Photographer",
    assignCode: "ASSIGN-004",
    initials: "EC",
    compensation: "$6,250 (Fixed)",
    projectName: "Wedding Videography",
    projectId: "SHOOT-2026-087",
    assignmentId: "ASSIGN-004",
  },
  {
    id: "cp-2",
    name: "Michael Chen",
    role: "Lead Videographer",
    assignCode: "ASSIGN-005",
    initials: "MC",
    compensation: "$5,500 (Fixed)",
    projectName: "Wedding Videography",
    projectId: "SHOOT-2026-087",
    assignmentId: "ASSIGN-005",
  },
];

export default function AdminAgreementDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Flow & Mode States
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMode, setSelectedMode] =
    useState<AgreementCreationMode>("individual");
  const [activeCpIndex, setActiveCpIndex] = useState<number>(0);
  const [reviewCpIndex, setReviewCpIndex] = useState<number>(0);

  // Form Fields State
  const [productionDate, setProductionDate] = useState<Date | null>(
    new Date("2026-09-15")
  );
  const [location, setLocation] = useState("The Grand Hall, Los Angeles");
  const [callTime, setCallTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("6:00 PM");

  // Modal States
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Editable Clause Sections State
  const [sections, setSections] = useState<ClauseSection[]>([
    {
      id: "scope",
      num: "01",
      title: "Scope of Services",
      content:
        "Capture photography coverage for the corporate event, including event highlights and speaker sessions.",
      isExpanded: true,
    },
    {
      id: "equipment",
      num: "02",
      title: "Equipment Requirements",
      subtitle:
        "This agreement defines the Shoot terms, responsibilities, and expectations...",
      content:
        "Sony FX3 or equivalent cinema camera, prime lenses (24mm, 50mm, 85mm), tripod, gimbal stabilizer, audio recording equipment.",
      isExpanded: false,
    },
    {
      id: "deliverables",
      num: "03",
      title: "Deliverables / Media Transfer",
      subtitle:
        "Additional terms and conditions applicable to this agreement....",
      content:
        "Upload all raw media to the designated Beige folder within 24 hours of shoot completion.",
      isExpanded: false,
    },
    {
      id: "expenses",
      num: "04",
      title: "Approved Expenses / Travel",
      subtitle:
        "Additional terms and conditions applicable to this agreement....",
      content:
        "Travel to and from shoot location (up to $75 round trip). Parking at venue. No additional expenses without prior written approval.",
      isExpanded: false,
    },
    {
      id: "additional",
      num: "05",
      title: "Special Instructions",
      subtitle:
        "Additional terms and conditions applicable to this agreement....",
      content:
        "Client requires all crew to sign NDA upon arrival. Business casual attire. Shoot brief will be provided 48 hours before the production date.",
      isExpanded: false,
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  if (!mounted) return null;

  const currentCP = CP_LIST[activeCpIndex];

  // Accordion Section Handlers
  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === id ? { ...sec, isExpanded: !sec.isExpanded } : sec
      )
    );
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, title } : sec))
    );
  };

  const updateSectionContent = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, content } : sec))
    );
  };

  // Step Navigation Logic
  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setActiveCpIndex(0);
    } else if (currentStep === 2) {
      if (selectedMode === "individual" && activeCpIndex < CP_LIST.length - 1) {
        setActiveCpIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setCurrentStep(3);
        setReviewCpIndex(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      setActiveCpIndex(CP_LIST.length - 1);
    } else if (currentStep === 2) {
      if (selectedMode === "individual" && activeCpIndex > 0) {
        setActiveCpIndex((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setCurrentStep(1);
      }
    } else {
      router.back();
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            {currentStep === 2 &&
              <>
                <Button
                  variant="outline"
                  className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                    ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                    : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                    }`}
                > Save Draft
                </Button>
                <Button
                  className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                    ? "bg-white border-white/10 text-black hover:bg-[#F0F0F0]"
                    : "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                    }`}
                >
                  Preview
                </Button>
              </>}
          </>
        }
      />

      <div className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-40 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}>
        <Button
          type="button"
          onClick={handlePreviousStep}
          className={`transition-colors flex items-center gap-2 lg:mb-5 p-0 bg-transparent hover:bg-transparent ${isDark
              ? "text-white hover:text-white/80"
              : "text-black hover:text-black/70"
            }`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Step 1 Component */}
        {currentStep === 1 && (
          <Step1ModeSelection
            isDark={isDark}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            cpList={CP_LIST}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        )}

        {/* Step 2 Component */}
        {currentStep === 2 && (
          <Step2AgreementDetails
            isDark={isDark}
            selectedMode={selectedMode}
            currentCP={currentCP}
            productionDate={productionDate}
            setProductionDate={setProductionDate}
            location={location}
            setLocation={setLocation}
            callTime={callTime}
            setCallTime={setCallTime}
            endTime={endTime}
            setEndTime={setEndTime}
            sections={sections}
            toggleSection={toggleSection}
            updateSectionTitle={updateSectionTitle}
            updateSectionContent={updateSectionContent}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        )}

        {/* Step 3 Component */}
        {currentStep === 3 && (
          <Step3ReviewAgreement
            isDark={isDark}
            selectedMode={selectedMode}
            cpList={CP_LIST}
            reviewCpIndex={reviewCpIndex}
            setReviewCpIndex={setReviewCpIndex}
            productionDate={productionDate}
            location={location}
            callTime={callTime}
            endTime={endTime}
            sections={sections}
            onOpenSendDialog={() => setIsSendDialogOpen(true)}
            onPrevious={handlePreviousStep}
            onSave={() => router.push("/admin/agreements")}
          />
        )}

        {/* Mobile Sticky Action Bar */}
        <div
          className={`lg:hidden fixed flex flex-wrap gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
            }`}
        >
          <Button
            type="button"
            onClick={handlePreviousStep}
            className={`flex-1 h-12 rounded-lg border text-sm font-medium bg-transparent ${isDark
                ? "border-white/20 text-white"
                : "border-black/20 text-black"
              }`}
          >
            Back
          </Button>

          <Button
            type="button"
            onClick={handleNextStep}
            className="flex-[2] h-12 rounded-lg text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]"
          >
            {currentStep === 1
              ? "Continue to Add Agreement"
              : currentStep === 2 &&
                selectedMode === "individual" &&
                activeCpIndex < CP_LIST.length - 1
                ? "Next CP"
                : currentStep === 2
                  ? "Review"
                  : "Save"}
          </Button>
        </div>
      </div>

      <SendAgreementModal
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onSubmit={() => {
          setIsSendDialogOpen(false);
          setIsSuccessOpen(true);
        }}
        cps={CP_LIST}
        mode={selectedMode}
      />

      <ShootAgreementSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        onBackToShoots={() => router.push("/admin/shoots")}
        onViewAgreement={() => router.push("/admin/agreements")}
        count={CP_LIST.length}
        mode={selectedMode}
      />
    </>
  );
}