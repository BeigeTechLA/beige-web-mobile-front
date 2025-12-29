"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Star, Loader2, Users, MessageCircleMore, CreditCard, Tag, Check, X } from "lucide-react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatLocationForDisplay } from "@/lib/utils/locationHelpers";
import { debounce } from "@/lib/utils";
import { affiliateApi } from "@/lib/api";
import axios from 'axios';

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

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#aaa',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

// Stripe Payment Form Component
function StripePaymentFormMulti({
  clientSecret,
  amount,
  onSuccess,
  onError
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
  const [referralAffiliateName, setReferralAffiliateName] = useState('');
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Debounced referral code validation
  const validateReferralCode = React.useCallback(
    debounce(async (code: string) => {
      if (!code || code.length < 4) {
        setReferralCodeValid(null);
        setReferralAffiliateName('');
        return;
      }

      setIsValidatingReferral(true);
      try {
        const response = await affiliateApi.validateCode(code);
        setReferralCodeValid(response.valid);
        setReferralAffiliateName(response.affiliate_name || '');
      } catch (error) {
        console.error('Error validating referral code:', error);
        setReferralCodeValid(false);
        setReferralAffiliateName('');
      } finally {
        setIsValidatingReferral(false);
      }
    }, 500),
    []
  );

  const handleReferralCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setReferralCode(upperCode);
    validateReferralCode(upperCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not initialized');
      return;
    }

    if (!clientSecret) {
      onError('Payment not initialized. Please refresh the page.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card information not found');
      return;
    }

    setIsProcessing(true);

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        onError(paymentError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      onError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10">
      <h3 className="font-bold mb-7 text-base lg:text-2xl">Add Payment Method</h3>

      <div className="bg-white rounded-[10px] p-4 lg:p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-[#212122]">
          <CreditCard className="w-5 h-5 lg:w-9 lg:h-9" />
          <div className="flex flex-col">
            <span className="text-base font-medium">Stripe Secure Payment</span>
            <span className="text-sm">Your payment is protected with Stripe&apos;s secure encryption.</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#272626] rounded-[20px] p-4 lg:p-10 flex flex-col gap-5 lg:gap-9">
        {/* Card Element */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60 z-10">
            Card Details
          </label>
          <div className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 flex items-center outline-none focus-within:border-white/50 bg-[#272626]">
            <CardElement options={CARD_ELEMENT_OPTIONS} className="w-full" />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60">
            Card Holder Name
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
            placeholder="Ex. John Doe"
            required
          />
        </div>

        {/* Referral Code */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60 z-10 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Referral Code (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => handleReferralCodeChange(e.target.value)}
              className={`h-14 lg:h-[82px] w-full rounded-[12px] border px-4 pr-12 text-white outline-none bg-[#272626] uppercase tracking-wider ${
                referralCodeValid === true
                  ? 'border-green-500 focus:border-green-400'
                  : referralCodeValid === false
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-white/30 focus:border-white/50'
              }`}
              placeholder="Enter code"
              maxLength={10}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidatingReferral ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : referralCodeValid === true ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : referralCodeValid === false ? (
                <X className="w-5 h-5 text-red-500" />
              ) : null}
            </div>
          </div>
          {referralCodeValid === true && referralAffiliateName && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Referred by {referralAffiliateName}
            </p>
          )}
          {referralCodeValid === false && referralCode.length >= 4 && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <X className="w-4 h-4" />
              Invalid referral code
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isProcessing || !stripe}
          className="w-fit h-14 lg:h-[96px] px-5 lg:px-12 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium rounded-[10px] lg:rounded-[20px] shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : `Confirm & Pay $${amount.toFixed(2)}`}
        </Button>
      </form>
    </div>
  );
}

function MultiCreatorPaymentContent() {
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId");

  // State
  const [step, setStep] = useState<"loading" | "payment" | "success">("loading");
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');

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
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';

        const response = await axios.get(
          `${API_BASE_URL}/guest-bookings/${shootId}/payment-details`
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to load payment details');
        }

        const data = response.data.data;
        console.log('Payment details loaded:', {
          hasQuote: !!data.quote,
          quoteTotal: data.quote?.total,
          creatorsCount: data.creators?.length
        });

        // Validate that we have required data
        if (!data.booking) {
          throw new Error('Booking data is missing');
        }

        if (!data.quote || typeof data.quote.total !== 'number') {
          throw new Error('Quote data is missing or invalid. Please try creating the booking again.');
        }

        setPaymentDetails(data);
        setStep("payment");
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching payment details:', err);
        setError(err.message || 'Failed to load payment information');
        toast.error(err.message || 'Failed to load payment information');
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [shootId]);

  // Create payment intent when payment details are loaded
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!paymentDetails || !shootId || clientSecret) return;

      const { booking, quote } = paymentDetails;

      // Add null check for quote
      if (!quote || typeof quote.total !== 'number') {
        console.error('Quote data is missing or invalid:', { quote });
        toast.error('Unable to calculate pricing. Please try again.');
        return;
      }

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';

        const response = await axios.post(
          `${API_BASE_URL}/payments/create-intent-multi`,
          {
            booking_id: shootId,
            amount: quote.total,
            guest_email: booking.guest_email,
          }
        );

        if (response.data.success && response.data.data.clientSecret) {
          setClientSecret(response.data.data.clientSecret);
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        toast.error('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [paymentDetails, shootId, clientSecret]);

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';

      await axios.post(
        `${API_BASE_URL}/payments/confirm-multi`,
        {
          paymentIntentId,
          booking_id: shootId,
        }
      );

      setStep("success");
      toast.success('Payment successful!');
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Payment succeeded but failed to save booking. Please contact support.');
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  // Get fallback image for creator
  const getFallbackImage = (creatorId: string) => {
    return crewImages[parseInt(creatorId) % 10];
  };

  // Loading state
  if (isLoading || step === "loading") {
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

  // Additional safety check (should be caught earlier in fetchPaymentDetails)
  if (!quote || typeof quote.total !== 'number') {
    console.error('Quote validation failed at render:', { quote });
    return (
      <div className="pt-20 lg:pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-0 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-3xl font-bold text-white">Quote Data Missing</h2>
            <p className="text-white/60 text-lg">
              The pricing information for this booking is missing. Please try creating a new booking.
            </p>
            <Link
              href="/book-a-shoot"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors"
            >
              Create New Booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success View
  if (step === "success") {
    return (
      <div className="pt-20 lg:pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[60vh]"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#E8D1AB]/20 blur-[60px] rounded-full" />
              <div className="relative w-[220px] h-[220px] md:w-[372px] md:h-[356px]">
                <Image
                  src="/images/misc/PaymentDone.png"
                  alt="Payment Done"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h2 className="text-lg lg:text-4xl font-medium mb-2 lg:mb-5 text-center">Payment Success</h2>
            <p className="text-[#E8D1AB] text-xl lg:text-[42px] font-bold mb-4 lg:mb-9">
              ${quote.total.toFixed(2)}
            </p>

            <Link
              href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
              className="h-12 lg:h-24 px-6 py-5 lg:px-20 lg:py-10 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-lg lg:text-2xl font-medium rounded-xl inline-flex items-center justify-center"
            >
              View Booking Summary
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Payment View
  return (
    <div className="pt-20 lg:pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-4 md:px-0">
        {/* Back Button */}
        <Link
          href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
          className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        {/* Page Header */}
        <div className="text-center mb-8 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg lg:text-[64px] lg:leading-[76px] font-bold text-gradient-white mb-3 lg:mb-5">
              Confirm and Pay
            </h2>
            <p className="text-white/70 mx-auto text-xs lg:text-base">
              Review your crew selection and complete your payment
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Payment Form */}
          <div className="lg:col-span-7 space-y-5">
            {!clientSecret ? (
              <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB] mb-4"></div>
                <p className="text-white/60">Initializing payment...</p>
              </div>
            ) : (
              <Elements stripe={stripePromise}>
                <StripePaymentFormMulti
                  clientSecret={clientSecret}
                  amount={quote.total}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            )}
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#171717] rounded-[24px] p-6 lg:p-10">
              <h3 className="font-bold mb-7 text-base lg:text-2xl">Booking Summary</h3>

              <div className="bg-white rounded-[20px] text-black py-3 lg:py-5">
                {/* Booking Details */}
                <div className="p-3 lg:p-5 border-b border-black/20">
                  <h4 className="font-bold text-lg mb-3">{booking.shoot_name || 'Unnamed Shoot'}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#626467]">Event Type:</span>
                      <span className="capitalize">{booking.event_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#626467]">Duration:</span>
                      <span>{booking.duration_hours || 0} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#626467]">Location:</span>
                      <span className="truncate ml-2">
                        {booking.event_location
                          ? formatLocationForDisplay(booking.event_location)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Crew Members */}
                <div className="p-3 lg:p-5 border-b border-black/20">
                  <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Your Crew ({creators?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {creators && creators.slice(0, 3).map((creator: any) => {
                      const imageUrl = creator.profile_image || getFallbackImage(creator.crew_member_id);
                      return (
                        <div key={creator.crew_member_id} className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={imageUrl}
                              alt={creator.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{creator.name}</p>
                            <p className="text-xs text-[#626467] truncate">{creator.role_name}</p>
                          </div>
                          {creator.rating > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 fill-[#222222]" />
                              <span>{creator.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {creators && creators.length > 3 && (
                      <p className="text-xs text-[#626467] text-center pt-2">
                        +{creators.length - 3} more
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                {quote && (
                  <div className="">
                    {quote.lineItems && quote.lineItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm p-3 lg:p-5 border-b border-black/20">
                        <span className="text-[#626467]">
                          {item.item_name}
                          {item.quantity > 1 && ` × ${item.quantity}`}
                          {item.rate_type === 'per_hour' && ` (${booking.duration_hours}hrs)`}
                        </span>
                        <span className="font-medium">${item.line_total?.toFixed(2) || '0.00'}</span>
                      </div>
                    ))}

                    <div className="p-3 lg:p-5 border-b border-black/20">
                      <div className="flex justify-between mb-3">
                        <span className="text-[#626467]">Subtotal</span>
                        <span className="font-medium">${quote.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      {quote.discountPercent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#626467]">Discount ({quote.discountPercent}%)</span>
                          <span className="font-medium text-[#4CAF50]">-${quote.discountAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}
                    </div>

                    {quote.marginAmount > 0 && (
                      <div className="flex justify-between text-sm p-3 lg:p-5 border-b border-black/20">
                        <span className="text-[#626467]">Service Fee ({quote.marginPercent}%)</span>
                        <span className="font-medium">${quote.marginAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-start p-3 lg:p-5">
                      <div className="flex flex-col gap-2 text-sm">
                        <span className="font-bold">Total</span>
                        <span className="text-[#212122]">Amount Due</span>
                      </div>
                      <span className="text-xl font-bold">${quote.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                )}

                {/* Protection Badge */}
                <div className="bg-[#E2FFD3] border-[0.5px] border-[#389903] rounded-xl p-3 lg:p-5 flex gap-2 mx-5 justify-start">
                  <div className="w-4 h-4 lg:w-6 lg:h-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167C21 10.8996 21 11.4234 21 11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914C3 11.4234 3 10.8996 3 10.4167Z" fill="#389903" stroke="#389903" strokeWidth="1.5" />
                      <path d="M9.5 12.4L10.9286 14L14.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-[#1B1B1B] text-sm lg:text-base font-bold lg:mb-2">Beige Project Protection</h5>
                    <p className="text-xs lg:text-sm text-[#212122] leading-relaxed">
                      Your payment is protected with Stripe's secure encryption. Funds are only released when you're satisfied.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <button
                  onClick={() => console.log("Talk to someone clicked")}
                  className="h-12 lg:h-[67px] border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-sm lg:text-lg font-medium bg-[#222222]"
                >
                  <MessageCircleMore className="w-4 h-4 lg:w-6 lg:h-6 fill-white text-black" />
                  Talk To Someone
                </button>
                <button
                  onClick={() => console.log("Beige bot clicked")}
                  className="h-12 lg:h-[67px] bg-[#E8D1AB] text-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#dcb98a] transition-colors text-sm lg:text-lg font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none">
                    <mask id="mask0_295_5465" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}><path d="M0 0H24V24H0V0Z" fill="white" /></mask>
                    <g mask="url(#mask0_295_5465)">
                      <path d="M13.7755 1.752C13.7755 2.71958 12.9911 3.504 12.0235 3.504C11.0559 3.504 10.2715 2.71958 10.2715 1.752C10.2715 0.784416 11.0559 0 12.0235 0C12.9911 0 13.7755 0.784416 13.7755 1.752Z" fill="#212122" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M12.024 3.50391H9.024C6.39082 3.50391 4.15699 5.21386 3.37234 7.58391H3.264C1.46136 7.58391 0 9.04527 0 10.8479C0 12.6505 1.46136 14.1119 3.264 14.1119H3.34147C4.09699 16.5316 6.35539 18.2879 9.024 18.2879H15.024C17.6926 18.2879 19.9511 16.5316 20.7065 14.1119H20.736C22.5386 14.1119 24 12.6505 24 10.8479C24 9.04527 22.5386 7.58391 20.736 7.58391H20.6757C19.891 5.21386 17.6572 3.50391 15.024 3.50391H12.024ZM17.8409 10.4639C17.8409 11.6945 16.8433 12.6921 15.6127 12.6921C14.382 12.6921 13.3845 11.6945 13.3845 10.4639C13.3845 9.23328 14.382 8.23565 15.6127 8.23565C16.8433 8.23565 17.8409 9.23328 17.8409 10.4639ZM8.37221 12.6921C9.60283 12.6921 10.6005 11.6945 10.6005 10.4639C10.6005 9.23328 9.60283 8.23565 8.37221 8.23565C7.14163 8.23565 6.144 9.23328 6.144 10.4639C6.144 11.6945 7.14163 12.6921 8.37221 12.6921Z" fill="#212122" />
                      <path d="M4.3125 23.9931C5.75048 21.1996 8.6624 19.2891 12.0206 19.2891C15.3788 19.2891 18.2907 21.1996 19.7287 23.9931H4.3125Z" fill="#212122" />
                    </g>
                  </svg>
                  Beige Bot
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MultiCreatorPaymentPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white relative">
      <img
        src="/svg/HeroBanner.svg"
        alt="Decorative Overlay"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />
      <div className="relative z-10">
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen bg-[#101010] flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" />
          </div>
        }>
          <MultiCreatorPaymentContent />
        </Suspense>
        <Footer />
      </div>
    </main>
  );
}
