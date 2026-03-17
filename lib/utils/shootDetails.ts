export const PRIMARY_ROLE_LABELS: Record<string, string> = {
  "1": "Videographer",
  "2": "Photographer",
  "3": "Editor",
  "4": "Producer",
  "5": "Director",
  "9": "Videographer",
  "10": "Photographer",
  "11": "Editor",
};

export const getPrimaryRoleLabel = (
  primaryRole: unknown,
  fallbackRoleName?: string | null,
) => {
  if (fallbackRoleName?.trim()) {
    return fallbackRoleName.trim();
  }

  if (primaryRole == null || primaryRole === "") {
    return "Creative Partner";
  }

  try {
    const parsed =
      typeof primaryRole === "string" && primaryRole.trim().startsWith("[")
        ? JSON.parse(primaryRole)
        : primaryRole;

    const roleIds = Array.isArray(parsed) ? parsed : [parsed];
    const labels = roleIds
      .map((roleId) => PRIMARY_ROLE_LABELS[String(roleId)] || String(roleId))
      .filter(Boolean);

    return Array.from(new Set(labels)).join(", ") || "Creative Partner";
  } catch {
    return PRIMARY_ROLE_LABELS[String(primaryRole)] || String(primaryRole);
  }
};

export const getPaymentStatusMeta = (
  paymentStatus?: string | null,
  paymentId?: string | number | null,
) => {
  const normalized = (paymentStatus || (paymentId ? "paid" : "pending")).toLowerCase();

  if (["paid", "success", "completed"].includes(normalized)) {
    return {
      label: "Paid",
      className: "text-[#22C55E]",
    };
  }

  if (["failed", "cancelled", "refunded", "rejected"].includes(normalized)) {
    return {
      label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
      className: "text-red-400",
    };
  }

  return {
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    className: "text-yellow-400",
  };
};

export const getProjectFolderLink = (project: any) => {
  return (
    project?.reference_links ||
    project?.folderLink ||
    project?.folder_link ||
    project?.shoot_folder_link ||
    project?.deliverables_folder_link ||
    ""
  );
};

const toCount = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};

export const getShootFilesText = (project: any) => {
  const imageCount = toCount(
    project?.totalImageFiles,
    project?.total_image_files,
    project?.image_files_count,
    project?.images_count,
  );
  const videoCount = toCount(
    project?.totalVideoFiles,
    project?.total_video_files,
    project?.video_files_count,
    project?.videos_count,
  );

  if (imageCount === 0 && videoCount === 0) {
    return "No files available";
  }

  return `${imageCount} Image${imageCount === 1 ? "" : "s"} & ${videoCount} Video${videoCount === 1 ? "" : "s"}`;
};
