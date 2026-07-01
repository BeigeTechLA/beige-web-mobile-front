"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useValidatePaymentLinkQuery } from '@/lib/redux/features/sales/salesApi';
import { Navbar } from '@/src/components/landing/Navbar';
import { Footer } from '@/src/components/landing/Footer';
import { CheckCircle, XCircle, ArrowRight, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentLinkPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { data, isLoading, isFetching } = useValidatePaymentLinkQuery(token, {
    skip: !token,
  });

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isFetching && data) {
      console.log("--- Payment Link Debug ---");
      console.log("Full API Response:", data);
      console.log("Reason Code:", data?.reason_code || data?.data?.reason_code);
      console.log("Valid Status:", data?.valid);
      console.log("Booking ID:", data?.booking_id || data?.data?.booking_id);
    }
  }, [data, isFetching]);
  
  const isAlreadyPaid = data?.reason_code === "PAID" || data?.data?.reason_code === "PAID";
  
  const paymentDetails = data?.data || data;
  const bookingId = paymentDetails?.booking_id;
  const requestedAmount = paymentDetails?.requested_amount;

  const isValid = !isAlreadyPaid && (data?.valid === true || !!bookingId);

  const handleProceedToPayment = useCallback(() => {
    if (bookingId) {
      let url = `/search-results/payment?shootId=${bookingId}&paymentLink=${encodeURIComponent(token)}`;
      if (paymentDetails?.discount_code) {
        url += `&discount=${paymentDetails.discount_code}`;
      }
      if (requestedAmount) {
        url += `&amount=${encodeURIComponent(String(requestedAmount))}`;
      }
      console.log("Redirecting to:", url);
      router.push(url);
    }
  }, [bookingId, paymentDetails, requestedAmount, router, token]);

  // Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isValid && !isFetching) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => { if(timer) clearInterval(timer); };
  }, [isValid, isFetching]);

  // Redirect Logic
  useEffect(() => {
    if (countdown === 0 && isValid && !isFetching) {
      handleProceedToPayment();
    }
  }, [countdown, isValid, isFetching, handleProceedToPayment]);


  if (isLoading || isFetching) {
    return (
      <main className="bg-[#101010] min-h-screen text-white flex flex-col relative">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-40 pb-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin mx-auto mb-4" />
            <p className="text-white/60">Verifying link security...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (isAlreadyPaid) {
    return (
      <main className="bg-[#101010] min-h-screen text-white flex flex-col relative">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 pt-40 pb-20">
          <div className="max-w-md w-full text-center bg-[#171717] rounded-2xl p-10 border border-[#E8D1AB]/30 shadow-2xl">
            <PartyPopper className="w-20 h-20 text-[#E8D1AB] mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4 text-white">Payment Received</h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              {data?.message || "Payment for this project has already been completed. You're all set!"}
            </p>
            <Button 
              onClick={() => router.push('/')} 
              className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black w-full h-14 text-lg font-bold"
            >
              Back to Homepage
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!isValid) {
    return (
      <main className="bg-[#101010] min-h-screen text-white flex flex-col relative">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 pt-40 pb-20">
          <div className="max-w-md w-full text-center bg-[#171717] rounded-2xl p-8 border border-red-500/20 shadow-2xl">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
            <p className="text-white/60 mb-6">{data?.message || "This link is no longer valid or has expired."}</p>
            <Button onClick={() => router.push('/')} className="bg-white/10 hover:bg-white/20 text-white w-full h-12">
              Go to Homepage
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-[#101010] min-h-screen text-white flex flex-col relative">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 pt-40 pb-20">
        <div className="max-w-md w-full text-center bg-[#171717] rounded-2xl p-10 border border-[#E8D1AB]/20 shadow-2xl">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Link Verified</h1>
          <p className="text-white/70 mb-2">Redirecting to our secure checkout...</p>
          <p className="text-[#E8D1AB] text-sm font-medium mb-8">
            Redirecting in <span className="text-xl font-bold">{countdown}</span> seconds
          </p>
          <Button onClick={handleProceedToPayment} className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black w-full h-14 text-lg font-bold group">
            Continue to Payment <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
