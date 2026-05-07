"use client";
import Image from "next/image";
import DottedDivider from "@/components/admin/DottedDivider";
import { MapPin, BadgeCheck } from "lucide-react";
import {
    getCoverImage,
    getInfo,
    getStudioLocation,
    getStudioName,
    getStudioTypes,
    type StudioRecord,
} from "./studioDetailUtils";

export default function StudioDetailHeader({ isDark, studio }: { isDark: boolean; studio?: StudioRecord | null }) {
    const info = getInfo(studio);
    const studioName = getStudioName(studio);
    const subtitle = info.brand_name || info.space_title || "Branding and visual expert";
    const location = getStudioLocation(studio);
    const shootTypes = getStudioTypes(studio);
    const coverImage = getCoverImage(studio);
    const status = studio?.status === "published" ? "Active" : studio?.status ? String(studio.status) : "Active";

    return (
        <div className={`rounded-xl p-6 mb-4 ${isDark ? "bg-[#1a1a1a] border border-white/10" : "bg-white border border-[#E5E5E5]"}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                    {/* Image */}
                    <div className="w-[120px] h-[120px] rounded-xl overflow-hidden relative shrink-0">
                        <Image
                            src={coverImage}
                            alt={studioName}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div>
                        {/* Name + Verified */}
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>
                                {studioName}
                            </h2>
                            <BadgeCheck size={20} className="text-[#22C55E] fill-[#22C55E] stroke-white" />
                        </div>

                        {/* Subtitle */}
                        <p className={`text-sm mb-2 ${isDark ? "text-white/50" : "text-black/50"}`}>
                            {subtitle}
                        </p>

                        {/* Location */}
                        <div className={`flex items-center gap-1 text-xs mb-4 ${isDark ? "text-white/40" : "text-black/40"}`}>
                            <MapPin size={12} />
                            <span>{location}</span>
                        </div>

                        {/* Shoot Type Badges */}
                        <div className="flex gap-2 flex-wrap">
                            {shootTypes.map((type) => (
                                <span
                                    key={type}
                                    className={`text-xs px-3 py-1.5 rounded-lg border ${isDark ? "border-white/10 text-white/70" : "border-black/10 text-black/70"}`}
                                >
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active Badge */}
                <span className="text-sm px-6 py-2 rounded-full font-medium border bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20">
                    {status}
                </span>
            </div>
            <DottedDivider />
        </div>
    );
}
