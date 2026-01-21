import React from 'react';
import { CreativePartnerProfile } from '@/components/admin/users/CreativePartnerProfile';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CreativePartnerDetailsPage({ params }: PageProps) {
    const { id } = await params;
    return (
        <div className="space-y-6">
            <CreativePartnerProfile id={id} />
        </div>
    );
}
