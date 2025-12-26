'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { QuoteBuilder } from './QuoteBuilder';
import type { BookingData } from '@/app/book-a-shoot/page';
import type { SelectedItem } from '@/lib/api/pricing';
import { selectQuote, selectSelectedItems } from '@/lib/redux/features/pricing/pricingSlice';

interface Step4ServicesProps {
  data: BookingData;
  updateData: (newData: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Services({ data, updateData, onNext, onBack }: Step4ServicesProps) {
  // Get quote state from Redux
  const reduxQuote = useSelector(selectQuote);
  const reduxSelectedItems = useSelector(selectSelectedItems);
  
  const [localQuoteTotal, setLocalQuoteTotal] = useState(0);
  const [localSelectedItems, setLocalSelectedItems] = useState<SelectedItem[]>([]);

  // Determine validity - either from local state or redux
  const isValid = useMemo(() => {
    return (reduxSelectedItems.length > 0) || (localSelectedItems.length > 0);
  }, [reduxSelectedItems, localSelectedItems]);

  const quoteTotal = reduxQuote?.total || localQuoteTotal;
  const displayItems = reduxSelectedItems.length > 0 ? reduxSelectedItems : localSelectedItems;

  // Handle quote changes from the QuoteBuilder
  const handleQuoteChange = useCallback((quoteData: { total: number; items: SelectedItem[] } | null) => {
    if (quoteData) {
      setLocalQuoteTotal(quoteData.total);
      setLocalSelectedItems(quoteData.items);
      
      // Store in booking data
      updateData({
        selectedServices: quoteData.items,
        quoteTotal: quoteData.total,
      });
    } else {
      setLocalQuoteTotal(0);
      setLocalSelectedItems([]);
    }
  }, [updateData]);

  // Calculate shoot hours from start/end dates or fallback
  const shootHours = useMemo(() => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
      return hours;
    }
    return data.studioTimeDuration || 3;
  }, [data.startDate, data.endDate, data.studioTimeDuration]);

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-4xl font-bold mb-2">
          Select Your Services
        </h1>
        <p className="text-white/70 text-sm lg:text-base max-w-2xl mx-auto">
          Build your custom package by selecting the services you need. 
          Prices are calculated based on your shoot duration and selections.
        </p>
      </div>

      {/* Quote Builder */}
      <div className="bg-[#171717] rounded-xl overflow-hidden border border-white/10">
        <QuoteBuilder
          eventType={data.shootType}
          initialHours={shootHours}
          onQuoteChange={handleQuoteChange}
          showSummary={true}
          className="p-4 lg:p-6"
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 text-white/70 hover:text-white transition-colors"
        >
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!isValid}
          className={`
            flex items-center gap-2 px-8 py-3 lg:py-4 rounded-[12px] font-bold text-base lg:text-xl transition-all
            ${isValid
              ? 'bg-[#E8D1AB] text-black hover:bg-[#dcb98a]'
              : 'bg-white/20 text-white/50 cursor-not-allowed'
            }
          `}
        >
          Continue to Review
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Selected Summary */}
      {displayItems.length > 0 && (
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <p className="text-sm text-white/70">
            You&apos;ve selected {displayItems.length} service{displayItems.length !== 1 ? 's' : ''} 
            for an estimated total of{' '}
            <span className="text-[#E8D1AB] font-bold">${quoteTotal.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default Step4Services;

