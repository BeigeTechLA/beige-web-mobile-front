export type EditTypeCount = {
  slug: string;
  quantity: number;
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
