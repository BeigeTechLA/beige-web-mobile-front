"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import StudiosTabs from "@/components/admin/studios/StudiosTabs";
import StudioListing from "@/components/admin/studios/StudioListing";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import DottedDivider from "@/components/admin/DottedDivider";

export default function MyStudiosPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";
    const pathname = usePathname();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    return (
        <>
            <Topbar
                pathname={pathname}
                actions={
                    <Button className="bg-[#E5D5B8] text-black text-sm font-medium"
                        onClick={() => router.push('/admin/studios/add')}
                    >
                        Create or Add Studio
                    </Button>
                }
            />

            <div className="p-4 lg:p-6 lg:px-10 lg:py-9 overflow-hidden">
                {/* Page Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className={`text-lg lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-[#101010]"}`}>
                            Studio Management
                        </h1>
                        <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>
                            Manage availability, bookings, and studio operations in one place.
                        </p>
                    </div>
                  <SortDateButton
  selectedDate={selectedDate}
  onDateChange={(date) => setSelectedDate(date)}
/>
                </div>
                <DottedDivider />

                {/* Tabs */}
                <StudiosTabs />

                {/* Content */}
                <div className="mt-6">
                    <StudioListing />
                </div>
            </div>
        </>
    );
}