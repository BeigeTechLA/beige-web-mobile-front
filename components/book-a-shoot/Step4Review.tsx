"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "@/app/book-a-shoot/page";

import Image from "next/image";
import { calculateDuration, formatISOToDateTime } from "@/lib/utils";
import { CalendarFold, ChevronDown, Clock, MapPin } from "lucide-react";
import { Separator } from "@/app/search-results/[creatorId]/components/Separator";
import { Separator as CenterSeparator } from "@/src/components/landing/Separator";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Review = ({ data, updateData, onNext }: Props) => {
  console.log(data);

  const [costSummaryOpen, setCostSummaryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 lg:gap-12 mx-0 w-full py-6 md:py-12 px-6 lg:px-0">
      <div className="flex flex-col gap-8 justify-center">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">Review & Match</h2>
          <p className="text-xs lg:text-sm text-[#939393]">Review your requirements to find the best matching creators.</p>
        </div>

        <div className="flex gap-6 lg:gap-10 p-4 md:p-6 bg-[#171717] rounded-lg lg:rounded-[20px]">
          <div className="w-full lg:w-[326px] relative shrink-0 rounded-lg lg:rounded-[20px] h-[200px] lg:h-[267px] overflow-hidden">
            <Image
              src={"/images/projects/Wedding.png"}
              alt={data?.shootType || "Shoot Image"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 lg:gap-8 w-full min-w-0">
            <div className="flex flex-col lg:flex-row justify-between ">
              <div>
                <h3 className="text-base lg:text-xl text-white">
                  {data.shootName || "Untitled Shoot"} ({data.shootType} • {data.contentType})
                </h3>
                <p className="text-xs lg:text-sm text-white/70">
                  #{data?.editType || "Edit Type Not Specified"}
                </p>
              </div>
              <div className="p-4 lg:px-6 lg:py-5 rounded-[10px] text-base lg:text-xl bg-[#E8D1AB] text-black font-medium">
                {"Total  $12543.75 /- "} {/* to be replaced with actual amount */}
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-4 lg:gap-6">
              <div className="flex items-center gap-3">
                <div className=""><Clock className="w-4 h-4 text-[#D9D9D9]" /></div>
                <div>
                  <p className="text-sm font-medium text-[#D9D9D9]">{calculateDuration(data.startDate, data.endDate)} <span className="text-[#E8D1AB]">(Estimated Duration)</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className=""><CalendarFold className="w-4 h-4 text-[#D9D9D9]" /></div>
                <div>
                  <p className="text-sm font-medium text-[#D9D9D9]">{formatISOToDateTime(data.startDate)} - {formatISOToDateTime(data.endDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className=""><MapPin className="w-4 h-4 text-[#D9D9D9]" /></div>
                <div>
                  <p className="text-sm font-medium text-[#D9D9D9]">
                    {typeof data.location === 'string'
                      ? data.location
                      : data.location || 'Location not specified'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-col w-full bg-[#171717] rounded-lg lg:rounded-[20px]">
          <button
            onClick={() => setCostSummaryOpen(!costSummaryOpen)}
            className="flex w-full items-center justify-between p-5"
          >
            <h2 className="text-lg lg:text-2xl font-bold tracking-tight">Cost Summary</h2>
            <div
              className={`transform transition-transform duration-300 ${costSummaryOpen ? "rotate-180" : "rotate-0"}`}
            >
              <ChevronDown className="h-6 w-6 text-white" />
            </div>
          </button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden border-t border-white/20 ${costSummaryOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"} p-4 lg:p-[30px] `}
          >
            <div className="space-y-4 lg:space-y-[30px]">
              {/* Example Data Rows: data from formData */}
              <div className="flex flex-col gap-3 lg:gap-6">
                <div className="flex justify-between text-sm lg:text-lg text-white/80">
                  <span>Wedding Photography (1.5 Hours)</span>
                  <span className="lg:text-xl font-medium text-white">$275.00 /-</span>
                </div>
                <div className="flex justify-between  text-sm lg:text-lg text-white/80">
                  <span>Edit Type - Feature Video</span>
                  <span className="lg:text-xl font-medium text-white">$550.00 /-</span>
                </div>
                <div className="flex justify-between  text-sm lg:text-lg text-white/80">
                  <span>Photographer - x1</span>
                  <span className="lg:text-xl font-medium text-white">$275.00 /-</span>
                </div>
              </div>

              <CenterSeparator />

              <div className="flex flex-col gap-2 lg:gap-3">
                <p className="text-sm lg:text-lg text-[#E8D1AB] font-bold">Add Ons</p>
                <div className="flex flex-col gap-4 lg:gap-6">
                  <div className="flex justify-between text-sm lg:text-lg text-white/80">
                    <span>Additional Camera (flat rate) - x1</span>
                    <span className="lg:text-xl font-medium text-white">$275.00 /-</span>
                  </div>
                  <div className="flex justify-between text-sm lg:text-lg text-white/80">
                    <span>Drone – Non-Corporate - x1</span>
                    <span className="lg:text-xl font-medium text-white">$550.00 /-</span>
                  </div>
                </div>
              </div>

              <CenterSeparator />
              <div className="flex flex-col gap-2 lg:gap-3 text-[#47C30D]">
                <div className="flex justify-between text-sm lg:text-lg text-white">
                  <span className="font-bold">Base Price</span>
                  <span className="lg:text-xl font-medium">$275.00 /-</span>
                </div>
                <div className="flex justify-between text-sm lg:text-lg">
                  <span>Edit Type - Feature Video</span>
                  <span className="lg:text-xl font-medium">$550.00 /-</span>
                </div>
              </div>

              <CenterSeparator />
              <div className="flex justify-between font-semibold  text-sm lg:text-lg  text-white">
                <span>Price After Discount</span>
                <span className="lg:text-xl">$1123 /-</span>
              </div>
            </div>
          </div>


          {/* Map Placeholder: Has been removed temporarily */}
          {/* <div className="mt-6 h-[80px] w-full bg-[#F5F5F5] rounded-[10px] overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />
          </div> */}

        </div>

        {/* Email Input */}
        <div className="mt-8 relative w-full">
          <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
            Your Email Address *
          </label>
          <input
            type="email"
            value={data.guestEmail}
            onChange={(e) => updateData({ guestEmail: e.target.value })}
            placeholder="email@example.com"
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/60 bg-[#101010]"
            required
          />
          <p className="text-xs lg:text-lg text-white/70 mt-2">
            We'll send booking confirmation and creator matches to this email
          </p>
        </div>
      </div>

      <div className="">
        <Button
          onClick={onNext}
          className="h-12 lg:h-[72px] w-full lg:w-[336px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold text-base lg:text-xl rounded-[12px]"
        >
          Find Creative Partner
        </Button>
      </div>
    </div>
  );
};