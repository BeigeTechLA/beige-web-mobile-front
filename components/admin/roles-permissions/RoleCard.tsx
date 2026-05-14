"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { RoleCardData } from "@/components/admin/roles-permissions/types";

type RoleCardProps = {
  card: RoleCardData;
  onEdit?: (id: string) => void;
};

export function RoleCard({ card, onEdit }: RoleCardProps) {
  return (
    <div className="group flex min-h-[225px] flex-col rounded-[32px] border border-white/10 bg-[#111111] px-6 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
      {/* Header: User count and Avatar stack */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-white/40">{card.usersLabel}</span>
        <div className="flex items-center">
          {card.members.map((member, index) => (
            <div
              key={member.id}
              className={`${
                index === 0 ? "" : "-ml-3"
              } relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#111111] text-[13px] font-semibold shadow-sm transition-transform duration-300 hover:z-20 hover:scale-110 ${member.tone} ${
                member.isCountBadge ? "z-0" : ""
              }`}
              style={{ zIndex: card.members.length - index }}
            >
              {member.avatarSrc && !member.isCountBadge ? (
                <Image
                  src={member.avatarSrc}
                  alt={member.label}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <span className="relative z-10">{member.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body: Role Title and Description */}
      <div className="mt-6">
        <h3 className="text-[24px] font-bold tracking-tight text-white">
          {card.name}
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-white/40">
          {card.description}
        </p>
      </div>

      {/* Footer: Actions */}
      <div className="mt-auto flex items-end justify-between pt-6">
        {/* Edit Role link in golden color #E5D5B8 matching the Beige app design */}
        <button
          type="button"
          onClick={() => onEdit?.(card.id)}
          className="text-[15px] font-medium text-[#E5D5B8] underline decoration-[#E5D5B8]/30 underline-offset-4 transition hover:text-[#f1e3c7] hover:decoration-[#E5D5B8]"
        >
          Edit Role
        </button>
        {/* Circular arrow button matching Figma's premium style */}
        <button
          type="button"
          onClick={() => onEdit?.(card.id)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#222222] text-white transition-all duration-300 hover:bg-[#333333] hover:scale-110 shadow-lg"
        >
          <ArrowUpRight size={18} />
        </button>
      </div>
    </div>
  );
}
