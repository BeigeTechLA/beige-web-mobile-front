"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Info, Send, Users } from "lucide-react";
import { CPDetail, AgreementCreationMode } from "./Step1AgreementTypeSelection";
import { ClauseSection } from "./Step2AgreementDetails";

interface Step3ReviewAgreementProps {
  isDark: boolean;
  selectedMode: AgreementCreationMode;
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
  selectedMode,
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
  const isCommon = selectedMode === "common";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        {
          isCommon ? <div>
            <h1 className={`text-xl lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
              Review Common Shoot Agreement
            </h1>
            <p className={`text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
              <span>
                {cpList.map((cp) => cp.name).join(" · ")}
              </span>
              {" - v1.0"}
            </p>
          </div> : <div>
            <h1 className={`text-xl lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
              Review Agreement — {reviewCP.name}
            </h1>
            <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>
              <span className="text-[#E8D1AB]">
                {" "}
                Agreement {reviewCpIndex + 1} of {cpList.length}
              </span>{" "}
              - {reviewCP.role} - {reviewCP.assignCode} - v1.0
            </p>
          </div>
        }

        <Button
          type="button"
          onClick={onOpenSendDialog}
          className="bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-12 px-5 rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <Send size={14} />
          Send Agreement To CP
        </Button>
      </div>

      {
        isCommon ? (
          <>
            <div className="flex items-center gap-3">
              <div
                className={`w-full rounded-2xl border p-4 transition-colors ${isDark
                  ? "bg-[#0E0E0D] border-[#1A1A19] text-white"
                  : "bg-white border-[#E2E8F0] text-black"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Users Icon Avatar Badge */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isDark
                      ? "border-[#E8D1AB]/20 bg-[#E8D1AB]/10 text-[#E8D1AB]"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                  >
                    <Users size={16} strokeWidth={1.5} />
                  </div>

                  {/* Content Section */}
                  <div className="space-y-1">
                    <div>
                      <h3 className={`text-sm lg:text-base font-semibold ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                        Common Shoot Agreement
                      </h3>

                      <p className={`text-xs lg:text-sm ${isDark ? "text-[#737370]" : "text-gray-500"}`}>
                        Agreement Version: v1.0 · {cpList.length} Recipients
                      </p>
                    </div>

                    <p className={`pt-1 text-xs lg:text-sm ${isDark ? "text-[#525250]" : "text-gray-400"}`}>
                      This agreement will be sent to all selected CPs. Each recipient must
                      accept individually.
                    </p>

                    {/* Recipient Chips */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-3">
                      {cpList.map((recipient) => (
                        <div
                          key={recipient.id}
                          className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-2.5 text-xs ${isDark
                            ? "border-[#252523] bg-[#141413] text-[#737370]"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                            }`}
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full font-medium ${isDark
                              ? "bg-[#1E1E1C] text-[#A8A8A6]"
                              : "bg-gray-200 text-gray-700"
                              }`}
                          >
                            {recipient.initials}
                          </div>
                          <span className={isDark ? "text-[#888888]" : "text-gray-700"}>
                            {recipient.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )
      }

      {/* Review Card Paper Sheet */}
      <div
        className={`border rounded-2xl overflow-hidden ${isDark
          ? "bg-[#0E0E0D] border-[#1E1E1C]"
          : "bg-white border-[#E2E8F0]"
          }`}
      >
        {/* Header Badge */}
        <div
          className={`p-6 lg:py-8 lg:px-10 space-y-2 lg:space-y-5 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}
        >
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-[#E8D1AB] rounded-full inline-block" />
            <span className="text-xs tracking-wider uppercase font-medium text-[#E8D1AB]">
              {isCommon ? "COMMON" : "INDIVIDUAL"}  SHOOT AGREEMENT · BEIGE SHEET
            </span>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl">
              {reviewCP.projectName}
            </h2>
            {!isCommon &&
              <p className={`text-xs lg:text-sm ${isDark ? "text-[#737370]" : "text-black/50"}`}>
                {reviewCP.name} · {reviewCP.role}
              </p>
            }
          </div>
        </div>

        {/* Project Information Section */}
        <div className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
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
        <div className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
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
        <div className={`p-6 lg:p-10 space-y-4 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}>
          <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
            Commercial Information
          </h3>
          {isCommon ? (
            <div className="space-y-2">
              {/* Table Container */}
              <div
                className={`overflow-hidden rounded-xl border ${isDark
                    ? "border-[#1A1A19] bg-[#111110]"
                    : "border-[#E5E7EB] bg-white"
                  }`}
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-xs tracking-wider uppercase ${isDark
                          ? "border-[#1A1A19] text-[#7E7E7E]"
                          : "border-[#E5E7EB] text-gray-500"
                        }`}
                    >
                      <th className="px-4 py-2.5 font-medium">Creative Partner</th>
                      <th className="px-4 py-2.5 font-medium">Role</th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        Compensation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs lg:text-sm">
                    {cpList?.map((cp, idx) => (
                      <tr
                        key={cp.id || idx}
                        className={`border-b last:border-b-0 ${isDark ? "border-[#1A1A1A]" : "border-[#F3F4F6]"}`}
                      >
                        <td className={`px-4 py-3 ${isDark ? "text-[#E8E8E7]" : "text-gray-900"}`}
                        >
                          {cp.name}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? "text-[#737370]" : "text-gray-500"}`}>
                          {cp.role}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${isDark ? "text-[#E8E8E7]" : "text-gray-900"}`}>
                          {cp.compensation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info Notice */}
              <div className="flex items-center gap-2 text-xs">
                <Info
                  size={14}
                  className={`shrink-0 ${isDark ? "text-[#E8D1AB]" : "text-gray-400"}`}
                />
                <span
                  className={isDark ? "text-[#E8D1AB]" : "text-gray-500"}
                >
                  Each creative partner's compensation is specified individually. All
                  recipients are reviewing the same agreement.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center text-sm lg:text-base">
              <span className={isDark ? "text-[#7B7B7B]" : "text-black/60"}>
                Compensation
              </span>
              <span className="font-semibold text-[#E8D1AB]">
                {reviewCP.compensation}
              </span>
            </div>
          )}
        </div>

        {/* Scope & Dynamic Clauses */}
        {
          sections.map((sec) => (
            <div
              key={sec.id}
              className={`p-6 lg:p-10 space-y-2 border-b ${isDark ? "border-[#1E1E1C]" : "border-[#E2E8F0]"}`}
            >
              <h3 className="text-xs lg:text-sm font-medium tracking-wider uppercase text-[#E8D1AB]">
                {sec.title}
              </h3>
              <p className={`text-sm lg:text-base ${isDark ? "text-[#7B7B7B]" : "text-black/80"}`}>
                {sec.content}
              </p>
            </div>
          ))
        }

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
            <p className={`font-semibold text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>
              v1.0
            </p>
          </div>
          <div>
            <span className="text-[#E8D1AB]">Created</span>
            <p className={`font-semibold text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>
              15 Sep 2026, 12:20 PM
            </p>
          </div>
        </div>
      </div >

      {/* Bottom Actions */}
      < div className="flex items-center gap-4 pt-4" >
        <Button
          type="button"
          onClick={onPrevious}
          className={`h-12 lg:h-18 lg:min-w-50 rounded-xl border text-sm lg:text-xl font-medium bg-transparent ${isDark ? "border-white/20 text-white" : "border-black/20 text-black"}`}
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
      </div >
    </div >
  );
}