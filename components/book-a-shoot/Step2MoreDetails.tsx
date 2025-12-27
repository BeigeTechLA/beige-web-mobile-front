"use client";

import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData, CrewBreakdown } from "@/app/book-a-shoot/page";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Loader2,
  Plus,
  Minus,
  Users,
} from "lucide-react";
import { QuantityControl } from "./QuantityControl";
import {
  useGetCatalogQuery,
  useCalculateQuoteMutation,
} from "@/lib/redux/features/pricing/pricingApi";
import {
  selectSelectedItems,
  selectQuote,
  toggleItem,
  updateItemQuantity,
  setQuote,
  setCatalog,
  setPricingMode,
} from "@/lib/redux/features/pricing/pricingSlice";
import {
  setCrewSize as setReduxCrewSize,
  setCrewBreakdown as setReduxCrewBreakdown,
} from "@/lib/redux/features/booking/bookingSlice";
import { formatCurrency, determinePricingMode } from "@/lib/api/pricing";
import type { PricingCategory } from "@/lib/api/pricing";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Content type display names
const CONTENT_TYPE_LABELS: Record<string, string> = {
  videographer: "Videographer",
  photographer: "Photographer",
  cinematographer: "Cinematographer",
};

// Crew Size Stepper Component
function CrewSizeStepper({
  value,
  onIncrease,
  onDecrease,
  min = 1,
  max = 20,
}: {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= min}
        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <Minus className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
      </button>
      <span className="text-white text-xl lg:text-2xl font-bold w-12 text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={value >= max}
        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
      </button>
    </div>
  );
}

// Crew Breakdown Row Component
function CrewBreakdownRow({
  type,
  label,
  count,
  onIncrease,
  onDecrease,
  canIncrease,
}: {
  type: string;
  label: string;
  count: number;
  onIncrease: () => void;
  onDecrease: () => void;
  canIncrease: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E8D1AB]/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#E8D1AB]" />
        </div>
        <span className="text-white font-medium text-base lg:text-lg">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          disabled={count <= 0}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>
        <span className="text-white text-lg font-medium w-8 text-center">
          {count}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={!canIncrease}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// Collapsible AddOn Category Component
function AddOnCategory({
  category,
  selectedItems,
  onToggle,
  onUpdateQty,
}: {
  category: PricingCategory;
  selectedItems: Map<number, number>;
  onToggle: (itemId: number) => void;
  onUpdateQty: (itemId: number, qty: number) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedCount = category.items.filter(
    (item) =>
      selectedItems.has(item.item_id) &&
      (selectedItems.get(item.item_id) || 0) > 0
  ).length;

  return (
    <div className="bg-[#171717] rounded-lg lg:rounded-[22px] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 lg:px-[30px] ${
          isOpen ? "lg:py-[30px]" : "lg:py-6"
        } text-white font-medium text-base lg:text-xl`}
      >
        <span className="flex items-center gap-3">
          {category.name}
          {selectedCount > 0 && (
            <span className="bg-[#E8D1AB] text-black text-xs font-medium px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>

      {isOpen && (
        <>
          <hr className="border-white/10" />
          <div className="bg-[#101010] m-4 lg:m-[30px] p-4 lg:p-[30px] rounded-lg lg:rounded-[22px] space-y-6">
            {category.items.map((item) => {
              const qty = selectedItems.get(item.item_id) || 0;
              const isSelected = qty > 0;
              const rate = parseFloat(String(item.rate));

              return (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between border-b border-white/5 pb-5 last:border-0 last:pb-0"
                >
                  <label className="flex items-start gap-4 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(item.item_id)}
                      className="mt-1 w-4 h-4 rounded border-white/30 bg-transparent accent-[#E8D1AB]"
                    />
                    <div>
                      <p className="text-white font-medium lg:text-[18px]">
                        {item.name}
                      </p>
                      <p className="text-[#E8D1AB] font-light text-sm lg:text-base">
                        {formatCurrency(rate)}
                        {item.rate_type === "per_hour" && " /hr"}
                      </p>
                    </div>
                  </label>
                  <QuantityControl
                    value={qty}
                    onIncrease={() => onUpdateQty(item.item_id, qty + 1)}
                    onDecrease={() =>
                      onUpdateQty(item.item_id, Math.max(0, qty - 1))
                    }
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export const Step2MoreDetails = ({ data, updateData, onNext }: Props) => {
  const dispatch = useDispatch();

  // Use ref to avoid stale closure issues with updateData
  const updateDataRef = useRef(updateData);
  updateDataRef.current = updateData;

  // Get pricing mode from shoot type
  const pricingMode = useMemo(
    () => determinePricingMode(data.shootType),
    [data.shootType]
  );

  // Fetch pricing catalog based on shoot type
  const { data: categories, isLoading: isCatalogLoading } = useGetCatalogQuery(
    { mode: pricingMode, eventType: data.shootType },
    { skip: !data.shootType }
  );

  // Calculate quote mutation
  const [calculateQuote] = useCalculateQuoteMutation();

  // Redux state
  const selectedItems = useSelector(selectSelectedItems);
  const quote = useSelector(selectQuote);

  // Convert selectedItems to Map for easy lookup
  const selectedItemsMap = useMemo(() => {
    const map = new Map<number, number>();
    selectedItems.forEach((item) => map.set(item.item_id, item.quantity));
    return map;
  }, [selectedItems]);

  // Update pricing mode in Redux when data changes
  useEffect(() => {
    if (pricingMode) {
      dispatch(setPricingMode(pricingMode));
    }
  }, [pricingMode, dispatch]);

  // Sync crew size and breakdown to Redux for global access (cart icon, etc.)
  useEffect(() => {
    dispatch(setReduxCrewSize(data.crewSize));
  }, [data.crewSize, dispatch]);

  useEffect(() => {
    dispatch(setReduxCrewBreakdown(data.crewBreakdown));
  }, [data.crewBreakdown, dispatch]);

  // Update catalog in Redux when data loads
  useEffect(() => {
    if (categories) {
      dispatch(setCatalog(categories));
    }
  }, [categories, dispatch]);

  // Recalculate quote when items change (only when user interacts with addons)
  useEffect(() => {
    // Only run if user has selected "yes" to addons
    if (data.wantsAddons !== "yes") return;

    if (selectedItems.length === 0) {
      dispatch(
        setQuote({
          pricingMode,
          shootHours: data.studioTimeDuration || 3,
          lineItems: [],
          subtotal: 0,
          discountPercent: 0,
          discountAmount: 0,
          priceAfterDiscount: 0,
          marginPercent: 25,
          marginAmount: 0,
          total: 0,
        })
      );
      return;
    }

    const recalculate = async () => {
      try {
        const result = await calculateQuote({
          items: selectedItems,
          shootHours: data.studioTimeDuration || 3,
          eventType: data.shootType,
        }).unwrap();
        dispatch(setQuote(result));
        // Update booking data with quote total using ref to avoid dependency
        updateDataRef.current({
          quoteTotal: result.total,
          selectedServices: selectedItems,
        });
      } catch (err) {
        console.error("Quote calculation failed:", err);
      }
    };

    const timeoutId = setTimeout(recalculate, 300);
    return () => clearTimeout(timeoutId);
  }, [
    selectedItems,
    data.studioTimeDuration,
    data.shootType,
    data.wantsAddons,
    pricingMode,
    calculateQuote,
    dispatch,
  ]);

  const handleToggleItem = useCallback(
    (itemId: number) => {
      dispatch(toggleItem({ itemId, defaultQuantity: 1 }));
    },
    [dispatch]
  );

  const handleUpdateQuantity = useCallback(
    (itemId: number, qty: number) => {
      dispatch(updateItemQuantity({ itemId, quantity: qty }));
    },
    [dispatch]
  );

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const clickedValue = Math.round((percentage * 20000) / 100) * 100;

    const distanceToMin = Math.abs(clickedValue - data.budgetMin);
    const distanceToMax = Math.abs(clickedValue - data.budgetMax);

    if (distanceToMin < distanceToMax) {
      updateData({ budgetMin: Math.min(clickedValue, data.budgetMax - 500) });
    } else {
      updateData({ budgetMax: Math.max(clickedValue, data.budgetMin + 500) });
    }
  };

  const handleNext = () => {
    if (!data.shootName) {
      toast.error("Input Required", {
        description: "Please enter a shoot name.",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-12 mx-0 w-full py-6 md:py-12 px-6 lg:px-0">
      <div className="flex flex-col gap-8 justify-center">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">
            Add Information & Budget
          </h2>
          <p className="text-xs lg:text-sm text-[#939393]">
            Share your requirements and set your budget.
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:gap-9">
          {/* Shoot Name */}
          <div className="relative w-full">
            <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
              Shoot Name
            </label>
            <input
              type="text"
              value={data.shootName}
              onChange={(e) => updateData({ shootName: e.target.value })}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-[#E8D1AB] bg-[#101010]"
              placeholder="Shoot Name"
            />
          </div>

          {/* Dynamic Crew Size Section */}
          <div className="bg-[#171717] rounded-[16px] p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-medium text-base lg:text-lg">
                  Total Crew Size
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  Set the total crew members needed
                </p>
              </div>
              <CrewSizeStepper
                value={data.crewSize}
                onIncrease={() => updateData({ crewSize: data.crewSize + 1 })}
                onDecrease={() => {
                  const newSize = Math.max(1, data.crewSize - 1);
                  // Also adjust breakdown if total exceeds new size
                  const currentTotal = Object.values(data.crewBreakdown).reduce(
                    (a, b) => a + b,
                    0
                  );
                  if (currentTotal > newSize) {
                    // Proportionally reduce breakdown
                    const breakdown = { ...data.crewBreakdown };
                    let excess = currentTotal - newSize;
                    const types = Object.keys(
                      breakdown
                    ) as (keyof CrewBreakdown)[];
                    for (const type of types.reverse()) {
                      if (excess <= 0) break;
                      const reduction = Math.min(breakdown[type], excess);
                      breakdown[type] -= reduction;
                      excess -= reduction;
                    }
                    updateData({ crewSize: newSize, crewBreakdown: breakdown });
                  } else {
                    updateData({ crewSize: newSize });
                  }
                }}
                min={1}
                max={20}
              />
            </div>

            {/* Crew Breakdown - Only show if content types are selected */}
            {data.contentType.length > 0 && data.contentType[0] !== "all" && (
              <>
                <hr className="border-white/10 mb-4" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white/70 text-sm lg:text-base">
                      Crew Breakdown
                    </h4>
                    <span className="text-[#E8D1AB] text-sm">
                      {Object.values(data.crewBreakdown).reduce(
                        (a, b) => a + b,
                        0
                      )}{" "}
                      / {data.crewSize} assigned
                    </span>
                  </div>
                  {data.contentType
                    .filter((type) => type !== "all")
                    .map((type) => {
                      const currentTotal = Object.values(
                        data.crewBreakdown
                      ).reduce((a, b) => a + b, 0);
                      const canIncrease = currentTotal < data.crewSize;
                      const breakdownKey = type as keyof CrewBreakdown;

                      return (
                        <CrewBreakdownRow
                          key={type}
                          type={type}
                          label={CONTENT_TYPE_LABELS[type] || type}
                          count={data.crewBreakdown[breakdownKey] || 0}
                          canIncrease={canIncrease}
                          onIncrease={() => {
                            if (canIncrease) {
                              updateData({
                                crewBreakdown: {
                                  ...data.crewBreakdown,
                                  [breakdownKey]:
                                    (data.crewBreakdown[breakdownKey] || 0) + 1,
                                },
                              });
                            }
                          }}
                          onDecrease={() => {
                            if (data.crewBreakdown[breakdownKey] > 0) {
                              updateData({
                                crewBreakdown: {
                                  ...data.crewBreakdown,
                                  [breakdownKey]:
                                    data.crewBreakdown[breakdownKey] - 1,
                                },
                              });
                            }
                          }}
                        />
                      );
                    })}
                </div>
              </>
            )}
          </div>

          {/* Reference Link */}
          <div className="relative w-full">
            <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
              Reference Link
            </label>
            <input
              type="text"
              value={data.referenceLink}
              onChange={(e) => updateData({ referenceLink: e.target.value })}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-[#E8D1AB] bg-[#101010]"
              placeholder="URL"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Special Note */}
            <div className="relative w-full">
              <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
                Special Note
              </label>
              <textarea
                value={data.specialNote}
                onChange={(e) => updateData({ specialNote: e.target.value })}
                className="h-24 lg:h-[162px] w-full p-4 rounded-[12px] border border-white/30 text-white outline-none focus:border-[#E8D1AB] bg-[#101010] resize-none"
                placeholder="Any specific requirements..."
              />
            </div>

            {/* Budget Range */}
            <div className="relative w-full">
              <div className="w-full bg-[#171717] rounded-[12px] p-3 lg:p-6">
                <label className="block mb-3 text-sm lg:text-base font-medium text-white">
                  Budget Range
                </label>
                <div
                  onClick={handleTrackClick}
                  className="relative w-full h-1 lg:h-[6px] bg-[#4D4D4D] rounded-full my-5 cursor-pointer"
                >
                  <div
                    className="absolute h-1 lg:h-[6px] bg-[#E8D1AB] rounded-full pointer-events-none"
                    style={{
                      left: `${(data.budgetMin / 20000) * 100}%`,
                      width: `${
                        ((data.budgetMax - data.budgetMin) / 20000) * 100
                      }%`,
                    }}
                  />
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={data.budgetMin}
                    onChange={(e) =>
                      updateData({
                        budgetMin: Math.min(
                          Number(e.target.value),
                          data.budgetMax - 500
                        ),
                      })
                    }
                    className={`absolute top-[-10px] left-0 w-full appearance-none bg-transparent pointer-events-none focus:outline-none ${
                      data.budgetMin > 15000 ? "z-[5]" : "z-[3]"
                    } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto`}
                  />
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={data.budgetMax}
                    onChange={(e) =>
                      updateData({
                        budgetMax: Math.max(
                          Number(e.target.value),
                          data.budgetMin + 500
                        ),
                      })
                    }
                    className="absolute top-[-10px] left-0 z-[4] w-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto"
                  />
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm lg:text-base text-white/60">
                      Minimum
                    </p>
                    <p className="text-sm lg:text-base font-medium text-white">
                      ${data.budgetMin.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm lg:text-base text-white/60">
                      Maximum
                    </p>
                    <p className="text-sm lg:text-base font-medium text-white">
                      ${data.budgetMax.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-white/10 my-4" />

        {/* Add-ons Section */}
        <div className="flex flex-col gap-6 lg:gap-10">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">
            Do you want the Add on?
          </h2>

          <div className="flex gap-3 lg:gap-6">
            {[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  updateData({ wantsAddons: item.value as "yes" | "no" })
                }
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-4 flex items-center justify-between transition-all ${
                  data.wantsAddons === item.value
                    ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                    : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"
                }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">
                  {item.label}
                </span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
                    data.wantsAddons === item.value
                      ? "bg-black"
                      : "border border-[#E5E5E5]"
                  }`}
                >
                  {data.wantsAddons === item.value && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Dynamic Add-ons from API */}
          {data.wantsAddons === "yes" && (
            <div className="flex flex-col gap-4 mt-4">
              {isCatalogLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E8D1AB]" />
                  <span className="ml-2 text-white/60">Loading add-ons...</span>
                </div>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <AddOnCategory
                    key={category.category_id}
                    category={category}
                    selectedItems={selectedItemsMap}
                    onToggle={handleToggleItem}
                    onUpdateQty={handleUpdateQuantity}
                  />
                ))
              ) : (
                <p className="text-white/60 text-center py-8">
                  {data.shootType
                    ? "No add-ons available for this shoot type."
                    : "Please select a shoot type first."}
                </p>
              )}

              {/* Live Quote Summary */}
              {quote && quote.total > 0 && (
                <div className="mt-4 p-4 lg:p-6 bg-[#171717] rounded-[12px] border border-[#E8D1AB]/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">
                        Selected Add-ons Total
                      </p>
                      {quote.discountPercent > 0 && (
                        <p className="text-[#47C30D] text-xs mt-1">
                          {quote.discountPercent}% discount applied
                        </p>
                      )}
                    </div>
                    <p className="text-[#E8D1AB] font-bold text-xl lg:text-2xl">
                      {formatCurrency(quote.total)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-8">
        <Button
          onClick={handleNext}
          className="h-12 lg:h-[72px] w-full md:w-[185px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold text-base lg:text-xl rounded-[12px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
