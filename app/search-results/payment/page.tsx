"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Users,
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
import { pushToDataLayer } from "@/lib/gtm";
import { useAuth } from "@/lib/hooks/useAuth";
import { BookingSummaryModal } from "@/src/components/landing/BookingSummaryModal";
import { corporateEventEditTypes, corporateEventPhotoEditTypes } from "@/app/data/shootData";

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}

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

// Helper for currency formatting - UPDATED to handle string numbers safely
const formatCurrency = (amount: any) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericAmount || 0);
};

// Helper for title casing
const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
};

const formatTime12h = (timeStr?: string | null) => {
  if (!timeStr) return "N/A";
  const [h, m] = String(timeStr).split(":");
  const hour = parseInt(h || "0", 10);
  if (Number.isNaN(hour)) return String(timeStr);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m || "00"} ${suffix}`;
};

const editTypeLabelByKey: Record<string, string> = [
  ...corporateEventEditTypes,
  ...corporateEventPhotoEditTypes,
].reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
  acc[item.key] = item.value;
  return acc;
}, {});

const getEditingDisplayName = (rawName: string) => {
  const lower = String(rawName || "").toLowerCase();
  if (lower.includes("social media reel") && lower.includes("15") && lower.includes("30")) {
    return editTypeLabelByKey.social_reel_15_30 || rawName;
  }
  if (lower.includes("social media reel") && lower.includes("30") && lower.includes("90")) {
    return editTypeLabelByKey.social_reel_30_90 || rawName;
  }
  if (lower.includes("mini") && lower.includes("highlight")) {
    return editTypeLabelByKey.mini_highlight_1_2 || rawName;
  }
  if (lower.includes("highlight") && !lower.includes("mini")) {
    return editTypeLabelByKey.highlight_4_7 || rawName;
  }
  if (lower.includes("feature")) {
    return editTypeLabelByKey.feature_30_40 || rawName;
  }
  if (lower.includes("edited photo")) {
    return editTypeLabelByKey.edited_photos || rawName;
  }
  return rawName;
};

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("revure_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  onSuccess: (paymentIntentId: string, referralCode?: string) => void;
  onError: (error: string) => void;
  shootId: string | null;
  booking: any;
  quote: any;
  setPaymentDetails: (details: any) => void;
  refreshPaymentIntent: (updatedDetails: any) => Promise<void>; // NEW TYPE
}) {
  const { user, isAuthenticated } = useAuth()
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");

  const searchParams = useSearchParams();
  const urlDiscount = searchParams.get("discount");

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
  const [referralErrorMessage, setReferralErrorMessage] = useState("");

  const isFree = amount === 0;

  // AUTO-APPLY & REFRESH FIX LOGIC - UPDATED TO HANDLE OVERRIDE
  useEffect(() => {
    const existingDiscountTotal = parseFloat(quote?.discount_total || 0);
    const savedCode = quote?.applied_discount_code?.toUpperCase();
    const urlCode = urlDiscount?.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Logic: If URL code is different from saved code, prioritize the URL code
    if (urlCode && urlCode !== savedCode && !discountCode) {
        setDiscountCode(urlCode);
        validateDiscountCode(urlCode);
    } 
    // Otherwise, fallback to the saved code if it exists
    else if (existingDiscountTotal > 0 && !discountCode) {
        setDiscountValid(true);
        if (savedCode) {
            setDiscountCode(savedCode);
        }
    }
  }, [urlDiscount, quote?.applied_discount_code, quote?.discount_total]); 

  // TRIGGER APPLICATION: Trigger when discount is valid and differs from what is active
  useEffect(() => {
    const urlCode = urlDiscount?.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const savedCode = quote?.applied_discount_code?.toUpperCase();

    // Condition to apply: It's valid AND (nothing is applied OR it's a different code than what's saved)
    if (urlCode && discountValid === true && !isValidatingDiscount) {
        if (parseFloat(quote?.discount_total || 0) === 0 || urlCode !== savedCode) {
            // Prevent infinite loop: Only apply if the current input matches the urlCode
            if (discountCode === urlCode) {
                applyDiscountCode();
            }
        }
    }
  }, [discountValid, urlDiscount, quote?.applied_discount_code]);

  // Debounced referral code validation
  const validateReferralCode = React.useCallback(
    debounce(async (code: string) => {
      if (!code || code.length < 4) {
        setReferralCodeValid(null);
        setReferralAffiliateName("");
        setReferralErrorMessage("");
        await refreshPricingWithReferral();
        return;
      }

      setIsValidatingReferral(true);
      try {
        let userId = null;
        try {
          const storedUser = localStorage.getItem("revure_user");
          if (storedUser) {
            const userObj = JSON.parse(storedUser);
            userId = userObj.id;
          }
        } catch (e) {
          console.error("Error parsing user", e);
        }

      const response = await affiliateApi.validateCode(code, userId);
      
      if (response.valid) {
        setReferralCodeValid(true);
        setReferralAffiliateName(response.affiliate_name || "");
        setReferralErrorMessage("");
        await refreshPricingWithReferral(code);
      } else {
        setReferralCodeValid(false);
        setReferralAffiliateName("");
        setReferralErrorMessage(response.message || "Invalid referral code");
        await refreshPricingWithReferral();
      }

      } catch (error) {
        // This will only run if there is a network crash
        console.error("Network Error:", error);
        setReferralCodeValid(false);
        setReferralErrorMessage("Check your internet connection");
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

      // If typed matches active exactly, it's valid
      if (quote?.applied_discount_code?.toUpperCase() === code.toUpperCase()) {
        setDiscountValid(true);
        return;
      }

      setIsValidatingDiscount(true);
      try {
        const API_BASE_URL =
          (
            process.env.NEXT_PUBLIC_API_ENDPOINT ||
            "https://revure-api.beige.app/v1/"
          ).replace(/\/$/, "") + "/";

        const response = await axios.get(
          `${API_BASE_URL}sales/discount-codes/${code}/validate?booking_id=${shootId}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (response.data.valid) {
          setDiscountValid(true);
          setDiscountData(response.data.data);
        } else {
          setDiscountValid(false);
          setDiscountData(null);
        }
      } catch (error: any) {
        if (quote?.applied_discount_code?.toUpperCase() === code.toUpperCase()) {
            setDiscountValid(true);
        } else {
          setDiscountValid(false);
          setDiscountData(null);
        }
      } finally {
        setIsValidatingDiscount(false);
      }
    }, 500),
    [shootId, quote?.applied_discount_code],
  );

  const handleReferralCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setReferralCode(upperCode);
    validateReferralCode(upperCode);
  };

  async function refreshPricingWithReferral(code?: string) {
    if (!shootId) return;
    try {
      const API_BASE_URL =
        (
          process.env.NEXT_PUBLIC_API_ENDPOINT ||
          "https://revure-api.beige.app/v1/"
        ).replace(/\/$/, "") + "/";

      const detailsRes = await axios.get(
        `${API_BASE_URL}guest-bookings/${shootId}/payment-details`,
        {
          params: code ? { referral_code: code } : {},
          headers: getAuthHeaders(),
        }
      );

      if (detailsRes.data.success) {
        setPaymentDetails(detailsRes.data.data);
        await refreshPaymentIntent(detailsRes.data.data);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to refresh pricing with referral code",
      );
    }
  }

  const clearReferralCode = async () => {
    setReferralCode("");
    setReferralCodeValid(null);
    setReferralAffiliateName("");
    setReferralErrorMessage("");
    await refreshPricingWithReferral();
  };

  const handleDiscountCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setDiscountCode(upperCode);
    validateDiscountCode(upperCode);
  };

  const applyDiscountCode = async () => {
    if (!discountCode || !discountValid || !quote?.quote_id) return;

    // Check if it is already applied
    if (quote?.applied_discount_code?.toUpperCase() === discountCode.toUpperCase()) return;

    setIsValidatingDiscount(true); 
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
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.success) {
        setAppliedDiscount(response.data.data);
        toast.success("Discount applied successfully!");

        const detailsRes = await axios.get(
          `${API_BASE_URL}guest-bookings/${shootId}/payment-details`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (detailsRes.data.success) {
          setPaymentDetails(detailsRes.data.data);
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

    // add GA event when payment is initiated
    pushToDataLayer("booking_payment_initiated ", {
      type: "Action Tracking",
      page_name: "Payment Page",
      location_in_website: "book_a_shoot_payment_page",
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
      email: isAuthenticated ? user?.email : booking.email,
      phone: isAuthenticated ? user?.phone_number : booking.phone,
      duration_on_page: performance.now() / 1000,
      booking_id: booking?.bookingId,
      booking_form_fields: {
        full_name: booking.fullName,
        phone: booking.phone,
      }
    });

    // 100% DISCOUNT CASE: Bypass Stripe
    if (isFree) {
      setIsProcessing(true);
      try {
        // We pass the clientSecret which is the mock ID from backend
        onSuccess(
          clientSecret,
          referralCodeValid ? referralCode : undefined,
        );
        pushToDataLayer("payment_success", {
          type: "Action Tracking",
          page_name: "Payment Page",
          location_in_website: "book_a_shoot_payment_page",
          user_id: isAuthenticated ? user?.id : "Unknown",
          user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
          email: isAuthenticated ? user?.email : booking.email,
          phone: isAuthenticated ? user?.phone_number : booking.phone,
          duration_on_page: performance.now() / 1000,
          booking_id: booking?.bookingId,
          payment_status: "Success (100% Discount)"
        });
      } catch (err) {
        onError("Failed to process free booking");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

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
        // add GA event when payment fails
        pushToDataLayer("payment_success", {
          type: "Action Tracking",
          page_name: "Payment Page",
          location_in_website: "book_a_shoot_payment_page",
          user_id: isAuthenticated ? user?.id : "Unknown",
          user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
          email: isAuthenticated ? user?.email : booking.email,
          phone: isAuthenticated ? user?.phone_number : booking.phone,
          duration_on_page: performance.now() / 1000,
          booking_id: booking?.bookingId,
          payment_status: `Fail: ${paymentError.message || "Payment failed"}`
        });

        onError(paymentError.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // add GA event when payment succeeds
        pushToDataLayer("payment_success", {
          type: "Action Tracking",
          page_name: "Payment Page",
          location_in_website: "book_a_shoot_payment_page",
          user_id: isAuthenticated ? user?.id : "Unknown",
          user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
          email: isAuthenticated ? user?.email : booking.email,
          phone: isAuthenticated ? user?.phone_number : booking.phone,
          duration_on_page: performance.now() / 1000,
          booking_id: booking?.bookingId,
          payment_status: "Success"
        });

        onSuccess(
          paymentIntent.id,
          referralCodeValid ? referralCode : undefined,
        );
      }
    } catch (err) {
      console.error("Unexpected payment error:", err);
      // add GA event when payment fails
      pushToDataLayer("payment_success", {
        type: "Action Tracking",
        page_name: "Payment Page",
        location_in_website: "book_a_shoot_payment_page",
        user_id: isAuthenticated ? user?.id : "Unknown",
        user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
        email: isAuthenticated ? user?.email : booking.email,
        phone: isAuthenticated ? user?.phone_number : booking.phone,
        duration_on_page: performance.now() / 1000,
        booking_id: booking?.bookingId,
        payment_status: `Fail: ${err instanceof Error ? err.message : "An unexpected error occurred"}`
      });

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
        {isFree ? "Confirm Free Booking" : "Add Payment Method"}
      </h3>

      {!isFree && (
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
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#272626] rounded-[20px] p-4 lg:p-10 flex flex-col gap-5 lg:gap-9"
      >
        {/* Only show card fields if it's NOT a free booking */}
        {!isFree && (
          <>
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
                required={!isFree}
              />
            </div>
          </>
        )}

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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isValidatingReferral ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : referralCodeValid === true ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : referralCodeValid === false ? (
                <X className="w-5 h-5 text-red-500" />
              ) : null}
              {referralCode.length > 0 && (
                <button
                  type="button"
                  onClick={clearReferralCode}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Clear referral code"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
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
                {referralErrorMessage || "Invalid referral code"}
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
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isValidatingDiscount ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : discountValid === true && discountCode.toUpperCase() !== quote?.applied_discount_code?.toUpperCase() ? (
                <button
                  type="button"
                  onClick={applyDiscountCode}
                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Apply
                </button>
              ) : discountValid === true && discountCode.toUpperCase() === quote?.applied_discount_code?.toUpperCase() ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : discountValid === false ? (
                <X className="w-5 h-5 text-red-500" />
              ) : null}
            </div>
          </div>
          {discountValid === true && discountCode.toUpperCase() === quote?.applied_discount_code?.toUpperCase() && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Discount applied: You Save {formatCurrency(quote.discount_total)}
            </p>
          )}
          {discountValid === true && discountData && discountCode.toUpperCase() !== quote?.applied_discount_code?.toUpperCase() && (
            <p className="text-blue-400 text-sm mt-2">
               Click &apos;Apply&apos; to update your total with this code.
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
          disabled={isProcessing || (!isFree && !stripe)}
          className="w-fit h-14 lg:h-[96px] px-5 lg:px-12 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium rounded-[10px] lg:rounded-[20px] shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] disabled:opacity-50"
        >
          {isProcessing
            ? "Processing..."
            : isFree 
              ? "Confirm Booking (Free)" 
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
  const [step, setStep] = useState<"loading" | "payment" | "success">("loading");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingIntent, setIsUpdatingIntent] = useState(false); 
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // UPDATED STATE FOR AGGREGATED ADDITIONAL PARTNERS
  const [pricingGroups, setPricingGroups] = useState<{
    shootCost: number;
    serviceHours: {
      videographer: number;
      photographer: number;
    };
    additionalCP: {
      totalCost: number;
      videoCount: number;
      photoCount: number;
    };
    mandatoryAddons: Array<{ role: string; cost: number }>;
    editingFees: number;
    editingItems: Array<{ name: string; quantity: number; total: number }>;
  }>({
    shootCost: 0,
    serviceHours: { videographer: 0, photographer: 0 },
    additionalCP: { totalCost: 0, videoCount: 0, photoCount: 0 },
    mandatoryAddons: [],
    editingFees: 0,
    editingItems: [],
  });

  const handleBackClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault(); 
    if (step !== "success") {
      setShowBackDialog(true);
    } else {
      window.history.back();
    }
  };

  const handleViewSummary = async () => {
  try {
    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "") + "/";
    const response = await axios.get(`${API_BASE_URL}admin/${shootId}/get-booking-summary`); // Your new API endpoint
    
    if (response.data.success) {
      setSummaryData(response.data.data);
      setIsSummaryModalOpen(true);
    }
  } catch (err) {
    toast.error("Failed to load summary details");
  }
};

  useEffect(() => {
    if (step === "success") return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowBackDialog(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step]);

  const handleConfirmBack = () => {
    setShowBackDialog(false);
    window.history.go(-2);
  };

  // CATEGORIZED PRICING CALCULATION
  useEffect(() => {
    if (!paymentDetails?.quote?.lineItems) return;

    const lineItems = paymentDetails.quote.lineItems;
    let shootCostSum = 0;
    let videographerHours = 0;
    let photographerHours = 0;
    let addVideoCount = 0;
    let addPhotoCount = 0;
    let addCPTotalCost = 0;
    let editingFeesSum = 0; 
    const mandatoryAddonItems: Array<{ role: string; cost: number }> = [];
    const editingLineItems: Array<{ name: string; quantity: number; total: number }> = [];

    lineItems.forEach((item: any) => {
      const name = item.item_name || "";
      const quantity = parseInt(item.quantity || 1);
      const total = parseFloat(item.line_total || 0);
      const unitPrice = total / quantity;

      // IMPROVED DETECTION: Check slug, category name, or keywords in item name
      const categorySlug = item.pricing_item?.category?.slug?.toLowerCase();
      const categoryName = item.pricing_item?.category?.name?.toLowerCase();
      const lowerName = name.toLowerCase();

      const isEditingItem =
        categorySlug === "editing" ||
        categoryName === "editing" ||
        lowerName.includes("reel") ||
        lowerName.includes("highlight") ||
        lowerName.includes("edited photos");

      if (name.includes("Pre-Production") || lowerName.includes("rush")) {
        shootCostSum += total;
      }
      // 2. Primary Crew (1st Unit to Shoot Cost, others to Additional aggregated)
      else if (name === "Videographer" || name === "Photographer") {
        if (name === "Videographer") videographerHours = quantity;
        if (name === "Photographer") photographerHours = quantity;
        shootCostSum += unitPrice;
        if (quantity > 1) {
          const extraQty = quantity - 1;
          addCPTotalCost += unitPrice * extraQty;
          if (name === "Videographer") addVideoCount += extraQty;
          if (name === "Photographer") addPhotoCount += extraQty;
        }
      } 
      else if (isEditingItem) {
        editingFeesSum += total;
        editingLineItems.push({
          name: getEditingDisplayName(name),
          quantity,
          total
        });
      }
      else if (item.is_mandatory) {
        mandatoryAddonItems.push({
          role: name,
          cost: total,
        });
      } 
      else {
        addCPTotalCost += total;
      }
    });

    setPricingGroups({
      shootCost: shootCostSum,
      serviceHours: {
        videographer: videographerHours,
        photographer: photographerHours
      },
      additionalCP: {
        totalCost: addCPTotalCost,
        videoCount: addVideoCount,
        photoCount: addPhotoCount
      },
      mandatoryAddons: mandatoryAddonItems,
      editingFees: editingFeesSum,
      editingItems: editingLineItems,
    });
  }, [paymentDetails]);

  const fetchIntent = async (details: any) => {
    if (!details || !shootId) return;
    const { booking, quote } = details;

    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "") + "/";
      const response = await axios.post(
        `${API_BASE_URL}payments/create-intent-multi`,
        {
          booking_id: shootId,
          amount: parseFloat(quote.total),
          guest_email: booking.guest_email,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.success && response.data.data.clientSecret) {
        setClientSecret(response.data.data.clientSecret);
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
      toast.error("Failed to initialize payment");
    }
  };

  const refreshPaymentIntent = async (updatedDetails: any) => {
    setIsUpdatingIntent(true);
    await fetchIntent(updatedDetails);
    setIsUpdatingIntent(false);
  };

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
        const response = await axios.get(
          `${API_BASE_URL}guest-bookings/${shootId}/payment-details`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to load payment details");
        }

        const data = response.data.data;
        setPaymentDetails(data);
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

  const handlePaymentSuccess = async (
    paymentIntentId: string,
    referralCode?: string,
  ) => {
    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "") + "/";
      await axios.post(
        `${API_BASE_URL}payments/confirm-multi`,
        {
          paymentIntentId,
          booking_id: shootId,
          referral_code: referralCode || null,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      setStep("success");
      toast.success("Booking confirmed successfully!");
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("Booking succeeded but failed to update status. Please contact support.");
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const getFallbackImage = (creatorId: string) => {
    return crewImages[parseInt(creatorId) % 10];
  };

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

  if (error || !paymentDetails) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="text-6xl">😔</div>
          <h2 className="text-3xl font-bold text-white">Payment Details Not Found</h2>
          <p className="text-white/60 text-lg">{error || "Unable to load payment information for this booking."}</p>
          <button onClick={handleBackClick} className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search Results
          </button>
        </div>
      </div>
    );
  }

  const { booking, creators, quote } = paymentDetails;
  const quoteTotal = (quote && typeof quote.total !== 'undefined') ? parseFloat(quote.total) : null;
  const isQuoteValid = quote && quoteTotal !== null && !isNaN(quoteTotal);

  if (!isQuoteValid) {
    return (
      <div className="pt-20 lg:pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-0 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-3xl font-bold text-white">Quote Data Missing</h2>
            <p className="text-white/60 text-lg">The pricing information for this booking is missing.</p>
            <Link href="/book-a-shoot" className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors">
              Create New Booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-lg lg:text-4xl font-medium mb-2 lg:mb-5 text-center">Booking Confirmed</h2>
            <p className="text-[#E8D1AB] text-xl lg:text-[42px] font-bold mb-8 lg:mb-12">{formatCurrency(quoteTotal)}</p>
            <div className="w-full max-w-2xl mb-6">
              <button onClick={() => window.open(getFormUrl(), "_blank")} className="w-full h-14 lg:h-20 rounded-xl lg:rounded-2xl bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium transition-colors flex items-center justify-center">
                Complete All The Details For Your Shoot
              </button>
            </div>
            <button
              onClick={handleViewSummary}
              className="h-12 lg:h-24 px-6 py-5 lg:px-20 lg:py-10 bg-white/10 hover:bg-white/20 text-white text-lg lg:text-2xl font-medium rounded-xl inline-flex items-center justify-center border border-white/20"
            >
              View Booking Summary
            </button>
          </motion.div>
        </div>
        <BookingSummaryModal 
          isOpen={isSummaryModalOpen} 
          onClose={() => setIsSummaryModalOpen(false)} 
          data={summaryData} 
        />
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-4 xl:px-0">
        <LeaveConfirmationModal isOpen={showLeaveModal} onConfirm={() => router.push("/book-a-shoot")} onCancel={() => setShowLeaveModal(false)} />

        <button onClick={() => setShowLeaveModal(true)} className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="text-center mb-8 lg:mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg lg:text-[64px] lg:leading-[76px] font-bold text-gradient-white mb-3 lg:mb-5">Confirm and Book</h2>
            <p className="text-white/70 mx-auto text-xs lg:text-base">Review your crew selection and complete your booking</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 space-y-5">
            {!clientSecret ? (
              <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB] mb-4"></div>
                <p className="text-white/60">Initializing payment details...</p>
              </div>
            ) : (
              <div className="relative">
                <AnimatePresence>
                  {isUpdatingIntent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-[#171717]/60 backdrop-blur-[2px] rounded-[20px] flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 text-[#E8D1AB] animate-spin mb-2" />
                      <p className="text-[#E8D1AB] font-medium">Updating Price...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentFormMulti
                    clientSecret={clientSecret}
                    amount={quoteTotal || 0}
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

          <div className="xl:col-span-5 space-y-6">
            <div className="bg-[#171717] rounded-[24px] p-6 lg:p-10">
              <h3 className="font-bold mb-7 text-base lg:text-2xl">Booking Summary</h3>
              <div className="bg-white rounded-[20px] text-black py-3 lg:py-5">
                <div className="p-3 lg:p-5 border-b border-black/20">
                  <h4 className="font-bold text-lg mb-3">{toTitleCase(booking.shoot_name || "Unnamed Shoot")}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#626467]">Event Type:</span>
                      <span>{toTitleCase((booking.project_name || booking.shoot_name || "").split("-")[0].trim())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#626467]">
                        {pricingGroups.serviceHours.videographer > 0 && pricingGroups.serviceHours.photographer > 0
                          ? "Videography & Photography Hours:"
                          : pricingGroups.serviceHours.videographer > 0
                            ? "Videography Hours:"
                            : pricingGroups.serviceHours.photographer > 0
                              ? "Photography Hours:"
                              : "Duration:"}
                      </span>
                      <span>
                        {`${booking.duration_hours || 0} hours`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#626467]">Timing:</span>
                      <span>{formatTime12h(booking.start_time)} - {formatTime12h(booking.end_time)}</span>
                    </div>
                    {pricingGroups.serviceHours.videographer > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#626467]">Videographer:</span>
                        <span>{pricingGroups.serviceHours.videographer}x dedicated professional videographers</span>
                      </div>
                    )}
                    {pricingGroups.serviceHours.photographer > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#626467]">Photographer:</span>
                        <span>{pricingGroups.serviceHours.photographer}x dedicated professional photographers</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#626467]">Location:</span>
                      <span className="truncate ml-2">{booking.event_location ? formatLocationForDisplay(booking.event_location) : "N/A"}</span>
                    </div>
                  </div>
                </div>

                {creators && creators.length > 0 && (
                  <div className="p-3 lg:p-5 border-b border-black/20">
                    <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                      <center><Users className="w-4 h-4" /></center>
                      Your Crew ({creators?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {creators.slice(0, 3).map((creator: any) => {
                        const imageUrl = creator.profile_image || getFallbackImage(creator.crew_member_id);
                        return (
                          <div key={creator.crew_member_id} className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <Image src={imageUrl} alt={creator.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{creator.name}</p>
                              <p className="text-xs text-[#626467] truncate">{creator.role_name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quote && (
                  <div className="">
                    {/* NEW AGGREGATED PRICING DISPLAY */}

                    {/* 1. SHOOT COST */}
                    <div className="flex justify-between text-sm p-3 lg:p-5 border-b border-black/20">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[#212122]">Shoot Cost</span>
                      </div>
                      <span className="font-bold">{formatCurrency(pricingGroups.shootCost || 0)}</span>
                    </div>

                    {pricingGroups.additionalCP.totalCost > 0 && (
                      <div className="flex justify-between text-sm p-3 lg:p-5 border-b border-black/20">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-[#212122]">Additional Creative Partner Fees</span>
                          <div className="text-[11px] text-[#626467] space-y-0.5">
                            {pricingGroups.additionalCP.videoCount > 0 && (
                              <div>videographer x {pricingGroups.additionalCP.videoCount}</div>
                            )}
                            {pricingGroups.additionalCP.photoCount > 0 && (
                              <div>photographer x {pricingGroups.additionalCP.photoCount}</div>
                            )}
                          </div>
                        </div>
                        <span className="font-medium">{formatCurrency(pricingGroups.additionalCP.totalCost || 0)}</span>
                      </div>
                    )}

                    {pricingGroups.editingFees > 0 && (
                      <div className="text-sm p-3 lg:p-5 border-b border-black/20 bg-[#f8f8f8]">
                        <div className="flex justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-[#212122]">Editing Cost</span>
                            <span className="text-[11px] text-[#626467]">
                              Number of Edited Content ({pricingGroups.editingItems.length})
                            </span>
                          </div>
                          <span className="font-medium">{formatCurrency(pricingGroups.editingFees)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {pricingGroups.editingItems.map((editItem, idx) => (
                            <div key={`edit-line-${idx}`} className="mt-2 flex justify-between text-[11px] text-[#626467]">
                              <span>{editItem.name} {editItem.quantity > 1 ? `x${editItem.quantity}` : ""}</span>
                              <span>{formatCurrency(editItem.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pricingGroups.mandatoryAddons.length > 0 && pricingGroups.mandatoryAddons.map((item, idx) => (
                      <div key={`addon-${idx}`} className="flex justify-between text-sm p-3 lg:p-5 border-b border-black/20 bg-[#E8D1AB]/5">
                        <span className="text-[#626467] font-medium">{item.role}</span>
                        <span className="font-bold">{formatCurrency(item.cost || 0)}</span>
                      </div>
                    ))}

                    <div className="p-3 lg:p-5 border-b border-black/20">
                      <div className="flex justify-between mb-1">
                        <span className="text-[#626467]">Subtotal</span>
                        <span className="font-medium">{formatCurrency(quote.subtotal || 0)}</span>
                      </div>

                      {parseFloat(quote.discount_total || 0) > 0 && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-black/10">
                          <div className="flex flex-col">
                            <span className="text-green-600 font-bold flex items-center gap-1">
                              <Tag className="w-3 h-3" /> Discount
                            </span>
                            {quote.discount_percentage && <span className="text-[10px] text-green-600/80">({quote.discount_percentage}% off)</span>}
                          </div>
                          <span className="text-green-600 font-bold">-{formatCurrency(quote.discount_total)}</span>
                        </div>
                      )}

                      {parseFloat(quote.referral_discount_amount || 0) > 0 && (
                        <div className="flex justify-between mt-2">
                          <span className="text-green-700 font-medium">
                            10% Referral Discount
                          </span>
                          <span className="text-green-700 font-bold">
                            -{formatCurrency(quote.referral_discount_amount)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start p-3 lg:p-5 bg-[#fcf8f1] rounded-b-[20px]">
                      <div className="flex flex-col gap-2 text-sm">
                        <span className="font-bold">Total</span>
                        <span className="text-[#212122]">Amount Due</span>
                      </div>
                      <span className="text-xl font-bold">{formatCurrency(quoteTotal || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBackDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-semibold text-white mb-4">Cancel Payment?</h3>
              <p className="text-white/60 mb-8 leading-relaxed">Your booking progress will be lost. If you have already clicked pay, please wait to avoid duplicate charges.</p>
              <div className="flex gap-4">
                <Button onClick={() => setShowBackDialog(false)} className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all font-medium">Continue Payment</Button>
                <Button onClick={handleConfirmBack} className="flex-1 py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all font-medium">Leave Page</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LeaveConfirmationModal = ({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-semibold text-white mb-4">Cancel Booking?</h3>
        <p className="text-white/60 mb-8 leading-relaxed">Your booking progress will be lost. If you have already clicked confirm, please wait to avoid duplicate submissions.</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all font-medium">Continue Booking</button>
          <button onClick={onConfirm} className="flex-1 py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all font-medium">Leave Page</button>
        </div>
      </div>
    </div>
  );
};

export default function MultiCreatorPaymentPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white relative">
      {/* <img src="/svg/HeroBanner.svg" alt="Decorative Overlay" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" /> */}
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
