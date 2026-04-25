"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
  BadgeCheckIcon,
  PencilLine,
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
import { debounce, getBookingDetails } from "@/lib/utils";
import { affiliateApi } from "@/lib/api";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { pushToDataLayer } from "@/lib/gtm";
import { useAuth } from "@/lib/hooks/useAuth";
import { BookingSummaryModal } from "@/src/components/landing/BookingSummaryModal";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";

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

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

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

const parseDateValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatShortDate = (value: string) => {
  if (!value) return "N/A";
  const date = parseDateValue(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatDurationHours = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "0";

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, "");
  }

  if (typeof value === "string") {
    return value.trim().replace(/\.00$/, "") || "0";
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return Number.isInteger(numericValue)
      ? String(numericValue)
      : String(numericValue).replace(/\.0+$/, "");
  }

  return "0";
};

const formatTime12 = (value?: string | null) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  const meridiemMatch = raw.match(/^(\d{1,2}):(\d{2})(?:\s)?([AaPp][Mm])$/);
  if (meridiemMatch) {
    const hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const suffix = meridiemMatch[3].toUpperCase();

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const normalizedHours = suffix === "PM" ? (hours % 12) + 12 : hours % 12;
      const date = new Date(2000, 0, 1, normalizedHours, minutes, 0);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  const timeMatch =
    raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/) ||
    raw.match(/(?:T|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z)?$/);

  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] || 0);

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const date = new Date(2000, 0, 1, hours, minutes, Number.isFinite(seconds) ? seconds : 0);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  const parsed = parseDateValue(raw);
  if (!parsed) return raw;
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getTimeRange = (booking?: any) => {
  const startRaw =
    booking?.start_time ||
    booking?.event_start_time ||
    booking?.booking_days?.[0]?.start_time ||
    booking?.booking_days?.[0]?.startTime ||
    null;
  const endRaw =
    booking?.end_time ||
    booking?.event_end_time ||
    booking?.booking_days?.[0]?.end_time ||
    booking?.booking_days?.[0]?.endTime ||
    null;

  const start = formatTime12(startRaw);
  const end = formatTime12(endRaw);
  if (start && end) return `${start}-${end}`;
  if (start) return start;
  return "";
};

// Helper for title casing
const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
};

const formatShootTypeLabel = (value?: string | null) => {
  const normalized = String(value || "").toLowerCase().replace(/\s+/g, "");
  if (!normalized) return "";

  const hasVideo =
    normalized.includes("video") || normalized.includes("videographer");
  const hasPhoto =
    normalized.includes("photo") || normalized.includes("photographer");

  if (hasVideo && hasPhoto) return "Video+Photo";
  if (hasVideo) return "Video";
  if (hasPhoto) return "Photo";
  return toTitleCase(String(value));
};

const extractContactName = (value?: string | null) => {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/contact\s*name\s*:\s*([^\n\r]+)/i);
  if (match?.[1]) return match[1].trim();
  return "";
};

const isEmail = (value?: string | null) => {
  const cleaned = String(value || "").trim();
  if (!cleaned) return false;
  if (cleaned.includes("@")) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
};

const extractNameFromProjectName = (value?: string | null) => {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";

  const dealPrefixMatch = cleaned.match(/^deal\s*-\s*(.+)$/i);
  if (dealPrefixMatch?.[1]) return dealPrefixMatch[1].trim();

  return "";
};

const pickDisplayName = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const cleaned = String(value || "").trim();
    if (!cleaned) continue;
    if (isEmail(cleaned)) continue;
    return cleaned;
  }
  return "";
};

const getInitials = (value?: string | null) => {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "NA";
  const parts = cleaned.split(" ").filter(Boolean);
  const initials = parts.map((part) => part[0]).join("").toUpperCase();
  if (initials) return initials.substring(0, 2);
  const emailPart = cleaned.split("@")[0] || "";
  const first = emailPart[0] || "N";
  const second = emailPart[1] || "A";
  return `${first}${second}`.toUpperCase();
};

const getEditCounts = (items: any[]) => {
  const counts = new Map<string, number>();
  (items || []).forEach((item) => {
    const label = String(item || "").trim();
    if (!label) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
  }));
};

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("revure_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getStoredUserEmail = () => {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = localStorage.getItem("revure_user");
    if (!storedUser) return null;
    const userObj = JSON.parse(storedUser);
    return userObj?.email || userObj?.user?.email || null;
  } catch {
    return null;
  }
};

const resolveGuestEmail = (booking?: any, fallbackEmail?: string | null) => {
  return (
    booking?.guest_email ||
    booking?.guestEmail ||
    booking?.user?.email ||
    booking?.client_email ||
    fallbackEmail ||
    getStoredUserEmail() ||
    null
  );
};

const normalizeDiscountCodeValue = (value?: string | null) => {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return normalized || null;
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
  accountCredit,
  useAccountCredit,
  creditAppliedAmount,
  onToggleAccountCredit,
  setPaymentDetails,
  refreshPaymentIntent, // NEW PROP: used to update price in background
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string, referralCode?: string) => Promise<void> | void;
  onError: (error: string) => void;
  shootId: string | null;
  booking: any;
  quote: any;
  accountCredit?: any;
  useAccountCredit: boolean;
  creditAppliedAmount: number;
  onToggleAccountCredit: (enabled: boolean) => Promise<void> | void;
  setPaymentDetails: (details: any) => void;
  refreshPaymentIntent: (updatedDetails: any, useCreditOverride?: boolean) => Promise<void>; // NEW TYPE
}) {
  const { user, isAuthenticated } = useAuth()
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");

  const searchParams = useSearchParams();
  const urlDiscount = searchParams.get("discount");
  const isFromPaymentLink = !!urlDiscount;

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
  const [referralErrorMessage, setReferralErrorMessage] = useState("");

  // Terms&Condn accept
  const [acceptTerms, setAcceptTerms] = useState(true);

  const isFree = amount === 0;
  const availableCreditAmount = parseFloat(accountCredit?.available_credit_amount || 0);
  const canUseAccountCredit =
    Boolean(accountCredit?.can_use_credit) && availableCreditAmount > 0;
  const isReferralLocked =
    isFree && parseFloat(quote?.discount_total || quote?.discount_amount || 0) > 0;
  const activeDiscountCode = normalizeDiscountCodeValue(
    quote?.applied_discount_code || quote?.discount_code
  );

  useEffect(() => {
    if (!isReferralLocked) return;
    if (referralCode.length === 0) return;
    clearReferralCode();
    toast.info("⚠️ Referral Code Not Applicable", {
      description: "This code can only be applied to shoot with a total value greater than $0.00",
    });
  }, [isReferralLocked]);

  // TRIGGER APPLICATION: Trigger when discount is valid and differs from what is active
  useEffect(() => {
    const urlCode = normalizeDiscountCodeValue(urlDiscount);

    // Condition to apply: It's valid AND (nothing is applied OR it's a different code than what's saved)
    if (urlCode && discountValid === true && !isValidatingDiscount) {
      if (urlCode !== activeDiscountCode) {
        // Prevent infinite loop: Only apply if the current input matches the urlCode
        if (discountCode === urlCode) {
          applyDiscountCode();
        }
      }
    }
  }, [discountValid, urlDiscount, activeDiscountCode, isValidatingDiscount, discountCode]);

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

  // Immediate referral validation (used on submit)
  const validateReferralCodeNow = async (code: string) => {
    if (!code || code.length < 4) {
      setReferralCodeValid(null);
      setReferralAffiliateName("");
      setReferralErrorMessage("");
      return false;
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
        return true;
      }

      setReferralCodeValid(false);
      setReferralAffiliateName("");
      setReferralErrorMessage(response.message || "Invalid referral code");
      return false;
    } catch (error) {
      console.error("Network Error:", error);
      setReferralCodeValid(false);
      setReferralErrorMessage("Check your internet connection");
      return false;
    } finally {
      setIsValidatingReferral(false);
    }
  };

  // Debounced discount code validation
  const validateDiscountCode = React.useCallback(
    debounce(async (code: string) => {
      if (!code || code.length < 4) {
        setDiscountValid(null);
        setDiscountData(null);
        return;
      }

      // If typed matches active exactly, it's valid
      const activeCode = activeDiscountCode;
      if (activeCode === code.toUpperCase()) {
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
        if (activeCode === code.toUpperCase()) {
          setDiscountValid(true);
        } else {
          setDiscountValid(false);
          setDiscountData(null);
        }
      } finally {
        setIsValidatingDiscount(false);
      }
    }, 500),
    [shootId, activeDiscountCode],
  );

  // AUTO-APPLY & REFRESH FIX LOGIC - UPDATED TO HANDLE OVERRIDE
  useEffect(() => {
    const urlCode = normalizeDiscountCodeValue(urlDiscount);

    // Logic: If URL code is different from saved code, prioritize the URL code
    if (urlCode && urlCode !== activeDiscountCode && !discountCode) {
      setDiscountCode(urlCode);
      validateDiscountCode(urlCode);
    }
    // Otherwise, hydrate only an actual saved discount code.
    else if (activeDiscountCode && !discountCode) {
      setDiscountValid(true);
      setDiscountCode(activeDiscountCode);
    }
  }, [urlDiscount, activeDiscountCode, discountCode, validateDiscountCode]);

  // Immediate discount validation (used on submit)
  const validateDiscountCodeNow = async (code: string) => {
    if (!code || code.length < 4) {
      setDiscountValid(null);
      setDiscountData(null);
      return false;
    }

    const activeCode = activeDiscountCode;
    if (activeCode === code.toUpperCase()) {
      return true;
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
        return true;
      }

      setDiscountValid(false);
      setDiscountData(null);
      return false;
    } catch (error: any) {
      setDiscountValid(false);
      setDiscountData(null);
      return false;
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleReferralCodeChange = (value: string) => {
    if (isReferralLocked) return;
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
    if (!upperCode && activeDiscountCode) {
      clearDiscountCode();
    }
  };

  const applyDiscountCode = async () => {
    const quoteId = quote?.quote_id || quote?.id;
    if (!discountCode || !discountValid || !quoteId) return;

    // Check if it is already applied
    const activeCode = activeDiscountCode;
    if (activeCode === discountCode.toUpperCase()) return;

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
          quote_id: quoteId,
          booking_id: shootId,
          guest_email: resolveGuestEmail(booking),
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.success) {
        toast.success("Discount applied successfully!");

        // Recalculate pricing after discount.
        // If a referral code is already valid, re-apply it on top of the discounted total.
        if (referralCodeValid && referralCode) {
          await refreshPricingWithReferral(referralCode);
        } else {
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
      }
    } catch (error: any) {
      console.error("Error applying discount:", error);
      toast.error(error.response?.data?.message || "Failed to apply discount");
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const clearDiscountCode = async () => {
    const quoteId = quote?.quote_id || quote?.id;
    const activeCode = activeDiscountCode;
    if (!activeCode || !quoteId || !shootId) {
      setDiscountCode("");
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

      const response = await axios.post(
        `${API_BASE_URL}sales/discount-codes/${activeCode}/clear`,
        {
          quote_id: quoteId,
          booking_id: shootId,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.success) {
        setDiscountCode("");
        setDiscountValid(null);
        setDiscountData(null);
        toast.success("Discount cleared successfully!");

        // Recalculate pricing after clear, preserving referral if present
        if (referralCodeValid && referralCode) {
          await refreshPricingWithReferral(referralCode);
        } else {
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
      }
    } catch (error: any) {
      console.error("Error clearing discount:", error);
      toast.error(error.response?.data?.message || "Failed to clear discount");
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate referral code on confirm before payment APIs
    if (referralCode.length > 0) {
      const isValid = await validateReferralCodeNow(referralCode);
      if (!isValid) {
        onError("Please enter a valid referral code or remove it.");
        return;
      }
    }

    // Validate discount code on confirm before payment APIs
    if (discountCode.length > 0) {
      const isValid = await validateDiscountCodeNow(discountCode);
      if (!isValid) {
        onError("This discount code is no longer active or is incorrect. Please enter a valid code or remove it to continue.");
        return;
      }
    }


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
        await onSuccess(
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

        await onSuccess(
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
              placeholder={isReferralLocked ? "Disabled for $0 total" : "Enter code"}
              maxLength={10}
              disabled={isReferralLocked}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isValidatingReferral ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : null}
              {referralCode.length > 0 && (
                <button
                  type="button"
                  onClick={clearReferralCode}
                  className="text-xs font-medium uppercase tracking-wider text-white/60 hover:text-white transition-colors"
                  aria-label="Clear referral code"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {referralCodeValid === true && referralAffiliateName && (
            <p className="text-green-400 text-sm mt-2">
              Referred by {referralAffiliateName}
            </p>
          )}
          {referralCodeValid === false && referralCode.length >= 4 && (
            <p className="text-red-400 text-sm mt-2">
              {referralErrorMessage || "Invalid referral code"}
            </p>
          )}
          {isReferralLocked && (
            <div className="text-white/60 text-sm mt-2">
              <div className="font-medium text-white/80">
                ⚠️ Referral Code Not Applicable
              </div>
              <div>
                This code can only be applied to shoot with a total value greater than $0.00
              </div>
            </div>
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
              onChange={(e) => {
                if (isFromPaymentLink) return;
                handleDiscountCodeChange(e.target.value);
              }}
              className={`h-14 lg:h-[82px] w-full rounded-[12px] border px-4 pr-24 text-white outline-none bg-[#272626] uppercase tracking-wider ${discountValid === true
                ? "border-green-500 focus:border-green-400"
                : discountValid === false
                  ? "border-red-500 focus:border-red-400"
                  : "border-white/30 focus:border-white/50"
                }`}
              placeholder="Enter discount code"
              maxLength={20}
              disabled={isFromPaymentLink}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isValidatingDiscount ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : discountValid === true && discountCode.toUpperCase() !== activeDiscountCode ? (
                <button
                  type="button"
                  onClick={applyDiscountCode}
                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Apply
                </button>
              ) : discountValid === true && discountCode.toUpperCase() === activeDiscountCode ? (
                <button
                  type="button"
                  onClick={clearDiscountCode}
                  className={`text-xs font-medium uppercase tracking-wider text-white/60 hover:text-white transition-colors ${isFromPaymentLink ? "hidden" : ""}`}
                >
                  Clear
                </button>
              ) : discountValid === false ? (
                <X className="w-5 h-5 text-red-500" />
              ) : null}
            </div>
          </div>
          {discountValid === true && discountCode.toUpperCase() === activeDiscountCode && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Discount applied: You Save {formatCurrency(quote.discount_total || quote.discount_amount)}
            </p>
          )}
          {discountValid === true && discountData && discountCode.toUpperCase() !== activeDiscountCode && (
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

        {/* Account Credit */}
        {/* <div className="w-full rounded-2xl border border-[#E8D1AB]/30 bg-gradient-to-br from-[#232323] to-[#1B1B1B] p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(232,209,171,0.45)]">
          <label
            className={`flex items-start justify-between gap-4 rounded-xl transition ${
              canUseAccountCredit ? "cursor-pointer" : "cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="sr-only"
                checked={Boolean(useAccountCredit && canUseAccountCredit)}
                disabled={!canUseAccountCredit}
                onChange={(e) => onToggleAccountCredit(e.target.checked)}
              />
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  useAccountCredit && canUseAccountCredit
                    ? "border-[#E8D1AB] bg-[#E8D1AB] text-black shadow-[0_0_0_3px_rgba(232,209,171,0.2)]"
                    : "border-white/40 bg-[#272626] text-transparent"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm lg:text-base text-white font-semibold tracking-wide">
                  Use Account Credit
                </span>
                <span className="text-xs lg:text-sm text-white/60 mt-0.5">
                  Available balance: {formatCurrency(availableCreditAmount || 0)}
                </span>
              </div>
            </div>
            {canUseAccountCredit && (
              <span className="text-[10px] lg:text-xs font-semibold uppercase tracking-[0.12em] text-[#E8D1AB] bg-[#E8D1AB]/10 border border-[#E8D1AB]/30 rounded-full px-2.5 py-1">
                Credit Ready
              </span>
            )}
          </label>
          {canUseAccountCredit && useAccountCredit && creditAppliedAmount > 0 && (
            <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300 flex items-center justify-between">
              <span>Credit applied</span>
              <span className="font-semibold">-{formatCurrency(creditAppliedAmount)}</span>
            </div>
          )}
          {!canUseAccountCredit && (
            <p className="text-white/50 text-sm mt-3">No account credit available for this booking.</p>
          )}
        </div> */}

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

      <div className="flex gap-3 bg-[#2A2A2A] rounded-[10px] p-2 lg:p-4 items-center mt-2 lg:mt-5">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
        />
        <p className="text-sm text-[#999]">
          By continuing to payment, you agree to our{" "}
          <span className="text-[#E8D5B5]">Terms & Conditions</span>,{" "}
          <span className="text-[#E8D5B5]">Cancellation Policy</span>,
          and <span className="text-[#E8D5B5]">Privacy Policy</span>
        </p>
      </div>
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
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isDetailsFormOpen, setIsDetailsFormOpen] = useState(false);
  const [useAccountCredit, setUseAccountCredit] = useState(false);

  // UPDATED STATE FOR AGGREGATED ADDITIONAL PARTNERS
  const [pricingGroups, setPricingGroups] = useState<{
    shootCost: number;
    additionalCP: {
      totalCost: number;
      videoCount: number;
      photoCount: number;
    };
    mandatoryAddons: Array<{ role: string; cost: number }>;
    editingFees: number;
    studioCost: number;
  }>({
    shootCost: 0,
    additionalCP: { totalCost: 0, videoCount: 0, photoCount: 0 },
    mandatoryAddons: [],
    editingFees: 0,
    studioCost: 0,
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
      // const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "") + "/";
      // const response = await axios.get(`${API_BASE_URL}admin/${shootId}/get-booking-summary`); // Your new API endpoint

      // if (response.data.success) {
      //   setSummaryData(response.data.data);
      //   setIsSummaryModalOpen(true);
      // }
      if (summaryData && Object.keys(summaryData).length > 0) {
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
    const lineItems = paymentDetails?.quote?.lineItems || [];
    let shootCostSum = 0;
    let addVideoCount = 0;
    let addPhotoCount = 0;
    let addCPTotalCost = 0;
    let editingFeesSum = 0;
    let studioCostSum = 0;
    const mandatoryAddonItems: Array<{ role: string; cost: number }> = [];

    lineItems.forEach((item: any) => {
      const name = item.item_name || "";
      const quantity = parseInt(item.quantity || 1);
      const total = parseFloat(item.line_total || 0);
      const unitPrice = total / quantity;

      // IMPROVED DETECTION: Check slug, category name, or keywords in item name
      const categorySlug = item.pricing_item?.category?.slug?.toLowerCase();
      const categoryName = item.pricing_item?.category?.name?.toLowerCase();
      const lowerName = name.toLowerCase();
      const isStudioItem =
        lowerName.includes("studio") ||
        lowerName.includes("resort") ||
        lowerName.includes("location platform");

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
      }
      else if (isStudioItem) {
        studioCostSum += total;
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
      additionalCP: {
        totalCost: addCPTotalCost,
        videoCount: addVideoCount,
        photoCount: addPhotoCount
      },
      mandatoryAddons: mandatoryAddonItems,
      editingFees: editingFeesSum,
      studioCost: studioCostSum,
    });
  }, [paymentDetails]);

  const fetchIntent = async (details: any, useCreditOverride: boolean = useAccountCredit) => {
    if (!details || !shootId) return;
    const { booking, quote } = details;
    const rawQuoteTotal = parseFloat(quote?.total || 0);
    const availableCredit = parseFloat(details?.account_credit?.available_credit_amount || 0);
    const canUseCredit = Boolean(details?.account_credit?.can_use_credit) && availableCredit > 0;
    const creditToApply =
      useCreditOverride && canUseCredit ? Math.min(availableCredit, rawQuoteTotal) : 0;
    const payableAmount = Math.max(rawQuoteTotal - creditToApply, 0);

    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "") + "/";
      const response = await axios.post(
        `${API_BASE_URL}payments/create-intent-multi`,
        {
          booking_id: shootId,
          amount: payableAmount,
          guest_email: resolveGuestEmail(booking, summaryData?.client_email),
          use_credit: useCreditOverride && canUseCredit,
          credit_amount_used: creditToApply,
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

  const refreshPaymentIntent = async (updatedDetails: any, useCreditOverride?: boolean) => {
    setIsUpdatingIntent(true);
    await fetchIntent(updatedDetails, useCreditOverride ?? useAccountCredit);
    setIsUpdatingIntent(false);
  };

  const fetchSummaryData = async () => {
    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/")
        .replace(/\/$/, "") + "/";

      const response = await axios.get(`${API_BASE_URL}admin/${shootId}/get-booking-summary`);

      if (response.data.success) {
        setSummaryData(response.data.data);
      }
    } catch (err) {
      toast.error("Failed to load summary details");
      console.error("Fetch error:", err);
    }
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

    if (shootId) {
      fetchSummaryData();
    }

    fetchPaymentDetails();
  }, [shootId]);

  useEffect(() => {
    const availableCredit = parseFloat(paymentDetails?.account_credit?.available_credit_amount || 0);
    const canUseCredit =
      Boolean(paymentDetails?.account_credit?.can_use_credit) && availableCredit > 0;
    if (!canUseCredit && useAccountCredit) {
      setUseAccountCredit(false);
      refreshPaymentIntent(paymentDetails, false);
    }
  }, [
    paymentDetails?.account_credit?.available_credit_amount,
    paymentDetails?.account_credit?.can_use_credit,
    paymentDetails,
    useAccountCredit,
  ]);

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
          use_credit: useAccountCredit && canUseAccountCredit,
          credit_amount_used: creditAppliedAmount,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      await fetchSummaryData();
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
  const accountCredit = paymentDetails?.account_credit || {};
  const availableCreditAmount = parseFloat(accountCredit?.available_credit_amount || 0);
  const canUseAccountCredit =
    Boolean(accountCredit?.can_use_credit) && availableCreditAmount > 0;
  const creditAppliedAmount =
    isQuoteValid && canUseAccountCredit && useAccountCredit
      ? Math.min(availableCreditAmount, quoteTotal || 0)
      : 0;
  const payableTotal = isQuoteValid
    ? Math.max((quoteTotal || 0) - creditAppliedAmount, 0)
    : 0;

  const customerName =
    pickDisplayName(
      extractContactName(summaryData?.description),
      extractContactName(booking?.description),
      summaryData?.client_name,
      summaryData?.clientName,
      booking?.full_name,
      booking?.fullName,
      booking?.client_name,
      booking?.guest_name,
      booking?.user?.name,
      extractNameFromProjectName(summaryData?.project_name),
      extractNameFromProjectName(booking?.project_name),
    ) || "Customer";

  const shootCategory = toTitleCase(
    (summaryData?.shoot_type || booking?.shoot_type || "").trim(),
  );

  const shootTypeLabel = formatShootTypeLabel(
    summaryData?.event_type || booking?.event_type,
  );

  const compactCustomerName = customerName.replace(/\s+/g, "");
  const headerParts = [
    compactCustomerName,
    shootCategory || "Shoot",
    shootTypeLabel || "ShootType",
  ].filter(Boolean);

  const headerText = headerParts.join("_");

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

    const paidAmount = summaryData?.pricing?.total_paid ?? quoteTotal;

    return (
      <div className="pt-20 lg:pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full min-h-[60vh]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#E8D1AB]/20 blur-[60px] rounded-full" />
              <div className="relative w-[360px] h-[220px] lg:w-[548px] lg:h-[344px]">
                <Image
                  src="/images/misc/PaymentSuccess.gif"
                  alt="Payment Done"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <h2 className="text-lg lg:text-4xl font-medium mb-2 lg:mb-5 text-center">Booking Confirmed</h2>
            <p className="text-[#E8D1AB] text-xl lg:text-[42px] font-bold mb-8 lg:mb-12">{formatCurrency(paidAmount)}</p>
            <div className="w-full max-w-2xl mb-6">
              <button
                onClick={() => setIsDetailsFormOpen(true)}
                className="w-full h-14 lg:h-20 rounded-xl lg:rounded-2xl bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium transition-colors flex items-center justify-center"
              >
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
        <AffiliateShootDetailsForm
          isOpen={isDetailsFormOpen}
          onClose={() => setIsDetailsFormOpen(false)}
          projectId={parseInt(shootId || "0")}
          hideAffiliateStep={true}
          redirectTo="/login"
        />
      </div>
    );
  }

  // Date Time info to manage Multiday shoot format
  const dateTimeInfo = getBookingDetails(booking)
  const handleAccountCreditToggle = async (enabled: boolean) => {
    const nextValue = Boolean(enabled && canUseAccountCredit);
    setUseAccountCredit(nextValue);
    await refreshPaymentIntent(paymentDetails, nextValue);
  };

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

                <Elements stripe={stripePromise}>
                  <StripePaymentFormMulti
                    clientSecret={clientSecret}
                    amount={payableTotal || 0}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    shootId={shootId}
                    booking={booking}
                    quote={quote}
                    accountCredit={accountCredit}
                    useAccountCredit={useAccountCredit}
                    creditAppliedAmount={creditAppliedAmount}
                    onToggleAccountCredit={handleAccountCreditToggle}
                    setPaymentDetails={setPaymentDetails}
                    refreshPaymentIntent={refreshPaymentIntent}
                  />
                </Elements>

                {/* Beige Gaurantee */}
                <div className="rounded-2xl border transition-all relative overflow-hidden bg-[#E8D1AB] text-[#1B1B1B] p-4 mt-2 lg:mt-4 flex items-start gap-4 ">
                  <div className="flex-shrink-0 bg-[#1B1B1B] p-2 lg:p-4 rounded-lg">
                    <BadgeCheckIcon className="w-6 h-6 lg:w-10 lg:h-10 text-[#E8D1AB]" />
                  </div>
                  <p className="italic font-bold text-sm lg:text-base">Our Beige Quality Guarantee ensures your production meets professional standards. If your shoot does not meet the agreed scope or quality expectations, we&apos;ll work with you and your assigned creative partner to make it right — including a complimentary reshoot if necessary.</p>
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-5 space-y-6 rounded-[20px]">
            <div className="bg-[#171717] rounded-[20px]">
              {/* <div className="bg-[#171717] rounded-[24px] p-6 lg:p-10"> */}
              <div className="p-6 lg:p-10 bg-[#272626] rounded-[20px]">
                <h3 className="font-bold text-base lg:text-2xl">Booking Summary</h3>
              </div>
              {/* <div className="bg-white rounded-[20px] text-black py-3 lg:py-5"> */}
              <div className="rounded-b-[20px] text-black">
                <div className="p-6 lg:p-10 border-b border-b-[#FFFFFF5C] flex gap-4 items-start">
                  <div className="w-10 h-10 lg:h-[82px] lg:w-[82px] rounded-full bg-[#333333] flex items-center justify-center text-[#FFFFFF85] font-semibold lg:text-2xl">
                    {getInitials(customerName)}
                  </div>
                  {/* ProjectName/Shoot Name currently displayed */}
                  <h4 className="flex-1 min-w-0 font-bold text-base lg:text-2xl text-white whitespace-normal break-words [overflow-wrap:anywhere]">
                    {headerText}
                  </h4>
                </div>
                <div className="p-6 lg:p-10 lg:text-lg text-white border-b border-b-[#FFFFFF5C]">
                  <div className="grid grid-cols-2 lg:grid-cols-3 mb-4 gap-2">
                    <div className="flex flex-col justify-between">
                      <span className="text-[#626467]">Shoot Category:</span>
                      <span className="font-medium">{toTitleCase((summaryData.shoot_type || "").trim())}</span>
                    </div>
                    <div className="flex flex-col justify-between">
                      <span className="text-[#626467]">Shoot Date:</span>
                      {/* <span className="font-medium">{formatShortDate(booking.event_date)} </span> */}
                      <span className="font-medium whitespace-pre-line">{dateTimeInfo.summaryDateText} </span>
                    </div>
                    <div className="flex flex-col justify-between">
                      <span className="text-[#626467]">Duration:</span>
                      <span className="font-medium">
                        <span className="block">{formatDurationHours(booking.duration_hours)} Hours</span>
                        {/* {getTimeRange(booking) ? (
                          <span className="block">{getTimeRange(booking)}</span>
                        ) : null} */}
                        <span className="block">{dateTimeInfo.displayTimeText}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between mb-4">
                    <span className="text-[#626467]">Shoot Type:</span>
                    <span className="font-medium">{toTitleCase((summaryData.event_type || "").trim())}</span>
                  </div>
                  <div className="flex flex-col justify-between">
                    <span className="text-[#626467]">Location:</span>
                    <span className="truncate">{booking.event_location ? formatLocationForDisplay(booking.event_location) : "N/A"}</span>
                  </div>
                </div>

                <div className="m-6 lg:m-10 rounded-2xl transition-all relative overflow-hidden bg-[#FFFFFF] text-[#000000]">
                  <div className=" p-4 lg:p-7">
                    <h4 className="font-bold text-lg lg:text-2xl">Shoot includes:</h4>
                  </div>
                  <div className="p-4 lg:p-7 space-y-2 lg:space-y-4 text-sm border-t border-t-[#0000005C]">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 lg:h-20 lg:w-20 rounded-full bg-[#E8D1AB] flex items-center justify-center text-[#000000]">
                        <Users className="w-6 h-6 lg:w-1- lg:h-10" />
                      </div>
                      <div className="flex flex-col lg:text-lg">
                        <span className="text-[#626467]">Dedicated Team:</span>
                        {
                          booking.event_type === "videographer" && (
                            <span className="text-[#070707] font-medium">{summaryData?.crew_counts[0].count || 0} Videographer(s) </span>
                          )
                        }
                        {
                          booking.event_type === "photographer" && (
                            <span className="text-[#070707] font-medium">{summaryData?.crew_counts[0].count || 0} Photographer(s)</span>
                          )
                        }
                        {
                          booking.event_type === "videographer,photographer" && (
                            <span className="text-[#070707] font-medium">{summaryData?.crew_counts[0].count || 0} Videographer(s) & {summaryData?.crew_counts[1].count || 0} Photographer(s)</span>
                          )
                        }
                      </div>
                    </div>

                    {
                      summaryData?.editing?.is_needed == true && (
                        <>
                          <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 lg:h-20 lg:w-20 rounded-full bg-[#E8D1AB] flex items-center justify-center text-[#000000]">
                              <PencilLine className="shrink-0 w-6 h-6 lg:w-1- lg:h-10" />
                            </div>
                            <div className="flex flex-col justify-between lg:text-lg">
                              <span className="text-[#626467]">Number of Edited Content:</span>
                              {
                                (summaryData?.editing && summaryData?.editing?.video_edits?.length > 0) && (
                                  <div className="">
                                    <span className="text-[#070707] font-medium">{summaryData?.editing?.video_edits?.length || 0} Video Edits</span>
                                  </div>
                                )
                              }
                              {
                                (summaryData?.editing && summaryData?.editing?.photo_edits?.length > 0) && (
                                  <div className="">
                                    <span className="text-[#070707] font-medium">{summaryData?.editing?.photo_edits?.length || 0} Photo Edits</span>
                                  </div>
                                )
                              }
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {getEditCounts(summaryData?.editing?.video_edits || []).map(
                              ({ label, count }) => (
                                <div key={label} className="text-[#666] text-xs lg:text-sm font-medium bg-[#F4F4F4] border border-[#00000033] rounded-[10px] p-2 lg:px-5 lg:py-3.5">
                                  {label}
                                  {count > 1 ? ` (x${count})` : ""}
                                </div>
                              ),
                            )}
                            {getEditCounts(summaryData?.editing?.photo_edits || []).map(
                              ({ label, count }) => (
                                <div key={label} className="text-[#666] text-xs lg:text-sm font-medium bg-[#F4F4F4] border border-[#00000033] rounded-[10px] p-2 lg:px-5 lg:py-3.5">
                                  {label}
                                  {count > 1 ? ` (x${count})` : ""}
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      )
                    }
                    <div className="bg-gradient-to-r from-[#FFF0D8] to-white rounded-xl p-4 lg:p-7 flex flex-col justify-between gap-3 lg:gap-6 italic">
                      <p className="text-[#000] flex gap-2 text-base font-medium"><Check size={24} />Unlimited Usage Rights</p>
                      <p className="text-[#000] flex gap-2 text-base font-medium"><Check size={24} />$2M Liability Insurance Policy</p>
                      <p className="text-[#000] flex gap-2 text-base font-medium"><Check size={24} />Beige Guarantee</p>
                    </div>
                  </div>
                </div>

                {creators && creators.length > 0 && (
                  <div className="p-6 lg:p-10 lg:text-lg text-white border-y border-y-[#FFFFFF5C]">
                    <h4 className="font-bold text-lg lg:text-2xl mb-3 flex items-center gap-2">
                      Your Crew <span className="text-[#E8D1AB]">({creators?.length || 0})</span>
                    </h4>
                    <div className="space-y-2">
                      {creators.slice(0, 3).map((creator: any) => {
                        const imageUrl = creator.profile_image
                          ? `${S3_PREFIX}${creator.profile_image}`
                          : getFallbackImage(creator.crew_member_id);
                        return (
                          <div key={creator.crew_member_id} className="flex items-center gap-2 lg:gap-4">
                            <div className="relative w-10 h-10 lg:w-[80px] lg:h-[80px] rounded-full overflow-hidden shrink-0">
                              <Image src={imageUrl} alt={creator.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 lg:text-lg ">
                              <p className="font-medium truncate">{creator.name}</p>
                              <p className="text-[#626467] truncate">{creator.role_name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quote && (
                  <>
                    <div className="p-6 lg:p-10 lg:text-lg text-white border-b border-b-[#FFFFFF5C]">
                      {/* NEW AGGREGATED PRICING DISPLAY */}

                      {/* 1. SHOOT COST */}
                      <div className="flex justify-between mb-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-[#CCC6C6]">Shoot Cost</span>
                        </div>
                        <span className="font-bold">{formatCurrency(pricingGroups.shootCost || 0)}</span>
                      </div>

                      {pricingGroups.additionalCP.totalCost > 0 && (
                        <div className="flex justify-between mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-[#CCC6C6]">Additional Creative Partner Fees</span>
                            {/* <div className="text-[11px] text-[#626467] space-y-0.5">
                            {pricingGroups.additionalCP.videoCount > 0 && (
                              <div>videographer x {pricingGroups.additionalCP.videoCount}</div>
                            )}
                            {pricingGroups.additionalCP.photoCount > 0 && (
                              <div>photographer x {pricingGroups.additionalCP.photoCount}</div>
                            )}
                          </div> */}
                          </div>
                          <span className="font-medium">{formatCurrency(pricingGroups.additionalCP.totalCost || 0)}</span>
                        </div>
                      )}

                      {pricingGroups.editingFees > 0 && (
                        <div className="flex justify-between mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-[#CCC6C6]">Editing Cost</span>
                            <span className=" text-[#787979]">Includes professional editing</span>
                          </div>
                          <span className="font-medium">{formatCurrency(pricingGroups.editingFees)}</span>
                        </div>
                      )}

                      {pricingGroups.studioCost > 0 && (
                        <div className="flex justify-between mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-[#CCC6C6]">Studio / Resort</span>
                            <span className=" text-[#787979]">Coachella studio selection</span>
                          </div>
                          <span className="font-medium">{formatCurrency(pricingGroups.studioCost)}</span>
                        </div>
                      )}

                      {pricingGroups.mandatoryAddons.length > 0 && pricingGroups.mandatoryAddons.map((item, idx) => (
                        <div key={`addon-${idx}`} className="flex justify-between text-sm p-3 lg:p-5 border-b border-black/20 bg-[#E8D1AB]/5">
                          <span className="text-[#626467] font-medium">{item.role}</span>
                          <span className="font-bold">{formatCurrency(item.cost || 0)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 lg:p-10 lg:text-[22px] text-white border-b border-b-[#FFFFFF5C]">
                      <div className="">
                        <div className="flex justify-between mb-1">
                          <span className="text-[#CCC6C6]">Subtotal</span>
                          <span className="font-medium text-[#389903]">{formatCurrency(quote.subtotal || 0)}</span>
                        </div>

                        {parseFloat(quote.discount_total || quote.discount_amount || 0) > 0 && (
                          <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-black/10">
                            <div className="flex flex-col">
                              <span className="text-green-600 font-bold flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Discount
                              </span>
                              {quote.discount_percentage && <span className="text-[10px] text-green-600/80">({quote.discount_percentage}% off)</span>}
                              {quote.discount_percent && <span className="text-[10px] text-green-600/80">({quote.discount_percent}% off)</span>}
                            </div>
                            <span className="text-green-600 font-bold">-{formatCurrency(quote.discount_total || quote.discount_amount)}</span>
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

                        {parseFloat(quote.tax_amount || 0) > 0 && (
                          <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-black/10">
                            <div className="flex flex-col">
                              <span className="text-[#CCC6C6] font-medium">
                                Tax
                                {parseFloat(quote.tax_rate || 0) > 0 ? ` (${quote.tax_rate}%)` : ""}
                              </span>
                              {quote.tax_type && (
                                <span className="text-[10px] text-[#787979] capitalize">
                                  {quote.tax_type} tax
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-white">
                              {formatCurrency(quote.tax_amount)}
                            </span>
                          </div>
                        )}

                        {canUseAccountCredit && useAccountCredit && creditAppliedAmount > 0 && (
                          <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-black/10">
                            <span className="text-green-700 font-medium">Account Credit Applied</span>
                            <span className="text-green-700 font-bold">
                              -{formatCurrency(creditAppliedAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6 lg:p-10 text-lg lg:text-2xl flex justify-between items-start bg-[#E8D1AB] rounded-b-[20px]">
                      <div className="flex flex-col">
                        <span className="font-bold">Total</span>
                        <span className="lg:text-lg text-[#545557]">Amount Due</span>
                      </div>
                      <span className="text-xl lg:text-[30px] font-bold">{formatCurrency(payableTotal || 0)}</span>
                    </div>
                  </>
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
