// components/admin/studios/EarningsLedgerModel.tsx
// Static UI
'use client';

import { ChevronDown } from 'lucide-react';

const ledgerData = [
    {
        date: 'Feb 8, 2026',
        studioName: 'Sunset Creative Studio',
        bookingId: '#B-12345',
        hours: '5h',
        baseRevenue: '$425.00',
        overtime: '+$100.00',
        platformFee: '-$42.50',
        netEarnings: '$482.50',
    },
    {
        date: 'Feb 5, 2026',
        studioName: 'Hollywood Production Hub',
        bookingId: '#B-12345',
        hours: '6h',
        baseRevenue: '$900.00',
        overtime: '--',
        platformFee: '-$90.00',
        netEarnings: '$810.00',
    },
];

export default function EarningsLedgerModel() {
    return (
        <div className="bg-[#111111] border border-white/8 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#E5D0A6] rounded-full" />
                    <h2 className="text-lg font-semibold text-white">Earnings Ledger</h2>
                </div>
                <div className="flex items-center gap-2">
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

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/8">
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Studio Name</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Booking ID</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Hours</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Base Revenue</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Overtime</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Platform Fee</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-white/60 bg-white/[0.02]">Net Earnings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledgerData.map((row, index) => (
                            <tr key={index} className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                                <td className="py-4 px-4 text-sm text-white">{row.date}</td>
                                <td className="py-4 px-4 text-sm text-white">{row.studioName}</td>
                                <td className="py-4 px-4 text-sm text-white/70">{row.bookingId}</td>
                                <td className="py-4 px-4 text-sm text-white/70">{row.hours}</td>
                                <td className="py-4 px-4 text-sm text-white">{row.baseRevenue}</td>
                                <td className="py-4 px-4 text-sm">
                                    <span className={row.overtime === '--' ? 'text-white/40' : 'text-[#F59E0B]'}>
                                        {row.overtime}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-sm text-[#FF5A5F]">{row.platformFee}</td>
                                <td className="py-4 px-4 text-sm font-medium text-white">{row.netEarnings}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}