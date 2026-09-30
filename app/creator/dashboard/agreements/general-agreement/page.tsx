"use client";

import React, { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";

interface AgreementPageProps {
  onBack?: () => void;
  onAccept?: () => void;
  isDark?: boolean;
}

export default function AgreementPage({
  onBack,
  onAccept,
  isDark = true,
}: AgreementPageProps) {
  const pathname = usePathname();
  const [isChecked, setIsChecked] = useState(false);

  return (
    <>
      <Topbar pathname={pathname} />
      <div className={`min-h-screen w-full px-4 py-6 md:px-8 lg:px-12 ${isDark ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        <div className="mx-auto max-w-5xl space-y-4">
          {/* Top Navigation / Back Button */}
          <div>
            <button
              onClick={onBack}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDark
                ? "text-gray-300 hover:text-white"
                : "text-gray-600 hover:text-black"
                }`}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          </div>

          {/* Document Body Card */}
          <div
            className={`rounded-2xl border ${isDark
              ? "border-[#3D3D3D] bg-[#171717] text-white/70"
              : "border-gray-200 bg-white text-gray-700"
              }`}
          >
            {/* Header Section */}
            <div className={`flex flex-col gap-4 border-b p-5 lg:px-9 lg:py-7 sm:flex-row sm:items-start sm:justify-between rounded-t-2xl ${isDark ? "bg-[#202020] border-[#3D3D3D]" : "border-gray-200 bg-black/10"}`}>
              <div className="space-y-1">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#D8CCBA]">
                  General Agreement
                </span>
                <h1 className={`text-xl lg:text-3xl ${isDark ? "text-white" : "text-black"}`}>
                  BEIGE CREATIVE PARTNER AGREEMENT
                </h1>
              </div>

              <div className="flex flex-col items-start gap-1 sm:items-end">
                <span className="rounded-lg bg-[#E8D1AB] px-3 py-1 text-xs font-medium text-black">
                  Version 1.0
                </span>
                <span className={`text-[10px] ${isDark ? "text-white" : "text-black"}`}>
                  Effective September 1, 2026
                </span>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-5 lg:p-8 space-y-4 lg:space-y-8 text-sm leading-relaxed lg:text-base">
              <div className="space-y-3 lg:space-y-5">
                <p>
                  This Creative Partner Agreement (the “Agreement”) governs participation as a creative professional on the Beige platform and the performance of photography, videography, production, post-production, livestreaming, editing, audio, and other creative or production services arranged through Beige.
                </p>

                <p>
                  This Agreement is between <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>Beige Corporation, a Delaware corporation (“Beige,” “we,” “us,” or “our”), and the individual or entity accepting this Agreement (“Creative Partner,” “you,” or “your”).</span>
                </p>

                <p>
                  By creating a Creative Partner account and affirmatively accepting this Agreement, you acknowledge that you have read, understood, and agree to be bound by it.
                </p>
              </div>

              <hr className={isDark ? "border-[#FFFFFF]/60" : "border-black/30"} />

              {/* Section 1 */}
              <div className="space-y-3 lg:space-y-5">
                <h2 className="text-base lg:text-xl font-medium text-[#E8D1AB] lg:text-lg">
                  1. Creative Partner Relationship
                </h2>
                <p>
                  Beige operates a technology platform and production network through which independent creative professionals may receive opportunities to provide services for Beige and Beige clients
                </p>
                <p>
                  You participate as an independent contractor and not as an employee, agent, partner, joint venturer, or representative of Beige.
                </p>
                <p>
                  Subject to applicable law, you are responsible for your own taxes, equipment, business expenses, licenses, registrations, insurance, and other obligations associated with operating as an independent professional.
                </p>
                <p>
                  Nothing in this Agreement guarantees any minimum number of assignments, minimum compensation, minimum hours, or continuing relationship with Beige.
                </p>
                <p>
                  Except as expressly authorized by Beige in writing, you have no authority to enter into agreements, modify project terms, provide refunds or credits, make commitments, incur obligations, or otherwise bind Beige.
                </p>
              </div>

              <hr className={isDark ? "border-[#FFFFFF]/60" : "border-black/30"} />

              {/* Section 2 */}
              <div className="space-y-3 lg:space-y-5">
                <h2 className="text-base  lg:text-xl font-medium text-[#E8D1AB] lg:text-lg">
                  2. Project Assignments and Beige Sheets
                </h2>
                <p>
                  Beige may offer individual projects or assignments to you from
                  time to time (each, an “Assignment”).
                </p>
                <p>
                  Each Assignment will be documented through a digital project assignment, production sheet, deal sheet, booking record, or similar electronic record issued through Beige (a “Beige Sheet”).
                </p>
                <p className="font-medium text-white">A Beige Sheet may include:</p>
                <div className="space-y-1">

                  <ul className="list-inside list-disc space-y-1 pl-2 text-[#999999]">
                    <li>Project name and identification number;</li>
                    <li>Role;</li>
                    <li>Production date;</li>
                    <li>Location;</li>
                    <li>Call time;</li>
                    <li>Anticipated end time or duration;</li>
                    <li>Compensation;</li>
                    <li>Scope of services;</li>
                    <li>Equipment requirements;</li>
                    <li>Production requirements;</li>
                    <li>Deliverables and media-transfer requirements;</li>
                    <li>Approved expenses or travel arrangements;</li>
                    <li>Special instructions; and</li>
                    <li>Other project-specific terms.</li>
                  </ul>
                </div>

                <p>You may accept or decline an offered Assignment</p>
                <p>
                  You are not obligated to perform an Assignment merely because
                  it is offered to you
                </p>

                <h3 className="font-medium text-[#E8D1AB]">Acceptance</h3>
                <p>
                  When you select “Accept Assignment,” “Accept,” “Confirm,” or
                  another electronic acceptance mechanism associated with a
                  Beige Sheet, you enter into a binding commitment to perform
                  that Assignment according to the Beige Sheet and this
                  Agreement.
                </p>
                <p>
                  Every accepted Beige Sheet is incorporated into and forms part
                  of this Agreement.
                </p>
                <p>
                  If an accepted Beige Sheet conflicts with this Agreement
                  regarding a project-specific business term, including
                  compensation, date, location, hours, equipment, or scope, the
                  Beige Sheet controls solely with respect to that
                  project-specific term.
                </p>
                <p>This Agreement otherwise controls.</p>
              </div>
            </div>
          </div>

          {/* Bottom Acceptance Card */}
          <div
            className={`rounded-2xl border p-6 space-y-5 ${isDark
              ? "border-[#3D3D3D] bg-[#171717]"
              : "border-gray-200 bg-white"
              }`}
          >
            <p className={`text-sm font-semibold uppercase ${isDark ? "text-white" : "text-black"}`}>
              PLEASE REVIEW AND ACCEPT BEIGE'S CREATIVE PARTNER AGREEMENT TO
              START RECEIVING AND WORKING ON ASSIGNMENTS.
            </p>

            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setIsChecked(!isChecked)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${isChecked
                  ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                  : isDark
                    ? "border-[#333333] bg-[#111111] group-hover:border-[#555555]"
                    : "border-gray-300 bg-white group-hover:border-gray-400"
                  }`}
              >
                {isChecked && <Check size={14} strokeWidth={3} />}
              </div>
              <span className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-gray-700"}`}>
                I have read and agree to the terms and conditions
              </span>
            </label>

            <button
              onClick={onAccept}
              disabled={!isChecked}
              className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${isChecked
                ? "bg-[#E8D1AB] text-black hover:bg-[#dfc8a0] active:scale-[0.99]"
                : isDark
                  ? "bg-[#25231F] text-[#6B6355] cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}