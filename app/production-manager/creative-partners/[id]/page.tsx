"use client";

import { useParams } from "next/navigation";
import { PMCreativePartnerProfile } from "@/components/production-manager/users/PMCreativePartnerProfile";

export default function CreativePartnerDetailPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="p-4 lg:p-8">
            <PMCreativePartnerProfile id={id} />
        </div>
    );
}
