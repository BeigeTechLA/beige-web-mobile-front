"use client";

import React, { useState } from "react";
import { X, Search, Calendar, MapPin, Lightbulb } from "lucide-react";
import { Button } from "../../ui/button";

interface Shoot {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface LinkToShootModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  isDark?: boolean;
}

const LinkToShootModal: React.FC<LinkToShootModalProps> = ({
  isOpen,
  onClose,
  folderName,
  isDark = true
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShootId, setSelectedShootId] = useState<string | null>(null);

  // Mock data for shoots
  const shoots: Shoot[] = [
    { id: "1", name: "Product Launch 2024", date: "Jan 15, 2024", location: "Studio A" },
    { id: "2", name: "Sarah & Mike Wedding", date: "Jan 10, 2024", location: "Grand Hotel" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-[92vw] lg:w-full max-w-[540px] border rounded-[24px] overflow-hidden shadow-2xl transition-colors duration-200 ${isDark ? "bg-black border-white/10" : "bg-white border-[#D7D7D7]"}`}>

        {/* Header */}
        <div className={`flex items-start justify-between p-3 lg:p-5 border-b transition-colors duration-200 ${isDark ? "border-b-white/30" : "border-b-[#D7D7D7]"
          }`}>
          <div>
            <h2 className={`text-lg font-semibold mb-2 truncate ${isDark ? "text-white" : "text-black"}`}>
              Link Folder to Shoots
            </h2>
            <p className={`text-xs lg:text-sm mt-1 truncate ${isDark ? "text-white/60" : "text-black/50"}`}>
              Link "{folderName}" to a booked shoot
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 lg:p-2 rounded-full transition-colors shrink-0 ${isDark ? "bg-white/5 text-white/60 hover:text-white" : "bg-black/5 text-black/60 hover:text-black"
              }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 lg:p-5">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/40" : "text-black/40"
                }`} size={18} />
              <input
                type="text"
                placeholder="Search shoots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl py-2 lg:py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 transition-all ${isDark
                    ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-[#979797] focus:ring-[#E8D1AB]/50"
                    : "bg-[#F4F5F7] border-[#D7D7D7] text-black placeholder:text-[#9F9FA9] focus:ring-[#B38F43]/50"
                  }`}
              />
            </div>

            {/* Shoot List */}
            <div className="space-y-3 max-h-[260px] lg:max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {shoots.map((shoot) => {
                const isSelected = selectedShootId === shoot.id;
                return (
                  <div
                    key={shoot.id}
                    onClick={() => setSelectedShootId(shoot.id)}
                    className={`group cursor-pointer p-3 lg:py-4 lg:px-5 rounded-xl border transition-all ${isSelected
                        ? isDark
                          ? "bg-[#E8D1AB]/5 border-[#E8D1AB]"
                          : "bg-[#B38F43]/5 border-[#B38F43]"
                        : isDark
                          ? "bg-transparent border-white/10 hover:border-white/20"
                          : "bg-transparent border-[#D7D7D7] hover:border-black/20"
                      }`}
                  >
                    <h4 className={`font-semibold lg:text-lg transition-colors truncate ${isDark ? "text-white" : "text-black"
                      }`}>
                      {shoot.name}
                    </h4>
                    <div className="flex items-center gap-5 mt-2">
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${isDark ? "text-[#979797]" : "text-[#727272]"
                        }`}>
                        <Calendar size={14} />
                        {shoot.date}
                      </div>
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${isDark ? "text-[#979797]" : "text-[#727272]"
                        }`}>
                        <MapPin size={14} />
                        {shoot.location}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Tip Box */}
            <div className="bg-[#F3F8FF] rounded-lg p-3 flex gap-3 border border-[#BFDBFE]">
              <Lightbulb className="text-[#1E40AF] shrink-0 mt-0.5" size={18} />
              <p className="text-[#1E40AF] text-sm leading-relaxed">
                Once linked, this folder will be visible to the client for this shoot.
                They will be able to view and download files.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-4 lg:mt-8">
            <Button
              type="button"
              onClick={onClose}
              className={`rounded-lg h-9 w-full lg:w-auto font-medium transition-colors ${isDark
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-[#F4F5F7] text-black hover:bg-[#E4E5E7]"
                }`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedShootId}
              className={`rounded-lg h-9 w-full lg:w-auto font-medium transition-colors disabled:opacity-50 bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90`}
            >
              Link Shoots
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkToShootModal;