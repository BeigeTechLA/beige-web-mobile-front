"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Loader2, Users } from "lucide-react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { useSelector } from "react-redux";
import { selectSelectedCreators } from "@/lib/redux/features/booking/bookingSlice";
import { toast } from "sonner";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Fallback images for creators
const crewImages = [
  "/images/crew/CREW(1).png",
  "/images/crew/CREW(2).png",
  "/images/crew/CREW(3).png",
  "/images/crew/CREW(4).png",
  "/images/crew/CREW(5).png",
  "/images/crew/CREW(7).png",
  "/images/crew/CREW(6).png",
  "/images/crew/CREW(8).png",
  "/images/crew/CREW(9).png",
  "/images/crew/CREW(10).png",
];

function MultiCreatorPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shootId = searchParams.get("shootId");

  // Get selected creators from Redux
  const selectedCreators = useSelector(selectSelectedCreators);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment details from backend
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!shootId) {
        setError("No booking ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_ENDPOINT}/guest-bookings/${shootId}/payment-details`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch payment details: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to load payment details');
        }

        setPaymentDetails(result.data);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching payment details:', err);
        setError(err.message || 'Failed to load payment information');
        toast.error('Failed to load payment information');
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [shootId]);

  // Get fallback image for creator
  const getFallbackImage = (creatorId: string) => {
    return crewImages[parseInt(creatorId) % 10];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" />
          <p className="text-white/60 text-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !paymentDetails) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="text-6xl">😔</div>
          <h2 className="text-3xl font-bold text-white">Payment Details Not Found</h2>
          <p className="text-white/60 text-lg">
            {error || "Unable to load payment information for this booking."}
          </p>
          <Link
            href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search Results
          </Link>
        </div>
      </div>
    );
  }

  const { booking, creators, quote } = paymentDetails;

  return (
    <div className="pt-20 lg:pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-0">
        {/* Back Button */}
        <Link
          href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
          className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search Results
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-2">
            Complete Your Booking
          </h1>
          <p className="text-white/60 text-lg">
            Review your crew selection and complete payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Booking Details & Creators */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-[#171717] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Booking Details</h2>
              <div className="space-y-3 text-sm lg:text-base">
                <div className="flex justify-between">
                  <span className="text-white/60">Shoot Name:</span>
                  <span className="text-white font-medium">{booking.shoot_name || 'Unnamed Shoot'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Event Type:</span>
                  <span className="text-white font-medium capitalize">{booking.event_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Duration:</span>
                  <span className="text-white font-medium">{booking.duration_hours || 0} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Location:</span>
                  <span className="text-white font-medium">{booking.event_location || 'N/A'}</span>
                </div>
                {booking.event_date && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Date:</span>
                    <span className="text-white font-medium">
                      {new Date(booking.event_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Crew */}
            <div className="bg-[#171717] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E8D1AB]" />
                Your Crew ({creators?.length || 0})
              </h2>
              <div className="space-y-4">
                {creators && creators.length > 0 ? (
                  creators.map((creator: any) => {
                    const imageUrl = creator.profile_image || getFallbackImage(creator.crew_member_id);
                    return (
                      <div
                        key={creator.crew_member_id}
                        className="flex items-center gap-4 p-4 bg-[#101010] rounded-lg hover:bg-[#1A1A1A] transition-colors"
                      >
                        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={creator.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-base truncate">
                            {creator.name}
                          </p>
                          <p className="text-white/50 text-sm truncate">{creator.role_name || 'Creator'}</p>
                          {creator.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-white/70 text-sm">
                                {creator.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[#E8D1AB] font-medium">
                            ${creator.hourly_rate || 0}/hr
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-white/40 text-center py-4">No creators selected</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Payment */}
          <div className="space-y-6">
            {/* Pricing Breakdown */}
            {quote && (
              <div className="bg-[#171717] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Pricing Summary</h2>
                <div className="space-y-3">
                  {/* Line Items */}
                  {quote.lineItems && quote.lineItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-white/80">
                      <span className="text-sm lg:text-base">
                        {item.item_name}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                        {item.rate_type === 'per_hour' && ` (${booking.duration_hours}hrs)`}
                      </span>
                      <span className="font-medium text-white">
                        ${item.line_total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between text-white">
                      <span className="font-semibold">Subtotal</span>
                      <span className="font-medium">
                        ${quote.subtotal?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Discount */}
                  {quote.discountPercent > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="text-sm">Discount ({quote.discountPercent}%)</span>
                      <span className="font-medium">
                        -${quote.discountAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}

                  {/* Service Fee */}
                  {quote.marginAmount > 0 && (
                    <div className="flex justify-between text-white/80">
                      <span className="text-sm">Service Fee ({quote.marginPercent}%)</span>
                      <span className="font-medium text-white">
                        ${quote.marginAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between text-white text-lg lg:text-xl">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-[#E8D1AB]">
                        ${quote.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discount Banner */}
                {quote.discountPercent > 0 && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400 font-medium">
                      🎉 You're saving ${quote.discountAmount?.toFixed(2)} with the {quote.discountPercent}% discount!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Form Placeholder */}
            <div className="bg-[#171717] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Payment Information</h2>
              <p className="text-white/60 text-sm mb-4">
                Payment integration coming soon. For now, please contact us to complete your booking.
              </p>
              <Button
                className="w-full h-12 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base rounded-lg"
                onClick={() => {
                  toast.info('Payment processing will be available soon!');
                }}
              >
                Complete Payment - ${quote?.total?.toFixed(2) || '0.00'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MultiCreatorPaymentPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen bg-[#101010] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" />
        </div>
      }>
        <MultiCreatorPaymentContent />
      </Suspense>
      <Footer />
    </main>
  );
}
