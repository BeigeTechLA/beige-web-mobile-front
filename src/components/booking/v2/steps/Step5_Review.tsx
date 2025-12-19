import React from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "../BookingModal";
import { MapPin, Film, DollarSign, Clock, CalendarFold,X } from "lucide-react";
import { calculateDuration, formatISOToDateTime } from "@/lib/utils";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  handleClose: () => void;
}

export const Step5Review = ({ data, onNext, onBack, updateData, handleClose }: Props) => {
  return (
    <div className="flex flex-col h-full justify-center lg:w-[760px] mx-0 w-full py-8 md:py-[50px]">
       <div className="flex justify-between items-start pb-6 md:pb-[50px] px-6 md:px-[50px] border-b border-b-[#CACACA]">
        <h2 className="text-xl lg:text-3xl font-bold text-[#1A1A1A]">
        Review and Confirm
      </h2>

              <div className="top-5 right-5 md:top-[50px] md:right-[50px] z-10">
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              </div>

      <div className="p-6 md:p-[50px]">
        <div className="bg-white rounded-[20px] p-6 shadow-sm mb-10">
          {/* Project Type Icon/Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#F0F0F0]">
            <div className="w-9 h-9 lg:w-[50px] lg:h-[50px] bg-[#E8D1AB]/80 rounded-md flex items-center justify-center text-[#000]">
              <Film className="w-5 h-5 lg:w-6 lg:h-6 text-[#000]" />
            </div>
            <div>
              <h3 className="text-base lg:text-xl font-medium text-[#000]">
                {data.shootName || "Untitled Shoot"} ({data.shootType} • {data.contentType})
              </h3>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
            <div className="flex items-center gap-3">
              <div className=""><Clock className="w-4 h-4 text-[#999]" /></div>
              <div>
                <p className="text-sm font-medium text-[#1D1D1BCC]">{calculateDuration(data.startDate, data.endDate)} <span className="text-[#C58213]">(Estimated Duration)</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className=""><CalendarFold className="w-4 h-4 text-[#999]" /></div>
              <div>
                <p className="text-sm font-medium text-[#1D1D1BCC]">{formatISOToDateTime(data.startDate)} - {formatISOToDateTime(data.endDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className=""><MapPin className="w-4 h-4 text-[#999]" /></div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {typeof data.location === 'string'
                    ? data.location
                    : data.location?.address || 'Location not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-[#999] font-serif italic">
                <DollarSign className="w-4 h-4 text-[#999]"/>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Up to ${data.budgetMax}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-[#999]">#</div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">{data.editType}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Map Placeholder: Has been removed temporarily */}
        {/* <div className="mt-6 h-[80px] w-full bg-[#F5F5F5] rounded-[10px] overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />
        </div> */}

        {/* Email Input */}
        <div className="mt-8">
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Your Email Address *
          </label>
          <input
            type="email"
            value={data.guestEmail}
            onChange={(e) => updateData({ guestEmail: e.target.value })}
            placeholder="email@example.com"
            className="w-full h-[56px] px-4 border border-[#D4D4D4] rounded-[12px] text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:border-[#E8D1AB] focus:ring-2 focus:ring-[#E8D1AB]/20"
            required
          />
          <p className="text-xs text-[#666] mt-2">
            We'll send booking confirmation and creator matches to this email
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-8 md:px-[50px]">
        <Button
          onClick={() => {
            console.log("Button clicked in Step5Review");
            onNext();
          }}
          className="w-full h-14 lg:h-[64px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-lg rounded-[12px]"
        >
          Find Creative Partner
        </Button>
        <button
          onClick={onBack}
          className="text-[#666] hover:text-[#1A1A1A] text-sm font-medium py-2 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
