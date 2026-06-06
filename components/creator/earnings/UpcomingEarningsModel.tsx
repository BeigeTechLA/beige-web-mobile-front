'use client';

import { Calendar, MapPin, Clock, Eye, Check, X, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import EarningsBreakdownModel from './EarningsBreakdownModel';

type Status = 'Partially Paid' | 'Awaiting Response' | 'Accepted';

interface EarningCardProps {
    title: string;
    company: string;
    status: Status;
    date: string;
    location: string;
    time: string;
    totalCompensation: string;
    advancePaid: string;
    remainingBalance: string;
}

const statusStyles: Record<Status, { bg: string; text: string; border: string }> = {
    'Partially Paid': { bg: 'bg-[#E0E7FF]', text: 'text-[#372AAc]', border: 'border-[#c6d2ff]' },
    'Awaiting Response': { bg: 'bg-[#FEF9C2]', text: 'text-[#894B00]', border: 'border-[#FFF085]' },
    Accepted: { bg: 'bg-[#DBEAFE]', text: 'text-[#193CB8]', border: 'border-[#BEDBFF]' },
};


const EarningCard = ({
    title,
    company,
    status,
    date,
    location,
    time,
    totalCompensation,
    advancePaid,
    remainingBalance,
}: EarningCardProps) => {
    const isAwaiting = status === 'Awaiting Response';
    const initials = title
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewEarnings = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);



    return (
        <div className="bg-[#0B0B0B] border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
            {/* Top Section */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-white font-semibold text-base">{title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status].bg} ${statusStyles[status].text}`}>
                            {status}
                        </span>
                    </div>
                    <p className="text-[#8A8A8A] text-sm mt-0.5">{company}</p>
                </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#8A8A8A]">
                <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {date}
                </span>
                <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {location}
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {time}
                </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/8 w-full" />

            {/* Compensation Section */}
            <div className="flex items-center justify-between">
                <span className="text-[#8A8A8A] text-sm">Total Compensation</span>
                <span className="text-[#E5D0A6] text-xl font-bold">{totalCompensation}</span>
            </div>

            {/* Payment Breakdown */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[rgba(0,208,132,0.12)] rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[#00D084] text-xs font-medium">Advance Paid</span>
                    <span className="text-[#00D084] font-semibold text-sm">{advancePaid}</span>
                </div>
                <div className="bg-[rgba(255,77,79,0.12)] rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[#FF4D4F] text-xs font-medium">Remaining Balance</span>
                    <span className="text-[#FF4D4F] font-semibold text-sm">{remainingBalance}</span>
                </div>
            </div>

            {/* Action Buttons */}
            {isAwaiting ? (
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                        onClick={() => alert('Earnings accepted!')}
                        className="flex items-center justify-center gap-2 bg-[#E5D0A6] text-[#0B0B0B] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#d4c096] transition-colors"
                    >
                        <Check size={14} />
                        Accept
                    </button>
                    <button
                        onClick={() => alert('Earnings declined!')}
                        className="flex items-center justify-center gap-2 bg-[#FF4D4F] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#e03e40] transition-colors"
                    >
                        <X size={14} />
                        Decline
                    </button>
                    <button
                        onClick={handleViewEarnings}
                        className="flex items-center justify-center gap-2 bg-[#1A1A1A] border border-white/10 text-[#E5D0A6] rounded-xl py-2.5 text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                        <Eye size={14} />
                        View Earnings
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleViewEarnings}
                    className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] border border-white/10 text-[#E5D0A6] rounded-xl py-2.5 text-sm font-medium hover:bg-white/5 transition-colors mt-2"
                >
                    <Eye size={14} />
                    View Earnings
                </button>
            )}

            <EarningsBreakdownModel
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                data={{
                    title,
                    company,
                    status,
                    date,
                    location,
                    time,
                    totalCompensation,
                    advancePaid,
                    remainingBalance,
                }}
            />
        </div>
    );
};

const mockEarnings: EarningCardProps[] = [
    {
        title: 'Nike Campaign Shoot',
        company: 'Nike Inc.',
        status: 'Partially Paid',
        date: 'Jan 16, 2026',
        location: 'Los Angeles, CA',
        time: '12:00 PM - 4:00 PM',
        totalCompensation: '$1,200',
        advancePaid: '$300',
        remainingBalance: '$1,250',
    },
    {
        title: 'Nike Campaign Shoot',
        company: 'Nike Inc.',
        status: 'Awaiting Response',
        date: 'Jan 16, 2026',
        location: 'Los Angeles, CA',
        time: '12:00 PM - 4:00 PM',
        totalCompensation: '$1,200',
        advancePaid: '$300',
        remainingBalance: '$1,250',
    },
    {
        title: 'Nike Campaign Shoot',
        company: 'Nike Inc.',
        status: 'Accepted',
        date: 'Jan 16, 2026',
        location: 'Los Angeles, CA',
        time: '12:00 PM - 4:00 PM',
        totalCompensation: '$1,200',
        advancePaid: '$300',
        remainingBalance: '$1,250',
    },
    {
        title: 'Nike Campaign Shoot',
        company: 'Nike Inc.',
        status: 'Accepted',
        date: 'Jan 16, 2026',
        location: 'Los Angeles, CA',
        time: '12:00 PM - 4:00 PM',
        totalCompensation: '$1,200',
        advancePaid: '$300',
        remainingBalance: '$1,250',
    },
];

export default function UpcomingEarningsModel() {
    return (
        <div className="bg-[#111111] border border-white/8 rounded-2xl p-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#E5D0A6] rounded-full" />
                    <h2 className="text-lg font-semibold text-white">Upcoming Earnings</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-full text-[#8A8A8A] hover:text-white transition-colors text-xs">
                        Status
                        <ChevronDown size={12} />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-full text-[#8A8A8A] hover:text-white transition-colors text-xs">
                        Month
                        <ChevronDown size={12} />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-full text-[#8A8A8A] hover:text-white transition-colors text-xs">
                        All
                        <ChevronDown size={12} />
                    </button>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6A6A6A]" size={18} />
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full h-12 pl-11 pr-4 bg-[#0B0B0B] border border-white/8 rounded-xl text-white placeholder-[#6A6A6A] focus:outline-none focus:border-[#E5D0A6]/50 transition-colors text-sm"
                />
            </div>

            {/* Earnings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockEarnings.map((earning, index) => (
                    <EarningCard key={index} {...earning} />
                ))}
            </div>
        </div>
    );
}