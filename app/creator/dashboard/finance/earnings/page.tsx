'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import OverviewModel from '@/components/creator/earnings/OverviewModel';
import UpcomingEarningsModel from '@/components/creator/earnings/UpcomingEarningsModel';
import Topbar from '@/components/creator/Topbar';
import { ArrowUpToLine, CalendarDays, Plus } from 'lucide-react';
import { SortDateButton } from '@/components/admin/SortDateButton';
import { useTheme } from 'next-themes';
import RaiseDisputeModal from '@/components/creator/RaiseDisputeModal';

export default function EarningsPage() {
    const pathname = usePathname();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

    const handleDisputeSubmit = (data: any) => {
        console.log('Dispute submitted:', data);
        setIsDisputeModalOpen(false);
    };
    const handleDateSort = (date: Date | undefined) => {
        setSelectedDate(date);
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = !mounted || theme === "dark";
    const topbarActions = (
        <div className="flex items-center gap-3 flex-wrap">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium">
                <ArrowUpToLine size={16} />
                Export
            </button>
            <button
                onClick={() => setIsDisputeModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E5D0A6] text-[#0B0B0B] rounded-xl hover:bg-[#d4c096] transition-colors text-sm font-semibold">
                <Plus size={16} />
                Raise New Dispute
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white">
            <Topbar
                pathname={pathname}
                title="Earnings Dashboard"
                breadcrumbOverrides={{
                    finance: 'Finances',
                    earnings: 'My Earnings',
                }}
                actions={topbarActions}
            />

            <div className="px-6 lg:px-10 pt-6 pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div>
                        <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>Earning Dashboard</h1>
                        <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
                            Monitor upcoming earnings, track payment status, and view detailed compensation breakdowns for your shoots.
                        </p>
                    </div>


                    <div className="flex items-center gap-3">
                        <SortDateButton
                            selectedDate={selectedDate}
                            onDateChange={handleDateSort}
                        />
                    </div>
                </div>
            </div>

            <main className="px-6 py-8 lg:px-10 space-y-6">
                <OverviewModel />
                <UpcomingEarningsModel />
            </main>

            <RaiseDisputeModal
                open={isDisputeModalOpen}
                onOpenChange={setIsDisputeModalOpen}
                onSubmit={handleDisputeSubmit}
                loading={false}
                isEdit={false}
            />
        </div>
    );
}


<div data-state="open" class="" data-aria-hidden="true" aria-hidden="true" style="pointer-events: auto;"></div>