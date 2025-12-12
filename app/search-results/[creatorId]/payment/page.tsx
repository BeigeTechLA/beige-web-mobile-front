"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Copy, MessageCircle, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

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
  image: "/images/influencer/Influencer1.png",
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
    <div className="pt-32 pb-20 min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4 md:px-8">
        {step === "confirm" ? (
          <>
            {/* Back Link */}
            <Link
              href={`/search-results/ethan-cole${shootId ? `?shootId=${shootId}` : ''}`}
              className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Confirm and Pay
              </h1>
              <p className="text-white/60">
                Review your booking details and complete your payment to secure
                your session
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-6xl mx-auto">
              {/* Left Column: Payment Form */}
              <div className="lg:col-span-7 space-y-8">
                {/* Payment Method Section */}
                <div className="bg-[#1A1A1A] rounded-[24px] p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium">Add Payment Method</h3>
                    <div className="flex items-center gap-2 bg-[#2A2A2A] rounded-lg px-3 py-1.5 border border-white/5">
                      <div className="w-4 h-4 bg-white/20 rounded-full" />
                      <span className="text-xs text-white/60">
                        Stripe Secure Payment
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] rounded-[16px] p-4 flex items-center justify-between border border-white/10 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-white/10 rounded overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/40">CARD</div>
                      </div>
                      <span className="text-sm">Stripe Secure Payment</span>
                    </div>
                    <button
                      onClick={() => console.log("Change payment method clicked")}
                      className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-medium hover:bg-white/90 transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  {/* Card Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 ml-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="w-full h-12 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8D1AB]/50 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full h-12 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8D1AB]/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">CVC / CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full h-12 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8D1AB]/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 ml-1">Card Holder Name</label>
                      <input
                        type="text"
                        placeholder="Ex. John Doe"
                        className="w-full h-12 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8D1AB]/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-[64px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-xl font-medium rounded-[16px] shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : `Confirm & Pay $${mockCreator.total}`}
                </Button>
              </div>

              {/* Right Column: Summary */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#1A1A1A] rounded-[24px] p-6 border border-white/10">
                  <h3 className="font-medium mb-6">Booking Summary</h3>

                  {/* Creator Info */}
                  <div className="flex items-center gap-4 pb-6 border-b border-white/10 mb-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden relative border border-white/10">
                      <Image
                        src={mockCreator.image}
                        alt="Creator"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{mockCreator.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <span>{mockCreator.role}</span>
                        <div className="flex items-center gap-1 text-[#E8D1AB]">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{mockCreator.rating} ({mockCreator.reviews})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Base Package ({mockCreator.hours} Hours)</span>
                      <span>${mockCreator.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Subtotal</span>
                      <span>${mockCreator.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#4CAF50]">
                      <span>Early Bird Discount (10%)</span>
                      <span>-${mockCreator.discount}</span>
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="font-medium">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold block">${mockCreator.total}</span>
                        <span className="text-xs text-white/40">Today: ${mockCreator.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Protection Badge */}
                  <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-xl p-4 flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#4CAF50]/20 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#4CAF50]" />
                    </div>
                    <div>
                      <h5 className="text-[#4CAF50] text-sm font-medium mb-1">Beige Project Protection</h5>
                      <p className="text-[10px] text-white/60 leading-relaxed">
                        Your payment is protected with Stripe's secure encryption. Funds are only released when you're satisfied.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Support Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => console.log("Talk to someone clicked")}
                    className="h-12 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Talk To Someone
                  </button>
                  <button
                    onClick={() => console.log("Beige bot clicked")}
                    className="h-12 bg-[#E8D1AB] text-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#dcb98a] transition-colors text-sm font-medium"
                  >
                    <div className="w-4 h-4 bg-black rounded-full" />
                    Beige Bot
                  </button>
                </div>
              </div>
            </div>
          </>
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

              {/* Phone/Check Illustration */}
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <div className="w-full h-full bg-[#1A1A1A] rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl rotate-[-10deg]">
                  <div className="absolute top-0 w-full h-1 bg-white/20" />
                  <Check className="w-16 h-16 text-[#E8D1AB]" strokeWidth={4} />

                  {/* Floating Elements */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-[#E8D1AB] rounded-full" />
                  <div className="absolute bottom-8 left-4 w-3 h-3 bg-white/20 rounded-full" />
                </div>
                {/* Checkmark Badge */}
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-[#E8D1AB] rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-black" strokeWidth={3} />
                </div>
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-2 text-center">Payment Success</h2>
            <p className="text-[#E8D1AB] text-3xl font-medium mb-12">${mockCreator.total}.00</p>

            <Button
              onClick={() => setShowSummary(true)}
              className="h-14 px-8 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-lg font-medium rounded-xl"
            >
              View Booking Summary
            </Button>
          </motion.div>
        )}
      </div>

      {/* Booking Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowSummary(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[600px] bg-white text-black rounded-[24px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">Booking Summary Details</h3>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">Confirmation Number</span>
                    <span className="font-medium flex items-center gap-2">
                      {mockBookingDetails.confirmationNumber}
                      <Copy
                        className="w-3 h-3 text-gray-400 cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(mockBookingDetails.confirmationNumber);
                          console.log("Confirmation number copied");
                        }}
                      />
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="font-medium">{mockBookingDetails.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-medium">{mockBookingDetails.transactionId}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-medium text-[#4CAF50]">{mockBookingDetails.amountPaid}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">Payment Date & Time</span>
                    <span className="font-medium text-right">{mockBookingDetails.paymentDate}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-sm font-medium">Give Your Shoot A Name (Optional)</label>
                  <p className="text-xs text-gray-400 mb-2">
                    If you give a shoot name, and click "Continue to Dashboard" button, this name will be saved in your shoot details.
                  </p>
                  <input
                    type="text"
                    placeholder="Shoot Name"
                    value={shootName}
                    onChange={(e) => setShootName(e.target.value)}
                    className="w-full h-12 border border-gray-200 rounded-xl px-4 focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-14 border-black text-black hover:bg-gray-50 rounded-xl font-medium"
                    onClick={handleBookAnother}
                  >
                    Book Another Session
                  </Button>
                  <Button
                    className="h-14 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black rounded-xl font-medium"
                    onClick={handleContinueToDashboard}
                  >
                    Continue to Dashboard
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
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
