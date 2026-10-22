"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useTheme } from "next-themes";

import NotificationCenterPage from "@/components/notifications/NotificationCenterPage";
import { notificationCenterApi, notificationPortalPaths, NOTIFICATIONS_UPDATED_EVENT, type NotificationPortal } from "@/lib/notificationCenterApi";

export default function NotificationPopup({ portal = "admin" }: { portal?: NotificationPortal }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const dragBoundsRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const suppressClickRef = React.useRef(false);
  const dragAnimation = useAnimationControls();

  useEffect(() => setMounted(true), []);

  const loadCount = useCallback(async () => {
    try {
      const res = await notificationCenterApi.counts();
      setUnread(res.data.unread);
    } catch { /* ignore badge errors */ }
  }, []);

  useEffect(() => {
    void loadCount();
    const timer = window.setInterval(loadCount, 30000);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, loadCount);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, loadCount);
    };
  }, [loadCount]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Esc to close + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Hide the button on the full notifications page itself
  if (pathname?.startsWith(notificationPortalPaths[portal])) return null;

  const isDark = !mounted || theme === "dark";

  return (
    <>
      <div ref={dragBoundsRef} className="pointer-events-none fixed inset-0 z-[80]">
        <motion.button
          type="button"
          aria-label="Open notifications"
          ref={buttonRef}
          animate={dragAnimation}
          onClick={(event) => {
            if (suppressClickRef.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClickRef.current = false;
              return;
            }
            setOpen(true);
          }}
          drag
          onDragStart={() => { suppressClickRef.current = true; }}
          onDragEnd={() => {
            const button = buttonRef.current;
            if (button) {
              const rect = button.getBoundingClientRect();
              const margin = 24;
              const width = rect.width;
              const height = rect.height;
              const corners = [
                { x: margin, y: margin },
                { x: window.innerWidth - width - margin, y: margin },
                { x: margin, y: window.innerHeight - height - margin },
                { x: window.innerWidth - width - margin, y: window.innerHeight - height - margin },
              ];
              const nearest = corners.reduce((best, corner) => {
                const distance = Math.hypot(rect.left - corner.x, rect.top - corner.y);
                return distance < best.distance ? { ...corner, distance } : best;
              }, { ...corners[0], distance: Number.POSITIVE_INFINITY });
              const baseLeft = window.innerWidth - width - margin;
              const baseTop = window.innerHeight - height - margin;
              void dragAnimation.start({
                x: nearest.x - baseLeft,
                y: nearest.y - baseTop,
                transition: { type: "spring", stiffness: 500, damping: 35 },
              });
            }
            window.setTimeout(() => { suppressClickRef.current = false; }, 0);
          }}
          dragConstraints={dragBoundsRef}
          dragMomentum={false}
          dragElastic={0.08}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 30 }}
          style={{ touchAction: "none" }}
          className="pointer-events-auto fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8D1AB] text-black shadow-lg hover:bg-[#D9C19A]"
        >
          <Bell size={20} />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F04444] px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </motion.button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className={`relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${isDark ? "border-[#303030] bg-[#121212]" : "border-[#E4E4E4] bg-[#F4F5F7]"}`}
          >
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className={`absolute right-3 top-3 z-10 rounded-full p-1.5 ${isDark ? "text-white/70 hover:bg-white/10" : "text-black/60 hover:bg-black/5"}`}
            >
              <X size={18} />
            </button>
            <div className="overflow-y-auto">
              <NotificationCenterPage portal={portal} variant="modal" onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
