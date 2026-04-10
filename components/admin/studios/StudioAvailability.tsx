"use client";

import React, { useState, useEffect, cloneElement } from "react";

import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

const StudioAvailability = ({ isDark }: { isDark: boolean }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [availabilityDetails, setAvailabilityDetails] = useState<any>({});



  // Helper Functions
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const isShootDay = (date: Date) => {
    if (!availabilityDetails) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayInfo = (availabilityDetails as any)[dateStr];
    return dayInfo?.projectAssigned === true;
  };

  return (
    <div className="space-y-4 lg:space-y-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Main Calendar Section */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className={`rounded-2xl transition-colors ${isDark ? "bg-[#171717]" : "bg-white border border-gray-200 shadow-sm"}`}>
            {/* Calendar Controls */}
            <div className={`p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "border-white/5" : "border-gray-100"
              }`}>
              <div className="flex items-center gap-4">
                <div className={`flex items-center rounded-lg gap-2 lg:gap-4 p-1`}>
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-[#202020] border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"
                      }`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className={`lg:text-lg font-semibold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-[#202020] border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"
                      }`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={`px-4 py-2 border rounded-lg text-sm transition-all ${isDark ? "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-[#E5D5B8]/40" : "bg-[#F0F0F0] border-[#E3E3E3] text-gray-600 hover:text-black shadow-sm"}`}
                  onClick={() => setCurrentMonth(new Date(2026, 0, 1))}
                >
                  Today
                </button>
              </div>
            </div>
            <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

            <div className="p-4 lg:p-6 rounded-2xl">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 border-collapse rounded-t-2xl">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (d, index) => (
                    <div
                      key={index}
                      className={`py-3 text-center text-sm font-bold capitalize tracking-widest border-b border-r last:border-r-0 ${isDark ? "text-white/30 bg-[#1F1F1F] border-[#000]" : "text-[#7C7777] bg-[#EDEBEB] border-gray-100"}`}
                    >
                      {d}
                    </div>
                  )
                )}
              </div>

              {/* Days Cells */}
              <div className="grid grid-cols-7 bg-[#101010] rounded-b-2xl">
                {calendarDays.map((day, dayIdx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const hasShoot = isShootDay(day);
                  const isTodayDate = isSameDay(day, new Date(2026, 0, 16)); // Mocking "Today" as Jan 16 for demo visual match

                  // Determine border classes
                  const isLastRow = dayIdx >= calendarDays.length - 7;
                  const isLastCol = (dayIdx + 1) % 7 === 0;

                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-[100px] p-3 transition-colors ${isDark ? "border-[#000]" : "border-gray-100"} ${!isLastRow ? 'border-b' : ''} ${!isLastCol ? 'border-r' : ''} ${!isCurrentMonth
                        ? (isDark ? 'bg-[#2C2C2C] text-[#878787]' : 'bg-[#F4F4F4] text-[#878787]')
                        : (isDark ? 'text-[#FFFFFF] bg-[#191818]' : 'bg-[#F8F4EE] text-[#3F3F3F]')
                        }`}
                    >
                      <span className={`text-sm font-medium block mb-2 w-7 h-7 flex items-center justify-center ${isTodayDate ? 'bg-[#E5D5B8] text-black rounded-full' : ''
                        }`}>
                        {format(day, 'd')}
                      </span>

                      {hasShoot && (
                        <div className="space-y-1">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded border w-fit ${isDark ? "bg-[#1E293B] border-[#334155]" : "bg-blue-50 border-blue-100"
                            }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                            <span className={`text-[10px] font-bold leading-none ${isDark ? "text-[#93C5FD]" : "text-blue-700"}`}>Shoot</span>
                          </div>
                          {/* <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1E293B] border border-[#334155] w-fit">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                              <span className="text-[10px] text-[#93C5FD] font-medium leading-none">Shoot</span>
                            </div> */}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="col-span-12 lg:col-span-3 w-full xl:max-w-[320px] space-y-3 lg:space-y-6">
          {/* Legend */}
          <div className={`rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#171717]" : "bg-white border border-gray-200 shadow-sm"}`}>
            <h3 className={`font-medium mb-2 lg:mb-4 ${isDark ? "text-white" : "text-black"}`}>Color Legend</h3>
            <div className="space-y-2 space-y-4">
              <div className="flex items-start gap-2 lg:gap-3">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${isDark ? "bg-[#444]" : "bg-[#ECE7E2]"}`}></div>
                <div>
                  <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Disabled</div>
                  <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Time off or blocked</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#8B7355] mt-1.5"></div>
                <div>
                  <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Today's</div>
                  <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Time off or blocked</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#3B82F6] mt-1.5"></div>
                <div>
                  <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Shoots</div>
                  <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Confirmed shoots</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#EF4444] mt-1.5"></div>
                <div>
                  <div className={`text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>Conflicts</div>
                  <div className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>Scheduling conflicts</div>
                </div>
              </div>
            </div>
          </div>

          {/* This Month Stats */}
          <div className={`rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#171717]" : "bg-white border border-gray-200 shadow-sm"}`}>
            <h3 className={`font-medium mb-4 ${isDark ? "text-white" : "text-black"}`}>This Month</h3>
            <div className="space-y-2 lg:space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                <span className="text-[#999] text-sm">Available Days</span>
                <span className={`text-sm lg:text-base  ${isDark ? "text-[#E8D1AB]" : "text-[#303030]"}`}>
                  12{/* {availabilityDays.length > 0 ? availabilityDays.join(", ") : "Not set"} */}
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                <span className="text-[#999] text-sm">Booked Shoots</span>
                <span className={`text-sm lg:text-base ${isDark ? "text-[#E8D1AB]" : "text-[#303030]"}`}>
                  6 {/* {stats?.total_projects || stats?.accepted_projects || '0'} */}
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                <span className="text-[#999] text-sm">Time Off</span>
                <span className={`text-sm lg:text-base  ${isDark ? "text-[#E8D1AB]" : "text-[#303030]"}`}>
                  2 days{/* {studioData.rating || "N/A"} */}</span>
              </div>
            </div>
          </div>

          {/* Share Availability */}
          <div className={`rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#171717]" : "bg-white border border-gray-200 shadow-sm"}`}>
            <h3 className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Share Availability</h3>
            <p className={`text-sm mb-4 ${isDark ? "text-[#888]" : "text-gray-500"}`}>Share your availability link with production teams</p>
            <button className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80 shadow-md"
              }`}>
              <Copy size={18} />
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudioAvailability;