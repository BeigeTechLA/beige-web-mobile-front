"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  LogOut,
  LayoutDashboard,
  Wallet,
  Settings,
  Menu,
  X,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  affiliateApi,
  type AffiliateDashboardStats,
  type ReferralHistoryItem,
} from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralHistoryItem[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        const [statsData, referralHistory] = await Promise.all([
          affiliateApi.getDashboardStats(token),
          affiliateApi.getReferralHistory(token),
        ]);
        setStats(statsData);
        setReferrals(referralHistory.referrals || []);
      } catch (error: any) {
        console.error("Error fetching affiliate dashboard:", error);
        if (error.response?.status === 404) {
          toast.error("Affiliate account not found.");
        } else {
          toast.error("Failed to load dashboard data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleCopyCode = async () => {
    if (stats?.affiliate.referral_code) {
      try {
        await navigator.clipboard.writeText(stats.affiliate.referral_code);
        setCopySuccess(true);
        toast.success("Referral code copied!");
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        toast.error("Failed to copy code");
        console.error("Copy failed", err);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return `SAR ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "cancelled":
      case "refunded":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-white/60 bg-white/5";
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-400 bg-green-400/10";
      case "approved":
        return "text-blue-400 bg-blue-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "rejected":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-white/60 bg-white/5";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB]"></div>
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#111] border-r border-white/10 w-64">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-widest text-[#E8D1AB]">
            BEIGE
          </span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        <button className="flex items-center w-full gap-3 px-3 py-3 rounded-lg bg-[#E8D1AB]/10 text-[#E8D1AB] font-medium transition-colors">
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </button>
        <button className="flex items-center w-full gap-3 px-3 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
          <Wallet size={20} />
          <span>Payouts (Soon)</span>
        </button>
        <button className="flex items-center w-full gap-3 px-3 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
          <Settings size={20} />
          <span>Settings (Soon)</span>
        </button>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E8D1AB] to-[#C4A470] flex items-center justify-center text-black font-bold text-sm shrink-0">
            {user?.name?.[0] || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.name || "Affiliate"}
            </p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#111] border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <span className="text-xl font-bold tracking-widest text-[#E8D1AB]">
          BEIGE
        </span>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#111] lg:hidden"
            >
              <Sidebar />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen h-screen overflow-hidden">
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Dashboard
                </h1>
                <p className="text-white/60">
                  Welcome back, {user?.name || "Partner"}
                </p>
              </div>

              {/* Referral Code Card - Compact */}
              <div className="bg-[#1A1A1A] border border-[#E8D1AB]/20 rounded-xl p-1 pr-1 flex items-center gap-3 w-full md:w-auto">
                <div className="px-4 py-2 flex-1 md:flex-none">
                  <span className="text-xs text-[#E8D1AB] uppercase tracking-wider font-semibold block mb-0.5">
                    Your Code
                  </span>
                  <span className="text-xl font-mono font-bold text-white tracking-widest">
                    {stats?.affiliate.referral_code}
                  </span>
                </div>
                <Button
                  onClick={handleCopyCode}
                  className="h-full bg-[#E8D1AB] hover:bg-[#d0b890] text-black font-medium px-4 py-3 rounded-lg transition-all"
                >
                  {copySuccess ? <CheckCircle size={18} /> : <Copy size={18} />}
                  <span className="ml-2">
                    {copySuccess ? "Copied" : "Copy"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Earnings */}
              <div className="bg-[#111] rounded-xl p-5 border border-white/5 relative overflow-hidden group hover:border-[#E8D1AB]/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign size={48} className="text-[#E8D1AB]" />
                </div>
                <p className="text-white/40 text-sm font-medium mb-2">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats?.earnings.total_earnings || 0)}
                </p>
              </div>

              {/* Pending Payout */}
              <div className="bg-[#111] rounded-xl p-5 border border-white/5 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock size={48} className="text-yellow-500" />
                </div>
                <p className="text-white/40 text-sm font-medium mb-2">
                  Pending Payout
                </p>
                <p className="text-2xl font-bold text-yellow-500">
                  {formatCurrency(stats?.earnings.pending_earnings || 0)}
                </p>
              </div>

              {/* Total Referrals */}
              <div className="bg-[#111] rounded-xl p-5 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users size={48} className="text-blue-500" />
                </div>
                <p className="text-white/40 text-sm font-medium mb-2">
                  Total Referrals
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats?.stats.total_referrals || 0}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {stats?.stats.successful_referrals || 0} successful
                </p>
              </div>

              {/* Conversion Rate */}
              <div className="bg-[#111] rounded-xl p-5 border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={48} className="text-purple-500" />
                </div>
                <p className="text-white/40 text-sm font-medium mb-2">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats?.stats.conversion_rate || "0"}%
                </p>
              </div>
            </div>

            {/* Recent Referrals Section */}
            <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Recent Referrals
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/40">
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Booking Amount</th>
                      <th className="px-6 py-4 font-medium">Commission</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {referrals.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-white/40"
                        >
                          <Users
                            className="mx-auto mb-3 opacity-20"
                            size={32}
                          />
                          <p>
                            No referrals yet. Share your code to start earning!
                          </p>
                        </td>
                      </tr>
                    ) : (
                      referrals.map((referral) => (
                        <tr
                          key={referral.referral_id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 text-white/80">
                            {formatDate(referral.created_at)}
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {referral.booking_amount
                              ? formatCurrency(referral.booking_amount)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 font-medium text-[#E8D1AB]">
                            {formatCurrency(referral.commission_amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${getStatusColor(
                                referral.status
                              )}`}
                            >
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${getPayoutStatusColor(
                                referral.payout_status
                              )}`}
                            >
                              {referral.payout_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How It Works - Collapsible or Compact */}
            <div className="bg-[#111] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">
                How to Earn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-white mb-1">Share Code</p>
                    <p className="text-sm text-white/40">
                      Send your unique code to potential clients.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-white mb-1">They Book</p>
                    <p className="text-sm text-white/40">
                      They use the code at checkout for a shoot.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-white mb-1">You Earn</p>
                    <p className="text-sm text-white/40">
                      Get SAR 200 for every completed booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
