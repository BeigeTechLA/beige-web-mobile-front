"use client";

import React from 'react';
import { useRouter, usePathname } from "next/navigation";
import { UserManagementTabbed } from '@/components/admin/users/UserManagementTabbed';
import Topbar from "@/components/admin/Topbar";
import { ArrowUpToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AllUsersPage() {
    const router = useRouter();
    const pathname = usePathname();
    return (
        <>
            <Topbar pathname={pathname}
                actions={
                    <>
                        {/* Need to add search bar, filters  */}
                        <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
                            <ArrowUpToLine /> Export
                        </Button>
                        <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7">
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
