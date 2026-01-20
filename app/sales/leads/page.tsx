"use client";

import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useGetLeadsQuery } from '@/lib/redux/features/sales/salesApi';
import LeadsTable from '@/components/sales/LeadsTable';
import { LeadStatus, LeadType } from '@/types/sales';

export default function LeadsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');

  const { data, isLoading, isFetching } = useGetLeadsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    lead_type: typeFilter || undefined,
    assigned_to: assignedToFilter || undefined,
  });

  const leads = data?.leads || [];
  const pagination = data?.pagination;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
          <p className="text-white/60">Manage and track all your sales leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#171717] rounded-xl p-6 border border-white/10 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="in_progress_self_serve">In Progress (Self-Serve)</option>
            <option value="in_progress_sales_assisted">In Progress (Sales Assisted)</option>
            <option value="payment_link_sent">Payment Link Sent</option>
            <option value="discount_applied">Discount Applied</option>
            <option value="booked">Booked</option>
            <option value="abandoned">Abandoned</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
          >
            <option value="">All Types</option>
            <option value="self_serve">Self-Serve</option>
            <option value="sales_assisted">Sales Assisted</option>
          </select>

          {/* Assigned To Filter */}
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
          >
            <option value="">All Assignments</option>
            <option value="unassigned">Unassigned</option>
            {/* TODO: Populate with actual sales reps */}
          </select>
        </div>

        {/* Active Filters Count */}
        {(search || statusFilter || typeFilter || assignedToFilter) && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-white/60">Active filters:</span>
            {search && (
              <span className="px-3 py-1 bg-[#E8D1AB]/20 text-[#E8D1AB] rounded-full text-sm">
                Search: {search}
              </span>
            )}
            {statusFilter && (
              <span className="px-3 py-1 bg-[#E8D1AB]/20 text-[#E8D1AB] rounded-full text-sm">
                Status
              </span>
            )}
            {typeFilter && (
              <span className="px-3 py-1 bg-[#E8D1AB]/20 text-[#E8D1AB] rounded-full text-sm">
                Type
              </span>
            )}
            {assignedToFilter && (
              <span className="px-3 py-1 bg-[#E8D1AB]/20 text-[#E8D1AB] rounded-full text-sm">
                Assignment
              </span>
            )}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTypeFilter('');
                setAssignedToFilter('');
              }}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <LeadsTable leads={leads} isLoading={isLoading || isFetching} />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-white/60">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-[#171717] text-white rounded-lg border border-white/10 hover:bg-[#272626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-[#E8D1AB] text-black'
                        : 'bg-[#171717] text-white border border-white/10 hover:bg-[#272626]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 bg-[#171717] text-white rounded-lg border border-white/10 hover:bg-[#272626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
