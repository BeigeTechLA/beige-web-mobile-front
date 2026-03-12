"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Copy,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { affiliateApi, updateReferralCode } from "@/lib/api"; // Added updateReferralCode import
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";

/* TYPES */
import type {
  AffiliateDashboardStats,
  ReferralHistoryItem,
} from "@/lib/api";
import { StatCard } from "@/components/admin/StatCard";

export default function AffiliateOverviewPage() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralHistoryItem[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // New states for editing referral code
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = Cookies.get("revure_token");
      if (!token) {
        toast.error("Please login again");
        return;
      }
      try {
        setIsLoading(true);
        const [statsRes, referralsRes] = await Promise.all([
          affiliateApi.getDashboardStats(token),
          affiliateApi.getReferralHistory(token),
        ]);
        setStats(statsRes);
        setReferrals(referralsRes.referrals || []);
        // Pre-fill edit state
        setNewCode(statsRes.affiliate.referral_code);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load affiliate dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleUpdateReferralCode = async () => {
    // Validation: Exactly 6 characters
    if (!newCode || newCode.length !== 6) {
      toast.error("Referral code must be exactly 6 characters");
      return;
    }

    const storedUser = localStorage.getItem("revure_user");
    if (!storedUser) {
      toast.error("User session not found");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    const affiliate_id = parsedUser?.affiliate_id;

    if (!affiliate_id) {
      toast.error("Affiliate ID not found");
      return;
    }

    try {
      setIsUpdating(true);
      await updateReferralCode({
        affiliate_id,
        referral_code: newCode.toUpperCase(),
      });

      // Update local UI
      if (stats) {
        setStats({
          ...stats,
          affiliate: { ...stats.affiliate, referral_code: newCode.toUpperCase() },
        });
      }

      setIsEditingCode(false);
      toast.success("Referral code updated!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update referral code");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleCopyCode = async () => {
    if (!stats?.affiliate.referral_code) return;
    try {
      await navigator.clipboard.writeText(stats.affiliate.referral_code);
      setCopySuccess(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E8D1AB]" />
      </div>
    );
  }



  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className=" mx-auto space-y-4 lg:space-y-8 pb-4 lg:pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
        <div>
          <h1 className="text-lg lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/70 text-xs lg:text-base">Welcome back, {user?.name || "Partner"}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#E8D1AB]/20 rounded-lg lg:rounded-xl p-1 pr-1 flex items-center gap-3 w-full md:w-auto min-w-[300px]">
          <div className="px-4 py-2 flex-1">
            <p className="text-xs text-[#E8D1AB] uppercase tracking-wider font-semibold block mb-0.5">Your Code</p>

            {isEditingCode ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newCode}
                    maxLength={6}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                      setNewCode(val.toUpperCase());
                    }}
                    className="bg-transparent border-b border-[#E8D1AB] outline-none text-lg font-mono font-bold text-white tracking-widest w-24 uppercase"
                    disabled={isUpdating}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUpdateReferralCode}
                      disabled={isUpdating}
                      className="text-green-400 p-1 hover:bg-white/5 rounded"
                    >
                      {isUpdating ? <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" /> : <Check size={18} />}
                    </button>
                    <button
                      onClick={() => { setIsEditingCode(false); setNewCode(stats?.affiliate.referral_code || ""); }}
                      disabled={isUpdating}
                      className="text-red-400 p-1 hover:bg-white/5 rounded"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-white/30">{newCode.length}/6 characters</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="lg:text-xl font-mono font-bold text-white tracking-widest">
                  {stats?.affiliate.referral_code}
                </p>
                <Button
                  onClick={() => setIsEditingCode(true)}
                  className="text-white/40 hover:text-[#E8D1AB]"
                >
                  <Pencil size={14} />
                </Button>
              </div>
            )}
          </div>

          {!isEditingCode && (
            <Button
              onClick={handleCopyCode}
              className="h-full bg-[#E8D1AB] hover:bg-[#d0b890] text-black font-medium px-4 py-3 rounded-lg"
            >
              {copySuccess ? <CheckCircle size={20} /> : <Copy size={20} />}
              <span className="ml-2">
                {copySuccess ? "Copied" : "Copy"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Earnings"
          value={formatCurrency(stats?.earnings.total_earnings || 0)}
          icon={DollarSign}
          iconColor="text-[#E8D1AB]"
          hoverBorder="hover:border-[#E8D1AB]/30"
        />
        <StatCard
          label="Pending Payout"
          value={formatCurrency(stats?.earnings.pending_earnings || 0)}
          icon={Clock}
          iconColor="text-yellow-500"
          valueColor="text-yellow-500"
          hoverBorder="hover:border-yellow-500/30"
        />
        <StatCard
          label="Total Referrals"
          value={stats?.stats.total_referrals || 0}
          icon={Users}
          iconColor="text-blue-500"
          hoverBorder="hover:border-blue-500/30"
          subtext={`${stats?.stats.successful_referrals || 0} successful`}
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats?.stats.conversion_rate || 0}%`}
          icon={TrendingUp}
          iconColor="text-purple-500"
          hoverBorder="hover:border-purple-500/30"
        />
      </div>

      {/* Table Section */}
      <div className="bg-[#111] rounded-lg lg:rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Recent Referrals
          </h2>
        </div>

        {/* --- MOBILE VIEW (Accordion Cards) --- */}
        <div className="lg:hidden space-y-4">
          {referrals.length === 0 ? (
            <div className="px-6 py-12 text-center text-white/40 bg-white/5  border border-white/5">
              <Users className="mx-auto mb-3 opacity-20" size={32} />
              <p>No referrals yet. Share your code to start earning!</p>
            </div>
          ) : (
            referrals.map((referral) => {
              const isExpanded = expandedId === referral.referral_id;

              return (
                <div
                  key={referral.referral_id}
                  className="bg-[#101010] rounded-2xl border border-white/5 overflow-hidden"
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(referral.referral_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full border transition-colors ${isExpanded ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'}`}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Commission</p>
                        <p className="font-medium text-[#E8D1AB]">
                          {formatCurrency(referral.commission_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${payoutColor(referral.status)}`}>
                        {referral.status}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-white/5 grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Date</p>
                        <p className="text-white/80 text-sm">{formatDate(referral.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Booking Amt</p>
                        <p className="text-white/60 text-sm">
                          {referral.booking_amount ? formatCurrency(referral.booking_amount) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Payout Status</p>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${payoutColor(referral.payout_status)}`}>
                          {referral.payout_status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* --- DESKTOP VIEW (Original Table) --- */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-white/5 text-white/40">
              <tr className="text-[#E8D1AB] text-sm font-medium rounded-b-xl">
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D] ">Date</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">Booking Amount</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">Commission</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">Status</th>
                <th className="pb-4 px-4 text-right bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">Payout</th>
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
                      No referrals yet. Share your code to start
                      earning!
                    </p>
                  </td>
                </tr>
              ) : (
                referrals.map((referral) => (
                  <tr key={referral.referral_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white/80">{formatDate(referral.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/80">{referral.booking_amount ? formatCurrency(referral.booking_amount) : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#E8D1AB] font-medium">{formatCurrency(referral.commission_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider ${statusColor(referral.status)}`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider ${payoutColor(referral.payout_status)}`}>
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

      {/* How to Earn Section */}
      <div className="bg-[#111] rounded-lg lg:rounded-xl border border-white/5 p-4 lg:p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          How to Earn
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-white mb-1">
                Share Code
              </p>
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
                Get 10% for every completed booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper Color Functions */
const statusColor = (status: string) => {
  switch (status) {
    case "completed": return "text-green-400 bg-green-400/10";
    case "pending": return "text-yellow-400 bg-yellow-400/10";
    case "cancelled":
    case "refunded": return "text-red-400 bg-red-400/10";
    default: return "text-white/60 bg-white/5";
  }
};

const payoutColor = (status: string) => {
  switch (status) {
    case "paid": return "text-green-400 bg-green-400/10";
    case "approved": return "text-blue-400 bg-blue-400/10";
    case "pending": return "text-yellow-400 bg-yellow-400/10";
    case "rejected": return "text-red-400 bg-red-400/10";
    default: return "text-white/60 bg-white/5";
  }
};
