"use client"

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { ChevronRight, MoreVertical } from "lucide-react";
import ActionMenu from "@/components/admin/sales-representative/ActionMenu";

// placeholder data 
const sortByData = ["Recent Leads (5)", "Recent Leads (15)", "Test Filter"]

interface LeadData {
  clientName: string;
  email: string;
  leadType: "Self-Serve" | "Sales Assisted";
  bookingStatus: "Booked" | "Cancelled" | "In-Progress";
  lastActivity: string;
  date: Date;
}

// placeholder data 
const LEADS_DATA: LeadData[] = [
  {
    clientName: "Alex Thompson",
    email: "alex.t@gmail.com",
    leadType: "Self-Serve",
    bookingStatus: "Booked",
    lastActivity: "2 hours ago.",
    date: new Date("2026-01-22T10:30:00")
  },
  {
    clientName: "Sarah Jenkins",
    email: "s.jenkins@outlook.com",
    leadType: "Self-Serve",
    bookingStatus: "Booked",
    lastActivity: "1 day ago",
    date: new Date("2026-01-22T10:30:00")
  },
  {
    clientName: "Michael Chen",
    email: "mchen_tech@yahoo.com",
    leadType: "Sales Assisted",
    bookingStatus: "In-Progress",
    lastActivity: "4 hours ago.",
    date: new Date("2026-01-12T15:20:00")
  },
  {
    clientName: "Emily Rodriguez",
    email: "emily.rod@company.org",
    leadType: "Sales Assisted",
    bookingStatus: "Cancelled",
    lastActivity: "12 hours ago.",
    date: new Date("2026-01-02T05:30:00")
  },
  {
    clientName: "David Park",
    email: "dpark_creative@me.com",
    leadType: "Self-Serve",
    bookingStatus: "Booked",
    lastActivity: "2 days ago",
    date: new Date("2026-01-21T10:40:00")
  },
  {
    clientName: "Jessica Wu",
    email: "jessica.wu@design.com",
    leadType: "Self-Serve",
    bookingStatus: "Booked",
    lastActivity: "23 hours ago.",
    date: new Date("2026-01-12T16:30:00")
  },
  {
    clientName: "Kevin Adams",
    email: "kadams_photo@live.com",
    leadType: "Sales Assisted",
    bookingStatus: "In-Progress",
    lastActivity: "1 day ago",
    date: new Date("2026-01-14T14:30:00")
  }
];

const StatusBadge = ({ status }: { status: LeadData["bookingStatus"] }) => {
  const styles = {
    "Booked": "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]",
    "Cancelled": "bg-[#fbd9d3] text-red-500 border-[#fbd9d3]",
    "In-Progress": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]"
  };

  return (
    <span className={`px-7 py-3 rounded-full text-base font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default function AdminSaleRepManagerPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = React.useState("")
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);

    } else {
      console.log("unfiltered");
    }
  };


  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, client: string) => {
    setSelectedClient(client);
    const rect = e.currentTarget.getBoundingClientRect();

    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top - 20
    });
  };


  return (
    <>
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div className="text-white">
          <h1 className="text-2xl leading-[32px] font-semibold mb-1">Sales Representative Management</h1>
          <p className="text-sm text-white/70">View activity, manage assignments, and monitor performance across your sales team.</p>
        </div>

        {/* Sort By Date component to be added */}
        <div className="flex gap-2 ">
          <BasicDropdown
            label="Status"
            value={sortBy}
            roundedFull={true}
            onChange={(val) => setSortBy(val)}
            styles={"text-base h-[54px]"}
            options={sortByData}
          />
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>
      </div>

      <div
        className="h-[1px] w-full my-4 lg:my-9"
        style={{
          backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
          backgroundSize: '30px 1px', // 30px is the total dash + gap width
          backgroundRepeat: 'repeat-x'
        }}
      />

      <div className="w-full overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#101010] text-[#E8D1AB] text-sm font-medium">
              <th className="rounded-l-2xl py-5 px-6 font-medium border-l border-b border-b-[#333333] border-l-[#333333]">Client Name</th>
              <th className="py-5 px-6 font-medium border-b border-[#333333]">Email ID</th>
              <th className="py-5 px-6 font-medium border-b border-[#333333]">Lead Type</th>
              <th className="py-5 px-6 font-medium border-b border-[#333333]">Booking Status</th>
              <th className="py-5 px-6 font-medium border-b border-[#333333]">Last Activity</th>
              <th className="py-5 px-6 font-medium text-right rounded-r-2xl border-r border-b border-b-[#333333] border-r-[#333333]">Action</th>
            </tr>
          </thead>
          <tbody>
            {LEADS_DATA.map((lead, idx) => (
              <tr
                key={idx}
                className=" hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                {/* Client Name & Date */}
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-[50px] h-[50px] rounded-lg bg-[#FFF6D9] flex items-center justify-center text-black font-medium text-xl">
                      {lead.clientName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-white font-medium text-base">{lead.clientName}</p>
                      <p className="text-white/40 text-sm mt-1.5">{format(lead.date, "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="py-5 px-6 text-white text-base">{lead.email}</td>

                {/* Lead Type */}
                <td className="py-5 px-6">
                  <span className="text-white text-base">{lead.leadType}</span>
                </td>

                {/* Booking Status */}
                <td className="py-5 px-6">
                  <StatusBadge status={lead.bookingStatus} />
                </td>

                {/* Last Activity */}
                <td className="py-5 px-6 text-white text-base">
                  {lead.lastActivity}
                </td>

                {/* Action */}
                <td className="py-5 px-6 text-right">
                  <Button
                    className="text-white hover:text-white/80 transition-colors"
                    onClick={(e) => handleOpenMenu(e, lead.clientName)}
                  >
                    <MoreVertical size={20} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {menuAnchor && (
        <ActionMenu
          client={selectedClient}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          anchor={menuAnchor}
        />
      )}

    </>
  )
}