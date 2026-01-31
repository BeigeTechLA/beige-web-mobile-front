"use client";
import React, { useState } from 'react';
import { ShootsTable } from '@/components/admin/ShootsTable';
import { Calendar } from 'lucide-react';
import { SortDateButton } from '@/components/admin/SortDateButton';

export default function ShootsPage() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const handleDateSort = (date: Date | null) => {
        setSelectedDate(date);
        if (date) {
            console.log(date);
        } else {
            console.log("unfiltered");
        }
    };

    return (
        <div className="space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-[32px] font-semibold text-white mb-2 leading-none">Shoots Management</h1>
                    <p className="text-[#888888] text-sm lg:text-base leading-none">Track and manage your photography and videography project</p>
                </div>
                <SortDateButton
                    selectedDate={selectedDate}
                    onDateChange={handleDateSort}
                />
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-dashed border-t border-dashed border-[#333333] opacity-50" />

            <ShootsTable externalSelectedDate={selectedDate} />
        </div>
    );
}
