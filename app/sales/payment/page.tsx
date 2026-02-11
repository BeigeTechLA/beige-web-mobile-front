"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalesLeadDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  return (
    <div className="min-h-screen text-white font-sans flex flex-col items-center">
      {/* Header Navigation */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-12 px-4">
        <h2 className="lg:text-xl font-medium">Complete Your Payment</h2>
        <Button
          onClick={() => router.back()}
          className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>
      </div>

      {/* Main Terminal Card */}
      <div className="w-full lg:max-w-3xl bg-[#000000] border border-white/40 rounded-lg lg:rounded-2xl overflow-hidden">

        <div className="p-4 lg:p-8 space-y-3 lg:space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight">Booking Summary</h1>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">Client Name</p>
              <p className="text-base text-[#767676]">Sarah Johnson</p>
            </div>
            <div></div> {/* Empty for alignment */}

            <div className="col-span-2 space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">Service</p>
              <p className="text-base text-[#767676]">Corporate Event Photography</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">Date</p>
              <p className="text-base text-[#767676]">Feb 15, 2026</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">Booking ID</p>
              <p className="text-base text-[#767676]">BKG-2026-001234</p>
            </div>

            <div className="col-span-2 space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">Location</p>
              <p className="text-base text-[#767676]">San Francisco Convention Center</p>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-[#171717] rounded-lg lg:rounded-2xl p-3 lg:p-6 space-y-3">
            <div className="flex justify-between text-[#9D9D9D]">
              <span>Subtotal</span>
              <span className="text-white">$2,500</span>
            </div>
            <div className="flex justify-between text-[#9D9D9D]">
              <span>Taxes & Fees</span>
              <span className="text-white">$225</span>
            </div>
            {/* <div className="h-[1px] bg-zinc-700 w-full" /> */}
            <div className="flex justify-between items-center pt-2 border-t border-t-[#E4E4E7]">
              <span className="lg:text-lg">Total</span>
              <span className="text-lg lg:text-2xl text-[#E8D1AB]">$2,725</span>
            </div>
          </div>
        </div>

        {/* Discount Section */}
        <div className="p-4 lg:p-8 space-y-2 lg:space-y-4 border-y border-y-[#E4E4E7] ">
          <p className="text-sm text-white font-medium">Have a discount code?</p>
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter code"
              className="flex-1 bg-black border border-[#D4D4D8] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#E8D1AB]/50 transition-all"
            />
            <button className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-white/80 transition-colors">
              Apply
            </button>
          </div>
        </div>

        {/* Primary Action */}
        <div className="p-4 lg:p-8 space-y-2 lg:space-y-4">
          <button className="w-full bg-[#E8D1AB] hover:bg-[#d9c19a] text-[#09090B] font-semibold py-3.5 rounded-xl lg:text-lg transition-all shadow-[0_0_20px_rgba(232,209,171,0.15)]">
            Pay $2,725 Now
          </button>
          <p className="text-xs text-center text-[#71717B] leading-relaxed">
            By proceeding with payment, you agree to our terms and conditions. Your payment information is secured and encrypted.
          </p>
        </div>
      </div>

      {/* Support Footer */}
      <p className="mt-12 text-zinc-500 text-sm">
        Need help? Contact support at <span className="text-[#52525C]">support@example.com</span>
      </p>
    </div>
  );
}
