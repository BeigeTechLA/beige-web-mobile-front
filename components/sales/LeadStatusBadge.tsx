"use client";

import { LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types/sales';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export default function LeadStatusBadge({ status, className = '' }: LeadStatusBadgeProps) {
  const label = LEAD_STATUS_LABELS[status];
  const colorClass = LEAD_STATUS_COLORS[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
