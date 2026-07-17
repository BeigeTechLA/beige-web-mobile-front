"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    AlertTriangle,
    Clock,
    Tag,
    Check,
    X,
    ArrowUpDown,
    ArrowDown,
    TrendingUpDown,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

interface NotificationDetailPageProps {
    params: {
        id: string;
    };
}

import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import Topbar from "@/components/admin/Topbar";
import DottedDivider from "@/components/admin/DottedDivider";

export default function NotificationDetailPage({ params }: NotificationDetailPageProps) {
    const { id } = params;
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [reviewNotes, setReviewNotes] = useState("");

    const isDark = !mounted || theme === "dark";

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleApprove = () => {
        // Approval logic here
        console.log("Approved with notes:", reviewNotes);
    };

    const handleReject = () => {
        // Rejection logic here
        console.log("Rejected with notes:", reviewNotes);
    };

    return (
        <div className="relative overflow-hidden">
            <Topbar
                pathname="Notification / Details"
                actions={<div />}
            />
            <div
                className={`min-h-screen px-6 py-6 lg:px-10 lg:py-8 ${isDark ? "bg-[#111111]" : "bg-[#F4F5F7]"}`}
            >
                <div className="min-h-screen">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className={`mb-6 flex items-center gap-2 text-sm transition-colors ${isDark ? "text-white" : "text-[#101010]"
                            }`}
                    >
                        <ChevronLeft size={14} />
                        Back
                    </button>

                    {/* Header Section */}
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>
                                Admin Approval Required
                            </h1>
                            <p className={`mt-1 text-sm ${isDark ? "text-white/70" : "text-[#101010]/70"}`}>
                                Quote #Q{id}
                            </p>
                        </div>
                        <span className="rounded-full bg-[#FFF4C9] px-5.5 py-3 text-base font-medium text-[#BA6605]">
                            Pending
                        </span>
                    </div>

                    {/* High-Risk Alert */}
                    <div className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${isDark ? "border-[#FE9A00]/20 bg-[#FE9A00]/10" : "border-[#D8A73C]/30 bg-[#F4DFAE]/20"
                        }`}>
                        <AlertTriangle className={`mt-0.5 h-5 w-5 ${isDark ? "text-[#D8A73C]" : "text-[#C87913]"}`} />
                        <div>
                            <h3 className={`text-base font-semibold ${isDark ? "text-[#FFB900]" : "text-[#C87913]"}`}>
                                High-Risk Changes Detected
                            </h3>
                            <p className={`mt-1 text-sm ${isDark ? "text-[#FFB900]" : "text-[#C87913]/80"}`}>
                                This approval involves financial adjustments or event changes that may impact operations.
                            </p>
                        </div>
                    </div>

                    {/* Info Cards Row */}
                    <div className="mb-6 grid gap-4 md:grid-cols-3">
                        {/* Requested Date */}
                        <div className={`flex items-start gap-3 rounded-2xl border-[0.5px] p-4 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#101010]/10 bg-white"
                            }`}>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isDark ? "bg-[#2B7FFF]/10" : "bg-[#C5D9F7]"}`}>
                                <Calendar size={24} className={isDark ? "text-[#51A2FF]" : "text-[#16a34a]"} />
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? "text-[#9F9FA9]" : "text-[#101010]/60"}`}>Requested</p>
                                <p className={`text-base font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>March 15, 2026</p>
                            </div>
                        </div>

                        {/* Price Impact */}
                        <div className={`flex items-start gap-3 rounded-2xl border-[0.5px] p-4 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#101010]/10 bg-white"
                            }`}>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isDark ? "bg-[#AD46FF]/10" : "bg-[#EBC9F5]"}`}>
                                <DollarSign size={24} className={isDark ? "text-[#C27AFF]" : "text-[#7C3AED]"} />
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? "text-[#9F9FA9]" : "text-[#101010]/60"}`}>Price Impact</p>
                                <p className={`text-base font-semibold ${isDark ? "text-[#FFB900]" : "text-[#C87913]"}`}>+$8,000.00</p>
                            </div>
                        </div>

                        {/* Request Type */}
                        <div className={`flex items-start gap-3 rounded-2xl border-[0.5px] p-4 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#101010]/10 bg-white"
                            }`}>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isDark ? "bg-[#FE9A00]/10" : "bg-[#F5E2AF]"}`}>
                                <AlertTriangle size={24} className={isDark ? "text-[#FFB900]" : "text-[#C87913]"} />
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? "text-[#9F9FA9]" : "text-[#101010]/60"}`}>Request Type</p>
                                <p className={`text-base font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>Edit</p>
                            </div>
                        </div>
                    </div>

                    {/* Requested Changes Card */}
                    <div
                        className={`flex flex-col justify-center mb-6 rounded-2xl border-[0.5px] gap-8 p-8 ${isDark
                            ? "border-[#3D3D3D] bg-[#171717]"
                            : "border-[#101010]/10 bg-white"
                            }`}>
                        <h2 className={`text-lg font-normal ${isDark ? "text-white" : "text-[#101010]"}`}>
                            Requested Changes
                        </h2>

                        {/* Duration Card */}
                        <div className="flex flex-col gap-4">
                            <div className={`flex flex-col gap-3 rounded-xl p-4 ${isDark ? "bg-[#272727]/30" : "bg-[#F9F9F9]"
                                }`}>
                                <div className="flex items-center gap-2">
                                    <h3 className={`text-base font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>Duration</h3>
                                    <span className={`rounded px-2 py-0.5 text-xs ${isDark ? "bg-[#1B2840] text-[#58A6FF]" : "bg-[#C5D9F7] text-[#16a34a]"
                                        }`}>
                                        Service
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className={`mb-1 flex items-center gap-1 text-sm ${isDark ? "text-[#71717B]" : "text-[#101010]/60"}`}>
                                            <TrendingDown size={12} /> Old Value
                                        </p>
                                        <p className={`text-sm ${isDark ? "text-[#9F9FA9]" : "text-[#101010]/80"}`}>8 hours</p>
                                    </div>
                                    <div>
                                        <p className={`mb-1 flex items-center gap-1 text-sm ${isDark ? "text-[#71717B]" : "text-[#101010]/60"}`}>
                                            <TrendingUp size={12} /> New Value
                                        </p>
                                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>10 hours</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Price Card */}
                            <div className={`flex flex-col gap-3 rounded-xl p-4 ${isDark ? " bg-[#272727]/30" : " bg-[#F9F9F9]"
                                }`}>
                                <div className="flex items-center gap-2">
                                    <h3 className={`text-base font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>Total Price</h3>
                                    <span className={`rounded px-2 py-0.5 text-xs ${isDark ? "bg-[#2D2725] text-[#D8A73C]" : "bg-[#F5E2AF] text-[#C87913]"
                                        }`}>
                                        Pricing
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className={`mb-1 flex items-center gap-1 text-sm ${isDark ? "text-[#71717B]" : "text-[#101010]/60"}`}>
                                            <TrendingDown size={12} /> Old Value
                                        </p>
                                        <p className={`text-sm ${isDark ? "text-[#9F9FA9]" : "text-[#101010]/80"}`}>$12,000</p>
                                    </div>
                                    <div>
                                        <p className={`mb-1 flex items-center gap-1 text-sm ${isDark ? "text-[#71717B]" : "text-[#101010]/60"}`}>
                                            <TrendingUp size={12} /> New Value
                                        </p>
                                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>$20,000</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reason for Changes */}
                        <div className={`rounded-xl p-4 ${isDark ? "bg-[#272727]/30" : "bg-[#F9F9F9]"
                            }`}>
                            <p className={`mb-2 text-sm ${isDark ? "text-[#9F9FA9]" : "text-[#101010]/60"}`}>Reason for Changes</p>
                            <p className={`text-base ${isDark ? "text-white" : "text-[#101010]"}`}>
                                Client requested additional crew and extended duration for comprehensive coverage
                            </p>
                        </div>

                        {/* Additional Payment Alert */}
                        <div className={`rounded-lg border p-4 ${isDark ? "border-[#E8D1AB]/20 bg-[#E8D1AB]/10" : "border-[#D8A73C]/20 bg-[#F4DFAE]/20"
                            }`}>
                            <h3 className={`mb-1 text-base font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#C87913]"}`}>
                                Additional Payment Required
                            </h3>
                            <p className={`text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#101010]/70"}`}>
                                Customer will need to pay $8,000.00 additional. Booking status remains confirmed.
                            </p>
                        </div>

                        {/* Review Notes Textarea */}
                        <div>
                            <fieldset className={`rounded-xl border-[0.5px] ${isDark ? "border-white/50 bg-[#171717]" : "border-[#101010]/10"}`}>
                                <legend className={`px-2 ml-2.5 text-base ${isDark ? "text-white/60" : "text-[#101010]/60"}`}>
                                    Review Notes (Optional)
                                </legend>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add any notes about this approval decision..."
                                    className={`h-32 w-full resize-none rounded-xl bg-transparent p-4 text-base outline-none ${isDark
                                        ? "text-white placeholder:text-white/40"
                                        : "text-[#101010] placeholder:text-[#101010]/40"
                                        }`}
                                />
                            </fieldset>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleReject}
                                className={`h-15 min-w-[200px] rounded-xl border-[0.5px] text-base font-medium transition-colors ${isDark
                                    ? "border-[#FB2C36]/20 bg-[#FB2C36]/10 text-[#FF6467] hover:bg-[#341111]"
                                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    }`}
                            >
                                <X size={24} className="mr-1" />
                                Reject Request
                            </Button>
                            <Button
                                onClick={handleApprove}
                                className={`h-15 min-w-[200px] rounded-xl text-base font-medium text-[#101010] transition-colors ${isDark
                                    ? "bg-[#1ABF5C] hover:bg-[#28d165]"
                                    : "bg-[#22C55E] hover:bg-[#28d165]"
                                    }`}
                            >
                                <Check size={24} className="mr-1" />
                                Approve Request
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}