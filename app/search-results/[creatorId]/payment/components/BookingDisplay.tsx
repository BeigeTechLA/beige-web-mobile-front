"use client";

import React from 'react';
import type { BookingFormData } from '@/types/payment';

interface BookingDisplayProps {
  bookingData: Partial<BookingFormData>;
}

export function BookingDisplay({ bookingData }: BookingDisplayProps) {
  return (
    <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10">
      <h3 className="font-bold mb-6 text-base lg:text-2xl">Booking Details</h3>

      <div className="space-y-4">
        {/* Hours */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <span className="text-white/60 text-sm lg:text-base">Duration</span>
          <span className="text-white font-medium text-sm lg:text-base">
            {bookingData.hours || 1} Hour{(bookingData.hours || 1) > 1 ? 's' : ''}
          </span>
        </div>

        {/* Shoot Date */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <span className="text-white/60 text-sm lg:text-base">Shoot Date</span>
          <span className="text-white font-medium text-sm lg:text-base">
            {bookingData.shoot_date || 'Not specified'}
          </span>
        </div>

        {/* Location */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <span className="text-white/60 text-sm lg:text-base">Location</span>
          <span className="text-white font-medium text-sm lg:text-base text-right max-w-[60%]">
            {bookingData.location || 'Not specified'}
          </span>
        </div>

        {/* Shoot Type */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <span className="text-white/60 text-sm lg:text-base">Shoot Type</span>
          <span className="text-white font-medium text-sm lg:text-base">
            {bookingData.shoot_type || 'Not specified'}
          </span>
        </div>

        {/* Special Requests */}
        {bookingData.special_requests && (
          <div className="pt-2">
            <span className="text-white/60 text-sm lg:text-base block mb-2">Special Requests</span>
            <p className="text-white text-sm lg:text-base">
              {bookingData.special_requests}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
