"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { RoleCardData } from "@/components/admin/roles-permissions/types";

type RoleCardProps = {
  card: RoleCardData;
  isDark?: boolean;
  onEdit?: (id: string) => void;
  editDisabled?: boolean;
  onViewUsers?: (id: string) => void;
};

const getBadgeText = (value: string) => {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "NA";

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
};

export function RoleCard({ card, isDark = true, onEdit, editDisabled = false, onViewUsers }: RoleCardProps) {
  const fallbackBadges = card.members.filter((member) => !member.isCountBadge);
  const countBadge = card.members.find((member) => member.isCountBadge);

  return (
    <div className={`group flex min-h-[224px] w-full max-w-[367px] flex-col overflow-hidden rounded-[24px] border px-4 py-4 shadow-[0_14px_28px_rgba(0,0,0,0.28)] transition-all duration-300 sm:px-5 sm:py-5 lg:px-6 lg:py-5 ${
      isDark
        ? "border-white/10 bg-[#161616] hover:border-white/15 hover:shadow-[0_20px_38px_rgba(0,0,0,0.34)]"
        : "border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)] hover:border-[#D8D8D8] hover:shadow-[0_16px_30px_rgba(16,16,16,0.12)]"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <span className={`pt-1 text-[13px] font-medium sm:text-[14px] ${isDark ? "text-white/45" : "text-[#101010]"}`}>
          {card.usersLabel}
        </span>

        <div className="flex items-center pl-2 pr-1 sm:pl-3">
          {fallbackBadges.slice(0, 4).map((member, index) => {
            const badgeText = getBadgeText(member.label);

            return (
              <div
                key={member.id}
                className={[
                  "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border text-[11px] font-semibold shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 sm:h-11 sm:w-11 sm:text-[12px]",
                  isDark ? "border-[#1a1a1a] bg-[#f4e6c7] text-[#111111]" : "border-white bg-[#EDEDED] text-[#101010]",
                  index === 0 ? "" : "-ml-1 sm:-ml-2",
                ].join(" ")}
                style={{ zIndex: fallbackBadges.length - index }}
              >
                {member.avatarSrc ? (
                  <Image
                    src={member.avatarSrc}
                    alt={member.label}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <span className="relative z-10">{badgeText}</span>
                )}
              </div>
            );
          })}

          {countBadge && (
            <div
              className={`relative -ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border text-[15px] font-medium shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 sm:-ml-2 sm:h-11 sm:w-11 sm:text-[16px] ${
                isDark ? "border-[#1a1a1a] bg-[#E9D4A9] text-[#111111]" : "border-white bg-[#E5D5B8] text-[#101010]"
              }`}
              style={{ zIndex: 0 }}
            >
              <span className="relative z-10">
                {countBadge.label.startsWith("+")
                  ? countBadge.label
                  : `+${countBadge.label}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 max-w-[520px] sm:mt-6">
        <div className="flex items-center gap-3">
          <h3 className={`text-[18px] font-semibold tracking-tight sm:text-[19px] lg:text-[20px] ${isDark ? "text-white" : "text-[#101010]"}`}>
            {card.name}
          </h3>
          {card.roleId === 8 ? (
            <span className={`inline-flex h-6 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.16em] ${
              isDark ? "border-[#E5D5B8]/20 bg-[#E5D5B8]/10 text-[#E5D5B8]" : "border-[#C9A96E]/20 bg-[#C9A96E]/10 text-[#8E6A2A]"
            }`}>
              Super Admin
            </span>
          ) : null}
        </div>
        <p className={`mt-2 max-w-[560px] text-[12px] leading-snug line-clamp-2 sm:text-[13px] lg:text-[13px] ${isDark ? "text-white/55" : "text-[#32323299]"}`}>
          {card.description}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between pt-5">
        <button
          type="button"
          onClick={() => onEdit?.(card.id)}
          disabled={editDisabled}
          title={editDisabled ? "Edit permission not allowed" : "Edit role"}
          className={`text-[13px] font-medium underline underline-offset-4 transition disabled:cursor-not-allowed disabled:opacity-35 ${
            isDark
              ? "text-[#E5D5B8] decoration-[#E5D5B8]/35 hover:text-[#f1e3c7] hover:decoration-[#E5D5B8]"
              : "text-[#8E6A2A] decoration-[#8E6A2A]/30 hover:text-[#6f531f] hover:decoration-[#8E6A2A]"
          }`}
        >
          Edit Role
        </button>
        <button
          type="button"
          onClick={() => onViewUsers?.(card.id)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:scale-110 active:scale-95 ${
            isDark
              ? "border-white/10 bg-[#2a2a2a]"
              : "border-[#E3E3E3] bg-white"
          }`}
        >
          <ArrowUpRight
            size={15}
            strokeWidth={2.25}
          />
        </button>
      </div>
    </div>
  );
}
