"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import DottedDivider from "@/components/admin/DottedDivider";

// Single Dummy Data Object
const AGREEMENT_DETAIL_DATA = {
  agreementType: "SHOOT ASSIGNMENT AGREEMENT",
  projectName: "ABC Corporate Shoot",
  projectId: "PRJ-1024",
  assignmentId: "ASN-2012",
  cpName: "John Doe",
  role: "Photographer",
  currentVersion: "v1.0",
  status: "Accepted",
  badgeType: "Common Agreement",
  compensation: 2000.0,
  productionDetails: {
    date: "15 September, 2026",
    location: "Los Angeles",
    callTime: "8:00 AM",
    expectedEndTime: "6:00 PM",
  },
  scopeOfServices:
    "Capture photography coverage for the corporate event, including event highlights and speaker sessions.",
  equipmentRequirements:
    "Sony FX3 or equivalent cinema camera, prime lenses (24mm, 50mm, 85mm), tripod, gimbal stabilizer, audio recording equipment.",
  deliverableRequirements:
    "Upload all raw media to the designated Beige folder within 24 hours of shoot completion.",
  approvedExpenses:
    "Travel to and from shoot location (up to $75 round trip). Parking at venue. No additional expenses without prior written approval.",
  specialInstructions:
    "Client requires all crew to sign NDA upon arrival. Business casual attire. Shoot brief will be provided 48 hours before the production date.",
  versionHistory: [
    {
      version: "v1.0",
      status: "Accepted",
      date: "15 Sep 2026, 10:32 AM",
      compensation: 2000.0,
    },
  ],
  activityLog: [
    {
      id: "1",
      user: "ADMIN",
      version: "v1.0",
      action: "Created agreement — v1.0",
      time: "11:15 AM",
    },
    {
      id: "2",
      user: "ADMIN",
      version: "v1.0",
      action: "Agreement sent to John Doe",
      time: "10:32 AM",
    },
  ],
};

export default function AdminAgreementDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const data = AGREEMENT_DETAIL_DATA;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return (
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm lg:text-base font-medium ${isDark
              ? "bg-[#D4FFE4] text-[#16A34A] border border-[#D4FFE4]"
              : "bg-[#E6F8ED] text-[#0D894F] border border-[#A3E6C1]"
              }`}
          >
            Accepted
          </span>
        );
      case "Expired":
      case "Pending":
        return (
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm lg:text-base font-medium ${isDark
              ? "bg-[#FFF4C9] text-[#BA6605] border border-[#FFF4C9]"
              : "bg-[#FEF6E7] text-[#B7791F] border border-[#FCD34D]"
              }`}
          >
            {status}
          </span>
        );
      case "Not Accepted":
        return (
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm lg:text-base font-medium ${isDark
              ? "bg-[#FFD4D4] text-[#A31616] border border-[#FFD4D4]"
              : "bg-[#FDE8E8] text-[#E53E3E] border border-[#F87171]"
              }`}
          >
            Not Accepted
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button
              onClick={() => router.push("/admin/agreements/history")}
              title="View Version History"
              variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}
            >
              <History size={24} />
              View Version History
            </Button>
          </>
        }
      />

      <div className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-40 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <div className="flex flex-col lg:flex-row gap-4 items-center w-full">
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Agreement Detail
            </h1>
            <span
              className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-sm border ${isDark
                ? "text-[#18150F] bg-[#EDE5D5] border-[#3D3D3D]"
                : "text-black/80 bg-[#F8F8F8] border-[#E5E5E5]"
                }`}
            >
              {data.currentVersion}
            </span>
            {getStatusBadge(data.status)}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => console.log("Resend")}
              title="Resend"
              variant="outline"
              className={`flex-0 h-12 min-w-32 rounded-md font-semibold text-sm px-6 gap-2 transition-all ${isDark
                ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}
            >
              Resend
            </Button>
            <Button
              onClick={() => console.log("Edit Agreement")}
              title="Edit Agreement"
              className="flex-0 w-full bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-12 px-6 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
            >
              Edit Agreement
            </Button>
          </div>
        </div>

        {/* Main Grid Section (Left: Document Card, Right: Version History & Activity Log) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Agreement Preview Document */}
          <div className={`lg:col-span-2 space-y-5`}>
            {/* Top Summary Info Card */}
            <div className={`border rounded-2xl p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
              <div>
                <p className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>Project</p>
                <p className={`font-semibold text-sm mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
                  {data.projectName}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>CP</p>
                <p className={`font-semibold text-sm mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
                  {data.cpName}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>Role</p>
                <p className={`font-semibold text-sm mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
                  {data.role}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>Assignment ID</p>
                <p className={`font-semibold text-sm mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
                  {data.assignmentId}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>Current Version</p>
                <p className={`font-semibold text-sm mt-0.5 ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                  {data.currentVersion}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>Compensation</p>
                <p className={`font-semibold text-sm mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
                  ${data.compensation.toFixed(2)}
                </p>
              </div>
            </div>

            <div className={`lg:col-span-2 border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
              {/* Header Title Section */}
              <div className={`space-y-2 p-5 lg:px-8 lg:py-7 rounded-t-2xl ${isDark ? "bg-[#202020]" : "bg-white"}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? "text-[#D8CCBA]" : "text-gray-400"}`}>
                    {data.agreementType}
                  </p>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg ${isDark ? "bg-white/10 text-white/70" : "bg-[#F0F0F0] text-black/70"}`}
                  >
                    {data.currentVersion}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className={`text-2xl lg:text-3xl capitalize ${isDark ? "text-white" : "text-black"}`}>
                    {data.projectName}
                  </h2>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-[#D4E0FF] text-[#0B2F8B]">
                      ● {data.badgeType}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-[#D4FFE4] text-[#16A34A]">
                      ● {data.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="space-y-3 px-5 pt-5 lg:px-8 lg:pt-9">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Project Information
                </h3>
                <div className={`text-xs lg:text-sm w-full flex flex-wrap gap-y-2 gap-x-3 lg:gap-y-4 lg:gap-x-5 ${isDark ? "text-[#AAA7A7]" : "text-black/70"}`}>
                  <p>Project Name : <span className={isDark ? "text-white" : "text-black"}>{data.projectName}</span></p>
                  <p>|</p>
                  <p>Project ID : <span className={isDark ? "text-white" : "text-black"}>{data.projectId}</span></p>
                  <p>|</p>
                  <p>Assignment ID : <span className={isDark ? "text-white" : "text-black"}>{data.assignmentId}</span></p>
                </div>
                <div className={`text-xs lg:text-sm flex flex-wrap gap-y-2 gap-x-3 lg:gap-y-4 lg:gap-x-5 ${isDark ? "text-[#AAA7A7]" : "text-black/70"}`}>
                  <p>Creative Partner : <span className={isDark ? "text-[#E8D1AB]" : "text-black"}>{data.cpName}</span></p>
                  <p>|</p>
                  <p>Role : <span className={isDark ? "text-white" : "text-black"}>{data.role}</span></p>
                </div>
              </div>

              <DottedDivider />

              {/* Production Details */}
              <div className="space-y-3 px-5 lg:px-8">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Production Details
                </h3>
                <div className={`text-xs lg:text-sm w-full flex flex-wrap gap-y-2 gap-x-3 lg:gap-y-4 lg:gap-x-5 ${isDark ? "text-[#AAA7A7]" : "text-black/70"}`}>
                  <p>Production Date : <span className={isDark ? "text-white" : "text-black"}>{data.productionDetails.date}</span></p>
                  <p>|</p>
                  <p>Location : <span className={isDark ? "text-white" : "text-black"}>{data.productionDetails.location}</span></p>
                  <p>|</p>
                  <p>Call Time : <span className={isDark ? "text-white" : "text-black"}>{data.productionDetails.callTime}</span></p>
                </div>
                <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                  Expected End Time / Duration : <span className={isDark ? "text-white" : "text-black"}>{data.productionDetails.expectedEndTime}</span>
                </p>
              </div>

              <DottedDivider />

              {/* Compensation Box */}
              <div className="space-y-3 px-5 lg:px-8">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Compensation
                </h3>
                <div className={`flex justify-between items-center border rounded-xl p-5 text-sm lg:text-base ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70" : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"}`}>
                  <span className={`text-sm lg:text-base ${isDark ? "text-white/80" : "text-black/80"}`}>
                    Total Compensation
                  </span>
                  <span className={`text-xl lg:text-2xl font-semibold ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                    ${data.compensation.toFixed(2)}
                  </span>
                </div>
              </div>

              <DottedDivider />

              {/* Scope of Services Box */}
              <div className="space-y-3 px-5 lg:px-8">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Scope of Services
                </h3>
                <div className={`border rounded-xl p-5 text-sm lg:text-base ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70" : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"}`}>
                  {data.scopeOfServices}
                </div>
              </div>

              <DottedDivider />

              {/* Equipment Requirements Box */}
              <div className="space-y-3 px-5 lg:px-8">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Equipment Requirements
                </h3>
                <div className={`border rounded-xl p-5 text-sm lg:text-base ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70" : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"}`}>
                  {data.equipmentRequirements}
                </div>
              </div>
              <DottedDivider />

              {/* Deliverables / Media Transfer Requirements */}
              <div className="space-y-3 px-5 lg:px-8">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Deliverables / Media Transfer Requirements
                </h3>
                <div className={`border rounded-xl p-5 text-sm lg:text-base ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70" : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"}`}>
                  {data.deliverableRequirements}
                </div>
              </div>
              <DottedDivider />

              {/* Approved Expenses / Travel */}
              <div className="space-y-3 px-5 lg:px-8">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Approved Expenses / Travel
                </h3>
                <div className={`border rounded-xl p-5 text-sm lg:text-base ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70" : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"}`}>
                  {data.approvedExpenses}
                </div>
              </div>
              <DottedDivider />

              {/* Special Instructions */}
              <div className="space-y-3 px-5 lg:px-8">
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Special Instructions
                </h3>
                <div className={`border rounded-xl p-5 text-sm lg:text-base ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70" : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"}`}>
                  {data.specialInstructions}
                </div>
              </div>

              <div className="space-y-3 lg:space-y-5 px-5 py-5 lg:px-8 lg:pb-9 lg:pt-6">
                <p className={`text-xs lg:text-sm ${isDark ? "text-[#9E9690]" : "text-black/50"}`}>
                  This Shoot Assignment Agreement is issued under the Beige Creative Partner Agreement. By accepting,
                  the Creative Partner confirms their ability to perform the assignment as described and agrees to the
                  terms herein and the governing Beige Creative Partner Agreement. Both parties acknowledge that
                  acceptance creates a binding commitment for the specified production.
                </p>
                <div className="flex items-center gap-4 lg:gap-7">
                  <div>
                    <p className="text-xs lg:text-sm text-[#E8D1AB]">Beige Sheet Version</p>
                    <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>{data.currentVersion}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-[#E8D1AB]">Created</p>
                    <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>15 Sep 2026, 12:20 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Side Cards */}
          <div className="space-y-6">
            {/* Version History Card */}
            <div className={`border rounded-2xl p-5 space-y-4 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
              <h3 className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"}`}>
                Version History
              </h3>

              {data.versionHistory.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-xl px-4 py-5 space-y-2.5 ${isDark ? "bg-[#101010] border-white/10" : "bg-[#F9FAFB] border-[#E5E5E5]"}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <span className={`font-semibold text-sm ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                        {item.version}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-[#D4FFE4] text-[#16A34A]">
                        ● {data.status}
                      </span>
                    </div>
                    <span className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>
                      {item.date}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className={isDark ? "text-[#AAA7A7]" : "text-black/50"}>
                      Compensation
                    </span>
                    <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                      ${item.compensation.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={() => console.log("Preview Agreement")}
                    className="w-full bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-9 rounded-lg text-xs font-semibold"
                  >
                    Preview Agreement
                  </Button>
                </div>
              ))}
            </div>

            {/* Activity Log Card */}
            <div className={`border rounded-2xl p-5 space-y-4 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
              <h3 className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"}`}>
                Activity Log
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/20">
                {data.activityLog.map((log) => (
                  <div key={log.id} className="relative flex items-start justify-between text-xs">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#3D3D3D] flex items-center justify-center text-[9px] font-bold text-white/70">
                      A
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                          {log.user}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-sm border ${isDark
                            ? "text-[#18150F] bg-[#EDE5D5] border-[#3D3D3D]"
                            : "text-black/80 bg-[#F8F8F8] border-[#E5E5E5]"
                            }`}
                        >
                          {log.version}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isDark ? "text-white" : "text-black"}`}>
                        {log.action}
                      </p>
                    </div>
                    <span className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Mobile Sticky Action Bar */}
        <div className={`lg:hidden fixed flex flex-wrap gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push("/admin/agreements")}
            title="View Version History"
            variant="outline"
            className={`h-14 rounded-md font-semibold text-sm px-4 gap-2 transition-all ${isDark
              ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
              : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
              }`}
          >
            <History size={24} />
            View Version History
          </Button>
        </div>
      </div>
    </>
  );
}