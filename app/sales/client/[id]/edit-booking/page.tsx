"use client";

import React from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useGetLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";
import EditBookingForm from "@/components/admin/EditBookingForm";
import Topbar from "@/components/admin/Topbar";
import { Loader2 } from "lucide-react";

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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
