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
    <div className=" overflow-hidden relative">
      <Topbar pathname={pathname}
        actions={
          <Button onClick={() => router.push("/sales/quotes/preview")} className="bg-[#E5D5B8] text-black">
            Preview Quote
          </Button>
        }
      />

      <div className="px-4 pb-20 pt-6 lg:px-9 lg:pb-12 lg:pt-8 mx-auto">
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
            <div className="bg-[#282727] rounded-xl lg:border lg:border-[#FFFFFF80] p-3 lg:p-6">
              <div className="flex justify-between lg:text-lg">
                <p className="text-[#FFFFFFAD] font-semibold">Service Include</p>
                <p className="text-white font-bold">$1,000.00</p>
              </div>
              <div className="my-4 lg:my-6 border-t border-[#FFFFFF5C]" />
              <div className="flex justify-between items-center lg:text-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-[#E8D1AB] rounded-full p-2 lg:p-3 text-black">
                    <Video className="w-5 h-5 lg:h-9 lg:w-9" />
                  </div>
                  <p className="text-sm lg:text-base text-[#FFF] font-medium w-1/2 lg:w-full">Videography - (Private Event)</p>
                </div>
                <p className="text-sm lg:text-base text-[#9C9696]">$1,000.00</p>
              </div>
            </div>

            {/* Add-ons  */}
            {logisticsData.length > 0 && (
              <div className="bg-[#282727] rounded-xl lg:border lg:border-[#FFFFFF80] p-3 lg:p-6">
                <div className="flex justify-between lg:text-lg">
                  <p className="text-[#FFFFFFAD] font-semibold">Add-ons</p>
                  <p className="text-white font-bold">$1,600.00</p>
                </div>
                <div className="my-4 lg:my-6 border-t  border-[#FFFFFF5C]" />
                <div className="space-y-3 lg:space-y-6">
                  {
                    addonData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center lg:text-lg"
                      >
                        <p className="text-sm lg:text-base text-[#FFF] font-medium">{item.label}</p>
                        <p className="text-sm lg:text-base text-[#9C9696]">
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
              <div className="bg-[#282727] rounded-xl lg:border lg:border-[#FFFFFF80] p-3 lg:p-6">
                <div className="flex justify-between lg:text-lg">
                  <p className="text-[#FFFFFFAD] font-semibold">Logistics</p>
                  <p className="text-white font-bold">$1,600.00</p>
                </div>
                <div className="my-4 lg:my-6 border-t  border-[#FFFFFF5C]" />
                <div className="space-y-3 lg:space-y-6">
                  {
                    logisticsData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center lg:text-lg"
                      >
                        <p className="text-sm lg:text-base text-[#FFF] font-medium">{item.label}</p>
                        <p className="text-sm lg:text-base text-[#9C9696]">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Subtotal  */}
            <div className="bg-[#282727] rounded-xl lg:border lg:border-[#FFFFFF80] p-3 lg:p-6 space-y-3 lg:space-y-6">
              <div className="flex justify-between lg:text-lg">
                <p className="text-white font-semibold">Subtotal</p>
                <p className="text-[#9C9696] font-bold">$1,600.00</p>
              </div>
              <div className="flex justify-between items-center lg:text-lg">
                <p className="text-sm lg:text-base text-white font-medium">Sales Tax (8.5%)</p>
                <p className="text-sm lg:text-base text-[#9C9696]">
                  $471.75
                </p>
              </div>
              <div className="flex justify-between items-center text-lg text-black lg:text-xl bg-[#E8D1AB] p-3 lg:p-6 rounded-lg lg:rounded-xl">
                <p className="text-sm lg:text-base font-medium">Final Total</p>
                <p className="text-lg lg:text-2xl font-semibold">
                  $6,021.75
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className="lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] bg-[#0f0f0f]">
        <Button
          onClick={() => router.push('/sales/quotes/preview')}
          className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
        >
          Preview Quote
        </Button>
      </div>
    </div>
  )
}
