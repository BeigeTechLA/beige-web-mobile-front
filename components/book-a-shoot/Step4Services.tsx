'use client';

import React, { useState, useCallback } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { QuoteBuilder } from './QuoteBuilder';
import type { BookingData } from '@/app/book-a-shoot/page';
import type { SelectedItem } from '@/lib/api/pricing';

interface Step4ServicesProps {
  data: BookingData;
  updateData: (newData: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Services({ data, updateData, onNext, onBack }: Step4ServicesProps) {
  const [isValid, setIsValid] = useState(false);
  const [quoteTotal, setQuoteTotal] = useState(0);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Handle quote changes from the QuoteBuilder
  const handleQuoteChange = useCallback((quoteData: { total: number; items: SelectedItem[] } | null) => {
    if (quoteData) {
      setQuoteTotal(quoteData.total);
      setSelectedItems(quoteData.items);
      setIsValid(quoteData.items.length > 0);
      
      // Store in booking data
      updateData({
        addons: quoteData.items.reduce((acc, item) => {
          acc[String(item.item_id)] = item.quantity;
          return acc;
        }, {} as Record<string, number>),
        budgetMin: quoteData.total,
        budgetMax: quoteData.total,
      });
    } else {
      setQuoteTotal(0);
      setSelectedItems([]);
      setIsValid(false);
    }
  }, [updateData]);

  // Derive shoot hours from date/time if available
  const shootHours = data.studioTimeDuration || 3;

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
      <div className="bg-white rounded-xl overflow-hidden">
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
            flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all
            ${isValid
              ? 'bg-[#C9A227] text-white hover:bg-[#B08D1F]'
              : 'bg-white/20 text-white/50 cursor-not-allowed'
            }
          `}
        >
          Continue to Review
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Selected Summary */}
      {selectedItems.length > 0 && (
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <p className="text-sm text-white/70">
            You&apos;ve selected {selectedItems.length} service{selectedItems.length !== 1 ? 's' : ''} 
            for an estimated total of{' '}
            <span className="text-[#C9A227] font-bold">${quoteTotal.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default Step4Services;

