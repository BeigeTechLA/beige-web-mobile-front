"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { UserManagementTabbed } from '@/components/admin/users/UserManagementTabbed';
import Topbar from "@/components/admin/Topbar";
import { ArrowUpToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { usePermissions } from "@/lib/hooks/usePermissions";

export default function AllUsersPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { canCreate } = usePermissions("shoots");

    useEffect(() => setMounted(true), []);

    const isDark = !mounted || theme === "dark";

    return (
        <>
            <Topbar pathname={pathname}
                actions={
                    <>
                        {/* Need to add search bar, filters  */}
                        <Button className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg ${isDark ? "text-white bg-[#202020] border-white/20 hover:bg-white/10" : "text-[#323232] bg-[#F0F0F0] border-[#E3E3E3] hover:bg-[#E3E3E3]"} border transition-colors `}>
                            <ArrowUpToLine /> Export
                        </Button>
                        <Button
                            onClick={() => router.push("/book-a-shoot")}
                            disabled={!canCreate}
                            title={canCreate ? "Book a Shoot" : "Create permission not allowed"}
                            className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7"
                        >
                            Book a Shoot
                        </Button>
                    </>
                }
            />

            <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
                <UserManagementTabbed />
            </div>
        </>
    );
}
