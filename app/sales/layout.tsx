"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

import SalesSidebar from "@/components/sales/Sidebar";
import SalesTopbar from '@/components/sales/Topbar';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-screen bg-[#0f0f0f] text-white overflow-hidden">
            <SalesTopbar pathname={pathname} />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                <SalesSidebar />
                <main className="flex-1 overflow-y-auto p-6 lg:px-10 lg:py-9 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
