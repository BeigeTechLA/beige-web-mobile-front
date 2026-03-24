"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="overflow-hidden relative">
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
            className={`flex items-center gap-2 transition-colors ${isDark ? "text-[#D4D4D4] hover:text-white" : "text-black hover:text-black/70"}`}>
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        {/* Summary Block */}
        <div className={`border rounded-[18px] mb-8 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#DFDDDD]"} `}>
          {/* Header */}
          <div className={`p-4 lg:p-9 border-b ${isDark ? "border-b-[#FFFFFF80]" : "border-b-[#DFDDDD]"}`}>
            <h2 className={`text-lg lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Quote Summary</h2>
            <p className={`text-sm ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Configure tax rate and type for this quotation</p>
          </div>
          {/* Data */}
          <div className="p-4 lg:p-9 space-y-3 lg:space-y-6">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className={`${isDark ? "bg-[#333333] text-[#FFFFFF85]" : "bg-[#F4F5F7] text-[#00000085]"} text-lg lg:text-2xl p-3 lg:p-6 w-fit rounded-full font-medium `}>
                {getInitials("Harsh Panchal")}
              </div>
              <p className={`text-lg lg:text-2xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Harsh Panchal
              </p>
            </div>

            {/* Service included */}
            <div className={`rounded-xl lg:border p-3 lg:p-6 ${isDark ? "bg-[#282727] lg:border-[#FFFFFF80]" : "bg-[#F4F5F7] lg:border-[#D7D7D7]"}`}>
              <div className="flex justify-between lg:text-lg">
                <p className={`${isDark ? "text-[#FFFFFFAD]" : "text-[#000000AD]"} font-semibold`}>Service Include</p>
                <p className={`${isDark ? "text-white" : "text-black"} font-bold`}>$1,000.00</p>
              </div>
              <div className={`my-4 lg:my-6 border-t ${isDark ? "border-[#FFFFFF5C]" : "border-[#0000005C]"}`} />
              <div className="flex justify-between items-center lg:text-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-[#E8D1AB] rounded-full p-2 lg:p-3 text-black">
                    <Video className="w-5 h-5 lg:h-9 lg:w-9" strokeWidth={1.5} />
                  </div>
                  <p className={`text-sm lg:text-base font-medium w-1/2 lg:w-full ${isDark ? "text-white" : "text-black"} `}>Videography - (Private Event)</p>
                </div>
                <p className={`text-sm lg:text-base ${isDark ? "text-[#9C9696]" : "text-[#00000080]"}`}>$1,000.00</p>
              </div>
            </div>

            {/* Add-ons  */}
            {addonData.length > 0 && (
              <div className={`rounded-xl lg:border p-3 lg:p-6 ${isDark ? "bg-[#282727] lg:border-[#FFFFFF80]" : "bg-[#F4F5F7] lg:border-[#D7D7D7]"}`}>
                <div className="flex justify-between lg:text-lg">
                  <p className={`${isDark ? "text-[#FFFFFFAD]" : "text-[#000000AD]"} font-semibold`}>Add-ons</p>
                  <p className={`${isDark ? "text-white" : "text-black"} font-bold`}>$1,600.00</p>
                </div>
                <div className={`my-4 lg:my-6 border-t ${isDark ? "border-[#FFFFFF5C]" : "border-[#0000005C]"}`} />
                <div className="space-y-3 lg:space-y-6">
                  {
                    addonData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center lg:text-lg"
                      >
                        <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{item.label}</p>
                        <p className={`text-sm lg:text-base ${isDark ? "text-[#9C9696]" : "text-[#00000080]"}`}>
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
              <div className={`rounded-xl lg:border p-3 lg:p-6 ${isDark ? "bg-[#282727] lg:border-[#FFFFFF80]" : "bg-[#F4F5F7] lg:border-[#D7D7D7]"}`}>
                <div className="flex justify-between lg:text-lg">
                  <p className={`${isDark ? "text-[#FFFFFFAD]" : "text-[#000000AD]"} font-semibold`}>Logistics</p>
                  <p className={`${isDark ? "text-white" : "text-black"} font-bold`}>$1,600.00</p>
                </div>
                <div className={`my-4 lg:my-6 border-t ${isDark ? "border-[#FFFFFF5C]" : "border-[#0000005C]"}`} />
                <div className="space-y-3 lg:space-y-6">
                  {
                    logisticsData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center lg:text-lg"
                      >
                        <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{item.label}</p>
                        <p className={`text-sm lg:text-base ${isDark ? "text-[#9C9696]" : "text-[#00000080]"}`}>
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Subtotal  */}
            <div className={`rounded-xl lg:border p-3 lg:p-6 space-y-3 lg:space-y-6 ${isDark ? "bg-[#282727] lg:border-[#FFFFFF80]" : "bg-[#F4F5F7] lg:border-[#D7D7D7]"}`}>
              <div className="flex justify-between lg:text-lg">
                <p className={`${isDark ? "text-white" : "text-black"} font-semibold`}>Subtotal</p>
                <p className={`${isDark ? "text-[#9C9696]" : "text-[#00000080]"} font-semibold`}>$1,600.00</p>
              </div>
              <div className="flex justify-between items-center lg:text-lg">
                <p className={`${isDark ? "text-white" : "text-black"} text-sm lg:text-base font-medium`}>Sales Tax (8.5%)</p>
                <p className={`text-sm lg:text-base ${isDark ? "text-[#9C9696]" : "text-[#00000080]"}`}>
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
      <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] ${isDark ? "bg-[#0f0f0f]":"bg-[#F3F4F6]"}`}>
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
