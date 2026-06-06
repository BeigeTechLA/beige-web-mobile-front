'use client';

import React, { useState } from 'react';
import { X, Calendar, MapPin, Download, Send } from 'lucide-react';

type Status = 'Partially Paid' | 'Awaiting Response' | 'Accepted';

interface EarningsBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    data?: any; // Existing data structure preserved
}

interface TimelineItem {
    title: string;
    subtitle?: string;
    date?: string;
    completed: boolean;
}

const statusStyles: Record<Status, { bg: string; text: string; border: string }> = {
    'Partially Paid': { bg: 'bg-[#E0E7FF]', text: 'text-[#372AAc]', border: 'border-[#c6d2ff]' },
    'Awaiting Response': { bg: 'bg-[#FEF9C2]', text: 'text-[#894B00]', border: 'border-[#FFF085]' },
    Accepted: { bg: 'bg-[#DBEAFE]', text: 'text-[#193CB8]', border: 'border-[#BEDBFF]' },
};

export default function EarningsBreakdownModal({ isOpen, onClose, data }: EarningsBreakdownModalProps) {
    const [showPayoutTimeline, setShowPayoutTimeline] = useState(false);

    if (!isOpen) return null;

    // Timeline data
    const timelineItems: TimelineItem[] = [
        {
            title: 'New Shoot Received & Shoot assigned to you',
            date: 'May 28, 2026',
            completed: true,
        },
        {
            title: 'Shoot Accepted by you for this new Shoot',
            date: 'May 29, 2026',
            completed: true,
        },
        {
            title: 'Advance Payment of $300 Has Been Processed',
            date: 'June 01, 2026',
            completed: true,
        },
        {
            title: 'Shoot Completed · Awaiting Completion',
            completed: false,
        },
        {
            title: 'Awaiting Finance Approval',
            completed: false,
        },
        {
            title: 'Final Payment Processed · Remaining Balance Paid',
            completed: false,
        },
    ];

    return (
        <>
            {/* Backdrop Blur Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Right-Side Slide-Over Panel */}
            <div
                className="fixed top-0 right-0 h-full w-full max-w-[580px] bg-[#000000] border-l border-[rgba(255,255,255,0.08)] rounded-l-2xl z-50 flex flex-col shadow-2xl transform transition-transform duration-300"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header Section */}
                <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-start justify-between shrink-0">
                    <div>
                        <h2 id="modal-title" className="text-2xl font-bold text-white tracking-tight">
                            Earnings Breakdown
                        </h2>
                        <p className="text-sm text-[#71717A] mt-1">
                            Detailed compensation and payment information
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#202020] hover:bg-[#2a2a2a] text-white transition-colors duration-200"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* SECTION 1: SHOOT INFORMATION */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4">Shoot Information</h3>
                        <div className="bg-[#1A1A1A] rounded-xl p-5 space-y-4">
                            {/* 3-Column Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-[#71717A] mb-1">Shoot Name</p>
                                    <p className="text-white font-medium">{data?.title}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#71717A] mb-1">Client</p>
                                    <p className="text-white font-medium">{data?.company}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#71717A] mb-1">Status</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[data?.status as Status]?.bg} ${statusStyles[data?.status as Status]?.text} ${statusStyles[data?.status as Status]?.border}`}>
                                        {data?.status}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(255,255,255,0.08)]" />

                            {/* Metadata Row */}
                            <div className="flex items-center gap-6 text-sm text-[#A1A1AA]">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-[#71717A]" />
                                    <span>{data?.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-[#71717A]" />
                                    <span>{data?.location}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: COMPENSATION BREAKDOWN */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4">Compensation Breakdown</h3>
                        <div className="bg-[#1A1A1A] rounded-xl p-5">
                            <div className="space-y-4">
                                <RowItem label="Base Shoot Compensation" amount={data?.totalCompensation} />
                                <RowItem label="Editing Compensation" amount={data?.editingCompensation} />
                                <RowItem label="Travel Adjustment" amount={data?.travelAdjustment} />
                                <RowItem label="Bonus Compensation" amount={data?.bonusCompensation} />

                                <div className="h-px bg-[rgba(255,255,255,0.08)]" />

                                {/* Total Row */}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-white font-semibold text-base">Total Compensation</span>
                                    <span className="text-[#E5D0A6] font-bold text-[36px] leading-none">{data?.totalCompensation}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: PAYMENT BREAKDOWN */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4">Payment Breakdown</h3>
                        <div className="space-y-4">
                            {/* Advance Payment Card */}
                            <div className="bg-[rgba(0,208,132,0.12)] border border-[rgba(0,208,132,0.2)] rounded-xl p-5 flex justify-between items-start">
                                <div>
                                    <p className="text-[#00D084] font-medium text-sm">Advance Payment Received</p>
                                    <p className="text-[#A1A1AA] text-sm mt-1">Received on {data?.date}</p>
                                </div>
                                <p className="text-[#00D084] font-bold text-2xl">{data?.advancePaid}</p>
                            </div>

                            {/* Remaining Balance Card */}
                            <div className="bg-[rgba(255,90,95,0.12)] border border-[rgba(255,90,95,0.2)] rounded-xl p-5 flex justify-between items-start">
                                <div>
                                    <p className="text-[#FF5A5F] font-medium text-sm">Remaining Balance</p>
                                    <p className="text-[#A1A1AA] text-sm mt-1">Payable after shoot completion and finance approval</p>
                                </div>
                                <p className="text-[#FF5A5F] font-bold text-2xl">{data?.remainingBalance}</p>
                            </div>

                            {/* Payment Progress */}
                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-[#A1A1AA]">Payment Progress</span>
                                    <span className="text-sm text-white font-medium">25% Paid</span>
                                </div>
                                <div className="h-2 bg-[#202020] rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-[#00D084] rounded-full transition-all duration-500"
                                        style={{ width: '25%' }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#00D084]">$300 paid</span>
                                    <span className="text-[#FF5A5F]">$900 remaining</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-6 border-t border-[rgba(255,255,255,0.08)] shrink-0 bg-[#000000]">
                    <div className="flex gap-3">
                        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#1A1A1A] text-white font-medium hover:bg-[#202020] transition-colors duration-200">
                            <Download size={18} />
                            Download Payment Proof
                        </button>
                        <button
                            onClick={() => setShowPayoutTimeline(true)}
                            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-[#E5D0A6] text-[#111111] font-semibold hover:bg-[#d4bf96] transition-colors duration-200"
                        >
                            <Send size={18} />
                            View Payout Timeline
                        </button>
                    </div>
                </div>
            </div>

            {/* Payout Timeline Modal */}
            {showPayoutTimeline && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/75 backdrop-blur-[10px] z-50 transition-opacity duration-300"
                        onClick={() => setShowPayoutTimeline(false)}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-[24px] w-full max-w-[600px] max-h-[80vh] overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                                <h2 className="text-[28px] font-bold text-white tracking-tight">
                                    Payout Timeline
                                </h2>
                                <button
                                    onClick={() => setShowPayoutTimeline(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2A2424] hover:bg-[#3a3434] text-white transition-colors duration-200"
                                    aria-label="Close modal"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Timeline Content */}
                            <div className="p-8 overflow-y-auto max-h-[calc(80vh-110px)]">
                                <div className="space-y-4">
                                    {timelineItems.map((item, index) => (
                                        <div key={index} className="flex items-start gap-6">
                                            {/* Timeline Indicator */}
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${item.completed
                                                        ? 'bg-[#22C7A9] shadow-[0_0_12px_rgba(34,199,169,0.4)]'
                                                        : 'bg-[#2D2D2D]'
                                                        }`}
                                                >
                                                    {item.completed && (
                                                        <div className="w-[8px] h-[8px] rounded-full bg-[#22C7A9]" />
                                                    )}
                                                </div>
                                                {/* Vertical Line */}
                                                {index !== timelineItems.length - 1 && (
                                                    <div
                                                        className={`w-px h-10 mt-2 ${item.completed ? 'border-l border-dashed border-[#22C7A9]' : 'border-l border-dashed border-[#555555]'
                                                            }`}
                                                    />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className={`text-[14px] font-medium ${item.completed ? 'text-white' : 'text-[#A1A1AA]'}`}>
                                                        {item.title}
                                                    </p>
                                                </div>

                                                {/* Date */}
                                                {item.date && (
                                                    <div className="text-right ml-8">
                                                        <p className="text-[13px] text-[#71717A]">
                                                            {item.date}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// Reusable Row Component for Compensation Section
function RowItem({ label, amount }: { label: string; amount: string }) {
    return (
        <>
            <div className="flex justify-between items-center">
                <span className="text-sm text-[#A1A1AA]">{label}</span>
                <span className="text-white font-medium">{amount}</span>
            </div>
            <div className="h-px bg-[rgba(255,255,255,0.08)]" />
        </>
    );
}