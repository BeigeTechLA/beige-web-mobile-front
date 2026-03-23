"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Topbar from "@/components/sales/Topbar";
import { ArrowLeft, Video } from "lucide-react";
import { getInitials } from "@/lib/utils";

const addonData = [
  { label: "4K Camera Upgrade", amount: 500 },
  { label: "Drone Footage", amount: 800 },
  { label: "Hair & Makeup Artist", amount: 300 },
];
const logisticsData = [
  { label: "Travel & Transportation", amount: 500 },
  { label: "Equipment Rental", amount: 800 },
  { label: "Studio Rental", amount: 800 },
  { label: "Permits & Licenses", amount: 300 },
];

export default function QuoteSummaryPage() {
  const router = useRouter();
  const pathname = usePathname();


  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <Button onClick={() => router.push("/sales/quotes/preview")} className="bg-[#E5D5B8] text-black">
            Preview Quote
          </Button>
        }
      />

      <div className="px-4 pb-10 pt-6 lg:px-9 lg:pb-12 lg:pt-8 mx-auto">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-7">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[15px] text-[#D4D4D4] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        {/* Summary Block */}
        <div className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D]`}>
          {/* Header */}
          <div className="p-4 lg:p-9 border-b border-b-[#FFFFFF80] ">
            <h2 className="text-[18px] lg:text-[19px] font-medium text-white mb-1">Quote Summary</h2>
            <p className="text-[14px] text-[#A1A1AA]">Configure tax rate and type for this quotation</p>
          </div>

          {/* Data */}
          <div className="p-4 lg:p-9 space-y-3 lg:space-y-6">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="bg-[#333333] text-lg lg:text-2xl p-3 lg:p-6 w-fit rounded-full text-[#FFFFFF85] font-medium">
                {getInitials("Harsh Panchal")}
              </div>
              <p className="text-lg lg:text-2xl font-medium text-white">
                Harsh Panchal
              </p>
            </div>

            {/* Service included */}
            <div className="bg-[#282727] rounded-xl border border-[#FFFFFF80] p-3 lg:p-6">
              <div className="flex justify-between lg:text-lg">
                <p className="text-[#FFFFFFAD] font-semibold">Service Include</p>
                <p className="text-white font-bold">$1,000.00</p>
              </div>
              <div className="my-8 border-t  border-[#FFFFFF5C]" />
              <div className="flex justify-between items-center lg:text-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-[#E8D1AB] rounded-full p-3 text-black">
                    <Video size={36} />
                  </div>
                  <p className="text-[#FFF] font-medium">Videography - (Private Event)</p>
                </div>
                <p className="text-[#9C9696]">$1,000.00</p>
              </div>
            </div>

            {/* Add-ons  */}
            {logisticsData.length > 0 && (
              <div className="bg-[#282727] rounded-xl border border-[#FFFFFF80] p-3 lg:p-6">
                <div className="flex justify-between lg:text-lg">
                  <p className="text-[#FFFFFFAD] font-semibold">Add-ons</p>
                  <p className="text-white font-bold">$1,600.00</p>
                </div>
                <div className="my-8 border-t  border-[#FFFFFF5C]" />
                <div className="space-y-3 lg:space-y-6">
                  {
                    addonData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center lg:text-lg"
                      >
                        <p className="text-[#FFF] font-medium">{item.label}</p>
                        <p className="text-[#9C9696]">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Logistics */}
            {logisticsData.length > 0 && (
              <div className="bg-[#282727] rounded-xl border border-[#FFFFFF80] p-3 lg:p-6">
                <div className="flex justify-between lg:text-lg">
                  <p className="text-[#FFFFFFAD] font-semibold">Logistics</p>
                  <p className="text-white font-bold">$1,600.00</p>
                </div>
                <div className="my-8 border-t  border-[#FFFFFF5C]" />
                <div className="space-y-3 lg:space-y-6">
                  {
                    logisticsData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center lg:text-lg"
                      >
                        <p className="text-[#FFF] font-medium">{item.label}</p>
                        <p className="text-[#9C9696]">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Subtotal  */}
            <div className="bg-[#282727] rounded-xl border border-[#FFFFFF80] p-3 lg:p-6 space-y-3 lg:space-y-6">
              <div className="flex justify-between lg:text-lg">
                <p className="text-[#FFFFFFAD] font-semibold">Subtotal</p>
                <p className="text-white font-bold">$1,600.00</p>
              </div>
              <div className="flex justify-between items-center lg:text-lg">
                <p className="text-[#FFF] font-medium">Sales Tax (8.5%)</p>
                <p className="text-[#9C9696]">
                  $471.75
                </p>
              </div>
              <div className="flex justify-between items-center text-lg text-black lg:text-xl bg-[#E8D1AB] p-3 lg:p-6 rounded-lg lg:rounded-xl">
                <p className="font-medium">Final Total</p>
                <p className="text-xl lg:text-2xl font-semibold">
                  $6,021.75
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
