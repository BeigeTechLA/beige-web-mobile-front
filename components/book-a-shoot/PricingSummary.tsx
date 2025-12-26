'use client';

import React from 'react';
import { Clock, Percent, DollarSign, Tag, Loader2 } from 'lucide-react';
import type { QuoteCalculation } from '@/lib/api/pricing';
import { formatCurrency } from '@/lib/api/pricing';

interface PricingSummaryProps {
  quote: QuoteCalculation | null;
  shootHours: number;
  isCalculating?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function PricingSummary({
  quote,
  shootHours,
  isCalculating = false,
  showDetails = true,
  className = '',
}: PricingSummaryProps) {
  if (isCalculating) {
    return (
      <div className={`bg-white border border-[#E5E5E5] rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-[#626467]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Calculating...</span>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className={`bg-white border border-[#E5E5E5] rounded-lg p-6 ${className}`}>
        <p className="text-center text-[#626467]">
          Select items to see pricing breakdown
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#E5E5E5] rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-[#C9A227] text-white px-6 py-4">
        <h3 className="font-semibold text-lg">Quote Summary</h3>
        <div className="flex items-center gap-4 mt-1 text-sm text-white/80">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{shootHours} hour{shootHours !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag className="w-4 h-4" />
            <span className="capitalize">{quote.pricingMode} pricing</span>
          </div>
        </div>
      </div>

      {/* Line Items (if showDetails) */}
      {showDetails && quote.lineItems.length > 0 && (
        <div className="border-b border-[#E5E5E5]">
          <div className="px-6 py-3 bg-gray-50">
            <h4 className="font-medium text-sm text-[#626467] uppercase tracking-wide">
              Selected Services
            </h4>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {quote.lineItems.map((item, index) => (
              <div
                key={`${item.item_id}-${index}`}
                className="flex items-center justify-between px-6 py-3 border-b border-[#F3F4F6] last:border-b-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#212122]">{item.item_name}</p>
                  <p className="text-xs text-[#626467]">
                    {formatCurrency(item.unit_price)} × {item.quantity}
                    {item.rate_type === 'per_hour' && ` × ${shootHours}hr`}
                  </p>
                </div>
                <p className="font-medium text-[#212122]">
                  {formatCurrency(item.line_total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="p-6 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-[#626467]">Subtotal</span>
          <span className="font-medium text-[#212122]">
            {formatCurrency(quote.subtotal)}
          </span>
        </div>

        {/* Discount */}
        {quote.discountPercent > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              <span>Discount ({quote.discountPercent}% for {shootHours}+ hrs)</span>
            </div>
            <span className="font-medium">-{formatCurrency(quote.discountAmount)}</span>
          </div>
        )}

        {/* Price After Discount */}
        {quote.discountPercent > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-[#E5E5E5]">
            <span className="text-[#626467]">Price After Discount</span>
            <span className="font-medium text-[#212122]">
              {formatCurrency(quote.priceAfterDiscount)}
            </span>
          </div>
        )}

        {/* Service Fee */}
        <div className="flex justify-between items-center">
          <span className="text-[#626467]">
            Beige Service Fee ({quote.marginPercent}%)
          </span>
          <span className="font-medium text-[#212122]">
            {formatCurrency(quote.marginAmount)}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-4 border-t-2 border-[#212122]">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#C9A227]" />
            <span className="font-bold text-lg text-[#212122]">Total</span>
          </div>
          <span className="font-bold text-2xl text-[#C9A227]">
            {formatCurrency(quote.total)}
          </span>
        </div>
      </div>

      {/* Discount Info */}
      {quote.discountPercent > 0 && (
        <div className="px-6 py-3 bg-green-50 border-t border-green-100">
          <p className="text-sm text-green-700">
            🎉 You&apos;re saving {formatCurrency(quote.discountAmount)} with the {quote.discountPercent}% 
            multi-hour discount!
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function PricingSummaryCompact({
  quote,
  isCalculating,
}: {
  quote: QuoteCalculation | null;
  isCalculating?: boolean;
}) {
  if (isCalculating) {
    return (
      <div className="flex items-center gap-2 text-[#626467]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Calculating...</span>
      </div>
    );
  }

  if (!quote || quote.lineItems.length === 0) {
    return (
      <p className="text-sm text-[#626467]">No items selected</p>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-[#626467]">
        {quote.lineItems.length} item{quote.lineItems.length !== 1 ? 's' : ''} selected
      </div>
      <div className="text-right">
        {quote.discountPercent > 0 && (
          <p className="text-xs text-green-600">
            -{quote.discountPercent}% discount applied
          </p>
        )}
        <p className="font-bold text-lg text-[#C9A227]">
          {formatCurrency(quote.total)}
        </p>
      </div>
    </div>
  );
}

export default PricingSummary;

