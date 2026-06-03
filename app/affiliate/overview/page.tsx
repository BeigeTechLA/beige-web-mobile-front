"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';
import { toast } from "sonner";
import Cookies from "js-cookie";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/src/components/landing/ui/button";
import { StatCard } from "@/components/admin/StatCard";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";

import {
  affiliateApi,
  type AffiliateDashboardStats,
  type ReferralHistoryItem,
  updateReferralCode,
} from "@/lib/api";

import { Check, X, Pencil, CheckCircle, Copy, DollarSign, Clock, Users, TrendingUp, ChevronUp, ChevronDown } from "lucide-react";


export default function AffiliateOverviewPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralHistoryItem[]>([]);

  const [copySuccess, setCopySuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isShootFormOpen, setIsShootFormOpen] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [creditSummary, setCreditSummary] = useState<any>(null);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = Cookies.get("revure_token");
      if (!token) {
        toast.error("Please log in to view your affiliate dashboard");
        router.push("/");
        return;
      }

      try {
        setIsDataRefreshing(true);

        const params: any = {};

        const [statsData, referralHistory, summaryData, pendingData, creditSummaryData, creditHistoryData] = await Promise.all([
          affiliateApi.getDashboardStats(token),
          affiliateApi.getReferralHistory(token),
          affiliateApi.getDashboardSummary(token, params),
          affiliateApi.getProjectFormSubmission(token),
          affiliateApi.getClientCreditSummary(token),
          affiliateApi.getClientCreditHistory(token, { page: 1, limit: 5 }),
        ]);
        setStats(statsData);
        setReferrals(referralHistory.referrals || []);
        setDashboardSummary(summaryData.data);
        setNewCode(statsData.affiliate.referral_code);

        if (!creditSummaryData?.error) {
          setCreditSummary(creditSummaryData?.data || null);
        }
        if (!creditHistoryData?.error) {
          setCreditHistory(creditHistoryData?.data?.history || []);
        }

        if (!pendingData.error) {
          setPendingProjects(pendingData.projects || []);
          setPendingCount(pendingData.count || 0);
        }
      } catch (error: any) {
        console.error("Error fetching affiliate dashboard:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsDataRefreshing(false);
      }
    };

    fetchDashboardData();
  }, [router]);


  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  const formatCurrency = (amount: any) => {
    if (amount === undefined || amount === null || isNaN(Number(amount)))
      return "$0.00";
    return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleUpdateReferralCode = async () => {
    if (newCode.length < 4 || newCode.length > 20) {
      toast.error("Referral code must be between 4-20 characters");
      return;
    }

    const storedUser = localStorage.getItem("revure_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
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

      if (stats) {
        setStats({
          ...stats,
          affiliate: {
            ...stats.affiliate,
            referral_code: newCode.toUpperCase(),
          },
        });
      }
      setIsEditingCode(false);
      toast.success("Referral code updated!");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update referral code",
      );
    } finally {
      setIsUpdating(false);
    }
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
      }
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
      case "confirmed":
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
    const s = status?.toLowerCase();
    switch (s) {
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

  return (
    <>
      <Topbar pathname={pathname} />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Affiliate Overview
            </h1>
            {/* <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Manage your personal information and account security.
          </p> */}
          </div>

          {/* Referral Code Card */}
          <div className={`border rounded-lg lg:rounded-xl p-1 pr-1 flex items-center gap-3 w-full md:w-auto min-w-[300px] transition-colors ${isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/20" : "bg-white border-zinc-200 shadow-sm"
            }`}>
            <div className="px-4 py-2 flex-1">
              <span className="text-xs text-[#E8D1AB] uppercase tracking-wider font-semibold block mb-0.5">
                Your Code
              </span>

              {isEditingCode ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newCode}
                    maxLength={20}
                    onChange={(e) => {
                      const value = e.target.value.replace(
                        /[^a-zA-Z0-9]/g,
                        ""
                      );
                      setNewCode(value.toUpperCase());
                    }}
                    style={{
                      width: `${Math.max(newCode.length, 4) + 1}ch`,
                    }}
                    className={`bg-transparent border-b outline-none lg:text-xl font-mono font-bold tracking-widest uppercase transition-all ${isDark ? "border-[#E8D1AB] text-white" : "border-[#B59A6D] text-black"
                      }`}
                    disabled={isUpdating}
                  />
                  <button
                    onClick={handleUpdateReferralCode}
                    disabled={isUpdating}
                    className="text-green-400 hover:text-green-300"
                  >
                    {isUpdating ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                    ) : (
                      <Check size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCode(false);
                      setNewCode(stats?.affiliate.referral_code || "");
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={`lg:text-xl font-mono font-bold tracking-widest ${isDark ? "text-white" : "text-black"
                    }`}>
                    {stats?.affiliate.referral_code || "------"}
                  </span>
                  <div className="relative group flex items-center">
                    <button
                      onClick={() => setIsEditingCode(true)}
                      className={` transition-colors ${isDark ? "text-white/40 hover:text-[#E8D1AB]" : "text-[#747171] hover:text-black"}`}
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
                {copySuccess ? (
                  <CheckCircle size={18} />
                ) : (
                  <Copy size={18} />
                )}
                <span className="ml-2">
                  {copySuccess ? "Copied" : "Copy"}
                </span>
              </Button>
            )}
          </div>
        </div>

        <>
          {/* Google Forms CTA Banner */}
          {/* {pendingCount > 0 && (
            <div className={`border rounded-lg lg:rounded-xl p-4 lg:p-8 transition-colors ${isDark
              ? "bg-gradient-to-r from-[#E8D1AB]/10 to-[#E8D1AB]/5 border-[#E8D1AB]/20"
              : "bg-white border-[#E8D1AB]/30 shadow-sm"
              }`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg lg:text-xl mb-2 ${isDark ? "text-white" : "text-[#171717]"}`}>
                    Complete Your Shoot Details
                  </h3>
                  <p className={`text-sm lg:text-base ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                    Help us prepare better by filling out detailed
                    information about your upcoming shoot
                  </p>
                  <p className={`text-xs lg:text-sm mt-2 font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#7A5A2A]"}`}>
                    Pending projects: {pendingCount}
                  </p>
                </div>
                <Button
                  onClick={() => setIsShootFormOpen(true)}
                  className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium px-6 py-3 h-auto whitespace-nowrap"
                >
                  Fill Out Shoot Details
                </Button>
              </div>
            </div>
          )} */}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Earnings"
              value={formatCurrency(stats?.earnings.total_earnings || 0)}
              icon={DollarSign}
              isDark={isDark}
              iconColor="text-green-500"
              hoverBorder="hover:border-green-500/30"
            />
            <StatCard
              label="Pending Payout"
              value={formatCurrency(stats?.earnings.pending_earnings || 0)}
              icon={Clock}
              isDark={isDark}
              iconColor="text-yellow-500"
              hoverBorder="hover:border-yellow-500/30"
              valueColor="text-yellow-500"
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
              value={`${stats?.stats.conversion_rate || 0} %`}
              icon={TrendingUp}
              isDark={isDark}
              iconColor="text-purple-500"
              hoverBorder="hover:border-purple-500/30"
            />
          </div>

          {/* <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-[#E3E3E3]"}`}>
            <div className={`flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 p-5 border-b transition-colors duration-300 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#323232]"}`}>
                Account Credit Usage
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                  Available: {formatCurrency(creditSummary?.available_credit_amount || 0)}
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-orange-500/10 text-orange-400 border border-orange-500/30" : "bg-orange-50 text-orange-700 border border-orange-200"}`}>
                  Used: {formatCurrency(creditSummary?.used_credit_amount || 0)}
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
                  <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                    <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Date</th>
                    <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Type</th>
                    <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Booking</th>
                    <th className={`py-4 px-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {creditHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`px-6 py-10 text-center ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                        No credit activity yet
                      </td>
                    </tr>
                  ) : (
                    creditHistory.map((item, idx) => (
                      <tr key={`${item.account_credit_ledger_id}-${idx}`} className={`${isDark ? "border-b border-white/5" : "border-b border-[#E3E3E3]"}`}>
                        <td className={`px-4 py-4 ${isDark ? "text-white/80" : "text-[#323232]"}`}>
                          {item.created_at ? formatDate(item.created_at) : "-"}
                        </td>
                        <td className={`px-4 py-4 capitalize ${isDark ? "text-white/60" : "text-[#32323266]"}`}>
                          {item.entry_type === "credit_used" ? "Used" : item.entry_type === "credit_created" ? "Created" : item.entry_type}
                        </td>
                        <td className={`px-4 py-4 ${isDark ? "text-white/60" : "text-[#32323266]"}`}>
                          {item.booking_name || (item.booking_id ? `Booking #${item.booking_id}` : "-")}
                        </td>
                        <td className={`px-4 py-4 text-right font-medium ${item.direction === "debit" ? "text-orange-400" : "text-green-500"}`}>
                          {item.direction === "debit" ? "-" : "+"}{formatCurrency(item.amount || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-4 space-y-3">
              {creditHistory.length === 0 ? (
                <div className={`text-center py-6 ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                  No credit activity yet
                </div>
              ) : (
                creditHistory.map((item, idx) => (
                  <div key={`${item.account_credit_ledger_id}-${idx}`} className={`rounded-xl p-4 border ${isDark ? "bg-[#101010] border-white/10" : "bg-[#FFFCF6] border-[#E3E3E3]"}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>
                        {item.entry_type === "credit_used" ? "Used" : item.entry_type === "credit_created" ? "Created" : item.entry_type}
                      </span>
                      <span className={`text-sm font-semibold ${item.direction === "debit" ? "text-orange-400" : "text-green-500"}`}>
                        {item.direction === "debit" ? "-" : "+"}{formatCurrency(item.amount || 0)}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? "text-white/60" : "text-[#32323266]"}`}>
                      {item.booking_name || (item.booking_id ? `Booking #${item.booking_id}` : "No booking linked")}
                    </p>
                    <p className={`text-[11px] mt-1 ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                      {item.created_at ? formatDate(item.created_at) : "-"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div> */}

          {/* Referrals Table Section */}
          <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-[#E3E3E3]"
            }`}>
            {/* Header Section */}
            <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
              }`}>
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

                  {referrals.map((referral) => {
                    const isExpanded = expandedId === referral.referral_id;
                    return (
                      <div key={referral.referral_id} className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E3E3E3]"
                        }`}>
                        <div
                          className="flex items-center justify-between cursor-pointer pt-4"
                          onClick={() => toggleExpand(referral.referral_id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full border transition-colors ${isExpanded ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'
                              }`}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(referral.status)}`}>
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
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${getPayoutStatusColor(referral.payout_status)}`}>
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
              <table className="w-full text-left text-sm">
                <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
                  <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                    <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Date</th>
                    <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Booking Amount</th>
                    <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Commission</th>
                    <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Status</th>
                    <th className={`py-4 px-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`px-6 py-12 text-center ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                        <Users className="mx-auto mb-3 opacity-20" size={32} />
                        <p>No referrals yet. Share your code to start earning!</p>
                      </td>
                    </tr>
                  ) : (
                    referrals.map((referral) => (
                      <tr key={referral.referral_id} className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"
                        }`}>
                        <td className={`px-4 py-4 ${isDark ? "text-white/80" : "text-[#323232]"}`}>
                          {formatDate(referral.created_at)}
                        </td>
                        <td className={`px-4 py-4 ${isDark ? "text-white/60" : "text-[#32323266]"}`}>
                          {referral.booking_amount ? formatCurrency(referral.booking_amount) : "-"}
                        </td>
                        <td className={`px-4 py-4 font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}>
                          {formatCurrency(referral.commission_amount)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(referral.status)}`}
                          >
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${getPayoutStatusColor(referral.payout_status)}`}>
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

          {/* How It Works */}
          <div className={`rounded-lg lg:rounded-xl border p-4 lg:p-6 transition-colors ${isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200 shadow-sm"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-[#171717]"}`}>How to Earn</h3>
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
        </>
      </div>

      <AffiliateShootDetailsForm
        isOpen={isShootFormOpen}
        onClose={() => setIsShootFormOpen(false)}
        projectId={pendingProjects[0]?.project_id || 0}
        pendingProjects={pendingProjects}
        isDark ={isDark}
      />
    </>
  );
}
