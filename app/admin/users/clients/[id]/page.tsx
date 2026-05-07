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
    Copy
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const getInitials = (name: string) => {
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
};

const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number(amount));
};

export default function ClientDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [clientData, setClientData] = useState<any>(null);
    const [shootsData, setShootsData] = useState<any>(null);

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
        const fullCode = `#${code}`;
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

    return (
        <>
            <Topbar pathname={pathname} />

            <div className={`overflow-hidden min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 mx-auto space-y-8 ${isDark ? "bg-black text-white" : "bg-[#F4F5F7] text-black"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>

                {/* Page Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className={`p-2.5 border rounded-xl transition-colors ${isDark ? "bg-[#111] border-[#333] text-white hover:bg-[#222]" : "bg-gray-50 border-gray-200 text-black hover:bg-gray-100"}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{client?.name || "User Details"}</h1>
                        <p className={`${isDark ? "text-[#888]" : "text-gray-500"} text-sm font-medium`}>User ID: #{client?.client_id}</p>
                    </div>
                </div>

                {/* Info Section */}
                <div className={`border rounded-2xl p-8 space-y-10 ${isDark ? "bg-[#0D0D0D] border-[#222]" : "bg-gray-50 border-gray-100"}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
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
                                        #{affiliate?.referral_code || "N/A"}
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
                    </div>
                </div>

                {/* Shoots Management Section */}
              {/* <div className={`border rounded-2xl p-8 space-y-6 ${isDark ? "bg-[#0D0D0D] border-[#222]" : "bg-gray-50 border-gray-100"}`}>
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

                    <div className={`border rounded-2xl overflow-hidden ${isDark ? "bg-[#0D0D0D] border-[#222]" : "bg-white border-[#E5E5E5]"}`}>
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
                        <h2 className="text-2xl font-bold leading-none">Shoots Management</h2>
                        <div className="relative w-72 flex items-center">
                            <Search className={`absolute left-3 ${isDark ? "text-[#666]" : "text-gray-400"}`} size={16} />
                            <input
                                type="text"
                                placeholder="Search project name or ID..."
                                value={shootSearchQuery}
                                onChange={(e) => setShootSearchQuery(e.target.value)}
                                className={`border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all ${isDark ? "bg-[#0D0D0D] border-[#222] text-white placeholder:text-[#444] focus:border-[#444]" : "bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gray-300"}`}
                            />
                        </div>
                    </div>

                    {/* Tab Selection */}
                    <div className={`flex items-center gap-1 p-1.5 rounded-xl w-fit border ${isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"}`}>
                        <button
                            onClick={() => setActiveTab("Paid")}
                            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "Paid" ? "bg-[#E5D5B8] text-black shadow-lg" : (isDark ? "text-[#777] hover:text-white" : "text-gray-500 hover:text-black")}`}
                        >
                            Paid Shoots
                        </button>
                        <button
                            onClick={() => setActiveTab("Unpaid")}
                            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "Unpaid" ? "bg-[#E5D5B8] text-black shadow-lg" : (isDark ? "text-[#777] hover:text-white" : "text-gray-500 hover:text-black")}`}
                        >
                            Draft or Unpaid
                        </button>
                    </div>

                    {/* Shoots Table View */}
                    <div className={`border rounded-2xl overflow-hidden shadow-sm ${isDark ? "bg-[#0D0D0D] border-[#222]":"bg-white border-[#E5E5E5]"}`}>
                        <div className="overflow-x-auto">
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
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-medium text-base ${isDark ? "bg-white text-black" : "bg-[#F5EAD8] text-black"}`}>
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
                                                {formatCurrency(item.project.total_paid_amount || 0)}
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
                </div>
            </div>
        </>
    );
}
