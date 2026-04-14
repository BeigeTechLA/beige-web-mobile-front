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

type ProjectScheduleDay = {
  duration_hours?: number | string | null;
};

type ProjectScheduleLike = {
  booking_days?: ProjectScheduleDay[] | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  event_start_time?: string | null;
};

const getProjectBookingDays = (project: ProjectScheduleLike | null | undefined) =>
  Array.isArray(project?.booking_days) ? project.booking_days : [];

const formatProjectDateValue = (value?: string | null) => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatUsTime = (hours: number, minutes: number) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatProjectTimeValue = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim();
  const timeMatch = normalizedValue.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AaPp][Mm]))?$/,
  );

  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[4]?.toUpperCase();

    if (!Number.isNaN(hours) && !Number.isNaN(minutes) && minutes >= 0 && minutes < 60) {
      if (meridiem) {
        if (hours === 12) {
          hours = meridiem === "AM" ? 0 : 12;
        } else if (meridiem === "PM") {
          hours += 12;
        }
      }

      if (hours >= 0 && hours < 24) {
        return formatUsTime(hours, minutes);
      }
    }
  }

  const parsedDate = new Date(normalizedValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return normalizedValue;
};

export const getProjectTimeText = (project: ProjectScheduleLike | null | undefined) => {
  const startTime = formatProjectTimeValue(project?.start_time);
  const endTime = formatProjectTimeValue(project?.end_time);

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  if (startTime) {
    return startTime;
  }

  if (project?.event_start_time) {
    return formatProjectTimeValue(project.event_start_time) || "N/A";
  }

  return "N/A";
};

export const getProjectDateText = (project: ProjectScheduleLike | null | undefined) => {
  const bookingDays = getProjectBookingDays(project);

  if (bookingDays.length > 1) {
    return "Multiple Days";
  }

  return formatProjectDateValue(project?.event_date);
};

export const getProjectScheduleTimeText = (project: ProjectScheduleLike | null | undefined) => {
  const bookingDays = getProjectBookingDays(project);

  if (bookingDays.length > 1) {
    const totalHours = bookingDays.reduce((sum, day) => {
      const parsedHours = Number(day?.duration_hours);
      return Number.isFinite(parsedHours) ? sum + parsedHours : sum;
    }, 0);
    const roundedHours = Math.round(totalHours * 100) / 100;

    return `${Number.isInteger(roundedHours) ? roundedHours : roundedHours} hours`;
  }

  return getProjectTimeText(project);
};
