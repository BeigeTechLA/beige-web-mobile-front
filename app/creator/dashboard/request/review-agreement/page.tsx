"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import SuccessModal from "@/components/creator-profile/AgreementAcceptedSuccess";

export default function AgreementReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Metadata State
  const agreementType = "SHOOT ASSIGNMENT AGREEMENT";
  const agreementTitle = "ABC Corporate Shoot";
  const version = "v1.0";
  const status = "Pending Acceptance";

  // Project Information
  const projectInfo = {
    projectName: "ABC Corporate Shoot",
    projectId: "PRJ-1024",
    assignmentId: "ASN-2012",
    creativePartner: "John Doe",
    role: "Photographer",
  };

  // Production Details
  const productionDetails = {
    productionDate: "15 September, 2026",
    location: "Los Angeles",
    callTime: "8:00 AM",
    expectedEndTime: "6:00 PM",
  };

  // Compensation
  const totalCompensation = "$2000.00";

  // Detailed Specifications
  const scopeOfServices =
    "Capture photography coverage for the corporate event, including event highlights and speaker sessions.";

  const equipmentRequirements =
    "Sony FX3 or equivalent cinema camera, prime lenses (24mm, 50mm, 85mm), tripod, gimbal stabilizer, audio recording equipment.";

  const deliverablesMediaTransfer =
    "Upload all raw media to the designated Beige folder within 24 hours of shoot completion.";

  const approvedExpensesTravel =
    "Travel to and from shoot location (up to $75 round trip). Parking at venue. No additional expenses without prior written approval.";

  const specialInstructions =
    "Client requires all crew to sign NDA upon arrival. Business casual attire. Shoot brief will be provided 48 hours before the production date.";

  const metaFooter = {
    beigeSheetVersion: "v1.0",
    createdDate: "15 Sep 2026, 12:20 PM",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-20 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"
          }`}
      >
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-2 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"
            }`}
          variant="ghost"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Document Card Container */}
        <div
          className={`border rounded-2xl transition-colors max-w-6xl mx-auto ${isDark
            ? "bg-[#171717] border-[#3D3D3D] text-[#D8D8D8]"
            : "bg-white border-[#E2E8F0] text-gray-800"
            }`}
        >
          {/* Header Metadata Section */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 lg:px-8 lg:py-7 rounded-t-2xl border-b ${isDark
            ? "bg-[#202020] border-[#3D3D3D] text-[#D8D8D8]"
            : "bg-white border-[#E2E8F0] text-gray-800"
            }`}>
            <div>
              <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? "text-[#D8CCBA]" : "text-gray-400"}`}>
                {agreementType}
              </p>
              <h1 className={`text-2xl lg:text-3xl uppercase ${isDark ? "text-white" : "text-black"}`}>
                {agreementTitle}
              </h1>
            </div>

            <div className="flex flex-col sm:items-end shrink-0 gap-1.5">
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium w-fit ${isDark ? "bg-[#282828] text-[#D8CCBA]" : "bg-gray-200 text-gray-700"}`}>
                {version}
              </span>

              <span className="shrink-0 flex gap-1 items-center rounded-full bg-[#FEF9EC] text-[#D68910] text-xs font-medium px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D68910]" />
                {status}
              </span>
            </div>
          </div>

          <div>
            {/* Project Information */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Project Information
              </h2>
              <div
                className={`flex flex-wrap items-center text-sm gap-y-2 gap-x-3 ${isDark ? "text-[#AAA7A7]" : "text-gray-700"
                  }`}
              >
                <p>
                  Project Name :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.projectName}
                  </span>
                </p>
                <p className={isDark ? "text-[#E0E0E0]" : "text-gray-300"}>
                  |
                </p>
                <p>
                  Project ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.projectId}
                  </span>
                </p>
                <p className={isDark ? "text-[#E0E0E0]" : "text-gray-300"}>
                  |
                </p>
                <p>
                  Assignment ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.assignmentId}
                  </span>
                </p>
                <p className={isDark ? "text-[#E0E0E0]" : "text-gray-300"}>
                  |
                </p>
                <p>
                  Creative Partner :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.creativePartner}
                  </span>
                </p>
                <p className={isDark ? "text-[#E0E0E0]" : "text-gray-300"}>
                  |
                </p>
                <p>
                  Role :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.role}
                  </span>
                </p>
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Production Details */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Production Details
              </h2>
              <div
                className={`flex flex-wrap items-center text-sm gap-y-2 gap-x-3 ${isDark ? "text-[#AAA7A7]" : "text-gray-700"
                  }`}
              >
                <p>
                  Production Date :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.productionDate}
                  </span>
                </p>
                <p className={isDark ? "text-[#E0E0E0]" : "text-gray-300"}>
                  |
                </p>
                <p>
                  Location :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.location}
                  </span>
                </p>
                <p className={isDark ? "text-[#E0E0E0]" : "text-gray-300"}>
                  |
                </p>
                <p>
                  Call Time :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.callTime}
                  </span>
                </p>
                <p className={isDark ? "text-[#E0E0E0]" : "text-gray-300"}>
                  |
                </p>
                <p>
                  Expected End Time / Duration :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.expectedEndTime}
                  </span>
                </p>
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Compensation */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Compensation
              </h2>
              <div
                className={`flex items-center justify-between rounded-xl border p-5 ${isDark
                    ? "bg-[#E8D1AB]/10 border-[#E8D1AB]"
                    : "bg-gray-50 border-gray-200"
                  }`}
              >
                <p className={`text-sm lg:text-base ${isDark ? "text-white" : "text-gray-700"}`}>
                  Total Compensation
                </p>
                <p className={`text-xl lg:text-2xl font-semibold tracking-tight ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                  {totalCompensation}
                </p>
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Scope of Services */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Scope of Services
              </h2>
              <div
                className={`rounded-xl border p-5 text-sm leading-relaxed ${isDark
                    ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
              >
                {scopeOfServices}
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Equipment Requirements */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Equipment Requirements
              </h2>
              <div
                className={`rounded-xl border p-5 text-sm leading-relaxed ${isDark
                    ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
              >
                {equipmentRequirements}
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Deliverables / Media Transfer */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Deliverables / Media Transfer
              </h2>
              <div
                className={`rounded-xl border p-5 text-sm leading-relaxed ${isDark
                    ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
              >
                {deliverablesMediaTransfer}
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Approved Expenses / Travel */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Approved Expenses / Travel
              </h2>
              <div
                className={`rounded-xl border p-5 text-sm leading-relaxed ${isDark
                    ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
              >
                {approvedExpensesTravel}
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Special Instructions & Meta Footer */}
            <div className="p-5 lg:p-9 space-y-4">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Special Instructions
              </h2>
              <div
                className={`rounded-xl border p-5 text-sm leading-relaxed ${isDark
                    ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
              >
                {specialInstructions}
              </div>

              <p
                className={`text-xs lg:text-sm leading-relaxed pt-2 ${isDark ? "text-[#9E9690]" : "text-gray-600"
                  }`}
              >
                This Shoot Assignment Agreement is issued under the Beige Creative
                Partner Agreement. By accepting, the Creative Partner confirms their
                ability to perform the assignment as described and agrees to the
                terms herein and the governing Beige Creative Partner Agreement. Both
                parties acknowledge that acceptance creates a binding commitment for
                the specified production.
              </p>

              <div className="flex items-center gap-8 pt-2">
                <div>
                  <p
                    className={`text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-gray-400"
                      }`}
                  >
                    Beige Sheet Version
                  </p>
                  <p
                    className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"
                      }`}
                  >
                    {metaFooter.beigeSheetVersion}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-gray-400"
                      }`}
                  >
                    Created
                  </p>
                  <p
                    className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"
                      }`}
                  >
                    {metaFooter.createdDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Assignment Acceptance Action Card */}
        <div
          className={`border rounded-2xl max-w-6xl mx-auto p-6 space-y-4 ${isDark
              ? "bg-[#171717] border-[#3d3d3d]"
              : "bg-white border-[#E2E8F0]"
            }`}
        >
          <p
            className={`text-xs lg:text-sm font-semibold tracking-wider uppercase ${isDark ? "text-[#E8D1AB]" : "text-gray-800"
              }`}
          >
            ASSIGNMENT ACCEPTANCE
          </p>

          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setIsChecked(!isChecked)}
              className={`flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded border transition-colors ${isChecked
                  ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                  : isDark
                    ? "border-[#3A3A3A] bg-[#1A1A1A] group-hover:border-[#555555]"
                    : "border-gray-300 bg-white group-hover:border-gray-400"
                }`}
            >
              {isChecked && <Check size={14} strokeWidth={3} />}
            </div>
            <p
              className={`text-xs lg:text-sm leading-relaxed ${isDark ? "text-white" : "text-gray-700"
                }`}
            >
              By selecting 'Accept Assignment,' I confirm that I have reviewed this Beige Sheet and agree to perform this Assignment according to its terms and the Beige Creative Partner Agreement. I understand that accepting this Assignment creates a binding project commitment.
            </p>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              disabled={!isChecked}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${isChecked
                  ? "bg-[#10B981] text-white hover:bg-[#0E6C38] active:scale-[0.99]"
                  : isDark
                    ? "bg-[#123E28] text-[#3D7C5D] cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              onClick={() => { setIsModalOpen(true) }}
            >
              Accept Assignment
            </button>
            <button
              className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${isDark
                  ? "bg-[#EF4444] text-white hover:bg-[#8F2B2B]"
                  : "bg-red-600 text-white hover:bg-red-700"
                }`}
            >
              Reject
            </button>
          </div>
        </div>

        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </>
  );
}