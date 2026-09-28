"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  GripVertical,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Send,
  Info,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
} from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import { DatePickerFloating } from "@/components/admin/DatePickerFloating";
import { SendAgreementModal } from "@/components/admin/shoot-details/SendAgreementModal";
import ShootAgreementSuccessModal from "@/components/admin/shoot-details/ShootAgreementSuccessModal";

type AgreementCreationMode = "individual" | "common";

interface CPDetail {
  id: string;
  name: string;
  role: string;
  assignCode: string;
  initials: string;
  compensation: string;
  projectName: string;
  projectId: string;
  assignmentId: string;
}

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

interface ClauseSection {
  id: string;
  num: string;
  title: string;
  subtitle?: string;
  content: string;
  isExpanded: boolean;
}

export default function AdminAgreementDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Flow State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<AgreementCreationMode>("individual");
  const [activeCpIndex, setActiveCpIndex] = useState<number>(0);
  const [reviewCpIndex, setReviewCpIndex] = useState<number>(0);

  // Form Field States
  const [productionDate, setProductionDate] = useState<Date | null>(new Date("2026-09-15"));
  const [location, setLocation] = useState("The Grand Hall, Los Angeles");
  const [callTime, setCallTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("6:00 PM");

  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Editable Sections State
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
      subtitle: "This agreement defines the Shoot terms, responsibilities, and expectations...",
      content:
        "Sony FX3 or equivalent cinema camera, prime lenses (24mm, 50mm, 85mm), tripod, gimbal stabilizer, audio recording equipment.",
      isExpanded: false,
    },
    {
      id: "deliverables",
      num: "03",
      title: "Deliverables / Media Transfer",
      subtitle: "Additional terms and conditions applicable to this agreement....",
      content:
        "Upload all raw media to the designated Beige folder within 24 hours of shoot completion.",
      isExpanded: false,
    },
    {
      id: "expenses",
      num: "04",
      title: "Approved Expenses / Travel",
      subtitle: "Additional terms and conditions applicable to this agreement....",
      content:
        "Travel to and from shoot location (up to $75 round trip). Parking at venue. No additional expenses without prior written approval.",
      isExpanded: false,
    },
    {
      id: "additional",
      num: "05",
      title: "Special Instructions",
      subtitle: "Additional terms and conditions applicable to this agreement....",
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
  const reviewCP = CP_LIST[reviewCpIndex];

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

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setActiveCpIndex(0);
    } else if (currentStep === 2) {
      if (selectedMode === "individual" && activeCpIndex < CP_LIST.length - 1) {
        setActiveCpIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Move to Review Step
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
      <Topbar pathname={pathname} />

      <div
        className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-40 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"
          }`}
      >
        <Button
          onClick={handlePreviousStep}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"
            }`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* STEP 1: MODE SELECTION */}
        {currentStep === 1 && (
          <>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
              <div className="flex flex-col justify-between items-start w-full">
                <h1 className={`text-lg lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
                  Add Shoot Agreement
                </h1>
                <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                  Configure the Shoot Assignment Agreement
                </p>
              </div>

              <Button
                onClick={() => console.log("Version v1.0 (auto-generated)")}
                className="flex-0 w-full bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-12 px-6 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
              >
                Version v1.0 (auto-generated)
              </Button>
            </div>

            {/* Agreement Creation Container */}
            <div className={`border rounded-2xl transition-colors ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
              <div className={`border-b rounded-t-2xl p-5 space-y-6 transition-colors ${isDark ? "bg-[#090909] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
                <h2 className={`text-base font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
                  Agreement Creation
                </h2>
                <p className={`text-xs lg:text-sm ${isDark ? "text-[#747471]" : "text-black/60"}`}>
                  Choose whether to create separate agreements or one common agreement for the selected CPs.
                </p>
              </div>

              {/* Radio Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                {/* Individual Agreements Card */}
                <div
                  onClick={() => setSelectedMode("individual")}
                  className={`border rounded-xl p-4 cursor-pointer transition-all space-y-4 relative ${selectedMode === "individual"
                    ? isDark
                      ? "border-[#E8D1AB] bg-[#171717]"
                      : "border-[#000000] bg-[#FAFAFA]"
                    : isDark
                      ? "border-white/40 bg-[#101010] hover:border-[#3D3D3D]"
                      : "border-[#E5E5E5] bg-white hover:border-black/20"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMode === "individual"
                          ? "border-[#E8D1AB]"
                          : isDark
                            ? "border-white/40"
                            : "border-black/40"
                          }`}
                      >
                        {selectedMode === "individual" && (
                          <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${selectedMode === "individual" ? "text-[#E8D1AB]" : isDark ? "text-white" : "text-black"}`}>
                        Individual Agreements
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${selectedMode === "individual" ? "bg-[#E8D1AB]/15 border-[#E8D1AB]/25 text-[#E8D1AB]" : isDark
                        ? "bg-[#262525] border-[#252523] text-[#737370]"
                        : "bg-[#F3F4F6] border-[#E5E5E5] text-black/70"
                        }`}
                    >
                      Recommended
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"}`}>
                      One agreement per CP
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-[#747471]" : "text-black/50"}`}>
                      Create a separate agreement for each selected creative partner. Compensation, role,
                      scope, and details can be managed individually.
                    </p>
                  </div>

                  {/* Visual Diagram */}
                  <div className="pt-2 space-y-2.5">
                    {CP_LIST.map((cp, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium ${selectedMode === "individual" ? "bg-[#E8D1AB] text-black" : isDark ? "bg-[#333] text-white" : "bg-[#E0E0E0] text-black"}`}>
                          {cp.initials}
                        </div>
                        <div className={`h-[1px] flex-1 ${isDark ? "bg-[#282828]" : "bg-[#E0E0E0]"}`} />
                        <span
                          className={`text-[10px] px-3 py-1 rounded border ${isDark
                            ? "bg-[#262525] border-[#252523] text-[#737370]"
                            : "bg-[#F5F5F5] border-[#E0E0E0] text-black/50"
                            }`}
                        >
                          Agreement 0{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Agreement Card */}
                <div
                  onClick={() => setSelectedMode("common")}
                  className={`border rounded-xl p-4 cursor-pointer transition-all space-y-4 relative ${selectedMode === "common"
                    ? isDark
                      ? "border-[#E8D1AB] bg-[#171717]"
                      : "border-[#000000] bg-[#FAFAFA]"
                    : isDark
                      ? "border-white/40 bg-[#101010] hover:border-[#3D3D3D]"
                      : "border-[#E5E5E5] bg-white hover:border-black/20"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMode === "common"
                          ? "border-[#E8D1AB]"
                          : isDark
                            ? "border-white/40"
                            : "border-black/40"
                          }`}
                      >
                        {selectedMode === "common" && (
                          <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${selectedMode === "common" ? "text-[#E8D1AB]" : isDark ? "text-white" : "text-black"}`}>
                        Common Agreement
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${selectedMode === "common" ? "bg-[#E8D1AB]/15 border-[#E8D1AB]/25 text-[#E8D1AB]" : isDark
                        ? "bg-[#262525] border-[#252523] text-[#737370]"
                        : "bg-[#F3F4F6] border-[#E5E5E5] text-black/70"
                        }`}
                    >
                      Shared terms
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"}`}>
                      One agreement for multiple CPs
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-[#747471]" : "text-black/50"}`}>
                      Create one agreement shared with all selected creative partners. Use this when the
                      agreement terms are common to everyone.
                    </p>
                  </div>

                  {/* Visual Diagram */}
                  <div className="pt-2">
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex items-center -space-x-1.5">
                        <div className="flex items-center gap-0.5">
                          {CP_LIST.map((cp, idx) => (
                            <React.Fragment key={idx}>
                              {/* CP Initials Circle */}
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium ${selectedMode === "common" ? "bg-[#E8D1AB] text-black" : isDark ? "bg-[#333] text-white" : "bg-[#E0E0E0] text-black"}`}
                              >
                                {cp.initials}
                              </div>

                              {/* Plus Divider (inserted between circles) */}
                              {idx < CP_LIST.length - 1 && (
                                <span className="text-[#E8D1AB] text-xs font-semibold px-0.5 select-none">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      <div className={`h-[1px] flex-1 ${isDark ? "bg-[#282828]" : "bg-[#E0E0E0]"}`} />
                      <span
                        className={`text-[10px] px-3 py-1 rounded border ${isDark
                          ? "bg-[#262525] border-[#252523] text-[#737370]"
                          : "bg-[#F5F5F5] border-[#E0E0E0] text-black/50"
                          }`}
                      >
                        1 Agreement
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode Summary Footer Bar */}
              <div className="px-5 pb-5">
                <div className={`border rounded-lg px-5 py-3.5 flex flex-wrap items-center gap-6 text-sm ${isDark ? "bg-[#090909] border-[#1E1E1C]" : "bg-[#F9FAFB] border-[#E5E5E5]"}`}>
                  <div>
                    <span className={isDark ? "text-[#747471]" : "text-black/60"}>Mode: </span>
                    <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                      {selectedMode === "individual" ? "Individual Agreements" : "Common Agreement"}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? "text-[#747471]" : "text-black/60"}>CPs: </span>
                    <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{CP_LIST.length}</span>
                  </div>
                  <div>
                    <span className={isDark ? "text-[#747471]" : "text-black/60"}>Agreements to create: </span>
                    <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{selectedMode === "individual" ? CP_LIST.length : 1}</span>
                  </div>
                  <div>
                    <span className={isDark ? "text-[#747471]" : "text-black/60"}>Acceptance: </span>
                    <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{selectedMode === "individual" ? "Each CP individually" : "All CPs together"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Action Buttons (Desktop) */}
            <div className="hidden lg:flex items-center gap-4 pt-2">
              <Button
                onClick={handlePreviousStep}
                className={`h-12 px-8 rounded-xl border text-sm font-semibold transition-colors bg-transparent ${isDark
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-black/20 text-black hover:bg-black/5"
                  }`}
              >
                Back
              </Button>

              <Button
                onClick={handleNextStep}
                className="h-12 px-8 rounded-xl text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] transition-colors"
              >
                Continue to Add Agreement
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: CP AGREEMENT DETAILS FORM */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h1 className={`text-lg lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
                  Agreement for {selectedMode === "individual" ? currentCP.name : "All CPs"}{" "}
                  <span className="text-[#E8D1AB] font-normal">
                    ({selectedMode === "individual" ? "Individual Agreement" : "Common Agreement"})
                  </span>
                </h1>
                <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                  {currentCP.role} • {currentCP.assignCode}
                </p>
              </div>

              <Button
                onClick={() => console.log("Auto Generated Version")}
                className="flex-0 w-full lg:w-auto bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-10 px-5 rounded-lg font-semibold text-xs transition-all shrink-0"
              >
                Version v1.0 (auto-generated)
              </Button>
            </div>

            {/* Project Detail Card */}
            <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
              <h2 className={`p-4 lg:p-8 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Project Detail
              </h2>
              <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
              <div className="p-4 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className={`w-14 h-14 lg:w-21 lg:h-21 rounded-2xl flex items-center justify-center font-semibold text-lg lg:text-3xl shrink-0 ${isDark ? "bg-[#363434] text-[#E8D1AB]" : "bg-[#E0E0E0] text-black/80"}`}>
                  {currentCP.initials}
                </div>
                <div className="space-y-1.5 lg:space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-lg lg:text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
                      {currentCP.name} ({currentCP.role})
                    </h3>
                    <div className="bg-[#E8D1AB] text-black px-4 py-1 rounded-full text-xs flex items-center gap-1">
                      <span className="font-semibold text-sm">{currentCP.compensation}</span>
                      <span className="opacity-70">Total Compensation</span>
                    </div>
                  </div>

                  <div className={`flex gap-4 text-xs lg:text-sm ${isDark ? "text-[#AAA7A7]" : "text-black/60"}`}>
                    <p>Project Name : <span className={isDark ? "text-white" : "text-black"}>{currentCP.projectName}</span></p>
                    {"  "}|{"  "}
                    <p>Project ID : <span className={isDark ? "text-white" : "text-black"}>{currentCP.projectId}</span></p>
                    {"  "}|{"  "}
                    <p>Assignment ID : <span className={isDark ? "text-white" : "text-black"}>{currentCP.assignmentId}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Information Card */}
            <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
              <h2 className={`p-4 lg:p-8 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Production Information
              </h2>
              <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
              <div className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-10">
                {/* Production Date */}
                <DatePickerFloating
                  selectedDate={productionDate}
                  onDateChange={setProductionDate}
                  width="w-full"
                  classnames={`pointer-none w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] relative rounded-xl border ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                  labelClasses={`${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"} text-sm lg:text-base z-10 px-2`}
                  label="Production Date"
                />

                {/* Location */}
                <div
                  className={`relative rounded-xl border ${isDark
                    ? "border-white/20 bg-[#171717]"
                    : "border-gray-300 bg-white"
                    }`}
                >
                  <label className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. General Terms of Service"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                  />
                </div>

                {/* Call Time */}
                <div
                  className={`relative rounded-xl border ${isDark
                    ? "border-white/20 bg-[#171717]"
                    : "border-gray-300 bg-white"
                    }`}
                >
                  <label className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                    Call Time
                  </label>
                  <input
                    type="text"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                  />
                </div>

                {/* Expected End Time */}
                <div
                  className={`relative rounded-xl border ${isDark
                    ? "border-white/20 bg-[#171717]"
                    : "border-gray-300 bg-white"
                    }`}
                >
                  <label className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                    Expected End Time / Duration
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                  />
                </div>
              </div>
            </div>

            {/* Accordion / Clause Sections */}
            {/* Section Accordions */}
            <div className="flex flex-col gap-4">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`border rounded-2xl overflow-hidden transition-colors ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}
                >
                  {/* Section Header */}
                  <div
                    onClick={() => toggleSection(section.id)}
                    className={`p-4 lg:px-5 flex items-center justify-between cursor-pointer select-none ${section.isExpanded
                      ? isDark
                        ? "border-b border-[#323232]"
                        : "border-b border-[#E5E5E5]"
                      : ""
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical
                        size={16}
                        className={isDark ? "text-[#6E6E6B]" : "text-black/30"}
                      />
                      <span className={`text-xs font-medium mr-2 ${isDark ? "text-[#E8D1AB]" : "text-black/60"}`}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                          {section.title || "Untitled Section"}
                        </p>
                        {!section.isExpanded && section.content && (
                          <p className={`text-xs truncate max-w-xs md:max-w-md ${isDark ? "text-[#737373]" : "text-black/40"}`}>
                            {section.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/60"}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className={`transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/60"}`}
                      >
                        {section.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Section Body (Editor) */}
                  {section.isExpanded && (
                    <div className="p-4 lg:p-6 space-y-4">
                      {/* Section Title */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-[#A8A8A6]" : "text-black/60"}`}>
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none ${isDark
                            ? "bg-[#111110] border-[#252523] text-[#E8E8E7]"
                            : "bg-[#F8F8F8] border-gray-200 text-black"
                            }`}
                        />
                      </div>
                      {/* Rich Editor Toolbar */}
                      <div className={`flex items-center gap-1 w-full px-4 py-3 rounded-md border text-sm focus:outline-none ${isDark
                        ? "bg-[#111110] border-[#252523] text-[#E8E8E7]"
                        : "bg-[#F8F8F8] border-gray-200 text-black"
                        }`}>
                        <button
                          type="button"
                          className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"}`}
                        >
                          <Bold size={14} />
                        </button>
                        <button
                          type="button"
                          className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"}`}
                        >
                          <Italic size={14} />
                        </button>
                        <button
                          type="button"
                          className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"
                            }`}
                        >
                          <List size={14} />
                        </button>
                        <button
                          type="button"
                          className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"
                            }`}
                        >
                          <ListOrdered size={14} />
                        </button>
                        <button
                          type="button"
                          className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"
                            }`}
                        >
                          <Link size={14} />
                        </button>
                      </div>

                      <div className={`border rounded-md overflow-hidden ${isDark
                        ? "bg-[#111110] border-[#252523] text-[#E8E8E7]"
                        : "bg-[#F8F8F8] border-gray-200 text-black"
                        }`}>
                        {/* Content Field */}
                        <textarea
                          rows={4}
                          value={section.content}
                          onChange={(e) => updateSectionContent(section.id, e.target.value)}
                          placeholder="Write section content here..."
                          className={`w-full p-4 bg-transparent text-sm focus:outline-none resize-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-gray-400"}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Information Notice Bar */}
            <div
              className={`border rounded-xl p-3 flex items-center gap-3 text-sm ${isDark ? "bg-[#20201F] border-[#20201F] text-[#FFDE96]" : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="24" viewBox="0 0 26 24" fill="none">
                <path d="M12.7852 17V11" stroke="#FFDE96" strokeLinecap="round" />
                <ellipse cx="1.06536" cy="1" rx="1.06536" ry="1" transform="matrix(1 0 0 -1 11.7188 9)" fill="#FFDE96" />
                <path d="M2.13086 12C2.13086 7.28595 2.13086 4.92893 3.69104 3.46447C5.25123 2 7.7623 2 12.7845 2C17.8066 2 20.3177 2 21.8779 3.46447C23.438 4.92893 23.438 7.28595 23.438 12C23.438 16.714 23.438 19.0711 21.8779 20.5355C20.3177 22 17.8066 22 12.7845 22C7.7623 22 5.25123 22 3.69104 20.5355C2.13086 19.0711 2.13086 16.714 2.13086 12Z" stroke="#FFDE96" />
              </svg>
              <span>The system automatically generates: <span>Beige Sheet Version: v1.0</span></span>
            </div>

            {/* Navigation Action Buttons (Desktop) */}
            <div className="hidden lg:flex items-center gap-4 pt-4">
              <Button
                onClick={handlePreviousStep}
                className={`h-18 px-12 rounded-lg border text-xl font-medium transition-colors bg-transparent ${isDark
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-black/20 text-black hover:bg-black/5"
                  }`}
              >
                Back
              </Button>

              <Button
                onClick={handleNextStep}
                className="h-18 px-12 rounded-lg text-xl font-medium bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] transition-colors"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW AGREEMENT */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h1 className={`text-xl lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
                  Review Agreement — {reviewCP.name}
                </h1>
                <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>
                  <span className="text-[#E8D1AB]"> Agreement {reviewCpIndex + 1} of {CP_LIST.length}</span> - {reviewCP.role} - {reviewCP.assignCode} - v1.0
                </p>
              </div>

              <Button
                onClick={() => setIsSendDialogOpen(true)}
                className="bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-12 px-5 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Send size={14} />
                Send Agreement To CP
              </Button>
            </div>

            {/* CP Selector Tabs */}
            <div className="flex items-center gap-3">
              {CP_LIST.map((cp, idx) => {
                const isActive = reviewCpIndex === idx;
                return (
                  <button
                    key={cp.id}
                    onClick={() => setReviewCpIndex(idx)}
                    className={`flex items-center gap-2.5 p-2 pr-5 rounded-full border transition-all ${isActive
                      ? "border-[#E8D1AB]/25 bg-[#E8D1AB]/15 text-[#E8D1AB]"
                      : isDark
                        ? "border-[#272727] bg-[#1C1C1C] text-[#525250] hover:border-white/20"
                        : "border-black/10 bg-white text-black/50 hover:border-black/20"
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm lg:text-base font-medium ${isActive ? "bg-[#E8D1AB] text-black " : "bg-[#2D2D2D] text-[#A8A8A6] "}`}>
                      {cp.initials}
                    </div>
                    <span className="text-sm lg:text-base">{cp.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Review Card Paper Sheet */}
            <div className={`border rounded-2xl overflow-hidden ${isDark ? "bg-[#0E0E0D] border-[#1E1E1C]" : "bg-white border-[#E2E8F0]"}`}>
              {/* Header Badge */}
              <div className={`p-6 lg:py-8 lg:px-10 space-y-2 lg:space-y-5 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#E8D1AB] rounded-full inline-block" />
                  <span className="text-xs tracking-wider uppercase font-medium text-[#E8D1AB]">
                    INDIVIDUAL SHOOT AGREEMENT · BEIGE SHEET
                  </span>
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl">
                    Lana Guzman — {reviewCP.projectName}
                  </h2>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-[#737370]" : "text-black/50"}`}>
                    {reviewCP.name} · {reviewCP.role}
                  </p>
                </div>
              </div>

              {/* Project Information Section */}
              <div className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
                <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
                  Project Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 text-sm lg:text-base">
                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Project Name</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{reviewCP.projectName}</div>

                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Project ID</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{reviewCP.projectId}</div>

                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Assignment ID</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{reviewCP.assignmentId}</div>

                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Creative Partner</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{reviewCP.name}</div>

                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Role</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{reviewCP.role}</div>
                </div>
              </div>

              {/* Production Details Section */}
              <div className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
                <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
                  Production Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 text-sm lg:text-base">
                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Production Date</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                    {productionDate ? productionDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "15 September, 2026"}
                  </div>

                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Location</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{location}</div>

                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Call Time</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{callTime}</div>

                  <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Expected End Time / Duration</div>
                  <div className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{endTime}</div>
                </div>
              </div>

              {/* Commercial Information */}
              <div className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
                <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
                  Commercial Information
                </h3>
                <div className="flex justify-between items-center text-sm lg:text-base">
                  <span className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>Compensation</span>
                  <span className="font-semibold text-[#E8D1AB]">{reviewCP.compensation}</span>
                </div>
              </div>

              {/* Scope & Dynamic Clauses */}
              {sections.map((sec) => (
                <div key={sec.id} className={`p-6 lg:p-10 space-y-2 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
                  <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
                    {sec.title}
                  </h3>
                  <p className={`text-sm lg:text-base ${isDark ? "text-[#7B7B7B]" : "text-black/80"}`}>
                    {sec.content}
                  </p>
                </div>
              ))}

              {/* Footer Banner Statement */}
              <div className="bg-[#E8D1AB] border-y border-[#E8D1AB] p-4 lg:px-10 lg:py-5 text-xs text-[#3A3A38]">
                This Shoot Assignment Agreement is issued under the Beige Creative Partner Agreement. By accepting, the Creative Partner confirms their ability to perform the assignment as described and agrees to the terms herein and the governing Beige Creative Partner Agreement. Both parties acknowledge that acceptance creates a binding commitment for the specified production.
              </div>

              <div className="p-6 lg:p-10 flex items-center gap-6 text-xs lg:text-sm">
                <div>
                  <span className="text-[#E8D1AB]">Beige Sheet Version</span>
                  <p className={`font-semibold text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>v1.0</p>
                </div>
                <div>
                  <span className="text-[#E8D1AB]">Created</span>
                  <p className={`font-semibold text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>15 Sep 2026, 12:20 PM</p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={handlePreviousStep}
                className={`h-12 lg:h-18 lg:min-w-50 rounded-xl border text-sm lg:text-xl font-medium bg-transparent ${isDark ? "border-white/20 text-white" : "border-black/20 text-black"}`}
              >
                Back
              </Button>

              <Button
                onClick={() => router.push("/admin/agreements")}
                className="h-12 lg:h-18 lg:min-w-50 rounded-xl border text-sm lg:text-xl font-medium bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] transition-colors"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Floating Mobile Sticky Action Bar */}
        <div className={`lg:hidden fixed flex flex-wrap gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={handlePreviousStep}
            className={`flex-1 h-12 rounded-xl border text-sm font-medium bg-transparent ${isDark ? "border-white/20 text-white" : "border-black/20 text-black"}`}
          >
            Back
          </Button>

          <Button
            onClick={handleNextStep}
            className="flex-[2] h-12 rounded-xl text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]"
          >
            {currentStep === 1
              ? "Continue"
              : currentStep === 2 && selectedMode === "individual" && activeCpIndex < CP_LIST.length - 1
                ? "Next CP"
                : currentStep === 2
                  ? "Review"
                  : "Send Agreement"}
          </Button>
        </div>
      </div>

      <SendAgreementModal
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onSubmit={() => {
          setIsSendDialogOpen(false);
          setIsSuccessOpen(true)
          console.log("Agreements sent successfully");
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