export type EditTypeCount = {
  slug: string;
  quantity: number;
};

export const PHOTO_EDIT_ADDON_SET_SIZE = 25;

export const getPhotoEditsIncludedPerHour = (shootType?: string) => {
  return shootType === "wedding" ? 50 : 25;
};

export const getTotalDurationHours = (
  bookingType?: "single_day" | "multi_day",
  startDate?: string,
  endDate?: string,
  bookingDays?: Array<{ startTime?: string; endTime?: string }>
) => {
  if (bookingType === "multi_day" && Array.isArray(bookingDays) && bookingDays.length > 0) {
    const total = bookingDays.reduce((sum, day) => {
      if (!day.startTime || !day.endTime) return sum;

      const [sh, sm] = day.startTime.split(":").map(Number);
      const [eh, em] = day.endTime.split(":").map(Number);

      if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return sum;

      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff <= 0) return sum;

      return sum + diff / 60;
    }, 0);

    return Math.max(1, Math.round(total * 100) / 100);
  }

  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diffMs <= 0) {
    return 0;
  }

  return Math.max(1, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
};

export const getPhotoEditSummary = ({
  shootType,
  durationHours,
  selectedAddOnSets,
}: {
  shootType?: string;
  durationHours: number;
  selectedAddOnSets: number;
}) => {
  const includedPerHour = getPhotoEditsIncludedPerHour(shootType);
  const includedCount = durationHours > 0 ? includedPerHour * durationHours : 0;
  const extraCount = Math.max(0, selectedAddOnSets) * PHOTO_EDIT_ADDON_SET_SIZE;

  return {
    includedPerHour,
    includedCount,
    extraCount,
    totalCount: includedCount + extraCount,
  };
};

export const buildEditTypeCounts = (editTypes: string[] = []): EditTypeCount[] => {
  const counts = new Map<string, number>();

  editTypes.forEach((slug) => {
    if (!slug) return;
    counts.set(slug, (counts.get(slug) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([slug, quantity]) => ({
    slug,
    quantity,
  }));
};

export const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
  setTimeout(() => {
    if (ref && ref.current) {
      const navOffset = 100;

      // Calculate absolute position relative to the entire document
      const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, 100);
};
