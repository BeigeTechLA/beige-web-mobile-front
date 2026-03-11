"use client";

import React, { use } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useGetLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";
import EditBookingForm from "@/components/admin/EditBookingForm";
import Topbar from "@/components/admin/Topbar";

export default function EditBookingPage() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const leadId = params.id as string;

    // Fetch lead data for pre-population
    const { data: leadData, isLoading: isLeadLoading } = useGetLeadByIdQuery(parseInt(leadId), {
        skip: !leadId,
    });

    if (isLeadLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#101010]">
                <Loader2 className="animate-spin text-white/50" size={40} />
            </div>
        );
    }

    if (!leadData) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#101010] text-white">
                <p>Lead not found.</p>
            </div>
        );
    }

    return (
        <>
            <Topbar pathname={pathname} />
            <div className="bg-[#101010] min-h-screen">
                <EditBookingForm
                    leadId={leadId}
                    initialBookingData={leadData}
                    onSuccess={() => router.back()}
                    onCancel={() => router.back()}
                />
            </div>
        </>
    );
}
