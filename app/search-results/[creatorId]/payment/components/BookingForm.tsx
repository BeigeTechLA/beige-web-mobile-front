"use client";

import React from 'react';
import type { BookingFormData, ShootType } from '@/types/payment';

interface BookingFormProps {
  formData: Partial<BookingFormData>;
  onChange: (field: keyof BookingFormData, value: any) => void;
}

const shootTypes: ShootType[] = [
  'Event',
  'Product',
  'Portrait',
  'Wedding',
  'Commercial',
  'Fashion',
  'Real Estate',
  'Other',
];

export function BookingForm({ formData, onChange }: BookingFormProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10">
      <h3 className="font-bold mb-6 text-base lg:text-2xl">Booking Details</h3>

      <div className="space-y-5">
        {/* Hours */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#171717] px-2 text-sm lg:text-base text-white/60">
            Hours *
          </label>
          <input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={formData.hours || 1}
            onChange={(e) => onChange('hours', parseFloat(e.target.value) || 1)}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
            required
          />
        </div>

        {/* Shoot Date */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#171717] px-2 text-sm lg:text-base text-white/60">
            Shoot Date *
          </label>
          <input
            type="date"
            min={today}
            value={formData.shoot_date || ''}
            onChange={(e) => onChange('shoot_date', e.target.value)}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
            required
          />
        </div>

        {/* Location */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#171717] px-2 text-sm lg:text-base text-white/60">
            Location *
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder="e.g., New York, NY"
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
            required
          />
        </div>

        {/* Shoot Type */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#171717] px-2 text-sm lg:text-base text-white/60">
            Shoot Type *
          </label>
          <select
            value={formData.shoot_type || ''}
            onChange={(e) => onChange('shoot_type', e.target.value)}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626] appearance-none"
            required
          >
            <option value="" disabled>
              Select shoot type
            </option>
            {shootTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Special Requests */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#171717] px-2 text-sm lg:text-base text-white/60">
            Special Requests (Optional)
          </label>
          <textarea
            value={formData.special_requests || ''}
            onChange={(e) => onChange('special_requests', e.target.value)}
            placeholder="Any special requirements or notes..."
            rows={4}
            className="w-full rounded-[12px] border border-white/30 px-4 py-3 text-white outline-none focus:border-white/50 bg-[#272626] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
