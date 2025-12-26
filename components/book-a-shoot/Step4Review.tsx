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
import {
  selectQuote,
  selectShootHours,
  selectSelectedItems,
} from "@/lib/redux/features/pricing/pricingSlice";
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
  corporate_event: "/images/projects/Corporate.png",
  private: "/images/projects/Private.png",
  private_event: "/images/projects/Private.png",
};

export const Step4Review = ({
  data,
  updateData,
  onNext,
  isSubmitting = false,
}: Props) => {
  const [costSummaryOpen, setCostSummaryOpen] = useState(true);

  // Get quote data from Redux
  const quote = useSelector(selectQuote);
  const shootHours = useSelector(selectShootHours);
  const selectedItems = useSelector(selectSelectedItems);

  // Validate email before submission
  const handleSubmit = () => {
    if (!data.guestEmail || !data.guestEmail.includes("@")) {
      toast.error("Email Required", {
        description: "Please enter a valid email address.",
      });
      return;
    }
    onNext();
  };

  // Get appropriate image for shoot type
  const getShootImage = () => {
    const key = data.shootType?.toLowerCase();
    return shootTypeImages[key] || "/images/projects/Wedding.png";
  };

  // Calculate total from quote or fallback
  const totalAmount = quote?.total || data.quoteTotal || 0;

  // Get display content type
  const getContentTypeDisplay = () => {
    if (!data.contentType || data.contentType.length === 0) return "All";
    return data.contentType
      .filter((t) => t !== "all")
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(", ");
  };

  // Calculate duration display
  const getDurationDisplay = () => {
    if (data.startDate && data.endDate) {
      return calculateDuration(data.startDate, data.endDate);
    }
    return `${shootHours || data.studioTimeDuration || 3} Hours`;
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-12 mx-0 w-full py-6 md:py-12 px-6 lg:px-0">
      <div className="flex flex-col gap-8 justify-center">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">
            Review & Match
          </h2>
          <p className="text-xs lg:text-sm text-[#939393]">
            Review your requirements to find the best matching creators.
          </p>
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
          <div className="flex flex-col gap-4 lg:gap-6 w-full min-w-0">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div>
                <h3 className="text-base lg:text-xl text-white font-medium">
                  {data.shootName || "Untitled Shoot"} ({data.shootType || "Shoot"})
                </h3>
                <p className="text-xs lg:text-sm text-white/70">
                  #{getContentTypeDisplay()}
                </p>
              </div>
              <div className="p-4 lg:px-6 lg:py-5 rounded-[10px] text-base lg:text-xl bg-[#E8D1AB] text-black font-medium whitespace-nowrap self-start">
                Total {formatCurrency(totalAmount)}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4 lg:gap-5">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#D9D9D9]" />
                <p className="text-sm font-medium text-[#D9D9D9]">
                  {getDurationDisplay()}
                  <span className="text-[#E8D1AB]"> (Estimated Duration)</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CalendarFold className="w-4 h-4 text-[#D9D9D9]" />
                <p className="text-sm font-medium text-[#D9D9D9]">
                  {data.startDate
                    ? `${formatISOToDateTime(data.startDate)}${
                        data.endDate ? ` - ${formatISOToDateTime(data.endDate)}` : ""
                      }`
                    : "Date not specified"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#D9D9D9]" />
                <p className="text-sm font-medium text-[#D9D9D9]">
                  {data.location || "Location not specified"}
                </p>
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
            <h2 className="text-lg lg:text-2xl font-bold tracking-tight">
              Cost Summary
            </h2>
            <div
              className={`transform transition-transform duration-300 ${
                costSummaryOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              <ChevronDown className="h-6 w-6 text-white" />
            </div>
          </button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden border-t border-white/20 ${
              costSummaryOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 lg:p-[30px] space-y-4 lg:space-y-[30px]">
              {quote && quote.lineItems && quote.lineItems.length > 0 ? (
                <>
                  {/* Line Items */}
                  <div className="flex flex-col gap-3 lg:gap-4">
                    {quote.lineItems.map((item, index) => (
                      <div
                        key={`${item.item_id}-${index}`}
                        className="flex justify-between text-sm lg:text-lg text-white/80"
                      >
                        <span>
                          {item.item_name}
                          {item.quantity > 1 && ` × ${item.quantity}`}
                          {item.rate_type === "per_hour" &&
                            ` (${shootHours || data.studioTimeDuration}hrs)`}
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
                    <span className="font-bold">Base Price</span>
                    <span className="lg:text-xl font-medium">
                      {formatCurrency(quote.subtotal)}
                    </span>
                  </div>

                  {/* Discount */}
                  {quote.discountPercent > 0 && (
                    <div className="flex justify-between text-sm lg:text-lg text-[#47C30D]">
                      <span>Discount ({quote.discountPercent}%)</span>
                      <span className="lg:text-xl font-medium">
                        - {formatCurrency(quote.discountAmount)}
                      </span>
                    </div>
                  )}

                  <CenterSeparator />

                  {/* Price After Discount */}
                  <div className="flex justify-between font-semibold text-sm lg:text-lg text-white">
                    <span>Price After Discount</span>
                    <span className="lg:text-xl">
                      {formatCurrency(quote.priceAfterDiscount)}
                    </span>
                  </div>

                  {/* Service Fee */}
                  {quote.marginAmount > 0 && (
                    <div className="flex justify-between text-sm lg:text-lg text-white/80">
                      <span>Service Fee ({quote.marginPercent}%)</span>
                      <span className="lg:text-xl font-medium text-white">
                        {formatCurrency(quote.marginAmount)}
                      </span>
                    </div>
                  )}

                  <CenterSeparator />

                  {/* Total */}
                  <div className="flex justify-between font-bold text-lg lg:text-xl text-white">
                    <span>Total</span>
                    <span className="text-xl lg:text-2xl text-[#E8D1AB]">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-white/60">
                  <p>No services selected.</p>
                  <p className="text-sm mt-2">
                    Your quote will be based on your selected budget range: $
                    {data.budgetMin.toLocaleString()} - $
                    {data.budgetMax.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Discount Banner */}
        {quote && quote.discountPercent > 0 && (
          <div className="p-4 bg-[#47C30D]/20 border border-[#47C30D]/40 rounded-lg">
            <p className="text-sm lg:text-base text-[#47C30D] font-medium">
              🎉 You&apos;re saving {formatCurrency(quote.discountAmount)} with the{" "}
              {quote.discountPercent}% multi-hour discount!
            </p>
          </div>
        )}

        {/* Email Input */}
        <div className="relative w-full">
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

export default Step4Review;
