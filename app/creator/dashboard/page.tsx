"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Copy, DollarSign, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { affiliateApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";

/* TYPES (keep same as your API) */
import type {
  AffiliateDashboardStats,
  ReferralHistoryItem,
} from "@/lib/api";

export default function AffiliateOverviewPage() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralHistoryItem[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  /* ---------------- FETCH DATA ---------------- */
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
      } catch (err) {
        console.error(err);
        toast.error("Failed to load affiliate dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  /* ---------------- HELPERS ---------------- */
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

  const statusColor = (status: string) => {
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

  const payoutColor = (status: string) => {
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

  /* ---------------- LOADING ---------------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E8D1AB]" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-white/60">
            Welcome back, {user?.name || "Partner"}
          </p>
        </div>

        {/* Referral Code */}
        <div className="bg-[#1A1A1A] border border-[#E8D1AB]/20 rounded-xl flex items-center">
          <div className="px-4 py-3">
            <p className="text-xs text-[#E8D1AB] uppercase font-semibold">
              Your Code
            </p>
            <p className="text-xl font-mono font-bold">
              {stats?.affiliate.referral_code}
            </p>
          </div>
          <Button
            onClick={handleCopyCode}
            className="bg-[#E8D1AB] text-black rounded-r-xl h-full px-4"
          >
            {copySuccess ? <CheckCircle size={18} /> : <Copy size={18} />}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Earnings"
          value={formatCurrency(stats?.earnings.total_earnings || 0)}
          icon={<DollarSign />}
        />
        <StatCard
          label="Pending Payout"
          value={formatCurrency(stats?.earnings.pending_earnings || 0)}
          icon={<Clock />}
          color="text-yellow-400"
        />
        <StatCard
          label="Total Referrals"
          value={stats?.stats.total_referrals || 0}
          icon={<Users />}
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats?.stats.conversion_rate || 0}%`}
          icon={<TrendingUp />}
        />
      </div>

      {/* Referrals Table */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-semibold">Recent Referrals</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/40">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Booking</th>
              <th className="px-6 py-4">Commission</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-white/40">
                  No referrals yet
                </td>
              </tr>
            ) : (
              referrals.map((r) => (
                <tr key={r.referral_id}>
                  <td className="px-6 py-4">{formatDate(r.created_at)}</td>
                  <td className="px-6 py-4">
                    {r.booking_amount
                      ? formatCurrency(r.booking_amount)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-[#E8D1AB]">
                    {formatCurrency(r.commission_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${payoutColor(r.payout_status)}`}>
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
  );
}

/* ---------------- COMPONENT ---------------- */
function StatCard({
  label,
  value,
  icon,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-[#111] border border-white/5 rounded-xl p-5">
      <p className="text-white/40 text-sm mb-2">{label}</p>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="opacity-10 mt-2">{icon}</div>
    </div>
  );
}
