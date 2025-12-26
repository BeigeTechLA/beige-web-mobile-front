'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { CategorySection } from './CategorySection';
import { PricingSummary, PricingSummaryCompact } from './PricingSummary';
import {
  selectCategories,
  selectSelectedItems,
  selectShootHours,
  selectQuote,
  selectIsLoadingCatalog,
  selectIsCalculating,
  selectPricingMode,
  setShootHours,
  toggleItem,
  updateItemQuantity,
  clearItems,
  setQuote,
  setCalculating,
  setCalculationError,
  setCatalog,
  setCatalogLoading,
  setCatalogError,
  setPricingMode,
} from '@/lib/redux/features/pricing/pricingSlice';
import { useGetCatalogQuery, useCalculateQuoteMutation } from '@/lib/redux/features/pricing/pricingApi';
import type { RootState } from '@/lib/redux/store';
import type { SelectedItem } from '@/lib/api/pricing';

interface QuoteBuilderProps {
  eventType?: string;
  initialHours?: number;
  onQuoteChange?: (quote: { total: number; items: SelectedItem[] } | null) => void;
  className?: string;
  showSummary?: boolean;
}

export function QuoteBuilder({
  eventType,
  initialHours = 3,
  onQuoteChange,
  className = '',
  showSummary = true,
}: QuoteBuilderProps) {
  const dispatch = useDispatch();
  
  // Redux state
  const categories = useSelector(selectCategories);
  const selectedItems = useSelector(selectSelectedItems);
  const shootHours = useSelector(selectShootHours);
  const quote = useSelector(selectQuote);
  const isLoadingCatalog = useSelector(selectIsLoadingCatalog);
  const isCalculating = useSelector(selectIsCalculating);
  const pricingMode = useSelector(selectPricingMode);
  
  // Determine pricing mode from event type
  const effectivePricingMode = useMemo(() => {
    if (!eventType) return 'general';
    const normalized = eventType.toLowerCase();
    const weddingKeywords = ['wedding', 'bridal', 'engagement', 'ceremony', 'reception'];
    return weddingKeywords.some(kw => normalized.includes(kw)) ? 'wedding' : 'general';
  }, [eventType]);

  // RTK Query
  const { data: catalogData, isLoading: isCatalogLoading, error: catalogError, refetch } = useGetCatalogQuery(
    { mode: effectivePricingMode },
    { skip: false }
  );
  
  const [calculateQuote, { isLoading: isQuoteLoading }] = useCalculateQuoteMutation();

  // Sync catalog data with Redux
  useEffect(() => {
    if (catalogData) {
      dispatch(setCatalog(catalogData));
      dispatch(setCatalogLoading(false));
    }
  }, [catalogData, dispatch]);

  useEffect(() => {
    dispatch(setCatalogLoading(isCatalogLoading));
  }, [isCatalogLoading, dispatch]);

  useEffect(() => {
    if (catalogError) {
      dispatch(setCatalogError('Failed to load pricing catalog'));
    }
  }, [catalogError, dispatch]);

  // Update pricing mode when event type changes
  useEffect(() => {
    dispatch(setPricingMode(effectivePricingMode));
  }, [effectivePricingMode, dispatch]);

  // Set initial hours
  useEffect(() => {
    if (initialHours !== shootHours) {
      dispatch(setShootHours(initialHours));
    }
  }, []);

  // Convert selectedItems array to Map for CategorySection
  const selectedItemsMap = useMemo(() => {
    const map = new Map<number, number>();
    selectedItems.forEach(item => {
      map.set(item.item_id, item.quantity);
    });
    return map;
  }, [selectedItems]);

  // Calculate quote when selection changes
  useEffect(() => {
    const calculateNewQuote = async () => {
      if (selectedItems.length === 0) {
        dispatch(setQuote({
          pricingMode: effectivePricingMode,
          shootHours,
          lineItems: [],
          subtotal: 0,
          discountPercent: 0,
          discountAmount: 0,
          priceAfterDiscount: 0,
          marginPercent: 25,
          marginAmount: 0,
          total: 0,
        }));
        onQuoteChange?.(null);
        return;
      }

      dispatch(setCalculating(true));
      
      try {
        const result = await calculateQuote({
          items: selectedItems,
          shootHours,
          eventType,
        }).unwrap();
        
        dispatch(setQuote(result));
        onQuoteChange?.({ total: result.total, items: selectedItems });
      } catch (error) {
        console.error('Failed to calculate quote:', error);
        dispatch(setCalculationError('Failed to calculate quote'));
      }
    };

    // Debounce the calculation
    const timeoutId = setTimeout(calculateNewQuote, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedItems, shootHours, eventType, effectivePricingMode, calculateQuote, dispatch, onQuoteChange]);

  // Handlers
  const handleToggleItem = useCallback((itemId: number) => {
    dispatch(toggleItem({ itemId, defaultQuantity: 1 }));
  }, [dispatch]);

  const handleUpdateQuantity = useCallback((itemId: number, quantity: number) => {
    dispatch(updateItemQuantity({ itemId, quantity }));
  }, [dispatch]);

  const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    dispatch(setShootHours(value));
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(clearItems());
  }, [dispatch]);

  // Loading state
  if (isLoadingCatalog || isCatalogLoading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-[#C9A227]" />
        <span className="ml-2 text-[#626467]">Loading pricing catalog...</span>
      </div>
    );
  }

  // Error state
  if (catalogError) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 ${className}`}>
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-[#626467] mb-4">Failed to load pricing catalog</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#C9A227] text-white rounded-lg hover:bg-[#B08D1F] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Categories and Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header with hours selector */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-lg text-[#212122]">Build Your Quote</h2>
                <p className="text-sm text-[#626467]">
                  Select services for your{' '}
                  <span className="capitalize font-medium">{effectivePricingMode}</span> shoot
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Shoot Hours */}
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#626467]" />
                  <label htmlFor="shootHours" className="text-sm text-[#626467]">
                    Shoot Hours:
                  </label>
                  <input
                    id="shootHours"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={shootHours}
                    onChange={handleHoursChange}
                    className="w-20 px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>

                {/* Clear All */}
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Compact summary for mobile */}
            <div className="mt-4 pt-4 border-t border-[#E5E5E5] lg:hidden">
              <PricingSummaryCompact quote={quote} isCalculating={isCalculating || isQuoteLoading} />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            {categories.map((category, index) => (
              <CategorySection
                key={category.category_id}
                category={category}
                selectedItems={selectedItemsMap}
                shootHours={shootHours}
                onToggleItem={handleToggleItem}
                onUpdateQuantity={handleUpdateQuantity}
                defaultExpanded={index === 0}
              />
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12 text-[#626467]">
              <p>No pricing items available for {effectivePricingMode} mode.</p>
            </div>
          )}
        </div>

        {/* Right: Pricing Summary (Desktop) */}
        {showSummary && (
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <PricingSummary
                quote={quote}
                shootHours={shootHours}
                isCalculating={isCalculating || isQuoteLoading}
                showDetails={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Summary (Fixed Bottom) */}
      {showSummary && quote && quote.lineItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] shadow-lg p-4 z-50">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#626467]">
                  {quote.lineItems.length} item{quote.lineItems.length !== 1 ? 's' : ''}
                </p>
                {quote.discountPercent > 0 && (
                  <p className="text-xs text-green-600">
                    {quote.discountPercent}% discount applied
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-[#626467]">Total</p>
                <p className="font-bold text-xl text-[#C9A227]">
                  ${quote.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuoteBuilder;

