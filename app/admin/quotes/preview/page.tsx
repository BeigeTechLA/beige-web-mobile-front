"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Topbar from "@/components/admin/Topbar";
import { ArrowDownToLine, ArrowLeft, Copy, Send, Video } from "lucide-react";
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
          <>
            <Button onClick={() => console.log("Copy Link")} className="bg-[#202020] text-white hover:bg-[#202020]/50 border border-[#FFFFFF33]">
              <Copy />Copy Link
            </Button>
            <Button onClick={() => console.log("Download PDF")} className="bg-[#202020] text-white hover:bg-[#202020]/50 border border-[#FFFFFF33]">
              <ArrowDownToLine /> Download PDF
            </Button>
            <Button onClick={() => router.push("/admin/quotes/preview")} className="bg-[#E5D5B8] text-black">
              <Send /> Send Quote
            </Button>
          </>
        }
      />

      <div className="px-4 pb-30 pt-6 lg:px-9 lg:pb-12 lg:pt-8 mx-auto">
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

        {/* Header */}
        <div className="mb-4 lg:mb-9">
          <h2 className="text-[18px] lg:text-[19px] font-medium text-white mb-1">Quote Preview</h2>
          <p className="text-[14px] text-[#A1A1AA]">Review before sending to client</p>
        </div>

        {/* Preview Block */}
        <div className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D]`}>
          {/* Data */}
          <div className="p-4 lg:p-9 space-y-3 lg:space-y-6">
            {/* Beige HEader */}
            <div className="flex items-center justify-between">
              {/* Left */}
              <div className="space-y-2 lg:space-y-5">
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="bg-[#E8D1AB] text-lg lg:text-2xl p-4 w-fit rounded-xl text-[#FFFFFF85] font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M6.32217 0.0321608C2.83197 0.321635 0.819599 2.63743 1.00826 6.01462C1.07115 7.68713 1.7629 9.00585 3.02063 9.90643L3.33506 10.1316L2.89486 10.3567C1.10259 11.2895 0.222177 12.6082 0.0335174 14.6667C-0.280915 18.1082 1.63712 20.9708 4.93867 21.7427C6.03918 22 6.13351 22 11.6361 22H16.4155L16.0381 21.7427C15.1263 21.0994 14.3088 20.231 13.7428 19.2982L13.5541 19.0088H10.4098C7.29692 19.0088 6.73094 19.0088 6.1964 18.8801C4.37269 18.5263 3.33506 17.2719 3.33506 15.3421C3.33506 13.4123 4.37269 12.4152 6.57372 12.0614C6.88815 12.0292 7.29692 11.9971 9.15207 11.9971H11.3217L11.2902 11.3538C11.2588 10.7427 11.3217 9.52047 11.3531 9.23099L11.3845 9.10234H9.90671C7.64279 9.10234 6.88815 9.03801 6.1964 8.81286C5.033 8.39474 4.40413 7.55848 4.37269 6.2076C4.3098 4.63158 4.97011 3.60234 6.32217 3.21637C7.04537 3.02339 7.04537 3.02339 10.2526 2.99122H13.1768V7.20468C13.1768 11.3538 13.1768 12.0936 13.2711 13.0585C13.7113 17.0146 15.315 19.7164 18.082 21.1637C18.3021 21.2924 18.5222 21.3567 18.5222 21.3567C18.5851 21.3246 20 18.8801 20 18.7193C20 18.7193 19.8428 18.5906 19.717 18.5263C18.2392 17.8187 17.0129 16.0819 16.6356 14.2164C16.384 12.8977 16.384 12.4795 16.384 5.8538V0H11.5103C8.80619 0 6.47939 0.0321608 6.32217 0.0321608Z" fill="#171717" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm lg:text-2xl font-bold text-[#E8D1AB]">
                      Beige AI
                    </p>
                    <p className="text-[10px] lg:text-sm text-white">
                      Production Marketplace
                    </p>
                  </div>
                </div>
                <div className="text-[10px] lg:text-sm text-white ">
                  <p>123 Business Street</p>
                  <p>San Francisco, CA 94102</p>
                  <p>contact@beigeAI.com</p>
                </div>
              </div>

              {/* Right */}
              <div>
                <h2 className="text-lg lg:text-4xl text-white font-bold">QUOTATION</h2>
                <div className="mt-2.5 text-[10px] lg:text-sm text-[#BDBDBD] text-right">
                  <p>Quote #: Q1</p>
                  <p>Date: March 10, 2026</p>
                  <p>Valid Until: April 15, 2026</p>
                </div>
              </div>
            </div>

            <div className="my-4 lg:my-9 border-t border-[#FFFFFF1A] lg:border-[#FFFFFF5C]" />

            {/* Bill Addresses to */}
            <div className="space-y-2 lg:space-y-5">
              <p className="text-[#71717B] text-[10px] font-semibold mb-1.5 lg:mb-3 uppercase">Bill To</p>

              <div className="text-[10px] lg:text-sm text-white ">
                <p className="text-xs lg:text-lg font-semibold text-white">
                  Harsh Panchal
                </p>
                <p>New York, NY</p>
                <p>contact@harsh.com</p>
                <p>+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="bg-[#FAFAFA] rounded-xl p-4 text-[10px] lg:text-sm space-y-1.5 mb-5 lg:mb-9">
              <p className="text-[#71717B] font-semibold uppercase">Project Description</p>
              <p className="text-[#18181B]">
                Corporate video production for annual conference
              </p>
            </div>
            <div className="my-4 lg:my-9 border-t border-[#FFFFFF1A] lg:border-[#FFFFFF5C]" />


            {/* Service included */}
            <div className="space-y-2 lg:space-y-4 mb-6 lg:mb-12">
              <p className="text-[10px] lg:text-sm text-[#71717B] font-semibold uppercase">Service Include</p>
              <div className="text-[10px] lg:text-sm grid grid-cols-5 text-[#FFF] font-medium border-b  border-[#FFFFFF1A] lg:border-[#FFFFFF5C] pb-2">
                {/* <p className="">Videography - (Private Event)</p> */}
                <p>Description</p>
                <p className="text-center">Qty</p>
                <p className="text-center">Duration</p>
                <p className="text-center">Crew</p>
                <p className="text-right">Amount</p>
              </div>
              <div className="text-xs lg:text-base grid grid-cols-5 text-[#FFFFFF99] font-medium">
                <p className="text-white">Videography - (Private Event)</p>
                <p className="text-center">01</p>
                <p className="text-center">4 Hours</p>
                <p className="text-center">02</p>
                <p className="text-right">$1,000.00</p>
              </div>
            </div>
            <div className="my-4 lg:my-9 border-t border-[#FFFFFF1A] lg:border-[#FFFFFF1A]" />

            {/* Add-ons  */}
            {logisticsData.length > 0 && (
              <div className="space-y-2 lg:space-y-4 mb-4 lg:mb-8">
                <p className="text-[10px] lg:text-sm text-[#71717B] font-semibold uppercase">Add-ons</p>
                <div className="space-y-2 lg:space-y-4">
                  {
                    addonData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-xs lg:text-base"
                      >
                        <p className="text-[#FFF]">{item.label}</p>
                        <p className="text-[#FFFFFF99] font-medium">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            <div className="my-4 lg:my-9 border-t  border-[#FFFFFF1A] lg:border-[#FFFFFF5C]" />

            {/* Logistics */}
            {logisticsData.length > 0 && (
              <div className="space-y-2 lg:space-y-4 mb-4 lg:mb-8">
                <p className="text-[10px] lg:text-sm text-[#71717B] font-semibold uppercase">Logistics</p>
                <div className="space-y-2 lg:space-y-4">
                  {
                    logisticsData.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-xs lg:text-base"
                      >
                        <p className="text-[#FFF]">{item.label}</p>
                        <p className="text-[#FFFFFF99] font-medium">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Subtotal  */}
            <div className="bg-[#E8D1AB] rounded-xl p-3 lg:p-6 space-y-3 lg:space-y-6">
              <div className="space-y-1 lg:space-y-1.5">
                <div className="flex justify-between text-sm lg:text-base text-black">
                  <p className="">Subtotal</p>
                  <p className="font-medium">$1,600.00</p>
                </div>
                <div className="flex justify-between text-xs lg:text-base text-black">
                  <p className="">Sales Tax (8.5%)</p>
                  <p className="font-medium">
                    $471.75
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm lg:text-lg text-white lg:text-xl bg-[#171717] p-2 lg:p-4 rounded-lg lg:rounded-xl font-bold">
                <p>Final Total</p>
                <p className="text-[#E8D1AB]">
                  $6,021.75
                </p>
              </div>
            </div>
            <div className="my-4 lg:my-9 border-t  border-[#FFFFFF1A] lg:border-[#FFFFFF5C]" />

            {/* Terms & Conditions */}
            <div className="space-y-2 lg:space-y-3">
              <p className="text-[10px] lg:text-sm text-white font-semibold uppercase">Terms & Conditions</p>
              <ul className="text-[10px] lg:text-sm text-[#AAAAAA] list-disc list-inside">
                <li>Payment is due within 30 days of quote acceptance.</li>
                <li>A 50% deposit is required before project commencement.</li>
                <li>This quote is valid until April 15, 2026.</li>
                <li>All prices are in USD.</li>
                <li>Changes to the scope of work may result in additional charges.</li>
              </ul>
            </div>
            <div className="my-4 lg:my-9 border-t  border-[#FFFFFF1A] lg:border-[#FFFFFF5C]" />

            {/* Contact */}
            <div className="p-4 text-[10px] lg:text-sm text-white text-center">
              Thank you for your business! For questions, contact John Smith at contact@BeigeAI.com
            </div>
          </div>
        </div>
      </div>

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className="lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] bg-[#0f0f0f] items-center">
        <Button onClick={() => console.log("Copy Link")} className="bg-[#202020] text-white hover:bg-[#202020]/50 border border-[#FFFFFF33]">
          <Copy />Copy Link
        </Button>
        <div className="flex gap-2">

          <Button onClick={() => console.log("Download PDF")} className="bg-[#202020] text-white hover:bg-[#202020]/50 border border-[#FFFFFF33]">
            <ArrowDownToLine /> Download PDF
          </Button>
          <Button onClick={() => router.push("/admin/quotes/preview")} className="bg-[#E5D5B8] text-black">
            <Send /> Send Quote
          </Button>
        </div>
      </div>
    </div>
  )
}
