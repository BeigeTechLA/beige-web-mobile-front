"use client";

import React from "react";

interface BookingCheckoutProps {
  clientName?: string;
  service?: string;
  date?: string;
  bookingId?: string;
  location?: string;
  subtotal?: number;
  taxes?: number;
  total?: number;
  onPay?: () => void;
  onApplyDiscount?: (code: string) => void;
}

const BookingCheckoutCard = ({
  clientName = "Sarah Johnson",
  service = "Corporate Event Photography",
  date = "Feb 15, 2026",
  bookingId = "BKG-2026-001234",
  location = "San Francisco Convention Center",
  subtotal = 2500,
  taxes = 225,
  total = 2725,
  onPay,
  onApplyDiscount,
}: BookingCheckoutProps) => {
  const [discountCode, setDiscountCode] = React.useState("");

  return (
    <div className="flex flex-col items-center w-full">
      {/* Main Terminal Card */}
      <div className="w-full lg:max-w-3xl bg-[#000000] border border-white/40 rounded-lg lg:rounded-2xl overflow-hidden">

        <div className="p-4 lg:p-8 space-y-3 lg:space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Booking Summary
          </h1>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">
                Client Name
              </p>
              <p className="text-base text-[#767676]">{clientName}</p>
            </div>
            <div></div> {/* Empty for alignment */}

            <div className="col-span-2 space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">
                Service
              </p>
              <p className="text-base text-[#767676]">{service}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">
                Date
              </p>
              <p className="text-base text-[#767676]">{date}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">
                Booking ID
              </p>
              <p className="text-base text-[#767676]">{bookingId}</p>
            </div>

            <div className="col-span-2 space-y-1">
              <p className="text-xs uppercase tracking-widest text-white font-medium">
                Location
              </p>
              <p className="text-base text-[#767676]">{location}</p>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-[#171717] rounded-lg lg:rounded-2xl p-3 lg:p-6 space-y-3">
            <div className="flex justify-between text-[#9D9D9D]">
              <span>Subtotal</span>
              <span className="text-white">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#9D9D9D]">
              <span>Taxes & Fees</span>
              <span className="text-white">${taxes.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-t-[#E4E4E7]/20">
              <span className="lg:text-lg text-white">Total</span>
              <span className="text-lg lg:text-2xl text-[#E8D1AB]">
                ${total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Discount Section */}
        <div className="p-4 lg:p-8 space-y-2 lg:space-y-4 border-y border-y-white/10">
          <p className="text-sm text-white font-medium">Have a discount code?</p>
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 bg-black border border-[#D4D4D8] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#E8D1AB]/50 transition-all"
            />
            <button
              onClick={() => onApplyDiscount?.(discountCode)}
              className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-white/80 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Primary Action */}
        <div className="p-4 lg:p-8 space-y-2 lg:space-y-4">
          <button
            onClick={onPay}
            className="w-full bg-[#E8D1AB] hover:bg-[#d9c19a] text-[#09090B] font-semibold py-3.5 rounded-xl lg:text-lg transition-all shadow-[0_0_20px_rgba(232,209,171,0.15)]"
          >
            Pay ${total.toLocaleString()} Now
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
};

export default BookingCheckoutCard;