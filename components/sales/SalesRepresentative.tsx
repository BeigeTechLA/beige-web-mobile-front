"use client";

import React from 'react';
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react';

export default function SalesRepresentative() {
    const stats = [
        { name: 'Active Users', value: '48', icon: Users, change: '+12%', changeType: 'positive' },
        { name: 'Total Revenue', value: '$127K', icon: DollarSign, change: '+23%', changeType: 'positive' },
        { name: 'Conversion Rate', value: '68%', icon: TrendingUp, change: '+5%', changeType: 'positive' },
        { name: 'Awards Won', value: '12', icon: Award, change: '+3', changeType: 'positive' },
    ];

    const clients = [
        { name: 'Tech Corp', revenue: '$45K', shoots: 12, status: 'Active' },
        { name: 'Fashion Brand', revenue: '$32K', shoots: 8, status: 'Active' },
        { name: 'Food Co', revenue: '$28K', shoots: 6, status: 'Pending' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Sales Representative</h1>
                <p className="text-zinc-400">Track your performance and manage user relationships</p>
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

            {/* User List */}
            <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Top Users</h2>
                <div className="space-y-4">
                    {clients.map((client) => (
                        <div
                            key={client.name}
                            className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#E5D5B8]/20 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-[#E5D5B8]" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{client.name}</p>
                                    <p className="text-zinc-500 text-sm">{client.shoots} shoots completed</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-semibold">{client.revenue}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${client.status === 'Active'
                                        ? 'bg-green-500/10 text-green-500'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                    {client.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
