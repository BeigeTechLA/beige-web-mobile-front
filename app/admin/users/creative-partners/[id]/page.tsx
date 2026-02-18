"use client";

import React from 'react';
import { useRouter, usePathname } from "next/navigation";
import { CreativePartnerProfile } from '@/components/admin/users/CreativePartnerProfile';
import Topbar from "@/components/admin/Topbar";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CreativePartnerDetailsPage({ params }: PageProps) {
    const router = useRouter();
    const pathname = usePathname();

    const { id } = await params;
    return (
    <>
        <Topbar pathname={pathname} />

        <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
            <CreativePartnerProfile id={id} />
        </div>
    </>
    );
}
