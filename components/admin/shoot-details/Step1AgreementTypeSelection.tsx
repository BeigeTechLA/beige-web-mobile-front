"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export type AgreementCreationMode = "individual" | "common";

export interface CPDetail {
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

interface Step1ModeSelectionProps {
  isDark: boolean;
  selectedMode: AgreementCreationMode;
  setSelectedMode: (mode: AgreementCreationMode) => void;
  cpList: CPDetail[];
  onNext: () => void;
  onPrevious: () => void;
}

export function Step1ModeSelection({
  isDark,
  selectedMode,
  setSelectedMode,
  cpList,
  onNext,
  onPrevious,
}: Step1ModeSelectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:justify-between lg:items-center">
        <div className="flex flex-col justify-between items-start w-full">
          <h1 className={`text-base lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
            Add Shoot Agreement
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
            Configure the Shoot Assignment Agreement
          </p>
        </div>

        <Button
          type="button"
          onClick={() => console.log("Version v1.0 (auto-generated)")}
          className="flex-0 w-full lg:w-auto bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-12 px-6 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
        >
          Version v1.0 (auto-generated)
        </Button>
      </div>

      {/* Agreement Creation Container */}
      <div
        className={`border rounded-2xl transition-colors ${isDark
          ? "bg-[#101010] border-[#3D3D3D]"
          : "bg-white border-[#E2E8F0]"
          }`}
      >
        <div
          className={`border-b rounded-t-2xl p-5 space-y-2 transition-colors ${isDark
            ? "bg-[#090909] border-[#3D3D3D]"
            : "bg-white border-[#E2E8F0]"
            }`}
        >
          <h2 className={`text-sm lg:text-base font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
            Agreement Creation
          </h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-[#747471]" : "text-black/60"}`}>
            Choose whether to create separate agreements or one common agreement
            for the selected CPs.
          </p>
        </div>

        {/* Radio Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {/* Individual Agreements Card */}
          <div
            onClick={() => setSelectedMode("individual")}
            className={`border rounded-lg lg:rounded-xl p-4 cursor-pointer transition-all space-y-4 relative ${selectedMode === "individual"
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
                <span
                  className={`text-sm font-semibold ${selectedMode === "individual"
                    ? "text-[#E8D1AB]"
                    : isDark
                      ? "text-white"
                      : "text-black"
                    }`}
                >
                  Individual Agreements
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${selectedMode === "individual"
                  ? "bg-[#E8D1AB]/15 border-[#E8D1AB]/25 text-[#E8D1AB]"
                  : isDark
                    ? "bg-[#262525] border-[#252523] text-[#737370]"
                    : "bg-[#F3F4F6] border-[#E5E5E5] text-black/70"
                  }`}
              >
                Recommended
              </span>
            </div>

            <div className="space-y-1">
              <h4
                className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"
                  }`}
              >
                One agreement per CP
              </h4>
              <p
                className={`text-xs leading-relaxed ${isDark ? "text-[#747471]" : "text-black/50"
                  }`}
              >
                Create a separate agreement for each selected creative partner.
                Compensation, role, scope, and details can be managed individually.
              </p>
            </div>

            {/* Visual Diagram */}
            <div className="lg:pt-2 space-y-2.5">
              {cpList.map((cp, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium ${selectedMode === "individual"
                      ? "bg-[#E8D1AB] text-black"
                      : isDark
                        ? "bg-[#333] text-white"
                        : "bg-[#E0E0E0] text-black"
                      }`}
                  >
                    {cp.initials}
                  </div>
                  <div
                    className={`h-[1px] flex-1 ${isDark ? "bg-[#282828]" : "bg-[#E0E0E0]"
                      }`}
                  />
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
            className={`border rounded-lg lg:rounded-xl p-4 cursor-pointer transition-all space-y-4 relative ${selectedMode === "common"
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
                <span
                  className={`text-sm font-semibold ${selectedMode === "common"
                    ? "text-[#E8D1AB]"
                    : isDark
                      ? "text-white"
                      : "text-black"
                    }`}
                >
                  Common Agreement
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${selectedMode === "common"
                  ? "bg-[#E8D1AB]/15 border-[#E8D1AB]/25 text-[#E8D1AB]"
                  : isDark
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
                Create one agreement shared with all selected creative partners. Use
                this when the agreement terms are common to everyone.
              </p>
            </div>

            {/* Visual Diagram */}
            <div className="lg:pt-2">
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center -space-x-1.5">
                  <div className="flex items-center gap-0.5">
                    {cpList.map((cp, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium ${selectedMode === "common"
                            ? "bg-[#E8D1AB] text-black"
                            : isDark
                              ? "bg-[#333] text-white"
                              : "bg-[#E0E0E0] text-black"
                            }`}
                        >
                          {cp.initials}
                        </div>
                        {idx < cpList.length - 1 && (
                          <span className="text-[#E8D1AB] text-xs font-semibold px-0.5 select-none">
                            +
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div
                  className={`h-[1px] flex-1 ${isDark ? "bg-[#282828]" : "bg-[#E0E0E0]"
                    }`}
                />
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
          <div
            className={`border rounded-lg p-3.5 lg:px-5 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-1 lg:gap-6 text-sm ${isDark
              ? "bg-[#090909] border-[#1E1E1C]"
              : "bg-[#F9FAFB] border-[#E5E5E5]"
              }`}
          >
            <div>
              <span className={isDark ? "text-[#747471]" : "text-black/60"}>
                Mode:{" "}
              </span>
               <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {selectedMode === "individual"
                  ? "Individual Agreements"
                  : "Common Agreement"}
              </span>
            </div>
            <div>
              <span className={isDark ? "text-[#747471]" : "text-black/60"}>
                CPs:{" "}
              </span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {cpList.length}
              </span>
            </div>
            <div>
              <span className={isDark ? "text-[#747471]" : "text-black/60"}>
                Agreements to create:{" "}
              </span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {selectedMode === "individual" ? cpList.length : 1}
              </span>
            </div>
            <div>
              <span className={isDark ? "text-[#747471]" : "text-black/60"}>
                Acceptance:{" "}
              </span>
               <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {selectedMode === "individual"
                  ? "Each CP individually"
                  : "All CPs together"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="hidden lg:flex items-center gap-4 pt-2">
        <Button
          type="button"
          onClick={onPrevious}
          className={`h-12 px-8 rounded-xl border text-sm font-semibold transition-colors bg-transparent ${isDark
            ? "border-white/20 text-white hover:bg-white/10"
            : "border-black/20 text-black hover:bg-black/5"
            }`}
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onNext}
          className="h-12 px-8 rounded-xl text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] transition-colors"
        >
          Continue to Add Agreement
        </Button>
      </div>
    </div>
  );
}