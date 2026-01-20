"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Eye, UserPlus, MoreVertical } from 'lucide-react';
import { SalesLead } from '@/types/sales';
import LeadStatusBadge from './LeadStatusBadge';
import { LEAD_TYPE_LABELS } from '@/types/sales';
import { formatCurrency } from '@/lib/utils/discountHelpers';

interface LeadsTableProps {
  leads: SalesLead[];
  isLoading?: boolean;
  onAssignClick?: (leadId: number) => void;
}

export default function LeadsTable({ leads, isLoading, onAssignClick }: LeadsTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof SalesLead>('last_activity_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof SalesLead) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    return 0;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    }
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-[#171717] rounded-xl border border-white/10 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]"></div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-[#171717] rounded-xl border border-white/10 p-8 text-center">
        <p className="text-white/60">No leads found</p>
      </div>
    );
  }

  return (
    <div className="bg-[#171717] rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('client_name')}
              >
                Client
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('lead_type')}
              >
                Type
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('lead_status')}
              >
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Booking
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Assigned To
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('last_activity_at')}
              >
                Last Activity
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedLeads.map((lead) => (
              <tr key={lead.lead_id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {lead.client_name || 'N/A'}
                    </div>
                    <div className="text-sm text-white/60">
                      {lead.guest_email || lead.booking?.stream_project_booking_id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white/80">
                    {LEAD_TYPE_LABELS[lead.lead_type]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <LeadStatusBadge status={lead.lead_status} />
                </td>
                <td className="px-6 py-4">
                  {lead.booking ? (
                    <div className="text-sm">
                      <div className="text-white font-medium truncate max-w-xs">
                        {lead.booking.project_name}
                      </div>
                      <div className="text-white/60 flex items-center gap-2">
                        {lead.booking.event_type && (
                          <span className="capitalize">{lead.booking.event_type}</span>
                        )}
                        {lead.booking.budget && (
                          <span>• {formatCurrency(lead.booking.budget)}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-white/60">No booking</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.assigned_sales_rep ? (
                    <div className="text-sm">
                      <div className="text-white">{lead.assigned_sales_rep.name}</div>
                      <div className="text-white/60 text-xs">{lead.assigned_sales_rep.email}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAssignClick?.(lead.lead_id)}
                      className="inline-flex items-center gap-1 text-sm text-[#E8D1AB] hover:text-[#dcb98a] transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                  {formatDate(lead.last_activity_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/sales/leads/${lead.lead_id}`}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="More Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
