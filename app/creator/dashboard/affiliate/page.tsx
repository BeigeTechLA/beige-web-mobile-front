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
import { usePathname } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
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
import Topbar from "@/components/admin/Topbar";

export default function AffiliateOverviewPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

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
    // Validation: 4-20 characters
    if (newCode.length < 4 || newCode.length > 20) {
      toast.error("Referral code must be between 4-20 characters");
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
    <>
      <Topbar pathname={pathname} />
<div 
  className={`mx-4 lg:mx-8 mt-6 mb-20 rounded-[40px] transition-all duration-700 overflow-hidden
    ${isDark 
      ? `bg-[#0A0A0A] 
         border border-[#E8D1AB]/30 
         shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]` 
      : "bg-white border-zinc-200 shadow-sm"
    }`}
>
  {/* Inner Padding - Increased to prevent corner overlap */}
  <div className="p-8 lg:p-12 space-y-6 lg:space-y-10 pb-20">        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>Dashboard</h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Welcome back, {user?.name || "Partner"}</p>
          </div>

          <div className={`border rounded-lg lg:rounded-xl p-1 pr-1 flex items-center gap-3 w-full md:w-auto min-w-[300px] transition-colors ${isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/20" : "bg-white border-zinc-200 shadow-sm"}`}>
            <div className="px-4 py-2 flex-1">
              <p className="text-xs text-[#E8D1AB] uppercase tracking-wider font-semibold block mb-0.5">Your Code</p>

              {isEditingCode ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newCode}
                    maxLength={20}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                      setNewCode(val.toUpperCase());
                    }}
                    style={{
                      width: `${Math.max(newCode.length, 4) + 1}ch`,
                    }}
                    className={`bg-transparent border-b outline-none lg:text-xl font-mono font-bold tracking-widest uppercase transition-all ${isDark ? "border-[#E8D1AB] text-white" : "border-[#B59A6D] text-black"}`}
                    disabled={isUpdating}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUpdateReferralCode}
                      disabled={isUpdating}
                      className="text-green-400 p-1 hover:bg-white/5 rounded"
                    >
                      {isUpdating ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingCode(false);
                        setNewCode(stats?.affiliate.referral_code || "");
                      }}
                      disabled={isUpdating}
                      className="text-red-400 p-1 hover:bg-white/5 rounded"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className={`lg:text-xl font-mono font-bold tracking-widest ${isDark ? "text-white" : "text-black"}`}>
                    {stats?.affiliate.referral_code}
                  </p>
                  <div className="relative group flex items-center">
                    <button
                      onClick={() => setIsEditingCode(true)}
                      className={`transition-colors ${isDark ? "text-white/40 hover:text-[#E8D1AB]" : "text-[#747171] hover:text-black"}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#111] border border-white/10 text-xs text-white rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none shadow-xl">
                      You can set your unique code
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-white/10"></div>
                      <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#111]"></div>
                    </div>
                  </div>
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
            isDark={isDark}
            iconColor="text-[#E8D1AB]"
            hoverBorder="hover:border-[#E8D1AB]/30"
          />
          <StatCard
            label="Pending Payout"
            value={formatCurrency(stats?.earnings.pending_earnings || 0)}
            icon={Clock}
            isDark={isDark}
            iconColor="text-yellow-500"
            valueColor="text-yellow-500"
            hoverBorder="hover:border-yellow-500/30"
          />
          <StatCard
            label="Total Referrals"
            value={stats?.stats.total_referrals || 0}
            icon={Users}
            isDark={isDark}
            iconColor="text-blue-500"
            hoverBorder="hover:border-blue-500/30"
            subtext={`${stats?.stats.successful_referrals || 0} successful`}
          />
          <StatCard
            label="Conversion Rate"
            value={`${stats?.stats.conversion_rate || 0}%`}
            icon={TrendingUp}
            isDark={isDark}
            iconColor="text-purple-500"
            hoverBorder="hover:border-purple-500/30"
          />
        </div>

        {/* Table Section */}
        <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-[#E3E3E3]"}`}>
          {/* Header Section */}
          <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
            <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#323232]"}`}>
              Recent Referrals
            </h2>
          </div>

          {/* --- MOBILE VIEW (Accordion Cards) --- */}
          <div className="lg:hidden flex-grow space-y-4">
            {referrals.length === 0 ? (
              <div className={`px-6 py-12 text-center ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                <Users className="mx-auto mb-3 opacity-20" size={32} />
                <p>No referrals yet. Share your code to start earning!</p>
              </div>
            ) : (
              <>
                {/* Mobile Header Label Row */}
                <div className={`flex justify-between text-sm font-medium p-4 border-b ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-[#BFA780] bg-[#FFFCF6] border-b-[#E3E3E3]"
                  }`}>
                  <span>Commission</span>
                  <span>Status</span>
                </div>

                {
                  referrals.map((referral) => {
                    const isExpanded = expandedId === referral.referral_id;

                    return (
                      <div
                        key={referral.referral_id}
                        className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E3E3E3]"}`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer pt-4"
                          onClick={() => toggleExpand(referral.referral_id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full border transition-colors ${isExpanded ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'}`}>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                            <div>
                              <p className={`text-xs uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666]"}`}>
                                Commission
                              </p>
                              <p className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}>
                                {formatCurrency(referral.commission_amount)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${payoutColor(referral.status)}`}>
                              {referral.status}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="mt-4 grid grid-cols-2 gap-y-4 px-2 animate-in fade-in slide-in-from-top-1">
                            <div>
                              <p className={`text-xs uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666]"}`}>Date</p>
                              <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{formatDate(referral.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666]"}`}>Booking Amt</p>
                              <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>
                                {referral.booking_amount ? formatCurrency(referral.booking_amount) : "-"}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666]"}`}>Payout Status</p>
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${payoutColor(referral.payout_status)}`}>
                                {referral.payout_status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>

          {/* --- DESKTOP VIEW (Original Table) --- */}
          <div className="hidden lg:block w-full overflow-x-auto flex-grow">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
                <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                  <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Date</th>
                  <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Booking Amount</th>
                  <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Commission</th>
                  <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Status</th>
                  <th className={`py-4 px-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {referrals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className={`px-6 py-12 text-center ${isDark ? "text-white/40" : "text-[#32323266]"}`}
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
                    <tr key={referral.referral_id} className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}>
                      <td className={`px-4 py-4 ${isDark ? "text-white/80" : "text-[#323232]"}`}>{formatDate(referral.created_at)}</td>
                      <td className={`px-4 py-4 ${isDark ? "text-white/60" : "text-[#32323266]"}`}>{referral.booking_amount ? formatCurrency(referral.booking_amount) : "-"}</td>
                      <td className={`px-4 py-4 font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}>{formatCurrency(referral.commission_amount)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${statusColor(referral.status)}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${payoutColor(referral.payout_status)}`}>
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
        <div className={`rounded-lg lg:rounded-xl border p-4 lg:p-6 transition-colors ${isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200 shadow-sm"}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-[#171717]"}`}>
            How to Earn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Share Code", desc: "Send your unique code to potential clients." },
              { step: 2, title: "They Book", desc: "They use the code at checkout for a shoot." },
              { step: 3, title: "You Earn", desc: "Get 10% for every completed booking." }
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#E8D1AB]/80 text-[#171717]"}`}>
                  {item.step}
                </div>
                <div>
                  <p className={`font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>{item.title}</p>
                  <p className={`text-sm ${isDark ? "text-white/40" : "text-zinc-500"}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </>
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
