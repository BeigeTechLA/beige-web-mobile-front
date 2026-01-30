import React from 'react';
import SalesShootsTable from '@/components/sales/SalesShootsTable';
import { Calendar } from 'lucide-react';

export default function SalesShootsPage() {
    return (
        <div className="space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-[32px] font-semibold text-white mb-2 leading-none">Shoots Management</h1>
                    <p className="text-[#888888] text-sm lg:text-base leading-none">Track and manage your photography and videography project</p>
                </div>
                <button className="flex items-center gap-3 bg-transparent border border-[#333333] text-[#E0E0E0] px-6 py-3 rounded-full hover:bg-[#222222] transition-colors group">
                    <span className="text-base font-medium leading-none">Sort by Date</span>
                    <Calendar size={18} className="text-[#888888] group-hover:text-white transition-colors" />
                </button>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-dashed border-t border-dashed border-[#333333] opacity-50" />

            <SalesShootsTable />
        </div>
    );
}
