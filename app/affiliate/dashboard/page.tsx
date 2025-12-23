"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import {
  Copy,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Wallet,
  Share2,
} from "lucide-react";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { affiliateApi, type AffiliateDashboardStats } from "@/lib/api";
import { toast } from "sonner";

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AffiliateDashboardStats | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = Cookies.get("revure_token");

      if (!token) {
        toast.error("Please log in to view your affiliate dashboard");
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        const data = await affiliateApi.getDashboardStats(token);
        setDashboardData(data);
      } catch (error: any) {
        console.error("Error fetching affiliate dashboard:", error);
        if (error.response?.status === 404) {
          toast.error("Affiliate account not found. Please contact support.");
        } else if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/login");
        } else {
          toast.error("Failed to load affiliate dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleCopyCode = async () => {
    if (dashboardData?.affiliate.referral_code) {
      try {
        await navigator.clipboard.writeText(dashboardData.affiliate.referral_code);
        setCopySuccess(true);
        toast.success("Referral code copied to clipboard!");
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        toast.error("Failed to copy code");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "cancelled":
      case "refunded":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "approved":
        return "bg-blue-500/20 text-blue-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const formatCurrency = (amount: number) => {
    return `SAR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <main className="relative bg-[#141414] min-h-screen text-white overflow-x-hidden">
        <Navbar />
        <div className="relative pt-20 md:pt-32 pb-20 min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB] mx-auto mb-4"></div>
            <p className="text-white/60">Loading your affiliate dashboard...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="relative bg-[#141414] min-h-screen text-white overflow-x-hidden">
        <Navbar />
        <div className="relative pt-20 md:pt-32 pb-20 min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Affiliate Account Not Found</h2>
            <p className="text-white/60 mb-6">
              It looks like you don&apos;t have an affiliate account yet. 
              Please contact support if you believe this is an error.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
            >
              Return Home
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const { affiliate, stats, earnings, recent_referrals } = dashboardData;

  return (
    <main className="relative bg-[#141414] min-h-screen text-white overflow-x-hidden">
      <Navbar />
      
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#141414] pointer-events-none" />

      <div className="relative pt-20 md:pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">
              Affiliate Dashboard
            </h1>
            <p className="text-white/60">
              Track your referrals, earnings, and payouts
            </p>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-[#E8D1AB]/20 to-[#E8D1AB]/5 border border-[#E8D1AB]/30 rounded-2xl p-6 lg:p-8 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-5 h-5 text-[#E8D1AB]" />
                  <span className="text-white/60 text-sm">Your Referral Code</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl lg:text-4xl font-bold tracking-wider text-[#E8D1AB]">
                    {affiliate.referral_code}
                  </span>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="border-[#E8D1AB]/50 text-[#E8D1AB] hover:bg-[#E8D1AB]/10"
                  >
                    {copySuccess ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copySuccess ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Earn per successful booking</p>
                <p className="text-2xl lg:text-3xl font-bold text-[#E8D1AB]">
                  {formatCurrency(earnings.commission_per_booking)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Earnings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm">Total Earnings</span>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold">
                {formatCurrency(earnings.total_earnings)}
              </p>
            </motion.div>

            {/* Pending Earnings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm">Pending Payout</span>
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold">
                {formatCurrency(earnings.pending_earnings)}
              </p>
            </motion.div>

            {/* Total Referrals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm">Total Referrals</span>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold">
                {stats.total_referrals}
              </p>
              <p className="text-sm text-white/40 mt-1">
                {stats.successful_referrals} successful
              </p>
            </motion.div>

            {/* Conversion Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm">Conversion Rate</span>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold">
                {stats.conversion_rate}%
              </p>
            </motion.div>
          </div>

          {/* Paid Earnings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Paid Out</p>
                  <p className="text-xl font-bold">{formatCurrency(earnings.paid_earnings)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Completed Payouts</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Referrals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Recent Referrals</h2>
            </div>

            {recent_referrals.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No referrals yet</p>
                <p className="text-white/40 text-sm mt-1">
                  Share your referral code to start earning!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Date</th>
                      <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Booking Amount</th>
                      <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Commission</th>
                      <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Status</th>
                      <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recent_referrals.map((referral) => (
                      <tr key={referral.referral_id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          {formatDate(referral.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {referral.booking_amount
                            ? formatCurrency(referral.booking_amount)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-400">
                          {formatCurrency(referral.commission_amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm capitalize ${getStatusColor(referral.status)}`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full capitalize ${getPayoutStatusColor(
                              referral.payout_status
                            )}`}
                          >
                            {referral.payout_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-6 bg-[#1a1a1a]/50 border border-white/5 rounded-xl"
          >
            <h3 className="text-lg font-semibold mb-3">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-white/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#E8D1AB] font-bold">1</span>
                </div>
                <p>Share your unique referral code with friends and clients</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#E8D1AB] font-bold">2</span>
                </div>
                <p>They enter your code at checkout when booking a shoot</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#E8D1AB] font-bold">3</span>
                </div>
                <p>Earn SAR 200 for every successful paid booking they complete</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

