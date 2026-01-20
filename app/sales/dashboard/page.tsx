"use client";

import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Link as LinkIcon } from 'lucide-react';
import { useGetDashboardStatsQuery, useGetRecentActivitiesQuery } from '@/lib/redux/features/sales/salesApi';
import LeadStatusBadge from '@/components/sales/LeadStatusBadge';
import { ACTIVITY_TYPE_LABELS } from '@/types/sales';
import { formatCurrency, calculatePercentage } from '@/lib/utils/discountHelpers';

export default function SalesDashboardPage() {
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery({ period });
  const { data: activitiesData, isLoading: activitiesLoading } = useGetRecentActivitiesQuery({ limit: 10 });

  const stats = statsData?.overview;
  const leadsByStatus = statsData?.leads_by_status;

  const formatDate = (dateString: string) => {
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sales Dashboard</h1>
          <p className="text-white/60">Track your leads and performance</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 bg-[#171717] rounded-lg p-1">
          {(['7days', '30days', '90days'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-[#E8D1AB] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB]"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Leads */}
            <div className="bg-[#171717] rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-sm text-white/60">{period === '7days' ? '7d' : period === '30days' ? '30d' : '90d'}</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{stats?.total_leads || 0}</p>
                <p className="text-sm text-white/60">Total Leads</p>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-[#171717] rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                {stats && stats.conversion_rate > 0 && (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{stats?.conversion_rate || 0}%</p>
                <p className="text-sm text-white/60">Conversion Rate</p>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-[#171717] rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#E8D1AB]/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-[#E8D1AB]" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(stats?.total_revenue || 0)}
                </p>
                <p className="text-sm text-white/60">Total Revenue</p>
              </div>
            </div>

            {/* Booked Leads */}
            <div className="bg-[#171717] rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{stats?.booked_leads || 0}</p>
                <p className="text-sm text-white/60">Booked Leads</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leads by Status */}
            <div className="lg:col-span-2 bg-[#171717] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Leads by Status</h2>
              <div className="space-y-4">
                {leadsByStatus && Object.entries(leadsByStatus).map(([status, count]) => {
                  const total = stats?.total_leads || 1;
                  const percentage = calculatePercentage(count as number, total);
                  
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <LeadStatusBadge status={status as any} />
                        </div>
                        <span className="text-sm text-white/60">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#272626] rounded-full h-2">
                        <div
                          className="bg-[#E8D1AB] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-[#171717] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Quick Stats</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/60 mb-1">Self-Serve Leads</p>
                  <p className="text-2xl font-bold text-white">{stats?.self_serve_leads || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-1">Sales-Assisted Leads</p>
                  <p className="text-2xl font-bold text-white">{stats?.sales_assisted_leads || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-1">Completed Bookings</p>
                  <p className="text-2xl font-bold text-white">{stats?.completed_bookings || 0}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-1">Discount Codes</p>
                  <p className="text-2xl font-bold text-white">
                    {statsData?.discount_codes?.active || 0} / {statsData?.discount_codes?.total || 0}
                  </p>
                  <p className="text-xs text-white/50 mt-1">Active / Total</p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-1">Payment Links</p>
                  <p className="text-2xl font-bold text-white">
                    {statsData?.payment_links?.used || 0} / {statsData?.payment_links?.total || 0}
                  </p>
                  <p className="text-xs text-white/50 mt-1">Used / Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="mt-6 bg-[#171717] rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Recent Activities</h2>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {activitiesData?.activities?.map((activity) => (
                  <div
                    key={activity.activity_id}
                    className="flex items-start gap-4 p-4 bg-[#272626] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {activity.lead?.client_name || activity.lead?.guest_email || 'Unknown Client'}
                        </span>
                        <span className="text-white/60">•</span>
                        <span className="text-sm text-white/60">
                          {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                        </span>
                      </div>
                      {activity.lead && (
                        <LeadStatusBadge status={activity.lead.lead_status} className="mt-2" />
                      )}
                    </div>
                    <span className="text-sm text-white/50">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                ))}
                {(!activitiesData?.activities || activitiesData.activities.length === 0) && (
                  <p className="text-center text-white/60 py-8">No recent activities</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
