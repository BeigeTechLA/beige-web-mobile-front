"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";

import Sidebar from "@/components/production-manager/Sidebar";
import Topbar from '@/components/production-manager/Topbar';

export default function ProductionManagerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-[#0f0f0f] text-white overflow-hidden">
            <Topbar pathname={pathname} onMenuClick={() => setMobileOpen(true)} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block h-full">
                    <Sidebar />
                </div>

                {/* Mobile Sidebar (Drawer) */}
                <AnimatePresence>
                    {mobileOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
                            />
                            {/* Drawer */}
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed top-0 left-0 bottom-0 w-[280px] z-[80] lg:hidden"
                            >
                                <Sidebar onClose={() => setMobileOpen(false)} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 lg:px-10 lg:py-9 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
