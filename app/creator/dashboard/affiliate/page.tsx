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
  X 
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60 text-sm md:text-base">Welcome back, {user?.name || "Partner"}</p>
        </div>

        <div className="w-full lg:w-auto bg-[#1A1A1A] border border-[#E8D1AB]/20 rounded-xl flex items-center justify-between overflow-hidden min-w-[320px]">
          <div className="px-4 py-3 flex-1">
            <p className="text-[10px] text-[#E8D1AB] uppercase font-semibold mb-1">Your Code</p>
            
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
                <p className="text-lg md:text-xl font-mono font-bold text-white tracking-widest">
                  {stats?.affiliate.referral_code}
                </p>
                <button 
                  onClick={() => setIsEditingCode(true)}
                  className="text-white/30 hover:text-[#E8D1AB] transition-colors"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>
          
          {!isEditingCode && (
            <Button 
              onClick={handleCopyCode} 
              className="bg-[#E8D1AB] text-black rounded-none h-full py-8 px-6 hover:bg-[#d4be9a] transition-colors"
            >
              {copySuccess ? <CheckCircle size={20} /> : <Copy size={20} />}
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
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-semibold text-white">Recent Referrals</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-white/5 text-white/40">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Date</th>
                <th className="px-6 py-4 text-left font-medium">Booking Amount</th>
                <th className="px-6 py-4 text-left font-medium">Commission</th>
                <th className="px-6 py-4 text-left font-medium">Status</th>
                <th className="px-6 py-4 text-left font-medium">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/40">No referrals yet</td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r.referral_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white/80">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/80">{r.booking_amount ? formatCurrency(r.booking_amount) : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#E8D1AB] font-medium">{formatCurrency(r.commission_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider ${payoutColor(r.payout_status)}`}>
                        {r.payout_status}
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
      <div className="bg-[#111] rounded-xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-6 text-white">
          How to Earn
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0 border border-[#E8D1AB]/20">
              1
            </div>
            <div>
              <p className="font-medium text-white mb-1">Share Code</p>
              <p className="text-sm text-white/40 leading-relaxed">
                Send your unique referral code to potential clients or friends.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0 border border-[#E8D1AB]/20">
              2
            </div>
            <div>
              <p className="font-medium text-white mb-1">They Book</p>
              <p className="text-sm text-white/40 leading-relaxed">
                They apply your code at checkout when booking their photo shoot.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0 border border-[#E8D1AB]/20">
              3
            </div>
            <div>
              <p className="font-medium text-white mb-1">You Earn</p>
              <p className="text-sm text-white/40 leading-relaxed">
                Receive your commission once the booking is completed.
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
