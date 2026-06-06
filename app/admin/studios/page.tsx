// app/admin/studios/page.tsx
// Static UI
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ArrowUpToLine, Plus, Calendar, ChevronDown } from 'lucide-react';
import OverviewModel from '@/components/admin/studios/OverViewModel';
import OverallBookingsModel from '@/components/admin/studios/OverallBookingsModel';
import EarningsLedgerModel from '@/components/admin/studios/EarningsLedgerModel';
import Topbar from '@/components/admin/Topbar';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { SortDateButton } from '@/components/admin/SortDateButton';

export default function StudioManagementPage() {

    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    const pathname = usePathname();

    const isDark = !mounted || theme === "dark";
    const [activeTab, setActiveTab] = useState<'operations' | 'myStudios' | 'studioRequests'>('operations');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);


    const handleDateSort = (date: Date | null) => {
        setSelectedDate(date);
    };

    return (
        <>
            {/* Top Toolbar */}
            < Topbar pathname={pathname} actions={
                < div className="flex items-center gap-3" >
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
                        <input
                            type="text"
                            placeholder="Search Studio by name or shoot..."
                            className="w-[320px] h-10 pl-10 pr-4 bg-[#111111] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#E5D0A6]/50"
                        />
                    </div>

                    <Button className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
                        All Status
                        <ChevronDown className="w-4 h-4" />
                    </Button>

                    <Button className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
                        <ArrowUpToLine className="w-4 h-4" />
                        Export
                    </Button>

                    <Button className="flex items-center gap-2 px-4 py-2 bg-[#E5D0A6] text-[#111111] rounded-lg text-sm font-semibold hover:bg-[#d4c096] transition-colors">
                        <Plus className="w-4 h-4" />
                        Create or Add Studio
                    </Button>
                </div >
            } />

            < div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6" >

                {/* Main Content */}
                <div className={`space-y-6 font-instrument-sans transition-colors duration-300`}>
                    {/* Page Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Studio Management</h1>
                            <p className="text-sm text-white/60">Manage availability, bookings, and studio operations in one place.</p>
                        </div>

                        <SortDateButton selectedDate={selectedDate} onDateChange={handleDateSort} />
                        {/* <button className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-full text-sm text-white hover:bg-white/5 transition-colors">
                        Sort by Date
                        <Calendar className="w-4 h-4" />
                    </button> */}
                    </div>

                    {/* Dotted Divider */}
                    <div className="border-t border-dashed border-white/10" />

                    {/* Tabs */}
                    <div className="flex gap-1 bg-[#111111] p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab('operations')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'operations'
                                ? 'bg-[#E5D0A6] text-[#111111]'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Operations
                        </button>
                        <button
                            onClick={() => setActiveTab('myStudios')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'myStudios'
                                ? 'bg-[#E5D0A6] text-[#111111]'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            My Studios
                        </button>
                        <button
                            onClick={() => setActiveTab('studioRequests')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'studioRequests'
                                ? 'bg-[#E5D0A6] text-[#111111]'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Studio Requests
                        </button>
                    </div>

                    {/* Overview */}
                    <OverviewModel />

                    {/* Overall Bookings */}
                    <OverallBookingsModel />

                    {/* Earnings Ledger */}
                    <EarningsLedgerModel />
                </div>
            </div >
        </>
    );
}