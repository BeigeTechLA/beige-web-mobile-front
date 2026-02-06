"use client";

import React from 'react';
import { Camera, FileText, MessageSquare, TrendingUp } from 'lucide-react';

export default function SalesDashboard() {
  const stats = [
    { name: 'Total Shoots', value: '145', icon: Camera, change: '+12%', changeType: 'positive' },
    { name: 'Active Deals', value: '23', icon: TrendingUp, change: '+8%', changeType: 'positive' },
    { name: 'Documents', value: '89', icon: FileText, change: '+5%', changeType: 'positive' },
    { name: 'Messages', value: '156', icon: MessageSquare, change: '+18%', changeType: 'positive' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Sales Dashboard</h1>
        <p className="text-zinc-400">Overview of your sales activities and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#E5D5B8]/10 rounded-lg">
                <stat.icon className="w-6 h-6 text-[#E5D5B8]" />
              </div>
              <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">{stat.name}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 p-4 bg-[#0f0f0f] rounded-lg border border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-[#E5D5B8]/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#E5D5B8]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">New shoot booked</p>
                <p className="text-zinc-500 text-sm">Client: John Doe - Product Photography</p>
              </div>
              <span className="text-zinc-500 text-sm">2h ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
