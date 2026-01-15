"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight, ChevronDown } from "lucide-react";

type ShootStatus = "Pending" | "Pre Production" | "Completed" | "Rejected";

interface ShootRecord {
  id: string;
  customerName: string;
  customerImage: string;
  date: string;
  category: string;
  price: string;
  status: ShootStatus;
}

const SHOOT_DATA: ShootRecord[] = [
  { id: "#123456", customerName: "Lana Guzman", customerImage: "/images/crew/CREW(2).png", date: "Jan 13, 2026", category: "Videography", price: "$14,400", status: "Pending" },
  { id: "#123456", customerName: "Riya Patel", customerImage: "/images/crew/CREW(1).png", date: "Jan 13, 2026", category: "Photography", price: "$10,000", status: "Pending" },
  { id: "#123456", customerName: "John Lee", customerImage: "/images/crew/CREW(3).png", date: "Jan 13, 2026", category: "Video & Photo", price: "$5,000", status: "Pre Production" },
  { id: "#123456", customerName: "Dev Shah", customerImage: "/images/crew/CREW(4).png", date: "Jan 13, 2026", category: "Photography", price: "$10,000", status: "Pre Production" },
  { id: "#123456", customerName: "Sara Kim", customerImage: "/images/crew/CREW(5).png", date: "Jan 13, 2026", category: "Photography", price: "$10,000", status: "Pre Production" },
  { id: "#123456", customerName: "Maya Ross", customerImage: "/images/crew/CREW(6).png", date: "Jan 13, 2026", category: "Video & Photo", price: "$5,000", status: "Pending" },
];

const StatusBadge = ({ status }: { status: ShootStatus }) => {
  const styles = {
    Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    "Pre Production": "bg-[#FDF4FF] text-[#C065F0] border-[#C065F0]/20",
    Completed: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
    Rejected: "bg-[#FFF5F5] text-[#EF4444] border-[#EF4444]/20",
  };

  return (
    <span className={`px-6 py-2 rounded-full text-sm font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
};

export const OverallShootsTable = () => {
  return (
    <div className="w-full bg-[#171717] rounded-2xl border border-white/5 overflow-hidden mt-8">
      {/* Table Header Controls */}
      <div className="bg-[#101010] flex justify-between items-center p-5 border-b border-b-[#3D3D3D]">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className="">Overall Shoots</h3>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
            Month <ChevronDown size={14} />
          </button>
          <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
            All <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Table Grid */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#101010] ">
            <tr className="text-[#E8D1AB] text-sm font-medium rounded-b-xl">
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D] ">Shoot ID</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Customer Name</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Category</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Price</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Status</th>
              <th className="pb-4 px-4 text-right bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Action</th>
            </tr>
          </thead>
          <tbody className="p-5">
            {SHOOT_DATA.map((shoot, idx) => (
              <tr key={idx} className="group hover:bg-white/[0.02] transition-colors rounded-2xl">
                {/* ID */}
                <td className="py-2 px-4 text-white font-medium">{shoot.id}</td>
                
                {/* Customer Info */}
                <td className="py-2 px-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10">
                      <Image 
                        src={shoot.customerImage} 
                        alt={shoot.customerName} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-base">{shoot.customerName}</p>
                      <p className="text-[#666666] text-sm mt-0.5">{shoot.date}</p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-2 px-4 text-white/90 text-base">{shoot.category}</td>

                {/* Price */}
                <td className="py-2 px-4 text-white/90 text-base font-medium">{shoot.price}</td>

                {/* Status */}
                <td className="py-2 px-4">
                  <StatusBadge status={shoot.status} />
                </td>

                {/* Action */}
                <td className="py-2 px-4 text-right">
                  <button className="p-2 text-white/40 hover:text-white transition-colors">
                    <ChevronRight size={24} />
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