"use client";

import React, { useState } from "react";
import Image from "next/image";

interface EditorAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
  rounded?: string;
}

export default function EditorAvatar({
  name,
  avatarUrl,
  className = "h-12 w-12",
  rounded = "rounded-full",
}: EditorAvatarProps) {
  const [broken, setBroken] = useState(false);
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "E";

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[#E8D1AB] ${rounded} ${className}`}
    >
      {avatarUrl && !broken ? (
        <Image
          src={avatarUrl}
          alt={name}
          fill
          unoptimized
          sizes="(min-width: 1024px) 240px, 96px"
          className="object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold text-[#222222]">
          {initials}
        </div>
      )}
    </div>
  );
}
