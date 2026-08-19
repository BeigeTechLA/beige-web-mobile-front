"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import {
  ChevronLeft,
  Loader2,
  Search,
  ChevronRight,
  User,
  Mail,
  Phone,
  Hash,
  ShieldCheck,
  Copy,
  Clock3,
  History
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { Key } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";
import { useGenerateUserResetLinkForAdminMutation } from "@/lib/redux/features/auth/authApi";

const getInitials = (name: string) => {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
};

const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
};

const formatDateTime = (value?: string) => {
  if (!value) return { date: "N/A", time: "" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: value, time: "" };
  return {
    date: format(parsed, "MMM d, yyyy"),
    time: format(parsed, "h:mm a"),
  };
};

const getHistoryActorName = (entry: any) => {
  return (
    entry?.performed_by_name ||
    entry?.acted_by?.name ||
    entry?.actor?.name ||
    entry?.user?.name ||
    entry?.created_by?.name ||
    entry?.performed_by?.name ||
    entry?.admin_name ||
    entry?.changed_by ||
    "Admin"
  );
};

const getHistoryAvatar = (entry: any) => {
  return (
    entry?.acted_by?.avatar ||
    entry?.actor?.avatar ||
    entry?.user?.avatar ||
    entry?.created_by?.avatar ||
    entry?.performed_by?.avatar ||
    entry?.admin_avatar ||
    entry?.avatar ||
    ""
  );
};

const getHistoryActionLabel = (entry: any) => {
  const rawAction = String(
    entry?.action ||
    entry?.event ||
    entry?.type ||
    entry?.action_type ||
    entry?.status ||
    ""
  ).toLowerCase();

  if (rawAction.includes("restore_blocked") || rawAction.includes("blocked")) return "blocked";
  if (rawAction.includes("converted_to_creator") || rawAction.includes("creative_partner") || rawAction.includes("creator")) return "creative partner signup";
  if (rawAction.includes("restor")) return "restored";
  if (rawAction.includes("archiv") || rawAction.includes("delet")) return "deleted";
  return rawAction || "updated";
};

const buildHistorySentence = (entry: any, clientName: string) => {
  const actorName = getHistoryActorName(entry);
  const actionLabel = getHistoryActionLabel(entry);
  const subject = entry?.client_name || entry?.name || clientName;

  if (actionLabel === "restored") {
    return `${subject} was restored by ${actorName}`;
  }

  if (actionLabel === "deleted") {
    return `${subject} was deleted by ${actorName}`;
  }

  if (actionLabel === "creative partner signup") {
    const isSelfSignup = String(entry?.performed_by_role || "").toLowerCase() === "self_signup";
    return isSelfSignup
      ? `${subject} signed up as a creative partner`
      : `${subject} was converted to a creative partner by ${actorName}`;
  }

  return `${subject} was updated by ${actorName}`;
};

const tabs = [
  { label: "Paid Shoots", value: "Paid" },
  { label: "Draft or Unpaid", value: "Unpaid" },
] as const;

export default function ClientDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [shootsData, setShootsData] = useState<any>(null);
const [manualResetLink, setManualResetLink] = useState<string | null>(null);
const [generateAdminReset] = useGenerateUserResetLinkForAdminMutation();

  const [shootSearchQuery, setShootSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Paid" | "Unpaid">("Paid");

  useEffect(() => {
    setMounted(true);
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [detailsRes, shootsRes] = await Promise.all([
          adminApi.getClientById(id as string),
          adminApi.getClientShoots(id as string)
        ]);
        setClientData(detailsRes.data);
        setShootsData(shootsRes.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch client details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAllData();
  }, [id]);

  const isDark = !mounted || theme === "dark";

  const handleCopyAffiliateCode = (code: string) => {
    if (!code || code === "N/A") return;
    const fullCode = `${code}`;
    navigator.clipboard.writeText(fullCode);
    toast.success(`Copied ${fullCode} to clipboard`);
  };

  const filteredShoots = useMemo(() => {
    if (!shootsData?.projects) return [];
    const pool = activeTab === "Paid" ? shootsData.projects.paid : shootsData.projects.unpaid_or_draft;

    return pool.filter((item: any) =>
      item.project.project_name.toLowerCase().includes(shootSearchQuery.toLowerCase()) ||
      String(item.project.stream_project_booking_id).includes(shootSearchQuery)
    );
  }, [shootsData, activeTab, shootSearchQuery]);

  if (!mounted) return null;

  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${isDark ? "bg-black" : "bg-white"}`}>
      <Loader2 className={`animate-spin ${isDark ? "text-[#E5D5B8]" : "text-black"}`} size={40} />
    </div>
  );

  const client = clientData?.client;
  const affiliate = clientData?.affiliate;
  const accountCredit = clientData?.account_credit;
  const creditHistory = clientData?.credit_history || [];
  const archiveHistorySource = clientData?.archive_history || clientData?.archiveHistory || clientData?.archived_history || client?.archive_history || [];
  const rawArchiveHistory = Array.isArray(archiveHistorySource)
    ? archiveHistorySource
    : archiveHistorySource?.items || archiveHistorySource?.history || archiveHistorySource?.data || [];
  const archiveHistory = Array.isArray(rawArchiveHistory) ? rawArchiveHistory : [];
  const visibleArchiveHistory = archiveHistory.filter((entry) => getHistoryActionLabel(entry) !== "blocked");
  const clientName = client?.name || "This user";

  const clientType = client?.client_type === "registered" ? "registered" : "guest";
  const clientTypeLabel = clientType === "registered" ? "Registered" : "Guest";
  const clientEmail = String(client?.email || "").trim().toLowerCase();
  const clientTypeBadgeClass = clientType === "registered"
    ? "bg-[#E8F2FF] text-[#246BCE] border border-[#246BCE]/20"
    : "bg-[#FFF4E5] text-[#B66A00] border border-[#B66A00]/20";

  return (
    <>
      <Topbar pathname={pathname} />

      <div className={`overflow-hidden min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 mx-auto space-y-8 ${isDark ? "bg-black text-white" : "bg-[#F4F5F7] text-black"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.back()}
              className={`p-2.5 border rounded-xl transition-colors ${isDark ? "bg-[#111] border-[#333] text-white hover:bg-[#222]" : "bg-gray-50 border-gray-200 text-black hover:bg-gray-100"}`}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-2xl font-semibold">{client?.name || "User Details"}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <p className={`${isDark ? "text-[#888]" : "text-gray-500"} text-sm font-medium`}>User ID: #{client?.client_id}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${clientTypeBadgeClass}`}>
                  {clientTypeLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {Number(client?.is_active) === 1 && 
              client?.client_type === "registered" && (manualResetLink ? (
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm ${isDark ? "bg-[#111] border-white/10" : "bg-white border-gray-200"}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDark ? "border-white/10 bg-white/5 text-[#E8D1AB]" : "border-gray-200 bg-gray-50 text-[#B08A3C]"}`}>
                  <Key size={14} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-widest ${isDark ? "text-white/35" : "text-gray-400"}`}>Reset Link</p>
                  <span className={`block max-w-[240px] truncate font-mono text-[11px] ${isDark ? "text-[#E8D1AB]" : "text-[#8A6A2A]"}`}>{manualResetLink}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(manualResetLink); toast.success("Copied!"); }}
                  className={`ml-1 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-gray-100 text-gray-600"}`}
                  title="Copy reset link"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setManualResetLink(null)}
                  className={`text-[10px] font-medium uppercase tracking-wide transition-colors ${isDark ? "text-white/35 hover:text-white/70" : "text-gray-400 hover:text-gray-600"}`}
                  title="Clear link"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    if (!clientEmail) {
                      toast.error("Email is missing for this client");
                      return;
                    }
                    const res = await generateAdminReset({ email: clientEmail }).unwrap();
                    setManualResetLink(res.resetLink);
                  } catch (e) { toast.error("Failed to generate link"); }
                }}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold border min-w-[170px] ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-gray-200"}`}
              >
                <Key size={14} />
                Reset Password
              </button>
            )
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className={`border rounded-xl lg:rounded-2xl p-8 space-y-5 lg:space-y-10 ${isDark ? "bg-[#0D0D0D] border-white/20" : "bg-white border-[#E5E5E5]"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-[#E5D5B8]" : "bg-black/5 border-black/5 text-black"}`}>
                <User size={20} />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>User Name</p>
                <p className={`${isDark ? "text-white" : "text-black"} text-lg font-semibold`}>{client?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-[#E5D5B8]" : "bg-black/5 border-black/5 text-black"}`}>
                <Mail size={20} />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Email ID</p>
                <p className={`${isDark ? "text-white" : "text-black"} text-lg font-semibold`}>{client?.email}</p>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-[#E5D5B8]" : "bg-black/5 border-black/5 text-black"}`}>
                <Phone size={20} />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Phone Number</p>
                <p className={`${isDark ? "text-white" : "text-black"} text-lg font-semibold`}>{client?.phone_number || "N/A"}</p>
              </div>
            </div>

            {/* COPYABLE AFFILIATE CODE SECTION */}
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-[#E5D5B8]" : "bg-black/5 border-black/5 text-black"}`}>
                <Hash size={20} />
              </div>
              <div className="space-y-1 group">
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Affiliate Code</p>
                <button
                  onClick={() => handleCopyAffiliateCode(affiliate?.referral_code)}
                  className={`flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg transition-all active:scale-95 group ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                  title="Click to copy"
                >
                  <p className={`text-base font-bold ${isDark ? "text-[#E5D5B8]" : "text-[#E8D1AB]"}`}>
                    {affiliate?.referral_code || "N/A"}
                  </p>
                  {affiliate?.referral_code && (
                    <Copy size={14} className={`transition-colors ${isDark ? "text-[#444] group-hover:text-[#E5D5B8]" : "text-gray-400 group-hover:text-black"}`} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-[#E5D5B8]" : "bg-black/5 border-black/5 text-black"}`}>
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Status</p>
                <div className="pt-1">
                  <span className={`px-5 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-[#E6FFFA] text-[#38A169]" : "bg-[#D4FFE4] text-[#16A34A]"}`}>
                    {client?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-[#E5D5B8]" : "bg-black/5 border-black/5 text-black"}`}>
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Client Type</p>
                <div className="pt-1">
                  <span className={`px-5 py-1.5 rounded-full text-xs font-bold ${clientTypeBadgeClass}`}>
                    {clientTypeLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shoots Management Section */}
        {/* <div className={`border rounded-xl lg:rounded-2xl p-8 space-y-6 ${isDark ? "bg-[#0D0D0D] border-white/20" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold leading-none">Account Credit</h2>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB] border border-[#E8D1AB]/30" : "bg-[#FFF8EA] text-[#8A6A00] border border-[#E7D7BC]"}`}>
                            Wallet Summary
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`rounded-xl border p-4 ${isDark ? "bg-[#111] border-[#2A2A2A]" : "bg-white border-gray-200"}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Available</p>
                            <p className="mt-2 text-xl font-semibold text-emerald-500">
                                {formatCurrency(accountCredit?.available_credit_amount || 0)}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${isDark ? "bg-[#111] border-[#2A2A2A]" : "bg-white border-gray-200"}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Used</p>
                            <p className="mt-2 text-xl font-semibold text-orange-400">
                                {formatCurrency(accountCredit?.used_credit_amount || 0)}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${isDark ? "bg-[#111] border-[#2A2A2A]" : "bg-white border-gray-200"}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Total</p>
                            <p className={`mt-2 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
                                {formatCurrency(accountCredit?.total_credit_amount || 0)}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${isDark ? "bg-[#111] border-[#2A2A2A]" : "bg-white border-gray-200"}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-[#666]" : "text-gray-400"}`}>Pending</p>
                            <p className={`mt-2 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
                                {formatCurrency(accountCredit?.pending_credit_amount || 0)}
                            </p>
                        </div>
                    </div>

                    <div className={`border rounded-xl lg:rounded-2xl overflow-hidden ${isDark ? "bg-[#0D0D0D] border-white/20" : "bg-white border-[#E5E5E5]"}`}>
                        <div className={`px-6 py-4 border-b ${isDark ? "border-[#2A2A2A] text-white" : "border-[#E5E5E5] text-black"} font-semibold`}>
                            Recent Credit Activity
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-[#888] bg-[#0D0D0D]" : "text-[#00000080] bg-[#FFFCF6]"}`}>
                                        <th className="py-4 px-6">Date</th>
                                        <th className="py-4 px-6">Type</th>
                                        <th className="py-4 px-6">Booking</th>
                                        <th className="py-4 px-6 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {creditHistory.length > 0 ? creditHistory.map((entry: any) => (
                                        <tr key={entry.account_credit_ledger_id} className={`${isDark ? "border-t border-[#2A2A2A]" : "border-t border-[#F0F0F0]"}`}>
                                            <td className={`py-4 px-6 ${isDark ? "text-white" : "text-black"}`}>
                                                {entry.created_at ? format(new Date(entry.created_at), "MMM d, yyyy") : "N/A"}
                                            </td>
                                            <td className={`py-4 px-6 capitalize ${isDark ? "text-[#CCC]" : "text-gray-600"}`}>
                                                {entry.entry_type?.replace(/_/g, " ") || "N/A"}
                                            </td>
                                            <td className={`py-4 px-6 ${isDark ? "text-[#CCC]" : "text-gray-700"}`}>
                                                {entry.booking_name || (entry.booking_id ? `#${entry.booking_id}` : "N/A")}
                                            </td>
                                            <td className={`py-4 px-6 text-right font-semibold ${entry.direction === "debit" ? "text-orange-400" : "text-emerald-500"}`}>
                                                {entry.direction === "debit" ? "-" : "+"}{formatCurrency(entry.amount || 0)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className={`py-10 text-center ${isDark ? "text-[#666]" : "text-gray-400"}`}>
                                                No credit activity found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>*/}

        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base lg:text-xl font-medium leading-none">Shoots Management</h2>
            <div className="relative w-72 flex justify-end items-center">
              <Search className={`absolute left-3 ${isDark ? "text-[#666]" : "text-gray-400"}`} size={16} />
              <input
                type="text"
                placeholder="Search project name or ID..."
                value={shootSearchQuery}
                onChange={(e) => setShootSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all ${isDark ? "bg-[#0D0D0D] border-white/20 text-white placeholder:text-[#444] focus:border-[#444]" : "bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gray-300"}`}
              />
            </div>
          </div>

          {/* Tab Selection */}
          <TabsSwitcher
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
            }}
          />

          {/* Shoots Table View */}
          <div className={`border rounded-xl lg:rounded-2xl overflow-hidden shadow-sm ${isDark ? "bg-[#0D0D0D] border-white/20" : "bg-white border-[#E5E5E5]"}`}>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-sm font-medium capitalize tracking-wider ${isDark ? "text-[#888] bg-[#0D0D0D]" : "text-[#000000] bg-[#FFFCF6] border-b border-b-[#E5E5E5]"}`}>
                    <th className="py-5 px-6">Shoot ID</th>
                    <th className="py-5 px-6">Project Name</th>
                    <th className="py-5 px-6">Category</th>
                    <th className="py-5 px-6">Price</th>
                    <th className="py-5 px-6">Status</th>
                    <th className="py-5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShoots.length > 0 ? filteredShoots.map((item: any) => (
                    <tr
                      key={item.project.stream_project_booking_id}
                      onClick={() => router.push(`/admin/shoots/${item.project.stream_project_booking_id}`)}
                      className={`transition-colors cursor-pointer group ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"}`}
                    >
                      <td className={`py-6 px-6 ${isDark ? "text-white" : "text-black"}`}>
                        #{item.project.stream_project_booking_id}
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-medium text-base ${isDark ? "bg-white text-black" : "bg-[#F5EAD8] text-black"}`}>
                            {getInitials(item.project.project_name)}
                          </div>
                          <div>
                            <p className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{item.project.project_name}</p>
                            <p className={`text-sm mt-0.5  ${isDark ? "text-[#555]" : "text-[#00000066]"}`}>
                              {item.project.event_date ? format(new Date(item.project.event_date), 'MMM d, yyyy') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`py-6 px-6 ${isDark ? "text-[#999]" : "text-gray-500"}`}>
                        {item.project.event_type_labels || "N/A"}
                      </td>
                      <td className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                        {formatCurrency(item.project.total_value_amount ?? item.project.total_paid_amount ?? 0)}
                      </td>
                      <td className="py-6 px-6">
                        <span className={`text-base font-medium px-5 py-2 rounded-full capitalize tracking-tight ${activeTab === "Paid"
                          ? "bg-[#D4FFE4] text-[#16A34A]"
                          : (isDark ? "bg-[#1A1A1A] text-[#555]" : "bg-[#FFF4C9] text-[#BA6605]")
                          }`}>
                          {activeTab === "Paid" ? "Paid" : "Draft"}
                        </span>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <ChevronRight size={20} className={`ml-auto transition-colors ${isDark ? "text-[#333] group-hover:text-white" : "text-gray-300 group-hover:text-black"}`} />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <p className={`${isDark ? "text-[#666]" : "text-gray-400"} text-lg font-medium`}>
                            No {activeTab.toLowerCase()} shoots found matching your search.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Archive History */}
          <div className="space-y-4">
            <h2 className="text-base lg:text-xl font-medium leading-none">Archive History</h2>

            <div className={`rounded-xl lg:rounded-2xl border p-4 lg:p-8 ${isDark ? "bg-[#0D0D0D] border-white/20" : "bg-white border-[#E5E5E5] shadow-sm"}`}>
              {Array.isArray(visibleArchiveHistory) && visibleArchiveHistory.length > 0 ? (
                <div className="space-y-4 relative">
                  {visibleArchiveHistory.map((entry: any, index: number) => {
                    const { date, time } = formatDateTime(entry?.created_at || entry?.timestamp || entry?.date || entry?.archived_at || entry?.restored_at);
                    const actorName = getHistoryActorName(entry);
                    const avatar = getHistoryAvatar(entry);
                    const sentence = buildHistorySentence(entry, clientName);
                    const isNested = index > 0;
                    const isRestore = getHistoryActionLabel(entry) === "restored";

                    return (
                      <div
                        key={entry?.archive_history_id || entry?.id || `${date}-${time}-${index}`}
                        className={`relative ${isNested ? "pl-10 lg:pl-14 mt-4" : ""}`}
                      >
                        {isNested ? (
                          <div className={`absolute left-6 -top-4 w-4 lg:w-7 h-12 border-l border-b rounded-bl-xl ${isDark ? "border-white/35" : "border-black/10"}`} />
                        ) : null}

                        {/* Content Display Node */}
                        <div className={isNested ? `rounded-xl border p-3 lg:p-5 ${isDark ? "bg-black border-white/50" : "bg-[#FAFAFA] border-[#E7E7E7]"}` : "flex items-start gap-4"}>
                          <div className={`flex items-start gap-4 ${isNested ? "" : "w-full"}`}>
                            {/* Avatar Frame Container */}
                            <div className={`flex h-9 w-9 lg:h-16 lg:w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg ${isRestore
                              ? (isDark ? "bg-[#E8F5E9] text-[#166534]" : "bg-[#EAF9EE] text-[#15803D]")
                              : (isDark ? "bg-[#FFD5E8] text-black" : "bg-[#F3D6F1] text-black")
                              }`}>
                              {avatar ? (
                                <img src={avatar} alt={actorName} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm lg:text-2xl font-medium">{getInitials(actorName)}</span>
                              )}
                            </div>

                            {/* Text Content Block */}
                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className={`text-xs lg:text-base font-medium leading-normal ${isDark ? "text-white" : "text-black"}`}>
                                {/* Sentence execution string containing color weights */}
                                <span className={isDark ? "text-white/90" : "text-black/90"}>
                                  {sentence.includes(" - Admin") ? (
                                    <>
                                      {sentence.replace(" - Admin", "")}
                                      <span className={isDark ? "text-[#E5D5B8]" : "text-[#B08A3C]"}> - Admin</span>
                                    </>
                                  ) : (
                                    sentence
                                  )}
                                </span>
                              </p>

                              {/* Date Time Metadata block */}
                              <div className={`mt-1 flex items-center gap-1.5 text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/45"}`}>
                                <span>{date}</span>
                                {time && (
                                  <>
                                    <span>•</span>
                                    <span>{time}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`flex items-center gap-3 rounded-xl lg:rounded-2xl border p-4 lg:p-8 ${isDark ? "bg-[#0D0D0D] border-white/20" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isDark ? "bg-white/5 text-[#E5D5B8]" : "bg-black/5 text-black"}`}>
                    <History size={20} />
                  </div>
                  <div>
                    <p className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>No archive history found.</p>
                    <p className={`text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>This client has not been archived or restored yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
