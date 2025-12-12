import React from "react";
import { Button } from "@/src/components/landing-v2/ui/button";
import { BookingData } from "../BookingModal";
import { MapPin, Calendar, Film, DollarSign } from "lucide-react";

interface Props {
  data: BookingData;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Review = ({ data, onNext, onBack }: Props) => {
  return (
    <div className="flex flex-col h-full justify-center lg:w-[760px] mx-0 w-full py-8 md:py-[50px]">
      <h2 className="text-3xl font-bold text-[#1A1A1A] pb-10 md:pb-[50px] px-8 md:px-[50px] border-b border-b-[#CACACA]">
        Review and Confirm
      </h2>

      <div className="p-8 md:p-[50px]">
        <div className="bg-white rounded-[20px] p-6 shadow-sm mb-10">
          {/* Project Type Icon/Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#F0F0F0]">
            <div className="w-[50px] h-[50px] bg-[#E8D1AB]/80 rounded-md flex items-center justify-center text-[#000]">
              <Film className="w-6 h-6 text-[#000]" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-[#000]">
                {data.shootName || "Untitled Shoot"} ({data.shootType} • {data.contentType})
              </h3>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
            <div className="flex items-center gap-3">
              <div className=""><Calendar className="w-4 h-4 text-[#999]" /></div>
              <div>
                <p className="text-sm font-medium text-[#1D1D1BCC]">{data.startDate} - {data.endDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className=""><MapPin className="w-4 h-4 text-[#999]" /></div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">{data.location}</p>
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


        {/* Map Placeholder */}
        <div className="mt-6 h-[80px] w-full bg-[#F5F5F5] rounded-[10px] overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />
        </div>
      </div>

      <div className="flex flex-col gap-3 px-8 md:px-[50px]">
        <Button
          onClick={() => {
            console.log("Button clicked in Step5Review");
            onNext();
          }}
          className="w-full h-[64px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-lg rounded-[12px]"
        >
          Find a Creative
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
