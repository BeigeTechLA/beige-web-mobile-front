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
    const [loading, setLoading] = useState(true);
    const [clientData, setClientData] = useState<any>(null);
    const [shootsData, setShootsData] = useState<any>(null);

    const [shootSearchQuery, setShootSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"Paid" | "Unpaid">("Paid");

    useEffect(() => {
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

    // Function to handle copying
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

    if (loading) return <div className="flex h-screen items-center justify-center bg-black"><Loader2 className="animate-spin text-[#E5D5B8]" size={40} /></div>;

    const client = clientData?.client;
    const affiliate = clientData?.affiliate;

    return (
        <>
            <Topbar pathname={pathname} />

            <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 max-w-7xl mx-auto space-y-8 bg-black min-h-screen text-white" style={{ fontFamily: 'var(--font-instrument-sans)' }}>

                {/* Page Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2.5 bg-[#111] border border-[#333] rounded-xl text-white hover:bg-[#222]">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{client?.name || "User Details"}</h1>
                        <p className="text-[#888] text-sm font-medium">User ID: #{client?.client_id}</p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-[#0D0D0D] border border-[#222] rounded-2xl p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[#E5D5B8]">
                                <User size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#666] text-[10px] uppercase font-bold tracking-widest">User Name</p>
                                <p className="text-white text-lg font-semibold">{client?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[#E5D5B8]">
                                <Mail size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#666] text-[10px] uppercase font-bold tracking-widest">Email ID</p>
                                <p className="text-white text-lg font-semibold">{client?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/5">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[#E5D5B8]">
                                <Phone size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#666] text-[10px] uppercase font-bold tracking-widest">Phone Number</p>
                                <p className="text-white text-base font-semibold">{client?.phone_number || "N/A"}</p>
                            </div>
                        </div>

                        {/* COPYABLE AFFILIATE CODE SECTION */}
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[#E5D5B8]">
                                <Hash size={20} />
                            </div>
                            <div className="space-y-1 group">
                                <p className="text-[#666] text-[10px] uppercase font-bold tracking-widest">Affiliate Code</p>
                                <button
                                    onClick={() => handleCopyAffiliateCode(affiliate?.referral_code)}
                                    className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 -ml-2 rounded-lg transition-all active:scale-95 group"
                                    title="Click to copy"
                                >
                                    <p className="text-[#E5D5B8] text-base font-bold">
                                        #{affiliate?.referral_code || "N/A"}
                                    </p>
                                    {affiliate?.referral_code && (
                                        <Copy size={14} className="text-[#444] group-hover:text-[#E5D5B8] transition-colors" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[#E5D5B8]">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#666] text-[10px] uppercase font-bold tracking-widest">Status</p>
                                <div className="pt-1">
                                    <span className="px-5 py-1.5 rounded-full text-xs font-bold bg-[#E6FFFA] text-[#38A169]">
                                        {client?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shoots Management Section */}
                <div className="space-y-6 pt-4">

                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold leading-none">Shoots Management</h2>

                        <div className="relative w-72 flex items-center">
                            <Search
                                className="absolute left-3 text-[#666]"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search project name or ID..."
                                value={shootSearchQuery}
                                onChange={(e) => setShootSearchQuery(e.target.value)}
                                className="bg-[#0D0D0D] border border-[#222] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] w-full h-10"
                            />
                        </div>
                    </div>

                    {/* Tab Selection */}
                    <div className="flex items-center gap-1 bg-[#111] p-1.5 rounded-xl w-fit border border-[#333]">
                        <button
                            onClick={() => setActiveTab("Paid")}
                            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "Paid" ? "bg-[#E5D5B8] text-black shadow-lg" : "text-[#777] hover:text-white"
                                }`}
                        >
                            Paid Shoots
                        </button>
                        <button
                            onClick={() => setActiveTab("Unpaid")}
                            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "Unpaid" ? "bg-[#E5D5B8] text-black shadow-lg" : "text-[#777] hover:text-white"
                                }`}
                        >
                            Draft or Unpaid
                        </button>
                    </div>

                    {/* Shoots Table View */}
                    <div className="bg-[#0D0D0D] border border-[#222] rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[#888] text-[11px] font-bold bg-[#0D0D0D] uppercase tracking-wider">
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
                                            className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                        >
                                            <td className="py-6 px-6 text-white font-bold text-[15px]">
                                                #{item.project.stream_project_booking_id}
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black font-extrabold text-[12px]">
                                                        {getInitials(item.project.project_name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-[15px]">{item.project.project_name}</p>
                                                        <p className="text-[#555] text-xs mt-0.5 font-medium">
                                                            {item.project.event_date ? format(new Date(item.project.event_date), 'MMM d, yyyy') : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6 text-[#999] text-[14px] font-medium">
                                                {item.project.event_type_labels || "N/A"}
                                            </td>
                                            <td className="py-6 px-6 text-white font-bold text-[16px]">
                                                {formatCurrency(item.project.total_paid_amount || 0)}
                                            </td>
                                            <td className="py-6 px-6">
                                                <span className={`text-[11px] font-bold px-5 py-2 rounded-full uppercase tracking-tight ${activeTab === "Paid"
                                                        ? "bg-[#FFF9E5] text-[#B18A00]"
                                                        : "bg-[#1A1A1A] text-[#555]"
                                                    }`}>
                                                    {activeTab === "Paid" ? "Pending" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="py-6 px-6 text-right">
                                                <ChevronRight size={20} className="text-[#333] group-hover:text-white transition-colors ml-auto" />
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <p className="text-[#666] text-lg font-medium">
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
