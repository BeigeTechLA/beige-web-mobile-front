"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { ShootsTable } from '@/components/production-manager/ShootsTable';
import { SortDateButton } from '@/components/production-manager/SortDateButton';
import { Button } from '@/src/components/landing/ui/button';
import { useRouter } from 'next/navigation';
import DottedDivider from '@/components/admin/DottedDivider';

export default function ShootsPage() {
    const router = useRouter()
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const handleDateSort = (date: Date | null) => {
        setSelectedDate(date);
        if (date) {
            console.log(date);
        } else {
            console.log("unfiltered");
        }
    };

    // Constant default to dark
    const isDark = !mounted || theme === "dark";

    return (
        <div className="space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            {/* Header */}
            <div className="flex justify-between items-start lg:items-end mb-4 lg:mb-9">
                <div>
                    <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
                        }`}>Shoots Management</h1>
                    <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"
                        }`}>Track and manage your photography and videography project</p>
                </div>
                <SortDateButton
                    selectedDate={selectedDate}
                    onDateChange={handleDateSort}
                />
            </div>

            {/* Divider */}
            {/* <DottedDivider /> */}

            <ShootsTable externalSelectedDate={selectedDate} />

            {/* --- FLOATING MOBILE BUTTON --- */}
            <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
                }`}>
                <Button
                    onClick={() => router.push('/book-a-shoot')}
                    className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
                >
                    Book a Shoot
                </Button>
            </div>
        </div>
    );
}
