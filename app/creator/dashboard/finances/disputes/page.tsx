"use client";
import React, { useState } from "react";
import {
    Calendar,
    Search,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    TrendingUp,
    Calendar as CalendarIcon,
    AlertTriangle,
    ChevronRight,
    ChevronLeft,
    DollarSign,
    HandCoins,
    CheckCircle2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { formatCurrency } from "@/lib/utils";
import RaiseDisputeModal, { RaiseDisputeData } from "@/components/creator-profile/RaiseDisputeModal";
import DisputeDetailsModal, {
    type DisputeDetailsRecord,
} from "@/components/creator-profile/DisputeDetailsModal";

interface DisputeItem {
    id: string;
    bookingId: string;
    invoiceId?: string;
    title: string;
    status: "Paid" | "Disputed" | "Processing" | "Pending";
    payoutDate: string;
    totalEarnings: number;
    platformFee: number;
    finalPayout: number;
    disputeId?: string;
    raisedBy?: string;
    raisedRole?: string;
    category?: string;
    description?: string;
}

const disputesData: DisputeItem[] = [
    {
        id: "Dispute ID - 001",
        bookingId: "BK-001",
        invoiceId: "INV-004-B",
        title: "Corporate Headshots Session",
        status: "Paid",
        payoutDate: "28-04-2026",
        totalEarnings: 2500,
        platformFee: 300,
        finalPayout: 2200,
        raisedBy: "Emily Johnson",
        raisedRole: "Client",
        category: "Quality Issue",
        description: "The final photos did not meet the agreed quality standards.",
    },
    {
        id: "Dispute ID - 002",
        bookingId: "BK-002",
        invoiceId: "INV-005-B",
        title: "Wedding Photography Package",
        status: "Disputed",
        payoutDate: "28-04-2026",
        totalEarnings: 5800,
        platformFee: 696,
        finalPayout: 5104,
        disputeId: "DIS-045",
        raisedBy: "Emily Johnson",
        raisedRole: "Client",
        category: "Quality Issue",
        description: "The final photos did not meet the agreed quality standards.",
    },
    {
        id: "Dispute ID - 003",
        bookingId: "BK-003",
        invoiceId: "INV-006-B",
        title: "Product Photography - E-commerce",
        status: "Processing",
        payoutDate: "20-04-2026",
        totalEarnings: 1200,
        platformFee: 144,
        finalPayout: 1056,
        raisedBy: "Sarah Chen",
        raisedRole: "Client",
        category: "Delivery Delay",
        description: "Deliverables were not received on time.",
    },
    {
        id: "Dispute ID - 004",
        bookingId: "BK-004",
        invoiceId: "INV-007-B",
        title: "Real Estate Virtual Tour",
        status: "Pending",
        payoutDate: "26-03-2026",
        totalEarnings: 3200,
        platformFee: 384,
        finalPayout: 2816,
        raisedBy: "Michael Brown",
        raisedRole: "Client",
        category: "Payment Issue",
        description: "Incorrect amount was charged.",
    },
    {
        id: "Dispute ID - 005",
        bookingId: "BK-005",
        invoiceId: "INV-008-B",
        title: "Event Coverage - Conference",
        status: "Paid",
        payoutDate: "20-03-2026",
        totalEarnings: 4500,
        platformFee: 540,
        finalPayout: 3960,
        raisedBy: "Jessica Lee",
        raisedRole: "Client",
        category: "Service Quality",
        description: "Overall service was satisfactory.",
    },
];

const initialMetrics = [
    { id: 'upcoming', label: 'Total Dispute Amount', value: 17200, subvalue: "3", icon: DollarSign },
    { id: 'pending', label: 'Total Disputes Raised', value: 50, subvalue: "3", icon: HandCoins },
    { id: 'paid', label: 'Paid Disputes', value: 155, subvalue: "3", icon: CheckCircle2 },
    { id: 'total', label: 'Pending Dispute', value: 10, subvalue: "3", icon: DollarSign },
];

const getStatusBadge = (status: string) => {
    const badges = {
        Paid: { bg: "bg-[#10B981]/10", text: "text-[#10B981]", border: "border-[#10B981]/20" },
        Disputed: { bg: "bg-[#EF4444]/10", text: "text-[#EF4444]", border: "border-[#EF4444]/20" },
        Processing: { bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]", border: "border-[#3B82F6]/20" },
        Pending: { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", border: "border-[#F59E0B]/20" },
    };
    const badge = badges[status as keyof typeof badges] || badges.Pending;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
            {status}
        </span>
    );
};

// Helper function to convert DisputeItem to DisputeDetailsRecord
const mapToDisputeDetails = (dispute: DisputeItem): DisputeDetailsRecord => ({
    ...dispute,
    createdAt: dispute.payoutDate,
    payoutNote: "Payout will be processed after dispute resolution",
    timeline: [
        {
            title: "Dispute Created",
            by: dispute.raisedBy || "Unknown",
            at: "2026-04-19 10:30",
            tone: "warning" as const,
        },
        {
            title: "Under Review",
            by: "Support Team",
            at: "2026-04-19 14:20",
            tone: "review" as const,
        },
    ],
    comments: [
        {
            author: dispute.raisedBy || "Emily Johnson",
            role: "Client" as const,
            message: "The photos are blurry and not as discussed.",
            at: "19-04-2026, 10:35",
        },
        {
            author: "Support Agent",
            role: "Admin" as const,
            message: "We are reviewing the original contract and deliverables.",
            at: "19-04-2026, 15:35",
        },
    ],
    attachments: [
        {
            name: "contract.pdf",
            size: "245 KB",
            uploadedBy: "Sarah Chen",
            uploadedAt: "2026-04-2026",
        },
        {
            name: "sample-photos.zip",
            size: "12.5 MB",
            uploadedBy: "Sarah Chen",
            uploadedAt: "2026-04-2026",
        },
    ],
});

export default function DisputesPage() {
    const { isDark } = useResolvedTheme()
    const pathname = usePathname();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMetric, setActiveMetric] = useState('upcoming');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedCard, setSelectedCard] = useState(true);
    const [metrics, setMetrics] = useState(initialMetrics);
    const [overviewRange, setOverviewRange] = useState('month');
    const [disputedRange, setDisputedRange] = useState('month');
    const [disputedStatus, setDisputedStatus] = useState('status');
    const [disputedStat, setDisputedStat] = useState('all');
    const [isRaiseDisputeOpen, setIsRaiseDisputeOpen] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<DisputeDetailsRecord | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleRaiseDisputeSubmit = async (data: RaiseDisputeData) => {
        // TODO: Implement API call to submit dispute
        console.log("Submitting dispute:", data);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // In real implementation, you would:
        // 1. Send data to your backend
        // 2. Get response with dispute ID
        // 3. Update the disputes list
        // 4. Show success modal (already handled in the component)
    };

    const handleViewDetails = (dispute: DisputeItem) => {
        const disputeDetails = mapToDisputeDetails(dispute);
        setSelectedDispute(disputeDetails);
    };

    const filteredDisputes = disputesData.filter(
        (dispute) =>
            dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dispute.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Topbar pathname={pathname} actions={
                <Button
                    onClick={() => setIsRaiseDisputeOpen(true)}
                    className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                >
                    Raise New Dispute
                </Button>
            } />
            <div className="overflow-hidden p-4 pb-12 text-white lg:px-10 lg:py-9">
                <div className="mx-auto w-full max-w-[1800px] space-y-4 lg:space-y-8 bg-[#101010]">
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between lg:mb-6">
                        <div>
                            <h1 className="text-base lg:text-3xl font-bold">Disputes</h1>
                            <p className="text-xs lg:text-base text-white/60">Resolve disputes linked to Shoot and Invoice IDs</p>
                        </div>
                        <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    </div>
                    {/* Overview Section */}
                    <div className={`transition-colors duration-300 border rounded-2xl p-4 lg:p-5 w-full mt-5 lg:mt-9 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5 lg:mb-8">
                            <div className="flex items-center gap-2">
                                <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
                                <p className="font-medium text-sm lg:text-base">Overview</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={overviewRange} onValueChange={(val) => setOverviewRange(val)}>
                                    <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#807E7E] text-[#C4C4C4]" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
                                        }`}>
                                        <SelectValue placeholder="Range" />
                                    </SelectTrigger>
                                    <SelectContent className={`${isDark ? "bg-[#111111] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                                        <SelectItem value="month">Month</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="all">All time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Metric Cards Grid */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 rounded-xl p-3 lg:p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"
                            }`}>
                            {metrics.map((m) => {
                                const isActive = activeMetric === m.id;
                                return (
                                    <div
                                        key={m.id}
                                        onClick={() => setActiveMetric(m.id)}
                                        className={`relative group cursor-pointer rounded-lg p-4 border transition-all duration-200 ${isActive
                                            ? 'bg-[#ECD7B4] text-[#171717] border-transparent'
                                            : (isDark ? 'bg-[#101010] text-white border-transparent hover:border-white/30' : 'bg-[#F4F5F7] text-[#323232] border-transparent hover:border-[#ECD7B4]')
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`text-sm font-medium ${isActive ? 'text-black/70' : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`}>
                                                {m.label}
                                            </span>
                                            <div className={`p-2 rounded-full ${isActive ? 'bg-[#171717] text-[#E8D1AB]' : (isDark ? 'bg-[#2C2C2C] text-[#E8D1AB]' : 'bg-[#fff] text-[#E8D1AB]')}`}>
                                                <m.icon size={20} />
                                            </div>
                                        </div>

                                        <div className="text-2xl lg:text-[26px] font-bold mb-2">
                                            {isLoading ? <div className={`h-8 w-12 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-zinc-200"}`} /> : formatCurrency(m.value)}
                                        </div>

                                        <div className={`text-xs flex gap-1 items-center ${isActive ? 'text-[#101010]/70' : (isDark ? 'text-white/70' : 'text-zinc-500')}`}>
                                            <p className={`text-xs font-medium`}><span className={`${isActive ? 'text-[#047726]' : 'text-[#0DAE3D]'}`}>+{m.subvalue}%</span> from last month</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dispute History Section */}
                    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl mb-6">
                        <div className="rounded-2xl border-b-[0.5px] border-[#3D3D3D] bg-[#101010] p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
                                    <p className="font-medium text-sm lg:text-base">Dispute History</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Select value={disputedStatus} onValueChange={(val) => setDisputedStatus(val)}>
                                        <SelectTrigger className={`rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
                                            }`}>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent className={`${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                                            <SelectItem value="status">Status</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="disputed">Disputed</SelectItem>
                                            <SelectItem value="processing">Processing</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={disputedRange} onValueChange={(val) => setDisputedRange(val)}>
                                        <SelectTrigger className={`rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
                                            }`}>
                                            <SelectValue placeholder="Range" />
                                        </SelectTrigger>
                                        <SelectContent className={`${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                                            <SelectItem value="month">Month</SelectItem>
                                            <SelectItem value="week">Week</SelectItem>
                                            <SelectItem value="year">Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={disputedStat} onValueChange={(val) => setDisputedStat(val)}>
                                        <SelectTrigger className={`rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
                                            }`}>
                                            <SelectValue placeholder="Stat" />
                                        </SelectTrigger>
                                        <SelectContent className={`${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by Dispute ID and Client Name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#202020] border border-[#3D3D3D] rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E5D5B8] transition-colors"
                                />
                            </div>

                        </div>

                        {/* Dispute List */}
                        <div className="space-y-3 p-6">
                            {filteredDisputes.map((dispute) => (
                                <div key={dispute.id} className={`rounded-2xl overflow-hidden bg-[#0D0D0D] ${expandedId === dispute.id ? 'border border-[#E8D1AB]' : 'border border-[#262626]'}`}>
                                    {/* Collapsed Header */}
                                    <div
                                        onClick={() => toggleExpand(dispute.id)}
                                        className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            {expandedId === dispute.id ? (
                                                <ChevronUp size={20} className="text-[#E8D1AB]" />
                                            ) : (
                                                <ChevronDown size={20} className="text-gray-400" />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-3 text-lg mb-1">
                                                    <h3 className="font-normal">{dispute.title}</h3>
                                                    {getStatusBadge(dispute.status)}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                                                    <span>{dispute.bookingId}</span>
                                                    {dispute.status === "Disputed" ? (
                                                        <>
                                                            <span>•</span>
                                                            <AlertCircle size={14} className="text-[#EF4444]" />
                                                            <span className="text-[#EF4444]">Dispute Active</span>
                                                        </>
                                                    ) : <>
                                                        <span>•</span>
                                                        <Calendar size={14} />
                                                        <span>Payout: {dispute.payoutDate}</span>

                                                    </>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-normal text-[#10B981]">${dispute.finalPayout.toLocaleString()}</p>
                                            <p className="text-sm text-[#A0A0A0]">Net Payout</p>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === dispute.id && (
                                        <div className="px-5 py-5 bg-[#0A0A0A]">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                {/* Earnings Breakdown */}
                                                <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
                                                    <h4 className="text-base font-normal mb-4">Earnings Breakdown</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between text-base">
                                                            <span className="text-[#A0A0A0]">Total Earnings</span>
                                                            <span>${dispute.totalEarnings.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-base">
                                                            <span className="text-[#A0A0A0]">Platform Fee (12%)</span>
                                                            <span className="text-[#EF4444]">-${dispute.platformFee.toLocaleString()}</span>
                                                        </div>
                                                        <div className="border-t-[0.5px] border-[#262626] pt-3 mt-3">
                                                            <div className="flex justify-between text-base">
                                                                <span className="font-normal">Final Payout</span>
                                                                <span className="font-normal text-xl text-[#10B981]">${dispute.finalPayout.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payout Status */}
                                                <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-5">
                                                    <h4 className="text-base font-normal mb-4">Payout Status</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-base text-[#A0A0A0]">Status</span>
                                                            {getStatusBadge(dispute.status)}
                                                        </div>
                                                        <div className="flex justify-between text-base">
                                                            <span className="text-[#A0A0A0]">Payout Date</span>
                                                            <span>{dispute.payoutDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Active Dispute Alert */}
                                            {dispute.disputeId && (
                                                <div className="bg-[#EF4444]/5 border-[0.5px] border-[#EF4444]/20 rounded-lg p-5">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle className="text-[#EF4444] mt-0.5" size={20} />
                                                            <div>
                                                                <h4 className="font-normal mb-1">Active Dispute: {dispute.disputeId}</h4>
                                                                <p className="text-sm text-[#A0A0A0]">Payout will be processed after dispute resolution</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleViewDetails(dispute)}
                                                            className="px-5 py-2.5 bg-[#E8D1AB] text-black rounded-lg font-medium text-sm hover:bg-[#F5EBD8] transition-colors">
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-3.5 py-5 border-t border-[#3D3D3D] rounded-b-2xl bg-[#101010]">
                            <p className="text-sm text-gray-500">Page 1 to 10</p>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-lg border border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A] transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <button className="w-9 h-9 rounded-lg bg-[#E5D5B8] text-black font-medium text-sm">
                                    1
                                </button>
                                <button className="w-9 h-9 rounded-lg border border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A] transition-colors text-sm">
                                    2
                                </button>
                                <button className="w-9 h-9 rounded-lg border border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A] transition-colors text-sm">
                                    3
                                </button>
                                <span className="text-gray-500 px-2">...</span>
                                <button className="p-2 rounded-lg border border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A] transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <TrendingUp size={20} className="text-[#10B981]" />
                            <h2 className="text-base font-normal">Payment Summary</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-8">
                            <div>
                                <p className="text-sm text-[#A0A0A0] mb-1">Completed Bookings</p>
                                <p className="text-xl text-[#E8D1AB] font-normal">05</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#A0A0A0] mb-1">Average Earnings</p>
                                <p className="text-xl text-[#E8D1AB] font-normal">$3440.00</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#A0A0A0] mb-1">Average Platform Fee</p>
                                <p className="text-xl text-[#E8D1AB] font-normal">12%</p>
                            </div>
                        </div>
                    </div>
                </div>
                <RaiseDisputeModal
                    open={isRaiseDisputeOpen}
                    onOpenChange={setIsRaiseDisputeOpen}
                    onSubmit={handleRaiseDisputeSubmit}
                />

                <DisputeDetailsModal
                    isOpen={!!selectedDispute}
                    onClose={() => setSelectedDispute(null)}
                    dispute={selectedDispute}
                />
            </div>
        </>
    );
}