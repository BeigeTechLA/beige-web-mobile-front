"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type ShootStatus = "Initiated" | "Pre Production" | "Post Production" | "Revision" | "Completed";

interface ShootRecord {
    id: string;
    customerName: string;
    initials: string;
    date: string;
    category: string;
    price: string;
    status: ShootStatus;
}

const SHOOT_DATA: ShootRecord[] = [
    { id: "#123456", customerName: "Lana Guzman", initials: "LG", date: "Jan 13, 2026", category: "Videography", price: "$14,400", status: "Initiated" },
    { id: "#123456", customerName: "Riya Patel", initials: "RP", date: "Jan 13, 2026", category: "Photography", price: "$10,000", status: "Initiated" },
    { id: "#123456", customerName: "John Lee", initials: "JL", date: "Jan 13, 2026", category: "Video & Photo", price: "$5,000", status: "Pre Production" },
    { id: "#123456", customerName: "Dev Shah", initials: "DS", date: "Jan 13, 2026", category: "Photography", price: "$10,000", status: "Pre Production" },
    { id: "#123456", customerName: "Sara Kim", initials: "SK", date: "Jan 13, 2026", category: "Photography", price: "$10,000", status: "Pre Production" },
    { id: "#123456", customerName: "Maya Ross", initials: "MR", date: "Jan 13, 2026", category: "Video & Photo", price: "$5,000", status: "Initiated" },
    { id: "#123456", customerName: "Jacob Thompson", initials: "JT", date: "Jan 13, 2026", category: "Video & Photo", price: "$5,000", status: "Post Production" },
    { id: "#123456", customerName: "Sophia Johnson", initials: "SJ", date: "Jan 13, 2026", category: "Photography", price: "$5,000", status: "Revision" },
    { id: "#123456", customerName: "Daniel Roberts", initials: "DR", date: "Jan 13, 2026", category: "Videography", price: "$5,000", status: "Completed" },
    { id: "#123456", customerName: "Emily Davis", initials: "ED", date: "Jan 13, 2026", category: "Video & Photo", price: "$5,000", status: "Completed" },
    { id: "#123456", customerName: "Ethan Carter", initials: "EC", date: "Jan 13, 2026", category: "Video & Photo", price: "$5,000", status: "Initiated" },
];

const StatusBadge = ({ status }: { status: ShootStatus }) => {
    const styles = {
        Initiated: "bg-[#FFF9E5] text-[#B18A00]",
        "Pre Production": "bg-[#FDF4FF] text-[#C065F0]",
        "Post Production": "bg-[#EAEAEA] text-[#666666]",
        Revision: "bg-[#E6F0FF] text-[#3B82F6]",
        Completed: "bg-[#F0FFF4] text-[#22C55E]",
    };

    return (
        <span className={`px-6 py-2.5 rounded-full text-base font-medium leading-none ${styles[status]}`}>
            {status}
        </span>
    );
};

export const ShootsTable = () => {
    const router = useRouter();

    const handleRowClick = (id: string) => {
        // Remove the # from the ID for the URL
        const cleanId = id.replace('#', '');
        router.push(`/admin/shoots/${cleanId}`);
    };

    return (
        <div className="w-full bg-[#111111] rounded-2xl border border-[#333333] overflow-hidden" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            {/* Table Grid */}
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[#AAAAAA] text-base font-medium border-b border-[#333333] cursor-pointer leading-none tracking-normal">
                            <th className="py-5 px-6 font-medium">Shoot ID</th>
                            <th className="py-5 px-6 font-medium">Customer Name</th>
                            <th className="py-5 px-6 font-medium">Category</th>
                            <th className="py-5 px-6 font-medium">Price</th>
                            <th className="py-5 px-6 font-medium">Status</th>
                            <th className="py-5 px-6 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SHOOT_DATA.map((shoot, idx) => (
                            <tr
                                key={idx}
                                onClick={() => handleRowClick(shoot.id)}
                                className="border-b border-[#222222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                            >
                                {/* ID */}
                                <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.id}</td>

                                {/* Customer Info */}
                                <td className="py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-black font-semibold text-sm">
                                            {shoot.initials}
                                        </div>
                                        <div>
                                            <p className="text-[#E0E0E0] font-medium text-base leading-none tracking-normal">{shoot.customerName}</p>
                                            <p className="text-[#666666] text-xs mt-1.5">{shoot.date}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Category */}
                                <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.category}</td>

                                {/* Price */}
                                <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.price}</td>

                                {/* Status */}
                                <td className="py-5 px-6">
                                    <StatusBadge status={shoot.status} />
                                </td>

                                {/* Action */}
                                <td className="py-5 px-6 text-right">
                                    <button className="text-white hover:text-white transition-colors">
                                        <ChevronRight size={20} className="text-[#666666]" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
