import React from 'react';
import { UserManagementTabbed } from '@/components/admin/users/UserManagementTabbed';

export default function AllUsersPage() {
    return (
        <div className="space-y-6">
            <UserManagementTabbed />
        </div>
    );
}
