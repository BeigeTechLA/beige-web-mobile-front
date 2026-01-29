"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useValidatePaymentLinkQuery } from '@/lib/redux/features/sales/salesApi';
import { Navbar } from '@/src/components/landing/Navbar';
import { Footer } from '@/src/components/landing/Footer';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentLinkPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { data, isLoading, error } = useValidatePaymentLinkQuery(token, {
    skip: !token,
  });

  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const paymentLink = data?.data;
  const isValid = data?.success && paymentLink && !paymentLink.is_used && !paymentLink.is_expired;

  // Auto-redirect on successful validation
  useEffect(() => {
    if (isValid && paymentLink && autoRedirect) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleProceedToPayment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isValid, paymentLink, autoRedirect]);

  const handleProceedToPayment = () => {
    if (paymentLink?.booking) {
      const creatorId = paymentLink.booking.creator_id || 'unknown';
      const bookingId = paymentLink.booking.stream_project_booking_id;
      let url = `/search-results/${creatorId}/payment?shootId=${bookingId}`;

      // Add discount code to URL if present
      if (paymentLink.discount_code?.code) {
        url += `&discount=${paymentLink.discount_code.code}`;
      }

      router.push(url);
    }
  };

  if (isLoading) {
    return (
      <main className="bg-[#101010] min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB] mx-auto mb-4"></div>
            <p className="text-white/60">Validating payment link...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !data?.success) {
    return (
      <main className="bg-[#101010] min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#171717] rounded-2xl p-8 border border-white/10">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Invalid Payment Link</h1>
              <p className="text-white/60 mb-6">
                {error ? 'Failed to validate payment link' : data?.message || 'This payment link is invalid or has expired.'}
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (paymentLink?.is_used) {
    return (
      <main className="bg-[#101010] min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#171717] rounded-2xl p-8 border border-white/10">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Link Already Used</h1>
              <p className="text-white/60 mb-6">
                This payment link has already been used and cannot be accessed again.
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (paymentLink?.is_expired) {
    return (
      <main className="bg-[#101010] min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#171717] rounded-2xl p-8 border border-white/10">
              <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Link Expired</h1>
              <p className="text-white/60 mb-2">
                This payment link has expired and can no longer be used.
              </p>
              {paymentLink.expires_at && (
                <p className="text-white/40 text-sm mb-6">
                  Expired on: {new Date(paymentLink.expires_at).toLocaleString()}
                </p>
              )}
              <Button
                onClick={() => router.push('/')}
                className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Valid link - show booking summary and redirect
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="max-w-2xl w-full">
          <div className="bg-[#171717] rounded-2xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Payment Link Verified</h1>
              <p className="text-white/60">
                Your payment link has been validated. You'll be redirected to complete your booking.
              </p>
            </div>

            {/* Booking Summary */}
            {paymentLink?.booking && (
              <div className="bg-[#272626] rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
                <div className="space-y-3 text-sm">
                  {paymentLink.booking.project_name && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Project:</span>
                      <span className="text-white font-medium">{paymentLink.booking.project_name}</span>
                    </div>
                  )}
                  {paymentLink.booking.event_type && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Event Type:</span>
                      <span className="text-white font-medium capitalize">{paymentLink.booking.event_type}</span>
                    </div>
                  )}
                  {paymentLink.booking.event_date && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Date:</span>
                      <span className="text-white font-medium">
                        {new Date(paymentLink.booking.event_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {paymentLink.booking.budget && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Budget:</span>
                      <span className="text-white font-medium">${paymentLink.booking.budget}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Discount Info */}
            {paymentLink?.discount_code && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 font-medium">Discount Code Included</span>
                </div>
                <p className="text-white/80 text-sm">
                  Code <span className="font-mono font-bold">{paymentLink.discount_code.code}</span> will be automatically applied
                  {paymentLink.discount_code.discount_type === 'percentage'
                    ? ` (${paymentLink.discount_code.discount_value}% off)`
                    : ` ($${paymentLink.discount_code.discount_value} off)`}
                </p>
              </div>
            )}

            {/* Auto-redirect countdown */}
            {autoRedirect && (
              <div className="text-center mb-6">
                <p className="text-white/60 text-sm">
                  Redirecting in <span className="font-bold text-[#E8D1AB]">{countdown}</span> seconds...
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleProceedToPayment}
                className="flex-1 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium h-12 text-base"
              >
                Proceed to Payment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setAutoRedirect(false)}
                variant="outline"
                className="border-white/10 hover:bg-white/5"
              >
                Cancel Auto-redirect
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
