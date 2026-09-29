"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DatePickerFloating } from "@/components/admin/DatePickerFloating";
import {
  GripVertical,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  ArrowLeft,
} from "lucide-react";
import { CPDetail, AgreementCreationMode } from "./Step1AgreementTypeSelection";

export interface ClauseSection {
  id: string;
  num: string;
  title: string;
  subtitle?: string;
  content: string;
  isExpanded: boolean;
}

interface Step2AgreementDetailsProps {
  isDark: boolean;
  selectedMode: AgreementCreationMode;
  currentCP: CPDetail;
  allCPs?: CPDetail[];
  productionDate: Date | null;
  setProductionDate: (date: Date | null) => void;
  location: string;
  setLocation: (val: string) => void;
  callTime: string;
  setCallTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  sections: ClauseSection[];
  toggleSection: (id: string) => void;
  updateSectionTitle: (id: string, title: string) => void;
  updateSectionContent: (id: string, content: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function Step2AgreementDetails({
  isDark,
  selectedMode,
  currentCP,
  allCPs = [],
  productionDate,
  setProductionDate,
  location,
  setLocation,
  callTime,
  setCallTime,
  endTime,
  setEndTime,
  sections,
  toggleSection,
  updateSectionTitle,
  updateSectionContent,
  onNext,
  onPrevious,
}: Step2AgreementDetailsProps) {
  const isCommon = selectedMode === "common";

  // Fallback recipient list for common mode if allCPs is empty
  const cpList =
    allCPs.length > 0
      ? allCPs
      : [
        {
          id: "1",
          name: "Ethan Cole",
          role: "Lead Photographer",
          initials: "EC",
          compensation: "$6,250",
          projectName: "Wedding Videography",
          projectId: "PRJ-1024",
          assignmentId: "ASN-2012",
          assignCode: "ASN-2012",
        },
        {
          id: "2",
          name: "Michael Chen",
          role: "Videographer",
          initials: "MC",
          compensation: "$6,250",
          projectName: "Wedding Videography",
          projectId: "PRJ-1024",
          assignmentId: "ASN-2012",
          assignCode: "ASN-2012",
        },
      ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className={`text-lg lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
            {isCommon ? (
              "Create Common Shoot Agreement"
            ) : (
              <>
                Agreement for {currentCP.name}{" "}
                <span className="text-[#E8D1AB] font-normal">
                  (Individual Agreement)
                </span>
              </>
            )}
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
            {isCommon
              ? "Create one agreement to be shared with the selected creative partners."
              : `${currentCP.role} • ${currentCP.assignCode}`}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => console.log("Auto Generated Version")}
          className="flex-0 w-full lg:w-auto bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-10 px-5 rounded-lg font-semibold text-xs transition-all shrink-0"
        >
          Version v1.0 (auto-generated)
        </Button>
      </div>

      {/* Common Mode Specific Cards */}
      {isCommon ? (
        <>
          {/* Agreement Recipients Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-5 lg:p-9 text-base lg:text-xl font-medium rounded-2xl ${isDark ? "bg-[#090909] text-white" : "bg-[#E2E8F0]/40 text-black"}`}>
              Agreement Recipients
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="p-5 lg:p-9 flex flex-wrap items-center gap-6">
              {cpList.map((cp) => (
                <div key={cp.id} className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium border ${isDark
                      ? "bg-[#1E1E1C] text-[#A8A8A6] border-[#2A2A28]"
                      : "bg-[#F0F0F0] text-black/80"
                      }`}
                  >
                    {cp.initials}
                  </div>
                  <p className={`text-sm lg:text-base font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                    {cp.name}{" "}
                    <span className={`ml-4 ${isDark ? "text-[#E8D1AB]" : "text-black/50"}`}>
                      {cp.role}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Project Detail Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-9 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Project Detail
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="p-4 lg:p-9 space-y-3 text-xs lg:text-sm">
              <div
                className={`flex flex-wrap items-center gap-5 ${isDark ? "text-[#AAA7A7]" : "text-black/60"
                  }`}
              >
                <p>
                  Project Name :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {cpList[0]?.projectName || "Wedding Videography"}
                  </span>
                </p>
                <span>|</span>
                <p>
                  Project ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {cpList[0]?.projectId || "PRJ-1024"}
                  </span>
                </p>
                <span>|</span>
                <p>
                  Assignment ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {cpList[0]?.assignmentId || "ASN-2012"}
                  </span>
                </p>
              </div>
              <p className={isDark ? "text-[#AAA7A7]" : "text-black/60"}>
                Creative Partner :{" "}
                <span className={isDark ? "text-[#E8D1AB]" : "text-black"}>
                  {cpList.map((cp, index) => (
                    <React.Fragment key={cp.id || index}>
                      <span>{cp.name}</span>
                      <span className={isDark ? "text-white/60" : "text-gray-500"}>
                        {` (${cp.role})`}
                      </span>
                      {index < cpList.length - 1 && (
                        <span className={isDark ? "text-white/60" : "text-gray-500"}>, </span>
                      )}
                    </React.Fragment>
                  ))}
                </span>
              </p>
            </div>
          </div>

          {/* Compensation Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-9 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Compensation
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="p-4 lg:p-9 space-y-4">
              {cpList.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium ${isDark
                        ? "bg-[#1E1E1C] text-[#A8A8A6]"
                        : "bg-[#F0F0F0] text-black/80"
                        }`}
                    >
                      {cp.initials}
                    </div>
                    <span className={`text-sm lg:text-base font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                      {cp.name}
                    </span>
                  </div>

                  <div className="bg-[#E8D1AB] text-[#171717] px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5">
                    <span className="text-base font-semibold">{cp.compensation}</span>
                    <span className="text-[#171717]/60">Compensation</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
        /* Individual Mode Project Detail Card */
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-8 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Project Detail
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="p-4 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className={`w-14 h-14 lg:w-21 lg:h-21 rounded-2xl flex items-center justify-center font-semibold text-lg lg:text-3xl shrink-0 ${isDark
                  ? "bg-[#363434] text-[#E8D1AB]"
                  : "bg-[#E0E0E0] text-black/80"
                  }`}
              >
                {currentCP.initials}
              </div>
              <div className="space-y-1.5 lg:space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className={`text-lg lg:text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {currentCP.name} ({currentCP.role})
                  </h3>
                  <div className="bg-[#E8D1AB] text-black px-4 py-1 rounded-full text-xs flex items-center gap-1">
                    <span className="font-semibold text-sm">
                      {currentCP.compensation}
                    </span>
                    <span className="opacity-70">Total Compensation</span>
                  </div>
                </div>

                <div
                  className={`flex gap-4 text-xs lg:text-sm ${isDark ? "text-[#AAA7A7]" : "text-black/60"
                    }`}
                >
                  <p>
                    Project Name :{" "}
                    <span className={isDark ? "text-white" : "text-black"}>
                      {currentCP.projectName}
                    </span>
                  </p>
                  |
                  <p>
                    Project ID :{" "}
                    <span className={isDark ? "text-white" : "text-black"}>
                      {currentCP.projectId}
                    </span>
                  </p>
                  |
                  <p>
                    Assignment ID :{" "}
                    <span className={isDark ? "text-white" : "text-black"}>
                      {currentCP.assignmentId}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Production Information Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-8 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Production Information
            </h2>
            <div
              className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`}
            />
            <div className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-10">
              <DatePickerFloating
                selectedDate={productionDate}
                onDateChange={setProductionDate}
                width="w-full"
                classnames={`pointer-none w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] relative rounded-xl border ${isDark
                  ? "text-white placeholder:text-white/20"
                  : "text-black placeholder:text-gray-400"
                  }`}
                labelClasses={`${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"
                  } text-sm lg:text-base z-10 px-2`}
                label="Production Date"
              />

              <div
                className={`relative rounded-xl border ${isDark
                  ? "border-white/20 bg-[#171717]"
                  : "border-gray-300 bg-white"
                  }`}
              >
                <label
                  className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"
                    }`}
                >
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. General Terms of Service"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark
                    ? "text-white placeholder:text-white/20"
                    : "text-black placeholder:text-gray-400"
                    }`}
                />
              </div>

              <div
                className={`relative rounded-xl border ${isDark
                  ? "border-white/20 bg-[#171717]"
                  : "border-gray-300 bg-white"
                  }`}
              >
                <label
                  className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"
                    }`}
                >
                  Call Time
                </label>
                <input
                  type="text"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark
                    ? "text-white placeholder:text-white/20"
                    : "text-black placeholder:text-gray-400"
                    }`}
                />
              </div>

              <div
                className={`relative rounded-xl border ${isDark
                  ? "border-white/20 bg-[#171717]"
                  : "border-gray-300 bg-white"
                  }`}
              >
                <label
                  className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"
                    }`}
                >
                  Expected End Time / Duration
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark
                    ? "text-white placeholder:text-white/20"
                    : "text-black placeholder:text-gray-400"
                    }`}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Section Accordions */}
      <div className="flex flex-col gap-4">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className={`border rounded-2xl overflow-hidden transition-colors ${isDark
              ? "bg-[#171717] border-[#3D3D3D]"
              : "bg-white border-[#E5E5E5]"
              }`}
          >
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
                <span
                  className={`text-xs font-medium mr-2 ${isDark ? "text-[#E8D1AB]" : "text-black/60"
                    }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div>
                  <p
                    className={`text-sm font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"
                      }`}
                  >
                    {section.title || "Untitled Section"}
                  </p>
                  {!section.isExpanded && section.content && (
                    <p
                      className={`text-xs truncate max-w-xs md:max-w-md ${isDark ? "text-[#737373]" : "text-black/40"}`}
                    >
                      {section.content}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={`transition-colors ${isDark
                    ? "text-white hover:text-white/60"
                    : "text-black/60"
                    }`}
                >
                  <MoreHorizontal size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`transition-colors ${isDark
                    ? "text-white hover:text-white/60"
                    : "text-black/60"
                    }`}
                >
                  {section.isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
              </div>
            </div>

            {section.isExpanded && (
              <div className="p-4 lg:p-6 space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1.5 ${isDark ? "text-[#A8A8A6]" : "text-black/60"
                      }`}
                  >
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      updateSectionTitle(section.id, e.target.value)
                    }
                    className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none ${isDark
                      ? "bg-[#111110] border-[#3D3D3D] text-[#E8E8E7]"
                      : "bg-[#F8F8F8] border-gray-200 text-black"
                      }`}
                  />
                </div>

                <div
                  className={`flex items-center gap-1 w-full px-4 py-3 rounded-md border text-sm focus:outline-none ${isDark
                    ? "bg-[#111110] border-[#3D3D3D] text-[#E8E8E7]"
                    : "bg-[#F8F8F8] border-gray-200 text-black"
                    }`}
                >
                  <button
                    type="button"
                    className={`py-0.5 px-2 rounded transition-colors ${isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/5 text-black/70"
                      }`}
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    className={`py-0.5 px-2 rounded transition-colors ${isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/5 text-black/70"
                      }`}
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    className={`py-0.5 px-2 rounded transition-colors ${isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/5 text-black/70"
                      }`}
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    className={`py-0.5 px-2 rounded transition-colors ${isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/5 text-black/70"
                      }`}
                  >
                    <ListOrdered size={14} />
                  </button>
                  <button
                    type="button"
                    className={`py-0.5 px-2 rounded transition-colors ${isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/5 text-black/70"
                      }`}
                  >
                    <Link size={14} />
                  </button>
                </div>

                <div
                  className={`border rounded-md overflow-hidden ${isDark
                    ? "bg-[#111110] border-[#3D3D3D] text-[#E8E8E7]"
                    : "bg-[#F8F8F8] border-gray-200 text-black"
                    }`}
                >
                  <textarea
                    rows={4}
                    value={section.content}
                    onChange={(e) =>
                      updateSectionContent(section.id, e.target.value)
                    }
                    placeholder="Write section content here..."
                    className={`w-full p-4 bg-transparent text-sm focus:outline-none resize-none ${isDark
                      ? "text-white placeholder:text-white/30"
                      : "text-black placeholder:text-gray-400"
                      }`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Information Notice Bar */}
      <div
        className={`border rounded-xl p-3 flex items-center gap-3 text-sm ${isDark
          ? "bg-[#20201F] border-[#20201F] text-[#FFDE96]"
          : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"
          }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="24"
          viewBox="0 0 26 24"
          fill="none"
          className="shrink-0"
        >
          <path d="M12.7852 17V11" stroke="#FFDE96" strokeLinecap="round" />
          <ellipse
            cx="1.06536"
            cy="1"
            rx="1.06536"
            ry="1"
            transform="matrix(1 0 0 -1 11.7188 9)"
            fill="#FFDE96"
          />
          <path
            d="M2.13086 12C2.13086 7.28595 2.13086 4.92893 3.69104 3.46447C5.25123 2 7.7623 2 12.7845 2C17.8066 2 20.3177 2 21.8779 3.46447C23.438 4.92893 23.438 7.28595 23.438 12C23.438 16.714 23.438 19.0711 21.8779 20.5355C20.3177 22 17.8066 22 12.7845 22C7.7623 22 5.25123 22 3.69104 20.5355C2.13086 19.0711 2.13086 16.714 2.13086 12Z"
            stroke="#FFDE96"
          />
        </svg>
        <span>
          The system automatically generates:{" "}
          <span>Beige Sheet Version: v1.0</span>
        </span>
      </div>

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center gap-4 pt-4">
        <Button
          type="button"
          onClick={onPrevious}
          className={`h-18 px-12 rounded-lg border text-xl font-medium transition-colors bg-transparent ${isDark
            ? "border-white/20 text-white hover:bg-white/10"
            : "border-black/20 text-black hover:bg-black/5"
            }`}
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onNext}
          className="h-18 px-12 rounded-lg text-xl font-medium bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] transition-colors"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}