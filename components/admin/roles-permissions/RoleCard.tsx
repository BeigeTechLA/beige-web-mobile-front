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
    <div className="group flex min-h-[214px] flex-col rounded-[24px] border border-white/10 bg-[#171717] px-[18px] py-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 hover:border-white/15 hover:shadow-[0_20px_44px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <span className="pt-1 text-[15px] font-medium text-white/56">{card.usersLabel}</span>
        <div className="flex items-center pr-1">
          {card.members.map((member, index) => (
            <div
              key={member.id}
              className={`${
                index === 0 ? "" : "-ml-3"
              } relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-[#171717] text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out ${member.tone} ${
                member.isCountBadge
                  ? "group-hover:translate-x-2 group-hover:-translate-y-0.5"
                  : index === 0
                    ? "group-hover:-translate-x-2 group-hover:-translate-y-1"
                    : index === 1
                      ? "group-hover:translate-x-0 group-hover:-translate-y-1"
                      : index === 2
                        ? "group-hover:translate-x-2 group-hover:-translate-y-1"
                        : "group-hover:translate-x-3 group-hover:-translate-y-1"
              }`}
              style={{
                zIndex: card.members.length - index,
                transitionProperty: "transform, box-shadow, filter",
              }}
            >
              {member.avatarSrc && !member.isCountBadge ? (
                <Image
                  src={member.avatarSrc}
                  alt={member.label}
                  fill
                  sizes="44px"
                  className="object-cover transition duration-300 group-hover:scale-[1.04]"
                />
              ) : null}
              <span className={member.avatarSrc ? "sr-only" : "relative z-10"}>
                {member.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[22px]">
        <h3 className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-white">
          {card.name}
        </h3>
        <p className="mt-5 max-w-[365px] text-[14px] leading-[1.45] text-white/58">
          {card.description}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between pt-8">
        <button
          type="button"
          onClick={() => onEdit?.(card.id)}
          className="text-[17px] font-medium text-[#E5D5B8] underline underline-offset-4 transition hover:text-[#f1e3c7]"
        >
          Edit Role
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(card.id)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#575757] text-white/90 transition duration-300 hover:bg-[#666666]"
        >
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}
