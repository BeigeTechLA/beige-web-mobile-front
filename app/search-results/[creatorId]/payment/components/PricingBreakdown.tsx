"use client";

import React from 'react';
import type { PricingBreakdown as PricingBreakdownType } from '@/types/payment';

interface PricingBreakdownProps {
  hourlyRate: number;
  hours: number;
  equipmentCost: number;
}

export function PricingBreakdown({ hourlyRate, hours, equipmentCost }: PricingBreakdownProps) {
  const cpCost = hourlyRate * hours;
  const subtotal = cpCost + equipmentCost;
  const discount = 0; // Can be dynamic based on promotions
  const total = subtotal - discount;

  return (
    <div className="">
      <div className="flex justify-between text-sm lg:text-base p-3 lg:p-5 border-b border-black/20">
        <span className="text-[#626467]">
          CP Cost ({hours} {hours === 1 ? 'Hour' : 'Hours'} × ${hourlyRate}/hr)
        </span>
        <span className="text-[#212122] font-medium">${cpCost.toFixed(2)}</span>
      </div>

      {equipmentCost > 0 && (
        <div className="flex justify-between text-sm lg:text-base p-3 lg:p-5 border-b border-black/20">
          <span className="text-[#626467]">Equipment</span>
          <span className="text-[#212122] font-medium">${equipmentCost.toFixed(2)}</span>
        </div>
      )}

      <div className="text-sm lg:text-base p-3 lg:p-5 border-b border-black/20">
        <div className="flex justify-between mb-3 lg:mb-5">
          <span className="text-[#626467]">Subtotal</span>
          <span className="text-[#212122] font-medium">${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-[#626467]">Discount</span>
            <span className="font-medium text-[#4CAF50]">-${discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start p-3 lg:p-5">
        <div className="flex flex-col gap-2 lg:gap-4 text-sm lg:text-base">
          <span className="font-bold">Total</span>
          <span className="text-[#212122]">Amount Due</span>
        </div>
        <span className="text-xl font-bold">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
