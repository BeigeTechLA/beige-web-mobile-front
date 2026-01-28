"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Camera,
  ChevronDown,
  ArrowLeft,
  Percent,
  MapPinned,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Dummy data representing the lead shown in the screenshot
const LEAD_DETAIL = {
  clientName: "Ethan Carter",
  initials: "EC",
  email: "ethanc4519@yahoo.com",
  phone: "+1 (555) 123-4567",
  leadType: "Self-Serve",
  status: "Booked",
  booking: {
    date: "Feb 15, 2026",
    location: "742 Evergreen Terrace Springfield, IL 62704 United States",
    shootType: "Corporate Event Photography"
  },
  pricing: {
    basePrice: 2500.00,
    taxes: 225.00,
    total: 2725.00
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    "Booked": "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]",
    "Cancelled": "bg-[#fbd9d3] text-red-500 border-[#fbd9d3]",
    "In-Progress": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]"
  };

  const currentStyle = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={`px-7 py-2 rounded-full text-base font-medium border ${currentStyle}`}>
      {status}
    </span>
  );
};

export default function LeadDetailPage() {
  const router = useRouter();

  const [discount, setDiscount] = useState("");
  const [showDiscountCode, setShowDiscountCode] = useState(false);

  return (
    <div className="text-white font-sans">
      {/* Back Button */}
      <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0">
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Content Area (Left/Middle) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Client Details Card */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="text-xl font-medium text-white p-4 lg:p-9">Client Details</h2>
            <div className="h-[1px] w-full" style={{ backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`, backgroundSize: '30px 1px', backgroundRepeat: 'repeat-x' }} />
            <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-[84px] h-[84px] rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-[30px] font-semibold">
                    {LEAD_DETAIL.initials}
                  </div>
                  <div>
                    <h1 className="text-[22px] font-semibold">{LEAD_DETAIL.clientName}</h1>
                  </div>
                </div>
                <StatusBadge status={LEAD_DETAIL.status} />
              </div>
              <div className="flex flex-wrap gap-y-4 gap-x-8 text-sm text-[#AAA7A7]">
                <p>Email ID : <span className="text-white">{LEAD_DETAIL.email}</span></p>
                <div className="w-[1px] h-4 bg-white hidden md:block" />
                <p>Phone Number : <span className="text-white">{LEAD_DETAIL.phone}</span></p>
                <div className="w-[1px] h-4 bg-white hidden md:block" />
                <p>Lead Type : <span className="text-white">{LEAD_DETAIL.leadType}</span></p>
              </div>
            </div>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="text-xl font-medium text-white p-4 lg:p-9">Booking Summary</h2>
            <div className="h-[1px] w-full" style={{ backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`, backgroundSize: '30px 1px', backgroundRepeat: 'repeat-x' }} />
            <div className="flex flex-col gap-3 lg:gap-5 p-4 lg:p-9">
              {/* Date */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-[#8E8E8E]">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Date</p>
                  <p className="text-base font-medium">{LEAD_DETAIL.booking.date}</p>
                </div>
              </div>
              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-[#8E8E8E]">
                  <MapPinned size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#71717B] font-medium mb-1">Location</p>
                  <p className="text-base font-medium max-w-md">{LEAD_DETAIL.booking.location}</p>
                </div>
              </div>
              {/* Type */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-[#8E8E8E]">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Type</p>
                  <p className="text-base font-medium">{LEAD_DETAIL.booking.shootType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="text-xl font-medium text-white p-4 lg:p-9">Pricing Breakdown</h2>
            <div className="h-[1px] w-full" style={{ backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`, backgroundSize: '30px 1px', backgroundRepeat: 'repeat-x' }} />
            <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9 lg:pb-6">
              <div className="flex justify-between font-medium">
                <span className="text-[#71717B] text-xs">Base Price</span>
                <span className="text-white">${LEAD_DETAIL.pricing.basePrice.toLocaleString()}/-</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-[#71717B] text-xs">Taxes & Fees</span>
                <span className="text-white">${LEAD_DETAIL.pricing.taxes.toLocaleString()}/-</span>
              </div>
            </div>
            <div className="h-[1px] w-full bg-[#3D3D3D]" />
            <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
              <span className="text-sm font-medium">Taxes & Fees</span>
              <span className="text-lg font-semibold text-[#E8D1AB]">${LEAD_DETAIL.pricing.total.toLocaleString()}/-</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Discount Generator */}
        <div className="lg:col-span-4">
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="text-xl font-medium text-white p-4 lg:p-9">Generate Discount</h2>
            <div className="h-[1px] w-full" style={{ backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`, backgroundSize: '30px 1px', backgroundRepeat: 'repeat-x' }} />
            <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9">
              {/* Percentage Input */}
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-[#171717] px-2 text-sm text-white/60 capitalize tracking-widest">
                  Discount Percentage
                </label>
                <div className="flex items-center border border-white/50 rounded-xl px-4 py-4 bg-transparent focus-within:border-[#E8D1AB]/50 transition-all">
                  <input
                    type="number"
                    placeholder="0"
                    className="bg-transparent w-full outline-none text-white text-base"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  <Percent size={20} className="text-white" />
                </div>
              </div>

              {/* Usage Type Dropdown */}
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-[#171717] px-2 text-sm text-white/60 capitalize tracking-widest">
                  Usage Type
                </label>
                <button className="flex items-center justify-between w-full border border-white/50 rounded-xl px-4 py-4 text-left text-base text-white/60 hover:border-white/20">
                  Select usage type
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Action Button */}
              <Button
                className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold py-3.5 rounded-lg transition-all text-sm"
                onClick={() => setShowDiscountCode(true)}
              >
                Generate Code
              </Button>

              {
                showDiscountCode && (
                  <div className="flex flex-col gap-2 bg-[#0A0808] border border-white/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-white">Generated Code</p>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 px-3 py-2 bg-[#171717] border border-[#3F3F46] rounded-sm text-sm text-[#E8D1AB]">
                        DISCOUNT3F978S
                      </div>
                      <Button className="h-8 w-8 bg-[#171717]">
                        <Copy size={16} className="text-white" />
                      </Button>
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}