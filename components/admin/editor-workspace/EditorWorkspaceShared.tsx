"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Clock3 } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EditorWorkspaceRole } from "./editorWorkspaceDemoStore";

export const WORKSPACE_ROOT = "/admin/shoots/editor-workspace";

export const workspaceUrl = (
  role: EditorWorkspaceRole,
  shootId?: string,
  section?: "agreement" | "activity",
) => {
  const editorId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("editorId")
      : null;
  const extra = editorId ? `&editorId=${encodeURIComponent(editorId)}` : "";
  if (section === "activity") {
    return `${WORKSPACE_ROOT}/activity?role=${role}${shootId ? `&shoot=${encodeURIComponent(shootId)}` : ""}${extra}`;
  }
  const path = shootId
    ? `${WORKSPACE_ROOT}/${encodeURIComponent(shootId)}${section === "agreement" ? "/agreement" : ""}`
    : WORKSPACE_ROOT;
  return `${path}?role=${role}${extra}`;
};

export function usePreviewRole(): EditorWorkspaceRole {
  const searchParams = useSearchParams();
  return searchParams.get("role") === "external" ? "external" : "internal";
}

export function useEditorWorkspaceTheme() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return {
    mounted,
    isDark: !mounted || (resolvedTheme || theme) === "dark",
  };
}

export const StatusPill = ({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) => {
  const map: Record<string, string> = {
    "Not Started": "bg-[#303030] text-[#AFAFAF]",
    "In Progress": "bg-[#C6D2FF] text-[#244DCD]",
    Submitted: "bg-[#FCEBFF] text-[#C616CE]",
    "Revision Requested": "bg-[#F5E6C8] text-[#B87500]",
    Resubmitted: "bg-[#DAD1FF] text-[#5E40B9]",
    Approved: "bg-[#D2FBE2] text-[#0B9E50]",
    Completed: "bg-[#393020] text-[#E4CE9F]",
    Pending: "bg-[#F5E6C8] text-[#B87500]",
    Accepted: "bg-[#D2FBE2] text-[#0B9E50]",
    Rejected: "bg-[#FFD8DB] text-[#EB414A]",
  };
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${map[status] || "bg-[#303030] text-white"} ${className}`}
    >
      {status}
    </span>
  );
};

export const EditorWorkspaceTopbar = ({
  title = "Shoots Management",
  count,
  showActivity = false,
  onActivity,
}: {
  title?: string;
  count?: number;
  showActivity?: boolean;
  onActivity?: () => void;
}) => (
  <Topbar
    pathname={WORKSPACE_ROOT}
    title={count === undefined ? title : `${title}  ·  ${count} Shoots`}
    actions={
      showActivity ? (
        <button
          type="button"
          onClick={onActivity}
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#E8D1AB] px-5 text-sm font-semibold text-[#181818] transition-colors hover:bg-[#DCC59B]"
        >
          <Clock3 size={17} /> View Activity
        </button>
      ) : undefined
    }
  />
);

export const workspaceInput = (dark: boolean) =>
  `border outline-none transition-colors focus:border-[#D6BC8B] ${dark ? "border-[#373737] bg-[#202020] text-white placeholder:text-[#707070]" : "border-[#DADADA] bg-white text-[#171717] placeholder:text-[#878787]"}`;
export const workspaceSurface = (dark: boolean) =>
  dark ? "border-[#282828] bg-[#111111]" : "border-[#E4E4E4] bg-white";
export const workspaceMuted = (dark: boolean) =>
  dark ? "text-[#929292]" : "text-[#666666]";
export const workspaceAccent = "bg-[#E8D1AB] text-[#181818] hover:bg-[#DCC59B]";
export const workspaceSecondary = (dark: boolean) =>
  dark
    ? "border-[#3A3A3A] bg-[#1E1E1E] text-white hover:bg-[#2D2D2D]"
    : "border-[#DCDCDC] bg-[#F5F5F5] text-[#222222] hover:bg-[#EAEAEA]";

export function formatActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Editor-workspace form controls reuse the project's existing shared inputs. */
export interface WorkspaceOption {
  value: string;
  label: string;
}

export function WorkspaceSelect({
  label,
  value,
  onValueChange,
  options,
  isDark,
  className = "",
  triggerClassName = "",
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: WorkspaceOption[];
  isDark: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          aria-label={label}
          className={`h-12 rounded-lg ${workspaceInput(isDark)} ${triggerClassName}`}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent
          className={`z-[160] max-h-[min(320px,65dvh)] ${
            isDark
              ? "border-[#373737] bg-[#171717] text-white"
              : "border-[#E5E5E5] bg-white text-[#171717]"
          }`}
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={
                isDark
                  ? "focus:bg-[#2A2A2A] focus:text-white"
                  : "focus:bg-[#F5EFE3] focus:text-[#171717]"
              }
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function WorkspaceInput({
  isDark,
  className = "",
  ...props
}: React.ComponentProps<typeof Input> & { isDark: boolean }) {
  return (
    <Input
      {...props}
      className={`rounded-lg ${workspaceInput(isDark)} ${className}`}
    />
  );
}

export function WorkspaceTextarea({
  isDark,
  className = "",
  ...props
}: React.ComponentProps<typeof Textarea> & { isDark: boolean }) {
  return (
    <Textarea
      {...props}
      className={`min-h-[110px] rounded-lg ${workspaceInput(isDark)} ${className}`}
    />
  );
}
