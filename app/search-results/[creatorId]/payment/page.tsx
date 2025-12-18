"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Copy, CreditCard, MessageCircleMore, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { BookingSummaryModal } from "./components/BookingSumaryModal";

// Mock booking details
const mockBookingDetails = {
  confirmationNumber: "#BG-20250125-001",
  paymentMethod: "Stripe (****4242)",
  transactionId: "txn_1234567890",
  amountPaid: "$405.00",
  paymentDate: "August 26, 2025 at 06:50 PM",
};

// Mock creator data
const mockCreator = {
  name: "Ethan Cole",
  role: "Photographer Specialist",
  rating: 4.5,
  reviews: 120,
  image: "/images/avater-details.png",
  basePrice: 450,
  hours: 1,
  discount: 45,
  total: 405,
};

function PaymentContent() {
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId");

  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [showSummary, setShowSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shootName, setShootName] = useState("");

  const handlePayment = async () => {
    setIsProcessing(true);

    // Mock payment processing
    console.log("Processing payment...", {
      shootId,
      amount: mockCreator.total,
      creator: mockCreator.name,
    });

    // Simulate API call delay
    setTimeout(() => {
      setIsProcessing(false);
      setStep("success");
      console.log("Payment successful!");
    }, 2000);
  };

  const handleBookAnother = () => {
    console.log("Booking another session...");
    setShowSummary(false);
    // In a real app, this would navigate back to search results
    window.location.href = `/search-results${shootId ? `?shootId=${shootId}` : ""}`;
  };

  const handleContinueToDashboard = () => {
    console.log("Continuing to dashboard...", { shootName });
    // In a real app, this would navigate to the dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="relative pt-20 md:pt-32 pb-20 min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Background Overlay */}
      <img
        src="/svg/HeroBanner.svg"
        alt="Decorative Overlay"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />
      <div className="container mx-auto mt-12 px-4 md:px-0 relative z-10">
        {step === "confirm" ? (
          <div className="relative isolate overflow-hidden">

            {/* Back Link */}
            <Link
              href={`/search-results/ethan-cole${shootId ? `?shootId=${shootId}` : ''}`}
              className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>

            <div className="text-center mb-8 lg:mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-lg lg:text-[64px] lg:leading-[76px] font-bold text-gradient-white mb-3 lg:mb-5">
                  Confirm and Pay
                </h2>
                <p className="text-white/70 mx-auto text-xs lg:text-base">
                  Review your booking details and complete your payment to secure your session
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mx-auto">
              {/* Left Column: Payment Form */}
              <div className="lg:col-span-7 space-y-8">
                {/* Payment Method Section */}
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
                    <button
                      onClick={() => console.log("Change payment method clicked")}
                      className="text-base bg-[#222] text-white px-3 py-1.5 lg:py-3.5 lg:px-8 rounded-[10px] font-medium hover:bg-white/90 transition-colors lg:min-w-[125px]"
                    >
                      Change
                    </button>
                  </div>

                  {/* Card Form */}
                  <div className="bg-[#272626] rounded-[20px] p-4 lg:p-10 flex flex-col gap-5 lg:gap-9">
                    <div className="relative w-full">
                      <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative w-full">
                        <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
                        />
                      </div>
                      <div className="relative w-full">
                        <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60">
                          CVC / CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
                        />
                      </div>
                    </div>

                    <div className="relative w-full">
                      <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60">
                        Card Holder Name
                      </label>
                      <input
                        type="text"
                        className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
                        placeholder="Ex. John Doe"
                      />
                    </div>

                    {/* Button */}
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-fit h-14 lg:h-[96px] px-5 lg:px-12 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium rounded-[10px] lg:rounded-[20px] shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] disabled:opacity-50"
                    >
                      {isProcessing ? "Processing..." : `Confirm & Pay $${mockCreator.total}`}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Summary */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#171717] rounded-[24px] p-6 lg:p-10">
                  <h3 className="font-bold mb-7 text-base lg:text-2xl">Booking Summary</h3>

                  <div className="bg-white rounded-[20px] text-black py-3 lg:py-5">
                    {/* Creator Info */}
                    <div className="flex items-center gap-2 lg:gap-4 border-b border-black/20 pb-3 lg:pb-5 px-3 lg:px-5">
                      <div className="flex-shrink-0 w-10 h-10 lg:w-[82px] lg:h-[82px] rounded-full overflow-hidden border border-white/10">
                        <Image
                          src={mockCreator.image}
                          alt="Creator"
                          width={82}
                          height={82}
                          className="w-full h-full object-cover"
                          priority
                        />
                      </div>
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <h4 className="font-medium text-base lg:text-2xl">{mockCreator.name}</h4>
                          <span className=" text-xs lg:text-sm">{mockCreator.role}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs lg:text-sm">
                          <Star className="w-3 h-3 fill-[#222222]" />
                          <span>{mockCreator.rating} ({mockCreator.reviews})</span>
                        </div>
                      </div>
                    </div>


                    {/* Pricing Breakdown */}
                    <div className="">
                      <div className="flex justify-between text-sm lg:text-base p-3 lg:p-5 border-b border-black/20">
                        <span className="text-[#626467]">Base Package ({mockCreator.hours} Hours)</span>
                        <span className="text-[#212122] font-medium">${mockCreator.basePrice}</span>
                      </div>
                      <div className="text-sm lg:text-base p-3 lg:p-5 border-b border-black/20">
                        <div className="flex justify-between mb-3 lg:mb-5">
                          <span className="text-[#626467]">Subtotal</span>
                          <span className="text-[#212122] font-medium">${mockCreator.basePrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#626467]">Early Bird Discount (10%)</span>
                          <span className="font-medium text-[#4CAF50]">-${mockCreator.discount}</span>
                        </div>
                      </div>

                      {/* <div className="h-px bg-white/10 my-4" /> */}
                      <div className="flex justify-between items-start p-3 lg:p-5 ">
                        <div className="flex flex-col gap-2 lg:gap-4 text-sm lg:text-base">
                          <span className="font-bold">Total</span>
                          <span className="text-[#212122]">Today: ${mockCreator.total}</span>
                        </div>
                        <span className="text-xl font-bold">${mockCreator.total}</span>

                      </div>
                    </div>

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
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none"
                      >
                        <mask id="mask0_295_5465" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}><path d="M0 0H24V24H0V0Z" fill="white" /></mask>
                        <g mask="url(#mask0_295_5465)">
                          <path d="M13.7755 1.752C13.7755 2.71958 12.9911 3.504 12.0235 3.504C11.0559 3.504 10.2715 2.71958 10.2715 1.752C10.2715 0.784416 11.0559 0 12.0235 0C12.9911 0 13.7755 0.784416 13.7755 1.752Z" fill="#212122"
                          />
                          <path fillRule="evenodd" clipRule="evenodd" d="M12.024 3.50391H9.024C6.39082 3.50391 4.15699 5.21386 3.37234 7.58391H3.264C1.46136 7.58391 0 9.04527 0 10.8479C0 12.6505 1.46136 14.1119 3.264 14.1119H3.34147C4.09699 16.5316 6.35539 18.2879 9.024 18.2879H15.024C17.6926 18.2879 19.9511 16.5316 20.7065 14.1119H20.736C22.5386 14.1119 24 12.6505 24 10.8479C24 9.04527 22.5386 7.58391 20.736 7.58391H20.6757C19.891 5.21386 17.6572 3.50391 15.024 3.50391H12.024ZM17.8409 10.4639C17.8409 11.6945 16.8433 12.6921 15.6127 12.6921C14.382 12.6921 13.3845 11.6945 13.3845 10.4639C13.3845 9.23328 14.382 8.23565 15.6127 8.23565C16.8433 8.23565 17.8409 9.23328 17.8409 10.4639ZM8.37221 12.6921C9.60283 12.6921 10.6005 11.6945 10.6005 10.4639C10.6005 9.23328 9.60283 8.23565 8.37221 8.23565C7.14163 8.23565 6.144 9.23328 6.144 10.4639C6.144 11.6945 7.14163 12.6921 8.37221 12.6921Z" fill="#212122"
                          />
                          <path d="M4.3125 23.9931C5.75048 21.1996 8.6624 19.2891 12.0206 19.2891C15.3788 19.2891 18.2907 21.1996 19.7287 23.9931H4.3125Z" fill="#212122"
                          />
                        </g>
                      </svg>
                      Beige Bot
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Success View
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[60vh]"
          >
            <div className="relative mb-8">
              {/* Glowing Effect */}
              <div className="absolute inset-0 bg-[#E8D1AB]/20 blur-[60px] rounded-full" />

              <div className="relative w-[220px] h-[220px] md:w-[372px] md:h-[356px]">
                <Image
                  src="/images/misc/PaymentDone.png"
                  alt="Payment Done Image"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h2 className="text-lg lg:text-4xl font-medium mb-2 lg:mb-5 text-center">Payment Success</h2>
            <p className="text-[#E8D1AB] text-xl lg:text-[42px] font-bold mb-4 lg:mb-9">${mockCreator.total}.00</p>

            <Button
              onClick={() => setShowSummary(true)}
              className="h-12 lg:h-24 px-6 py-5 lg:px-20 lg:py-10 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-lg lg:text-2xl font-medium rounded-xl"
            >
              View Booking Summary
            </Button>
          </motion.div>
        )}
      </div>

      {/* Booking Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <BookingSummaryModal
            onClose={() => setShowSummary(false)}
            onBookAnother={() => console.log("Book another")}
            onContinue={(shootName) => {
              console.log("Shoot name:", shootName);
            }}
            bookingDetails={{
              confirmationNumber: "#BG-20250125-001",
              paymentMethod: "Stripe (****4242)",
              transactionId: "txn_1234567890",
              amountPaid: "$405.00",
              paymentDate: "August 26, 2025 at 06:50 PM",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white relative">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#101010]" />}>
        <PaymentContent />
      </Suspense>
      <Footer />
    </main>
  );
}
