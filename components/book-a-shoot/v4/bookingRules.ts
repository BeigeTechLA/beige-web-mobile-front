type PlaceContext = { id?: string; text?: string; short_code?: string };
type LocationFeature = PlaceContext & {
  context?: PlaceContext[];
  place_name?: string;
};

// Mapbox's district context identifies LA County even when the address only
// names a neighborhood or an independent city such as West Hollywood.
export function isLosAngelesLocation(address: string, details?: unknown): boolean {
  if (!address.trim()) return false;
  const feature = (details || {}) as LocationFeature;
  const context = [feature, ...(feature.context || [])];
  const region = context.find((part) => part.id?.startsWith("region."));
  const country = context.find((part) => part.id?.startsWith("country."));
  if (country?.short_code && country.short_code.toLowerCase() !== "us") return false;
  if (region && region.short_code?.toLowerCase() !== "us-ca" && region.text?.toLowerCase() !== "california") return false;
  const district = context.find((part) => part.id?.startsWith("district."));
  if (district?.text) return /^los angeles(?: county)?$/i.test(district.text);
  if (context.some((part) => /^(place|locality)\./.test(part.id || "") && /^los angeles$/i.test(part.text || ""))) return true;

  // Older saved selections may have only an address, without geographic context.
  const parts = (feature.place_name || address).split(",").map((part) => part.trim());
  const hasCalifornia = parts.some((part) => /^(CA|California)(?:\s+\d{5}(?:-\d{4})?)?$/i.test(part));
  return hasCalifornia && parts.some((part) => /^(Los Angeles(?: County)?|LA|West Hollywood|Beverly Hills|Santa Monica|Culver City|Burbank|Glendale|Pasadena|Long Beach|Malibu|Calabasas|Inglewood|Torrance|Hollywood|Hollywood Hills|North Hollywood|Woodland Hills|Studio City|Sherman Oaks|Encino|Van Nuys|Venice|Silver Lake|Echo Park|San Pedro)$/i.test(part));
}

export function getV4PhotoEditsPerHour(shootType: string, durationHours: number): number {
  return shootType === "wedding" || durationHours > 4 ? 50 : 25;
}

export const V4_PACKAGE_INCLUSIONS = [
  "$1M Liability Insurance Included",
  "Beige Guarantee — Love your content, or we’ll make it right",
  "Vetted Creative Partner",
  "Professional lighting and essential production equipment",
  "Raw files delivered digitally on Beige",
  "Up to 1 hour of setup time",
  "2 complimentary revision rounds",
];

export function getCreativeTeamError(services: string[], counts: Record<string, number>): string | null {
  const photo = services.includes("photography");
  const video = services.includes("videography") || services.includes("livestream");
  const positive = (role: string) => Number.isInteger(counts[role]) && counts[role] > 0;
  const hybrid = photo && video && positive("photoVideoCreator");
  if (photo && !positive("photographer") && !hybrid) {
    return video ? "Select at least one Photographer or Hybrid Shooter for photography." : "Select at least one Photographer to continue.";
  }
  if (video && !positive("videographer") && !hybrid) {
    return photo ? "Select at least one Videographer or Hybrid Shooter for videography." : "Select at least one Videographer to continue.";
  }
  return null;
}
