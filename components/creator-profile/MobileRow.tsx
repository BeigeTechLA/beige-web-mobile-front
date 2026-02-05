"use client";
import React, { useState } from "react";

import { ChevronDown, MapPin, Mail, Hash, User, ChevronRight, Check, X } from "lucide-react";
import { Button } from "../ui/button";

export function MobileRow({ item, onApprove, onDecline, onViewDetails }: any) {
  const [isOpen, setIsOpen] = useState(false);

  // Status Logic Mapping (Keep identical to your original desktop logic)
  let statusBg = "bg-[#FEF9C3]";
  let statusText = "text-[#854D0E]";
  let label = "Pending";

  if (item.status === "Confirmed") {
    statusBg = "bg-[#DCFCE7]";
    statusText = "text-[#166534]";
    label = "Approved";
  } else if (item.status === "Rejected" || item.status === "Declined") {
    statusBg = "bg-[#FEE2E2]";
    statusText = "text-[#991B1B]";
    label = "Rejected";
  }

  return (
    <div className="flex flex-col w-full">
      {/* Trigger Row */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer active:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#E8D1AB]/20 border border-[#E8D1AB]/10 flex items-center justify-center text-[#E8D1AB] font-bold text-sm shrink-0">
            {(item.project_name || "PR").split(' ').map((n: any) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-lg capitalize font-bold truncate max-w-[140px]">
              {item.project_name || "Untitled"}
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-tight">Production Shoot</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusBg} ${statusText}`}>
            {label}
          </span>
          <ChevronDown
            size={18}
            className={`text-white/20 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-4 pb-5 pt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Shoot ID */}
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-[10px] text-white/30 font-bold uppercase">
                <Hash size={16} /> Shoot ID
              </span>
              <p className="text-white/80 text-sm">#{item.project_id?.toString().slice(-6) || "123456"}</p>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-[10px] text-white/30 font-bold uppercase">
                <User size={16} /> Category
              </span>
              <p className="text-white/80 text-sm">Videographer</p>
            </div>

            {/* Location */}
            <div className="col-span-2 space-y-1">
              <span className="flex items-center gap-1.5 text-[10px] text-white/30 font-bold uppercase">
                <MapPin size={16} /> Location
              </span>
              <p className="text-white/80 text-sm truncate">{item.event_location || item.location || "N/A"}</p>
            </div>

            {/* Email */}
            <div className="col-span-2 space-y-1">
              <span className="flex items-center gap-1.5 text-[10px] text-white/30 font-bold uppercase">
                <Mail size={16} /> Client Email
              </span>
              <p className="text-white/80 text-sm truncate">{item.guest_email || "N/A"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {item.status === "Pending" ? (
              <div className="flex gap-2">
                <Button
                  size="icon"
                  onClick={onApprove}
                  className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  <Check size={18} />
                </Button>
                <Button
                  size="icon"
                  onClick={onDecline}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <X size={18} />
                </Button>
              </div>
            ) : (
              <button
                onClick={onViewDetails}
                className="w-full py-2.5 rounded-lg border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                View Full Details <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}