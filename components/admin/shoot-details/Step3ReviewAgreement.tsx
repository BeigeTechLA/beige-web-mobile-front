"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { CPDetail } from "./Step1AgreementTypeSelection";
import { ClauseSection } from "./Step2AgreementDetails";

interface Step3ReviewAgreementProps {
  isDark: boolean;
  cpList: CPDetail[];
  reviewCpIndex: number;
  setReviewCpIndex: (idx: number) => void;
  productionDate: Date | null;
  location: string;
  callTime: string;
  endTime: string;
  sections: ClauseSection[];
  onOpenSendDialog: () => void;
  onPrevious: () => void;
  onSave: () => void;
}

export function Step3ReviewAgreement({
  isDark,
  cpList,
  reviewCpIndex,
  setReviewCpIndex,
  productionDate,
  location,
  callTime,
  endTime,
  sections,
  onOpenSendDialog,
  onPrevious,
  onSave,
}: Step3ReviewAgreementProps) {
  const reviewCP = cpList[reviewCpIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1
            className={`text-xl lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"
              }`}
          >
            Review Agreement — {reviewCP.name}
          </h1>
          <p
            className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"
              }`}
          >
            <span className="text-[#E8D1AB]">
              {" "}
              Agreement {reviewCpIndex + 1} of {cpList.length}
            </span>{" "}
            - {reviewCP.role} - {reviewCP.assignCode} - v1.0
          </p>
        </div>

        <Button
          type="button"
          onClick={onOpenSendDialog}
          className="bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-12 px-5 rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <Send size={14} />
          Send Agreement To CP
        </Button>
      </div>

      {/* CP Selector Tabs */}
      <div className="flex items-center gap-3">
        {cpList.map((cp, idx) => {
          const isActive = reviewCpIndex === idx;
          return (
            <button
              type="button"
              key={cp.id}
              onClick={() => setReviewCpIndex(idx)}
              className={`flex items-center gap-2.5 p-2 pr-5 rounded-full border transition-all ${isActive
                  ? "border-[#E8D1AB]/25 bg-[#E8D1AB]/15 text-[#E8D1AB]"
                  : isDark
                    ? "border-[#272727] bg-[#1C1C1C] text-[#525250] hover:border-white/20"
                    : "border-black/10 bg-white text-black/50 hover:border-black/20"
                }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm lg:text-base font-medium ${isActive
                    ? "bg-[#E8D1AB] text-black "
                    : "bg-[#2D2D2D] text-[#A8A8A6] "
                  }`}
              >
                {cp.initials}
              </div>
              <span className="text-sm lg:text-base">{cp.name}</span>
            </button>
          );
        })}
      </div>

      {/* Review Card Paper Sheet */}
      <div
        className={`border rounded-2xl overflow-hidden ${isDark
            ? "bg-[#0E0E0D] border-[#1E1E1C]"
            : "bg-white border-[#E2E8F0]"
          }`}
      >
        {/* Header Badge */}
        <div
          className={`p-6 lg:py-8 lg:px-10 space-y-2 lg:space-y-5 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"
            }`}
        >
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
            <p
              className={`text-xs lg:text-sm ${isDark ? "text-[#737370]" : "text-black/50"
                }`}
            >
              {reviewCP.name} · {reviewCP.role}
            </p>
          </div>
        </div>

        {/* Project Information Section */}
        <div
          className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"
            }`}
        >
          <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
            Project Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 text-sm lg:text-base">
            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Project Name
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {reviewCP.projectName}
            </div>

            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Project ID
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {reviewCP.projectId}
            </div>

            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Assignment ID
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {reviewCP.assignmentId}
            </div>

            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Creative Partner
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {reviewCP.name}
            </div>

            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Role
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {reviewCP.role}
            </div>
          </div>
        </div>

        {/* Production Details Section */}
        <div
          className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"
            }`}
        >
          <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
            Production Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 text-sm lg:text-base">
            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Production Date
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {productionDate
                ? productionDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : "15 September, 2026"}
            </div>

            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Location
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {location}
            </div>

            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Call Time
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {callTime}
            </div>

            <div className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Expected End Time / Duration
            </div>
            <div
              className={`md:text-right ${isDark ? "text-[#E8E8E7]" : "text-black"
                }`}
            >
              {endTime}
            </div>
          </div>
        </div>

        {/* Commercial Information */}
        <div
          className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"
            }`}
        >
          <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
            Commercial Information
          </h3>
          <div className="flex justify-between items-center text-sm lg:text-base">
            <span className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
              Compensation
            </span>
            <span className="font-semibold text-[#E8D1AB]">
              {reviewCP.compensation}
            </span>
          </div>
        </div>

        {/* Scope & Dynamic Clauses */}
        {sections.map((sec) => (
          <div
            key={sec.id}
            className={`p-6 lg:p-10 space-y-2 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"
              }`}
          >
            <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
              {sec.title}
            </h3>
            <p
              className={`text-sm lg:text-base ${isDark ? "text-[#7B7B7B]" : "text-black/80"
                }`}
            >
              {sec.content}
            </p>
          </div>
        ))}

        {/* Footer Statement */}
        <div className="bg-[#E8D1AB] border-y border-[#E8D1AB] p-4 lg:px-10 lg:py-5 text-xs text-[#3A3A38]">
          This Shoot Assignment Agreement is issued under the Beige Creative Partner
          Agreement. By accepting, the Creative Partner confirms their ability to perform
          the assignment as described and agrees to the terms herein and the governing
          Beige Creative Partner Agreement.
        </div>

        <div className="p-6 lg:p-10 flex items-center gap-6 text-xs lg:text-sm">
          <div>
            <span className="text-[#E8D1AB]">Beige Sheet Version</span>
            <p
              className={`font-semibold text-sm lg:text-base ${isDark ? "text-white" : "text-black"
                }`}
            >
              v1.0
            </p>
          </div>
          <div>
            <span className="text-[#E8D1AB]">Created</span>
            <p
              className={`font-semibold text-sm lg:text-base ${isDark ? "text-white" : "text-black"
                }`}
            >
              15 Sep 2026, 12:20 PM
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center gap-4 pt-4">
        <Button
          type="button"
          onClick={onPrevious}
          className={`h-12 lg:h-18 lg:min-w-50 rounded-xl border text-sm lg:text-xl font-medium bg-transparent ${isDark ? "border-white/20 text-white" : "border-black/20 text-black"
            }`}
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onSave}
          className="h-12 lg:h-18 lg:min-w-50 rounded-xl border text-sm lg:text-xl font-medium bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] transition-colors"
        >
          Save
        </Button>
      </div>
    </div>
  );
}