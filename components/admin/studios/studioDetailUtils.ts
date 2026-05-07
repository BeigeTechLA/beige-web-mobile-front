"use client";

export type StudioRecord = Record<string, unknown>;

export const FALLBACK_STUDIO_IMAGE =
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400";

export const FALLBACK_GALLERY_IMAGES = [
    { id: 1, url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80", label: "Exterior" },
    { id: 2, url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Kitchen" },
    { id: 3, url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80", label: "Pool View" },
    { id: 4, url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80", label: "Living Room" },
    { id: 5, url: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80", label: "Bedroom" },
    { id: 6, url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80", label: "Bathroom" },
    { id: 7, url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", label: "Studio" },
];

export const getStudioRecord = (response: unknown, studioId?: string | number): StudioRecord | null => {
    const responseRecord = asRecord(response);
    const responseData = responseRecord?.data ?? response;
    const dataRecord = asRecord(responseData);
    const data =
        dataRecord?.studio ??
        dataRecord?.studio_details ??
        dataRecord?.studioDetail ??
        dataRecord?.item ??
        dataRecord?.record ??
        dataRecord?.data ??
        responseData;

    if (Array.isArray(data)) {
        const match = data.find((item) => String(asRecord(item)?.id) === String(studioId));
        return asRecord(match ?? data[0]);
    }

    return asRecord(data);
};

export const asRecord = (value: unknown): StudioRecord | null =>
    typeof value === "object" && value !== null ? value as StudioRecord : null;

export const textValue = (value: unknown, fallback = "") =>
    value === null || value === undefined || value === "" ? fallback : String(value);

export const parseStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    if (typeof value !== "string" || !value.trim()) return [];

    try {
        const parsedValue = JSON.parse(value);
        return Array.isArray(parsedValue) ? parsedValue.map(String).filter(Boolean) : [];
    } catch {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
};

export const getInfo = (studio?: StudioRecord | null) => ({
    ...(studio ?? {}),
    ...(asRecord(studio?.info) ?? {}),
});

export const getAddress = (studio?: StudioRecord | null) => ({
    ...(studio ?? {}),
    ...(asRecord(studio?.address) ?? {}),
});

export const getBudget = (studio?: StudioRecord | null) => ({
    ...(studio ?? {}),
    ...(asRecord(studio?.budget) ?? {}),
});

export const getStudioName = (studio?: StudioRecord | null) => {
    const info = getInfo(studio);
    const address = getAddress(studio);
    return textValue(
        info.studio_name ?? info.space_title ?? info.brand_name,
        address.city ? `Studio - ${address.city}` : "Sunset Creative Studio",
    );
};

export const getStudioDescription = (studio?: StudioRecord | null) => {
    const info = getInfo(studio);
    return textValue(
        info.description ?? studio?.additional_info,
        "A fully equipped production studio in Los Angeles, ideal for photo, video, podcast, and product shoots. The space offers professional lighting, flexible shooting setups, and comfortable crew areas to ensure smooth and efficient production. Conveniently located near parking, cafes, and creative services, this studio is designed to help creators move fast and shoot with confidence.",
    );
};

export const getStudioLocation = (studio?: StudioRecord | null) => {
    const address = getAddress(studio);
    return [
        address.address_line1 ?? address.address,
        address.city,
        address.state,
        address.country,
    ].map((item) => textValue(item)).filter(Boolean).join(", ") || "Woodland Hills, Los Angeles, CA";
};

export const getStudioTypes = (studio?: StudioRecord | null) => {
    const info = getInfo(studio);
    const budget = getBudget(studio);
    const categoryTypes = Array.isArray(budget.categories)
        ? budget.categories.map((category) => textValue(asRecord(category)?.name)).filter(Boolean)
        : [];
    const infoTypes = parseStringList(info.studio_type ?? info.suggest_type);
    return [...infoTypes, ...categoryTypes].filter(Boolean).slice(0, 4).length
        ? [...new Set([...infoTypes, ...categoryTypes].filter(Boolean))].slice(0, 4)
        : ["Photography", "Videography", "Product"];
};

export const getStudioImages = (studio?: StudioRecord | null) => {
    const media = Array.isArray(studio?.media) ? studio?.media : [];
    const images = media
        .map((item, index: number) => {
            const mediaRecord = asRecord(item);

            return {
                id: textValue(mediaRecord?.id, String(index + 1)),
                url: textValue(mediaRecord?.url),
                label: textValue(mediaRecord?.type, `Image ${index + 1}`),
            };
        })
        .filter((item) => item.url);

    return images.length ? images : FALLBACK_GALLERY_IMAGES;
};

export const getCoverImage = (studio?: StudioRecord | null) =>
    getStudioImages(studio)[0]?.url || FALLBACK_STUDIO_IMAGE;

export const formatTime = (time: unknown) => {
    const value = textValue(time);
    if (!value) return "";
    const [hoursValue, minutesValue = "00"] = value.split(":");
    const hours = Number(hoursValue);
    if (!Number.isFinite(hours)) return value;
    const suffix = hours >= 12 ? "pm" : "am";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutesValue.padStart(2, "0").slice(0, 2)} ${suffix}`;
};
