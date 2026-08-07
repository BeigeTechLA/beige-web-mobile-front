"use client";

import Image from "next/image";
import {
  X,
  Tag,
  Clock3,
  ExternalLink,
  MailOpen,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationDetailsModalProps {
  open: boolean;
  onClose: () => void;
  notification: any;
  isDark: boolean;
}

export default function NotificationDetailsModal({
  open,
  onClose,
  notification,
  isDark,
}: NotificationDetailsModalProps) {
  if (!open || !notification) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative origin-center scale-[0.85]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "w-[540px] rounded-2xl border shadow-2xl",
            isDark
              ? "border-[#353535] bg-[#090909]"
              : "border-gray-200 bg-white"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between border-b px-5 py-4",
              isDark ? "border-white/10" : "border-gray-200"
            )}
          >
            <h2
              className={cn(
                "text-xl font-semibold",
                isDark ? "text-white" : "text-black"
              )}
            >
              Notification Details
            </h2>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2525] hover:bg-[#3A3333]"
            >
              <X className="text-white" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            {/* Priority */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2",
                notification.priority === "Critical"
                  ? "bg-[#431515] text-[#FF5A5F]"
                  : notification.priority === "High"
                  ? "bg-[#3F3113] text-[#F5B83D]"
                  : "bg-[#1C2C4C] text-[#61A5FF]"
              )}
            >
              <Tag size={16} />
              <span className="text-sm font-medium uppercase">
                {notification.priority} Priority
              </span>
            </div>

            {/* User */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src={notification.avatar}
                  alt=""
                  width={42}
                  height={42}
                  className="rounded-full"
                />

                <div>
                  <h3
                    className={cn(
                      "text-lg font-semibold",
                      isDark ? "text-white" : "text-black"
                    )}
                  >
                    Sarah Chen
                  </h3>

                  <p className="text-sm text-[#9A9A9A]">
                    Creative Director
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-[#8A8A8A]">
                <Clock3 size={15} />
                {notification.time}
              </div>
            </div>

            {/* Action */}
            <div>
              <p className="mb-2 text-sm text-[#8E8E8E]">Action</p>

              <p
                className={cn(
                  "text-sm leading-6",
                  isDark ? "text-white" : "text-black"
                )}
              >
                {notification.title}
              </p>
            </div>

            {/* Details */}
            <div>
              <p className="mb-2 text-sm text-[#8E8E8E]">Details</p>

              <p
                className={cn(
                  "text-sm leading-6",
                  isDark ? "text-white" : "text-black"
                )}
              >
                {notification.message}
              </p>
            </div>

            {/* Category */}
            <div
              className={cn(
                "grid grid-cols-2 border-y py-3",
                isDark ? "border-white/10" : "border-gray-200"
              )}
            >
              <div>
                <p className="text-sm text-[#8A8A8A]">Category</p>

                <p
                  className={cn(
                    "mt-2",
                    isDark ? "text-white" : "text-black"
                  )}
                >
                  {notification.category}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#8A8A8A]">Type</p>

                <p
                  className={cn(
                    "mt-2",
                    isDark ? "text-white" : "text-black"
                  )}
                >
                  Project
                </p>
              </div>
            </div>

            {/* Primary Button */}
            <Button className="h-12 w-full rounded-xl bg-[#E8D1AB] text-base font-semibold text-black hover:bg-[#d7bf96]">
              <ExternalLink className="mr-2 h-4 w-4" />
              {notification.action}
            </Button>

            {/* Secondary Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-11 border-[#3B3B3B] bg-[#161616] text-white hover:bg-[#202020]"
              >
                <MailOpen className="mr-2 h-4 w-4" />
                Mark Unread
              </Button>

              <Button
                variant="outline"
                className="h-11 border-[#3B3B3B] bg-[#161616] text-white hover:bg-[#202020]"
              >
                <BellOff className="mr-2 h-4 w-4" />
                Mute Similar
              </Button>
            </div>

            {/* Timeline */}
            <div
              className={cn(
                "border-t pt-6",
                isDark ? "border-white/10" : "border-gray-200"
              )}
            >
              <h4 className="mb-5 text-[#D7C18F]">Timeline</h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" />

                  <span className={isDark ? "text-white" : "text-black"}>
                    Notification created
                  </span>
                </div>

                <span className="text-sm text-[#8A8A8A]">
                  14/05/2026, 15:46:42
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}