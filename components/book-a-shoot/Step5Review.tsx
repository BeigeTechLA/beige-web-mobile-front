"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "@/app/book-a-shoot/page";
import { toast } from "sonner";

import Image from "next/image";
import { calculateDuration, formatISOToDateTime } from "@/lib/utils";
import { CalendarFold, ChevronDown, Clock, MapPin, Loader2 } from "lucide-react";
import { Separator } from "@/app/search-results/[creatorId]/components/Separator";
import { Separator as CenterSeparator } from "@/src/components/landing/Separator";
import { selectQuote, selectShootHours, selectSelectedItems } from "@/lib/redux/features/pricing/pricingSlice";
import { formatCurrency } from "@/lib/api/pricing";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

// Map shoot types to images
const shootTypeImages: Record<string, string> = {
  wedding: "/images/projects/Wedding.png",
  music: "/images/projects/Music.png",
  commercial: "/images/projects/Commercial.png",
  tv: "/images/projects/TV.png",
  podcast: "/images/projects/Podcast.png",
  short_film: "/images/projects/ShortFilm.png",
  movie: "/images/projects/Movie.png",
  corporate: "/images/projects/Corporate.png",
  private: "/images/projects/Private.png",
};

export const Step5Review = ({ data, updateData, onNext, isSubmitting = false }: Props) => {
  const [costSummaryOpen, setCostSummaryOpen] = useState(true);
  
  // Get quote data from Redux
  const quote = useSelector(selectQuote);
  const shootHours = useSelector(selectShootHours);
  const selectedItems = useSelector(selectSelectedItems);

  // Validate email before submission
  const handleSubmit = () => {
    if (!data.guestEmail || !data.guestEmail.includes('@')) {
      toast.error("Email Required", { description: "Please enter a valid email address." });
      return;
    }
    onNext();
  };

  // Get appropriate image for shoot type
  const getShootImage = () => {
    const key = data.shootType?.toLowerCase();
    return shootTypeImages[key] || "/images/projects/Wedding.png";
  };

  // Calculate total from quote or fallback to 0
  const totalAmount = quote?.total || 0;

  return (
    <div className="flex flex-col gap-6 lg:gap-12 mx-0 w-full py-6 md:py-12 px-6 lg:px-0">
      <div className="flex flex-col gap-8 justify-center">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">Review & Match</h2>
          <p className="text-xs lg:text-sm text-[#939393]">Review your requirements to find the best matching creators.</p>
        </div>

        {/* Project Summary Card */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 p-4 md:p-6 bg-[#171717] rounded-lg lg:rounded-[20px]">
          <div className="w-full lg:w-[326px] relative shrink-0 rounded-lg lg:rounded-[20px] h-[200px] lg:h-[267px] overflow-hidden">
            <Image
              src={getShootImage()}
              alt={data?.shootType || "Shoot Image"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 lg:gap-8 w-full min-w-0">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div>
                <h3 className="text-base lg:text-xl text-white">
                  {data.shootName || "Untitled Shoot"} ({data.shootType || "Shoot"} • {data.contentType?.join(', ') || "All"})
                </h3>
                <p className="text-xs lg:text-sm text-white/70">
                  #{data?.editType || "Edit Type Not Specified"}
                </p>
              </div>
              <div className="p-4 lg:px-6 lg:py-5 rounded-[10px] text-base lg:text-xl bg-[#E8D1AB] text-black font-medium whitespace-nowrap">
                Total {formatCurrency(totalAmount)}
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-4 lg:gap-6">
              <div className="flex items-center gap-3">
                <div className=""><Clock className="w-4 h-4 text-[#D9D9D9]" /></div>
                <div>
                  <p className="text-sm font-medium text-[#D9D9D9]">
                    {calculateDuration(data.startDate, data.endDate) || `${shootHours} hours`} 
                    <span className="text-[#E8D1AB]"> (Estimated Duration)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className=""><CalendarFold className="w-4 h-4 text-[#D9D9D9]" /></div>
                <div>
                  <p className="text-sm font-medium text-[#D9D9D9]">
                    {formatISOToDateTime(data.startDate)} - {formatISOToDateTime(data.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className=""><MapPin className="w-4 h-4 text-[#D9D9D9]" /></div>
                <div>
                  <p className="text-sm font-medium text-[#D9D9D9]">
                    {typeof data.location === 'string'
                      ? data.location
                      : data.location || 'Location not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary Accordion */}
        <div className="flex flex-col w-full bg-[#171717] rounded-lg lg:rounded-[20px]">
          <button
            onClick={() => setCostSummaryOpen(!costSummaryOpen)}
            className="flex w-full items-center justify-between p-5"
          >
            <h2 className="text-lg lg:text-2xl font-bold tracking-tight">Cost Summary</h2>
            <div
              className={`transform transition-transform duration-300 ${costSummaryOpen ? "rotate-180" : "rotate-0"}`}
            >
              <ChevronDown className="h-6 w-6 text-white" />
            </div>
          </button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden border-t border-white/20 ${costSummaryOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"} p-4 lg:p-[30px]`}
          >
            <div className="space-y-4 lg:space-y-[30px]">
              {/* Selected Services from Quote */}
              {quote && quote.lineItems.length > 0 ? (
                <>
                  <div className="flex flex-col gap-3 lg:gap-6">
                    {quote.lineItems.map((item, index) => (
                      <div key={`${item.item_id}-${index}`} className="flex justify-between text-sm lg:text-lg text-white/80">
                        <span>
                          {item.item_name} 
                          {item.quantity > 1 && ` × ${item.quantity}`}
                          {item.rate_type === 'per_hour' && ` (${shootHours}hrs)`}
                        </span>
                        <span className="lg:text-xl font-medium text-white">
                          {formatCurrency(item.line_total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <CenterSeparator />

                  {/* Subtotal */}
                  <div className="flex justify-between text-sm lg:text-lg text-white">
                    <span className="font-bold">Subtotal</span>
                    <span className="lg:text-xl font-medium">{formatCurrency(quote.subtotal)}</span>
                  </div>

                  {/* Discount (if applicable) */}
                  {quote.discountPercent > 0 && (
                    <>
                      <div className="flex justify-between text-sm lg:text-lg text-[#47C30D]">
                        <span>Discount ({quote.discountPercent}% for {shootHours}+ hours)</span>
                        <span className="lg:text-xl font-medium">-{formatCurrency(quote.discountAmount)}</span>
                      </div>

                      <div className="flex justify-between text-sm lg:text-lg text-white">
                        <span>Price After Discount</span>
                        <span className="lg:text-xl font-medium">{formatCurrency(quote.priceAfterDiscount)}</span>
                      </div>
                    </>
                  )}

                  {/* Service Fee */}
                  <div className="flex justify-between text-sm lg:text-lg text-white/80">
                    <span>Beige Service Fee ({quote.marginPercent}%)</span>
                    <span className="lg:text-xl font-medium text-white">{formatCurrency(quote.marginAmount)}</span>
                  </div>

                  <CenterSeparator />

                  {/* Total */}
                  <div className="flex justify-between font-semibold text-sm lg:text-lg text-white">
                    <span className="text-lg lg:text-xl">Total</span>
                    <span className="text-xl lg:text-2xl text-[#E8D1AB]">{formatCurrency(quote.total)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <p>No services selected yet.</p>
                  <p className="text-sm mt-2">Go back to the Services step to build your quote.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Discount Banner */}
        {quote && quote.discountPercent > 0 && (
          <div className="p-4 bg-[#47C30D]/20 border border-[#47C30D]/40 rounded-lg">
            <p className="text-sm lg:text-base text-[#47C30D] font-medium">
              🎉 You&apos;re saving {formatCurrency(quote.discountAmount)} with the {quote.discountPercent}% multi-hour discount!
            </p>
          </div>
        )}

        {/* Email Input */}
        <div className="mt-4 relative w-full">
          <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
            Your Email Address *
          </label>
          <input
            type="email"
            value={data.guestEmail}
            onChange={(e) => updateData({ guestEmail: e.target.value })}
            placeholder="email@example.com"
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-[#E8D1AB] focus:ring-1 focus:ring-[#E8D1AB] bg-[#101010]"
            required
          />
          <p className="text-xs lg:text-sm text-white/70 mt-2">
            We&apos;ll send booking confirmation and creator matches to this email
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !data.guestEmail}
          className="h-12 lg:h-[72px] w-full lg:w-[336px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold text-base lg:text-xl rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding Creators...
            </span>
          ) : (
            "Find Creative Partner"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step5Review;

