"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

interface BookingDetails {
  confirmationNumber: string;
  paymentMethod: string;
  transactionId: string;
  amountPaid: string;
  paymentDate: string;
}

interface BookingSummaryModalProps {
  onClose: () => void;
  onBookAnother: () => void;
  onContinue: (shootName: string) => void;
  bookingDetails: BookingDetails;
}

export const BookingSummaryModal = ({
  onClose,
  onBookAnother,
  onContinue,
  bookingDetails,
}: BookingSummaryModalProps) => {
  const [shootName, setShootName] = React.useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-[720px] lg:max-w-[999px] bg-white text-black rounded-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between py-6 px-8 lg:px-[50px] lg:py-17 border-b border-black/10">
          <h3 className="text-lg lg:text-3xl font-bold">
            Booking Summary Details
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition"
          >
            <X className="w-5 h-5 lg:w-7 lg:h-7" />
          </button>
        </div>

        {/* Content */}
        <div className="">
          {/* Details */}
          <div className="space-y-3 lg:space-y-6 py-6 px-8 lg:px-[50px] lg:py-10 pb-8 border-b border-black/10 text-sm lg:text-lg">
            <div className="flex justify-between">
              <span className="text-[#626467]">
                Confirmation Number
              </span>
              <span className="font-medium">
                {bookingDetails.confirmationNumber}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#626467]">Payment Method</span>
              <span className="font-medium">
                {bookingDetails.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#626467]">Transaction ID</span>
              <span className="font-medium">
                {bookingDetails.transactionId}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#626467]">Amount Paid</span>
              <span className="font-semibold text-[#4CAF50]">
                {bookingDetails.amountPaid}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#626467]">
                Payment Date & Time
              </span>
              <span className="font-medium text-right">
                {bookingDetails.paymentDate}
              </span>
            </div>
          </div>

          {/* Shoot Name */}
          <div className="px-8 lg:px-[50px] pt-6 lg:pt-10">
            <h4 className="text-base lg:text-lg font-semibold mb-1">
              Give Your Shoot A Name (Optional)
            </h4>
            <p className="text-sm lg:text-base text-black/60 mb-4 lg:mb-8">
              If you give a shoot name and click “Continue to Dashboard”,
              this name will be saved in your shoot details.
            </p>

            <div className="relative w-full">
              <label className="absolute -top-3 left-4 bg-white px-2 text-sm lg:text-base text-[#000]/60">
                Shoot Name
              </label>
              <input
                type="text"
                value={shootName}
                onChange={(e) => setShootName(e.target.value)}
                className="h-14 lg:h-[82px] w-full rounded-[12px] border border-[#E5E5E5] px-4 text-[#1A1A1A] outline-none focus:border-[#1A1A1A] bg-white"
              />
            </div>

          </div>

          {/* Actions */}
          <div className="mt-6 lg:mt-12 grid grid-cols-2 gap-2.5 px-8 pb-6 lg:px-[50px] lg:pb-[50px]">
            <button
              onClick={onBookAnother}
              className="h-14 lg:h-[96px] rounded-[10px] lg:rounded-[20px] bg-black text-white text-base lg:text-2xl font-medium hover:bg-black/90 transition"
            >
              Book Another Session
            </button>

            <button
              onClick={() => onContinue(shootName)}
              className="h-14 lg:h-[96px] rounded-[10px] lg:rounded-[20px] bg-[#E8D1AB] text-black text-base lg:text-2xl font-medium hover:bg-[#dcb98a] transition"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
