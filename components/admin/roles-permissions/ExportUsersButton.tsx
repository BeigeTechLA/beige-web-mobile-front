"use client";

import { useState } from "react";
import { ArrowUpToLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";

type ExportUsersButtonProps = {
  roleId?: string | number | null;
  roleName?: string;
  isDark?: boolean;
  className?: string;
};

const getFilenameFromContentDisposition = (
  contentDisposition: string | undefined,
  fallback: string,
) => {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/['"]/g, ""));
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || fallback;
};

const sanitizeFilenamePart = (value: string) =>
  value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "role";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function ExportUsersButton({
  roleId,
  roleName = "role",
  isDark = true,
  className = "",
}: ExportUsersButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const isRoleButton = roleId !== undefined;
  const canExportRole = roleId != null && String(roleId).trim().length > 0;

  const handleExport = async () => {
    if (isExporting) return;
    if (isRoleButton && !canExportRole) {
      toast.error("Failed to export users. Please try again.");
      return;
    }

    setIsExporting(true);

    try {
      const response = canExportRole
        ? await adminApi.exportRoleUsers(roleId)
        : await adminApi.exportUsers();
      const fallbackName = canExportRole
        ? `${sanitizeFilenamePart(roleName)}-users-export.xlsx`
        : "all-users-export.xlsx";
      const filename = getFilenameFromContentDisposition(
        response.contentDisposition,
        fallbackName,
      );

      downloadBlob(response.blob, filename);
    } catch (error) {
      console.error("Export Users Error:", error);
      toast.error("Failed to export users. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleExport}
      disabled={isExporting || (isRoleButton && !canExportRole)}
      aria-label={isExporting ? "Exporting users" : "Export users"}
      title={isExporting ? "Exporting users" : "Export users"}
      className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg ${
        isDark
          ? "text-white bg-[#202020] border-white/20 hover:bg-white/10"
          : "text-[#323232] bg-[#F0F0F0] border-[#E3E3E3] hover:bg-[#E3E3E3]"
      } border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {isExporting ? (
        <Loader2 className="animate-spin" />
      ) : (
        <ArrowUpToLine />
      )}
      {isExporting ? "Exporting..." : "Export"}
    </Button>
  );
}
