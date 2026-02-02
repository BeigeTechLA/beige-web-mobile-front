"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Loader2,
  Users,
  MessageCircleMore,
  CreditCard,
  Tag,
  Check,
  X,
} from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatLocationForDisplay } from "@/lib/utils/locationHelpers";
import { debounce } from "@/lib/utils";
import { affiliateApi } from "@/lib/api";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

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
      color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      "::placeholder": {
        color: "#aaa",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Helper for title casing
const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
};

// Stripe Payment Form Component
function StripePaymentFormMulti({
  clientSecret,
  amount,
  onSuccess,
  onError,
  shootId,
  booking,
  quote,
  setPaymentDetails,
  refreshPaymentIntent, // NEW PROP: used to update price in background
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  shootId: string | null;
  booking: any;
  quote: any;
  setPaymentDetails: (details: any) => void;
  refreshPaymentIntent: (updatedDetails: any) => Promise<void>; // NEW TYPE
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");

  // Referral code state
  const [referralCode, setReferralCode] = useState("");
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(
    null,
  );
  const [referralAffiliateName, setReferralAffiliateName] = useState("");
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [discountValid, setDiscountValid] = useState<boolean | null>(null);
  const [discountData, setDiscountData] = useState<any>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);

  // Debounced referral code validation
  const validateReferralCode = React.useCallback(
    debounce(async (code: string) => {
      if (!code || code.length < 4) {
        setReferralCodeValid(null);
        setReferralAffiliateName("");
        return;
      }

      setIsValidatingReferral(true);
      try {
        const response = await affiliateApi.validateCode(code);
        setReferralCodeValid(response.valid);
        setReferralAffiliateName(response.affiliate_name || "");
      } catch (error) {
        console.error("Error validating referral code:", error);
        setReferralCodeValid(false);
        setReferralAffiliateName("");
      } finally {
        setIsValidatingReferral(false);
      }
    }, 500),
    [],
  );

  // Debounced discount code validation
  const validateDiscountCode = React.useCallback(
    debounce(async (code: string) => {
      if (!code || code.length < 4) {
        setDiscountValid(null);
        setDiscountData(null);
        return;
      }

      setIsValidatingDiscount(true);
      try {
        const API_BASE_URL =
          (
            process.env.NEXT_PUBLIC_API_ENDPOINT ||
            "https://revure-api.beige.app/v1/"
          ).replace(/\/$/, "") + "/";

        // Pass booking_id in query param for validation
        const response = await axios.get(
          `${API_BASE_URL}sales/discount-codes/${code}/validate?booking_id=${shootId}`,
        );

        if (response.data.valid) {
          setDiscountValid(true);
          setDiscountData(response.data.data);
        } else {
          setDiscountValid(false);
          setDiscountData(null);
        }
      } catch (error: any) {
        console.error("Error validating discount code:", error);
        setDiscountValid(false);
        setDiscountData(null);
      } finally {
        setIsValidatingDiscount(false);
      }
    }, 500),
    [shootId],
  );

  const handleReferralCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setReferralCode(upperCode);
    validateReferralCode(upperCode);
  };

  const handleDiscountCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setDiscountCode(upperCode);
    validateDiscountCode(upperCode);
  };

  const applyDiscountCode = async () => {
    if (!discountCode || !discountValid || !quote?.quote_id) return;

    setIsValidatingDiscount(true); // Ensure loading state is active
    try {
      const API_BASE_URL =
        (
          process.env.NEXT_PUBLIC_API_ENDPOINT ||
          "https://revure-api.beige.app/v1/"
        ).replace(/\/$/, "") + "/";

      const response = await axios.post(
        `${API_BASE_URL}sales/discount-codes/${discountCode}/apply`,
        {
          quote_id: quote.quote_id,
          booking_id: shootId,
          guest_email: booking.guest_email,
        },
      );

      if (response.data.success) {
        setAppliedDiscount(response.data.data);
        toast.success("Discount applied successfully!");

        const detailsRes = await axios.get(
          `${API_BASE_URL}guest-bookings/${shootId}/payment-details`
        );

        if (detailsRes.data.success) {
          // 1. Update the Summary text
          setPaymentDetails(detailsRes.data.data);

          // 2. Refresh the Stripe secret WITHOUT setting it to ""
          // This keeps the CardElement mounted and prevents the page refresh
          await refreshPaymentIntent(detailsRes.data.data);
        }
      }
    } catch (error: any) {
      console.error("Error applying discount:", error);
      toast.error(error.response?.data?.message || "Failed to apply discount");
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Payment system not initialized");
      return;
    }

    if (!clientSecret) {
      onError("Payment not initialized. Please refresh the page.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError("Card information not found");
      return;
    }

    setIsProcessing(true);

    try {
      const { error: paymentError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
            },
          },
        });

      if (paymentError) {
        console.error("Payment error:", paymentError);
        onError(paymentError.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error("Unexpected payment error:", err);
      onError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10">
      <h3 className="font-bold mb-7 text-base lg:text-2xl">
        Add Payment Method
      </h3>

      <div className="bg-white rounded-[10px] p-4 lg:p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-[#212122]">
          <CreditCard className="w-5 h-5 lg:w-9 lg:h-9" />
          <div className="flex flex-col">
            <span className="text-base font-medium">Stripe Secure Payment</span>
            <span className="text-sm">
              Your payment is protected with Stripe&apos;s secure encryption.
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#272626] rounded-[20px] p-4 lg:p-10 flex flex-col gap-5 lg:gap-9"
      >
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
              className={`h-14 lg:h-[82px] w-full rounded-[12px] border px-4 pr-12 text-white outline-none bg-[#272626] uppercase tracking-wider ${referralCodeValid === true
                ? "border-green-500 focus:border-green-400"
                : referralCodeValid === false
                  ? "border-red-500 focus:border-red-400"
                  : "border-white/30 focus:border-white/50"
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

        {/* Discount Code */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60 z-10 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Discount Code (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => handleDiscountCodeChange(e.target.value)}
              className={`h-14 lg:h-[82px] w-full rounded-[12px] border px-4 pr-24 text-white outline-none bg-[#272626] uppercase tracking-wider ${discountValid === true
                ? "border-green-500 focus:border-green-400"
                : discountValid === false
                  ? "border-red-500 focus:border-red-400"
                  : "border-white/30 focus:border-white/50"
                }`}
              placeholder="Enter discount code"
              maxLength={20}
              disabled={!!appliedDiscount}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isValidatingDiscount ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : discountValid === true && !appliedDiscount ? (
                <button
                  type="button"
                  onClick={applyDiscountCode}
                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Apply
                </button>
              ) : discountValid === true && appliedDiscount ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : discountValid === false ? (
                <X className="w-5 h-5 text-red-500" />
              ) : null}
            </div>
          </div>
          {discountValid === true && discountData && !appliedDiscount && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              {discountData.discount_type === "percentage"
                ? `${discountData.discount_value}% off`
                : `$${discountData.discount_value} off`}
            </p>
          )}
          {appliedDiscount && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Discount applied: Save $
              {appliedDiscount.discount_amount.toFixed(2)}
            </p>
          )}
          {discountValid === false && discountCode.length >= 4 && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <X className="w-4 h-4" />
              Invalid or expired discount code
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isProcessing || !stripe}
          className="w-fit h-14 lg:h-[96px] px-5 lg:px-12 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium rounded-[10px] lg:rounded-[20px] shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] disabled:opacity-50"
        >
          {isProcessing
            ? "Processing..."
            : `Confirm & Pay ${formatCurrency(amount)}`}
        </Button>
      </form>
    </div>
  );
}

function MultiCreatorPaymentContent() {
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId");

  const router = useRouter();

  // State
  const [step, setStep] = useState<"loading" | "payment" | "success">(
    "loading",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingIntent, setIsUpdatingIntent] = useState(false); // NEW STATE: for background loading
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Reusable function to fetch/update intent
  const fetchIntent = async (details: any) => {
    if (!details || !shootId) return;
    const { booking, quote } = details;

    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "") + "/";
      const response = await axios.post(`${API_BASE_URL}payments/create-intent-multi`, {
        booking_id: shootId,
        amount: quote.total,
        guest_email: booking.guest_email,
      });

      if (response.data.success && response.data.data.clientSecret) {
        setClientSecret(response.data.data.clientSecret);
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
      toast.error("Failed to initialize payment");
    }
  };

  // Helper passed to child
  const refreshPaymentIntent = async (updatedDetails: any) => {
    setIsUpdatingIntent(true);
    await fetchIntent(updatedDetails);
    setIsUpdatingIntent(false);
  };

  // Initial Data Fetch
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!shootId) {
        setError("No booking ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "") + "/";
        const response = await axios.get(`${API_BASE_URL}guest-bookings/${shootId}/payment-details`);

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to load payment details");
        }

        const data = response.data.data;
        setPaymentDetails(data);

        // Initial Intent Fetch
        await fetchIntent(data);

        setStep("payment");
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error fetching payment details:", err);
        setError(err.message || "Failed to load payment information");
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [shootId]);

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const API_BASE_URL =
        (
          process.env.NEXT_PUBLIC_API_ENDPOINT ||
          "https://revure-api.beige.app/v1/"
        ).replace(/\/$/, "") + "/";

      await axios.post(`${API_BASE_URL}payments/confirm-multi`, {
        paymentIntentId,
        booking_id: shootId,
      });

      setStep("success");
      toast.success("Payment successful!");
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error(
        "Payment succeeded but failed to save booking. Please contact support.",
      );
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
          <h2 className="text-3xl font-bold text-white">
            Payment Details Not Found
          </h2>
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

  // Additional safety check
  if (!quote || typeof quote.total !== "number") {
    return (
      <div className="pt-20 lg:pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-0 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-3xl font-bold text-white">
              Quote Data Missing
            </h2>
            <p className="text-white/60 text-lg">
              The pricing information for this booking is missing.
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
    const getFormUrl = () => {
      const weddingFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdg9VNPGWzS0-48TtYCfejktfl2j3Hl4sAD4HSkUoQIMP9WQA/viewform";
      const generalFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeYWPQXfFBqzt4FHVy6ccrS4WVbjFLHJQeIu56rj_zEinGGfQ/viewform";
      return booking?.event_type?.toLowerCase().includes("wedding") ? weddingFormUrl : generalFormUrl;
    };

    return (
      <div className="pt-20 lg:pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full min-h-[60vh]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#E8D1AB]/20 blur-[60px] rounded-full" />
              <div className="relative w-[220px] h-[220px] md:w-[372px] md:h-[356px]">
                <Image src="/images/misc/PaymentDone.png" alt="Payment Done" fill className="object-contain" priority />
              </div>
            </div>
            <h2 className="text-lg lg:text-4xl font-medium mb-2 lg:mb-5 text-center">Payment Success</h2>
            <p className="text-[#E8D1AB] text-xl lg:text-[42px] font-bold mb-8 lg:mb-12">{formatCurrency(quote.total)}</p>
            <div className="w-full max-w-2xl mb-6">
              <button onClick={() => window.open(getFormUrl(), "_blank")} className="w-full h-14 lg:h-20 rounded-xl lg:rounded-2xl bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium transition-colors flex items-center justify-center">
                Complete All The Details For Your Shoot
              </button>
            </div>
            <Link href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`} className="h-12 lg:h-24 px-6 py-5 lg:px-20 lg:py-10 bg-white/10 hover:bg-white/20 text-white text-lg lg:text-2xl font-medium rounded-xl inline-flex items-center justify-center border border-white/20">
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
        {/* Leave Confirmation Modal */}
        <LeaveConfirmationModal
          isOpen={showLeaveModal}
         onConfirm={() => {
         router.push("/book-a-shoot");
         } }
          onCancel={() => setShowLeaveModal(false)}
        />

        <button
          onClick={() => setShowLeaveModal(true)}
          className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="text-center mb-8 lg:mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg lg:text-[64px] lg:leading-[76px] font-bold text-gradient-white mb-3 lg:mb-5">Confirm and Pay</h2>
            <p className="text-white/70 mx-auto text-xs lg:text-base">Review your crew selection and complete your payment</p>
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
              <div className="relative">
                {/* Loader Overlay when updating the price/intent so the form doesn't disappear */}
                <AnimatePresence>
                  {isUpdatingIntent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-[#171717]/60 backdrop-blur-[2px] rounded-[20px] flex flex-col items-center justify-center"
                    >
                      <Loader2 className="w-10 h-10 text-[#E8D1AB] animate-spin mb-2" />
                      <p className="text-[#E8D1AB] font-medium">Updating Price...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentFormMulti
                    clientSecret={clientSecret}
                    amount={quote.total}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    shootId={shootId}
                    booking={booking}
                    quote={quote}
                    setPaymentDetails={setPaymentDetails}
                    refreshPaymentIntent={refreshPaymentIntent}
                  />
                </Elements>
              </div>
            )}
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#171717] rounded-[24px] p-6 lg:p-10">
              <h3 className="font-bold mb-7 text-base lg:text-2xl">Booking Summary</h3>
              <div className="bg-white rounded-[20px] text-black py-3 lg:py-5">
                <div className="p-3 lg:p-5 border-b border-black/20">
                  <h4 className="font-bold text-lg mb-3">
                    {toTitleCase(booking.shoot_name || "Unnamed Shoot")}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#626467]">Event Type:</span>
                      <span className="">
                        {toTitleCase(
                          (booking.project_name || booking.shoot_name || "")
                            .split("-")[0]
                            .trim(),
                        )}
                      </span>
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
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {creators && creators.length > 0 && (
                  <div className="p-3 lg:p-5 border-b border-black/20">
                    <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Your Crew ({creators?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {creators.slice(0, 3).map((creator: any) => {
                        const imageUrl =
                          creator.profile_image ||
                          getFallbackImage(creator.crew_member_id);
                        return (
                          <div
                            key={creator.crew_member_id}
                            className="flex items-center gap-2"
                          >
                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <Image
                                src={imageUrl}
                                alt={creator.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {creator.name}
                              </p>
                              <p className="text-xs text-[#626467] truncate">
                                {creator.role_name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quote && (
                  <div className="">
                    {quote.lineItems &&
                      quote.lineItems.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm p-3 lg:p-5 border-b border-black/20"
                        >
                          <span className="text-[#626467]">
                            {item.item_name}
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.line_total || 0)}
                          </span>
                        </div>
                      ))}
                    <div className="p-3 lg:p-5 border-b border-black/20">
                      <div className="flex justify-between mb-3">
                        <span className="text-[#626467]">Subtotal</span>
                        <span className="font-medium">
                          {formatCurrency(quote.subtotal || 0)}
                        </span>
                      </div>
                    </div>
                    {/* Show discount if applied */}
                    {/* {quote.discountAmount && quote.discountAmount > 0 && (
                        <div className="flex justify-between mb-3 text-green-600">
                          <span>
                            Discount Applied ({quote.discountPercent}%)
                          </span>
                          <span>
                            -${parseFloat(quote.discountAmount).toFixed(2)}
                          </span>
                        </div>
                      )} */}
                    {/* Show margin if applied */}
                    {/* {quote.marginAmount && quote.marginAmount > 0 && (
                        <div className="flex justify-between mb-3">
                          <span className="text-[#626467]">
                            Service Fee ({quote.marginPercent}%)
                          </span>
                          <span className="font-medium">
                            ${parseFloat(quote.marginAmount).toFixed(2)}
                          </span>
                        </div>
                      )} */}
                    <div className="flex justify-between items-start p-3 lg:p-5">
                      <div className="flex flex-col gap-2 text-sm">
                        <span className="font-bold">Total</span>
                        <span className="text-[#212122]">Amount Due</span>
                      </div>
                      <span className="text-xl font-bold">{formatCurrency(quote.total || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Support Buttons */}
              {/* <div className="grid grid-cols-2 gap-4 mt-5">
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 lg:w-6 lg:h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <mask
                      id="mask0_295_5465"
                      style={{ maskType: "luminance" }}
                      maskUnits="userSpaceOnUse"
                      x={0}
                      y={0}
                      width={24}
                      height={24}
                    >
                      <path d="M0 0H24V24H0V0Z" fill="white" />
                    </mask>
                    <g mask="url(#mask0_295_5465)">
                      <path
                        d="M13.7755 1.752C13.7755 2.71958 12.9911 3.504 12.0235 3.504C11.0559 3.504 10.2715 2.71958 10.2715 1.752C10.2715 0.784416 11.0559 0 12.0235 0C12.9911 0 13.7755 0.784416 13.7755 1.752Z"
                        fill="#212122"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12.024 3.50391H9.024C6.39082 3.50391 4.15699 5.21386 3.37234 7.58391H3.264C1.46136 7.58391 0 9.04527 0 10.8479C0 12.6505 1.46136 14.1119 3.264 14.1119H3.34147C4.09699 16.5316 6.35539 18.2879 9.024 18.2879H15.024C17.6926 18.2879 19.9511 16.5316 20.7065 14.1119H20.736C22.5386 14.1119 24 12.6505 24 10.8479C24 9.04527 22.5386 7.58391 20.736 7.58391H20.6757C19.891 5.21386 17.6572 3.50391 15.024 3.50391H12.024ZM17.8409 10.4639C17.8409 11.6945 16.8433 12.6921 15.6127 12.6921C14.382 12.6921 13.3845 11.6945 13.3845 10.4639C13.3845 9.23328 14.382 8.23565 15.6127 8.23565C16.8433 8.23565 17.8409 9.23328 17.8409 10.4639ZM8.37221 12.6921C9.60283 12.6921 10.6005 11.6945 10.6005 10.4639C10.6005 9.23328 9.60283 8.23565 8.37221 8.23565C7.14163 8.23565 6.144 9.23328 6.144 10.4639C6.144 11.6945 7.14163 12.6921 8.37221 12.6921Z"
                        fill="#212122"
                      />
                      <path
                        d="M4.3125 23.9931C5.75048 21.1996 8.6624 19.2891 12.0206 19.2891C15.3788 19.2891 18.2907 21.1996 19.7287 23.9931H4.3125Z"
                        fill="#212122"
                      />
                    </g>
                  </svg>
                  Beige Bot
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LeaveConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-semibold text-white mb-4">Abandon Booking?</h3>
        <p className="text-white/60 mb-8 leading-relaxed">
          You've filled in details on this page. Moving back will lose all details. Do you wish to continue?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all font-medium"
          >
            Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all font-medium"
          >
            Leave Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MultiCreatorPaymentPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white relative">
      <img src="/svg/HeroBanner.svg" alt="Decorative Overlay" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />
      <div className="relative z-10">
        <Navbar />
        <Suspense fallback={<div className="min-h-screen bg-[#101010] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" /></div>}>
          <MultiCreatorPaymentContent />
        </Suspense>
        <Footer />
      </div>
    </main>
  );
}