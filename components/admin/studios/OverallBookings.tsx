"use client";

import { CalendarCheck2, Clock } from "lucide-react";
import React, { PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type BookingStatus = "Upcoming" | "Completed" | "Cancelled";

export interface BookingCard {
  id: string;
  status: BookingStatus;
  studioName: string;
  amount: number;
  timeLabel: string; // e.g. "10:00 AM (4hrs Duration)"
  dateLabel: string; // e.g. "Saturday, Feb 14, 2026"
  projectName: string;
  crewLabel: string; // e.g. "Crew: 5"
  contactName: string;
  contactEmail: string;
  imageUrl: string;
}

type Props = {
  isDark?: boolean;
  cards?: Array<any>;
};

const DUMMY_CARDS: BookingCard[] = [
  {
    id: "bk_1",
    status: "Upcoming",
    studioName: "Sunset Creative Studio",
    amount: 340,
    timeLabel: "10:00 AM (4hrs Duration)",
    dateLabel: "Saturday, Feb 14, 2026",
    projectName: "Summer Product Launch",
    crewLabel: "Crew: 5",
    contactName: "Sarah Johnson",
    contactEmail: "sarah@example.com",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "bk_2",
    status: "Upcoming",
    studioName: "Downtown Loft Studio",
    amount: 525,
    timeLabel: "2:30 PM (6hrs Duration)",
    dateLabel: "Monday, Feb 16, 2026",
    projectName: "Brand Campaign Shoot",
    crewLabel: "Crew: 8",
    contactName: "Michael Lee",
    contactEmail: "michael@example.com",
    imageUrl:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "bk_3",
    status: "Completed",
    studioName: "Harbor Light Studio",
    amount: 290,
    timeLabel: "11:00 AM (3hrs Duration)",
    dateLabel: "Thursday, Feb 05, 2026",
    projectName: "Editorial Portraits",
    crewLabel: "Crew: 3",
    contactName: "Priya Shah",
    contactEmail: "priya@example.com",
    imageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  },

  {
    id: "bk_4",
    status: "Cancelled",
    studioName: "Harbor Light Studio",
    amount: 290,
    timeLabel: "11:00 AM (3hrs Duration)",
    dateLabel: "Thursday, Feb 05, 2026",
    projectName: "Editorial Portraits",
    crewLabel: "Crew: 4",
    contactName: "Michelle Shah",
    contactEmail: "mich@example.com",
    imageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  },{
    id: "bk_5",
    status: "Upcoming",
    studioName: "Sunset Creative Studio",
    amount: 340,
    timeLabel: "10:00 AM (4hrs Duration)",
    dateLabel: "Saturday, Feb 14, 2026",
    projectName: "Summer Product Launch",
    crewLabel: "Crew: 5",
    contactName: "Sarah Johnson",
    contactEmail: "sarah@example.com",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
];

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  isDragging: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function OverallBookingsStack({ isDark = true, cards }: Props) {
  const data = useMemo<BookingCard[]>(() => {
    if (!cards?.length) return DUMMY_CARDS;

    return cards.map((booking, index) => ({
      id: String(booking.studio_booking_id || booking.id || index),
      status: booking.status === 'completed' ? 'Completed' : ['cancelled', 'rejected'].includes(booking.status) ? 'Cancelled' : 'Upcoming',
      studioName: booking.studio_name || booking.space_name || 'Studio',
      amount: Number(booking.base_amount || booking.net_amount || 0),
      timeLabel: booking.start_time && booking.duration_hours
        ? `${booking.start_time} (${booking.duration_hours}hrs Duration)`
        : booking.start_time || 'TBD',
      dateLabel: booking.booking_date ? formatDateLabel(booking.booking_date) : 'TBD',
      projectName: booking.project_name || booking.source || 'Studio Booking',
      crewLabel: `Crew: ${booking.metadata?.crew_count || booking.cast_and_crew_count || 0}`,
      contactName: booking.contact_name || booking.customer_name || booking.user_name || 'Customer',
      contactEmail: booking.contact_email || booking.email || '',
      imageUrl: booking.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    }));
  }, [cards]);
  const [activeTab, setActiveTab] = useState<BookingStatus>("Upcoming");
  const [range, setRange] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(
    () => data.filter((c) => c.status === activeTab),
    [data, activeTab]
  );

  const [stack, setStack] = useState<BookingCard[]>(filtered);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [exitDir, setExitDir] = useState<"up" | "down" | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // keep stack in sync if cards prop changes
  useEffect(() => {
    setStack(filtered);
    setExitingId(null);
    setExitDir(null);
    dragRef.current = null;
  }, [filtered]);

  const top = stack[0];
  const visible = stack.slice(0, 3);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!top || exitingId) return;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        x: 0,
        y: 0,
        isDragging: true,
      };
    },
    [top, exitingId]
  );

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st?.isDragging || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    st.x = dx;
    st.y = dy;
    // trigger render
    dragRef.current = { ...st };
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    containerRef.current?.offsetHeight;
  }, []);

  const finishSwipe = useCallback(
    (dir: "up" | "down") => {
      if (!top) return;
      setExitingId(top.id);
      setExitDir(dir);
      // after animation, rotate stack
      window.setTimeout(() => {
        setStack((prev) => {
          if (prev.length <= 1) return prev;
          const [first, ...rest] = prev;
          return [...rest, first];
        });
        setExitingId(null);
        setExitDir(null);
        dragRef.current = null;
      }, 220);
    },
    [top]
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const st = dragRef.current;
      if (!st?.isDragging || st.pointerId !== e.pointerId) return;
      const dy = st.y;
      const threshold = 90;
      if (dy < -threshold) finishSwipe("up");
      else if (dy > threshold) finishSwipe("down");
      else dragRef.current = null;
    },
    [finishSwipe]
  );

  const onPointerCancel = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    dragRef.current = null;
  }, []);

  const dragX = dragRef.current?.x ?? 0;
  const dragY = dragRef.current?.y ?? 0;
  const rotate = clamp(dragX / 26, -6, 6);

  return (
    <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden min-h-[400px] h-full flex flex-col ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#FFF] border-[#E3E3E3]"
      }`}>
      {/* Header Controls */}
      <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
        }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={isDark ? "text-white" : "text-[#323232]"}>Overall Bookings</h3>
        </div>

        <div className="flex gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className={`sm:w-[110px] rounded-full h-9 px-3 text-[10px] lg:text-xs outline-none border ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
              }`}
          >
            <option value="all">All time</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`sm:w-[120px] rounded-full h-9 px-3 text-[10px] lg:text-xs outline-none border capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
              }`}
          >
            <option value="all">All</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className={`px-5 ${isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"} rounded-b-2xl border-b border-b-[#3D3D3D]`}>
        <div className={`flex gap-4 text-xs sm:text-sm font-medium ${isDark ? "text-white/50" : "text-[#32323299]"}`}>
          {(["Upcoming", "Completed", "Cancelled"] as BookingStatus[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`w-full py-4 max-w-[150px] relative transition-colors ${active ? (isDark ? "text-[#E8D1AB]" : "text-[#323232]") : ""}`}
              >
                {tab}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#E8D1AB]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`p-6 lg:p-12 ${visible.length > 1 ? "pt-8 lg:pt-16":""}`}>
        <div ref={containerRef} className="relative w-full overflow-visible h-[320px] md:h-[350px]">
          {visible
            .slice()
            .reverse()
            .map((card, idxFromBack) => {
              const idx = visible.length - 1 - idxFromBack; // 0 = top
              const isTop = idx === 0;

              // Peek cards above the top card
              const baseTranslateY = -idx * 20;
              const baseScale = 1 - idx * 0.02;
              const baseOpacity = 1 - idx * 0.06;

              const isExiting = exitingId === card.id;
              const exitY = exitDir === "up" ? -420 : 420;

              const tx = isTop && !exitingId ? dragX * 0.08 : 0; // tiny horizontal drift
              const ty = isTop && !exitingId ? dragY : 0;
              const rz = isTop && !exitingId ? rotate : 0;

              const finalY = isExiting ? exitY : ty;

              return (
                <div
                  key={card.id}
                  onPointerDown={isTop ? onPointerDown : undefined}
                  onPointerMove={isTop ? onPointerMove : undefined}
                  onPointerUp={isTop ? onPointerUp : undefined}
                  onPointerCancel={isTop ? onPointerCancel : undefined}
                  className={[
                    "absolute inset-0 rounded-2xl select-none",
                    isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
                  ].join(" ")}
                  style={{
                    transform: `translate3d(${tx}px, ${baseTranslateY + finalY}px, 0) scale(${baseScale}) rotate(${rz}deg)`,
                    opacity: baseOpacity,
                    transition: isTop && !isExiting && dragRef.current?.isDragging
                      ? "none"
                      : "transform 200ms ease, opacity 200ms ease",
                    zIndex: 10 - idx,
                  }}
                >
                  <CardUI isDark={isDark} card={card} />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function CardUI({ isDark, card }: { isDark: boolean; card: BookingCard }) {
  return (
    <div
      className={`w-full flex items-center gap-5 rounded-lg lg:rounded-2xl overflow-hidden border p-4 lg:p-9 ${isDark ? "bg-[#101010] border-[#2A2A2A]" : "bg-white border-[#E5E5E5]"
        }`}
    >
      {/* Image */}
      <div className="w-[45%] flex-1">
        <div className="h-full w-full lg:h-[281px] rounded-xl overflow-hidden bg-black/10">
          <img src={card.imageUrl} alt={card.studioName} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Content */}
      <div className="w-[55%] h-full flex flex-col justify-center flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base md:text-[22px] leading-tight">{card.studioName}</div>
          <div className={`text-lg md:text-[26px] font-semibold ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
            ${card.amount.toFixed(2)}
          </div>
        </div>

        <div className={`flex gap-3 mt-4 text-xs lg:text-sm p-3 rounded-xl ${isDark ? "bg-[#171717] text-white/70" : "text-[#32323280] bg-white/70"}`}>
          <div className="flex gap-1 items-center">
            <span><Clock size={14} /></span>
            <span>{card.timeLabel}</span>
          </div>
          <div className="flex gap-1 items-center">
            <span><CalendarCheck2 size={14} /></span>
            <span>{card.dateLabel}</span>
          </div>
        </div>

        <div className={`mt-4 h-1 w-full `}>
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="1" viewBox="0 0 595 1" fill="none" style={{ display: "block" }}>
            <path d="M0 0.25L595 0.249948" stroke="url(#paint0_linear_1392_6501)" strokeOpacity="0.2" strokeWidth="0.5" />
            <defs>
              <linearGradient id="paint0_linear_1392_6501" x1="4.37114e-08" y1="0.75" x2="595" y2="0.749948" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" />
                <stop offset="0.5" stopColor="white" stopOpacity="0.5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <div className={`text-xs lg:text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#32323280]"}`}>Project</div>
            <div className="mt-5 text-sm lg:text-base font-medium">{card.projectName}</div>
            <div className={`mt-3 text-xs lg:text-sm ${isDark ? "text-white/40" : "text-[#32323280]"}`}>{card.crewLabel}</div>
          </div>
          <div>
            <div className={`text-xs lg:text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#32323280]"}`}>Contact</div>
            <div className="mt-5 text-sm lg:text-base font-medium">{card.contactName}</div>
            <div className={`mt-3 text-xs lg:text-sm ${isDark ? "text-white/40" : "text-[#32323280]"}`}>{card.contactEmail}</div>
          </div>
        </div>
      </div>


    </div>
  );
}
