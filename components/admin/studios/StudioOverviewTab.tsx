"use client";
import { useEffect, useState } from "react";
import DottedDivider from "@/components/admin/DottedDivider";
import { Home, Sparkles, KeyRound, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Trees, Tv, Wifi, PawPrint, WashingMachine, Wind, AirVent, Camera,
    Refrigerator as Fridge, Bike,
    Video, Package, Clapperboard, CalendarDays, Dumbbell, Users, Flame, CircleDot, Wine
} from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
    asRecord,
    formatTime,
    getAddress,
    getInfo,
    getStudioDescription,
    getStudioLocation,
    getStudioName,
    parseStringList,
    textValue,
    type StudioRecord,
} from "./studioDetailUtils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const amenities = [
    { icon: <Trees size={22} />, label: "Garden view" },
    { icon: <Tv size={22} />, label: "Kitchen" },
    { icon: <Wifi size={22} />, label: "Wifi" },
    { icon: <PawPrint size={22} />, label: "Pets allowed" },
    { icon: <WashingMachine size={22} />, label: "Free washer - in building" },
    { icon: <Wind size={22} />, label: "Dryer" },
    { icon: <AirVent size={22} />, label: "Central air conditioning" },
    { icon: <Camera size={22} />, label: "Security cameras on property" },
    { icon: <Fridge size={22} />, label: "Refrigerator" },
    { icon: <Bike size={22} />, label: "Bicycles" },
];

const operatingHours = [
    { day: "Monday", hours: "10:00 am - 10:00 pm" },
    { day: "Tuesday", hours: "10:00 am - 10:00 pm" },
    { day: "Wednesday", hours: "10:00 am - 10:00 pm" },
    { day: "Thursday", hours: "10:00 am - 10:00 pm" },
    { day: "Friday", hours: "10:00 am - 10:00 pm" },
    { day: "Saturday", hours: "10:00 am - 10:00 pm" },
    { day: "Sunday", hours: "10:00 am - 10:00 pm" },
];

const amenityIconByName: Record<string, JSX.Element> = {
    wifi: <Wifi size={22} />,
    kitchen: <Tv size={22} />,
    "pets allowed": <PawPrint size={22} />,
    dryer: <Wind size={22} />,
    refrigerator: <Fridge size={22} />,
    "security cameras on property": <Camera size={22} />,

    // From your screenshot:
    "photo shoots": <Camera size={22} />,
    "video shoots": <Video size={22} />,
    "product shoots": <Package size={22} />,
    "production": <Clapperboard size={22} />,
    "event": <CalendarDays size={22} />,
    "recreation": <Dumbbell size={22} />,
    "meetings": <Users size={22} />,
    "indoor fireplace": <Flame size={22} />,
    "pool table": <CircleDot size={22} />,

    // Existing ones
    "garden view": <Trees size={22} />,
    "free washer - in building": <WashingMachine size={22} />,
    "central air conditioning": <AirVent size={22} />,
    "bicycles": <Bike size={22} />,
};

const formatGuestsLine = (studio?: StudioRecord | null) => {
    const details = asRecord(studio?.details);
    const info = getInfo(studio);

    const guests = Number(details?.guests ?? info?.guests ?? studio?.guests);
    const bedrooms = Number(details?.bedrooms ?? info?.bedrooms ?? studio?.bedrooms);
    const beds = Number(details?.beds ?? info?.beds ?? studio?.beds);
    const baths = Number(details?.bathrooms ?? info?.bathrooms ?? studio?.bathrooms);

    return [
        Number.isFinite(guests) && guests > 0 ? `${guests} guests` : null,
        Number.isFinite(bedrooms) && bedrooms > 0 ? `${bedrooms} bedroom` : null,
        Number.isFinite(beds) && beds > 0 ? `${beds} bed` : null,
        Number.isFinite(baths) && baths > 0 ? `${baths} bath` : null,
    ].filter(Boolean).join(" · ");
};
const getFeatures = (studio?: StudioRecord | null) => {
    const info = getInfo(studio);
    const rules = asRecord(studio?.rules);
    const details = asRecord(studio?.details);
    const budget = asRecord(studio?.budget);
    const features = [];

    if (info.overnight_stays) {
        features.push({ icon: <Home size={22} />, title: "Overnight stays allowed", desc: "This space supports overnight bookings" });
    } else {
        features.push({ icon: <Home size={22} />, title: "No overnight stays", desc: "This space is available for daytime bookings only" });
    }

    if (info.security_camera) {
        features.push({ icon: <Camera size={22} />, title: "Security cameras on property", desc: textValue(info.security_desc) || "Security cameras are present on the property" });
    }

    if (rules?.pets_allowed) {
        features.push({ icon: <PawPrint size={22} />, title: "Pets allowed", desc: "You can bring your pets to this space" });
    }

    if (rules?.alcohol_allowed) {
        features.push({ icon: <Wine size={22} />, title: "Alcohol allowed", desc: "Alcohol is permitted in this space" });
    }

    if (rules?.smoking_allowed) {
        features.push({ icon: <Flame size={22} />, title: "Smoking allowed", desc: "Smoking is permitted in this space" });
    }

    if (details?.host_activities) {
        const activities = [
            details?.activity_production && "Production",
            details?.activity_event && "Events",
            details?.activity_recreation && "Recreation",
            details?.activity_meetings && "Meetings",
        ].filter(Boolean).join(", ");

        if (activities) {
            features.push({ icon: <Clapperboard size={22} />, title: "Activities hosted", desc: activities });
        }
    }

    const minBooking = Number(budget?.minimum_booking);
    if (minBooking > 0) {
        features.push({ icon: <CalendarX size={22} />, title: `Minimum booking: ${minBooking} hour${minBooking > 1 ? "s" : ""}`, desc: "" });
    }

    const customRule = textValue(rules?.custom_rule);
    if (customRule) {
        features.push({ icon: <KeyRound size={22} />, title: "Custom rule", desc: customRule });
    }

    return features;
};

const getAmenities = (studio?: StudioRecord | null) => {
    const budget = asRecord(studio?.budget);
    const categories = Array.isArray(budget?.categories) ? budget.categories : [];
    const categoryIncludes = categories.flatMap((category) => parseStringList(asRecord(category)?.includes));
    const facilities = Array.isArray(studio?.facilities)
        ? studio?.facilities
            .filter((facility) => asRecord(facility)?.is_available !== false)
            .map((facility) => textValue(asRecord(facility)?.facility_name))
            .filter(Boolean)
        : [];
    const dynamicAmenities = [...new Set([...categoryIncludes, ...facilities])]
        .filter((label) => !label.startsWith("Parking - ") && !label.startsWith("Access - "))
        .slice(0, 10);

    if (!dynamicAmenities.length) return amenities;

    return dynamicAmenities.map((label) => ({
        icon: amenityIconByName[label.toLowerCase()] ?? <Sparkles size={22} />,
        label,
    }));
};

const getOperatingHours = (studio?: StudioRecord | null) => {
    const hours = Array.isArray(studio?.hours) ? studio?.hours : [];
    const mappedHours = hours.map((item) => {
        const hourRecord = asRecord(item);
        const day = textValue(hourRecord?.day);
        if (!day || hourRecord?.is_open === false) return null;

        return {
            day,
            hours: hourRecord?.is_24hrs
                ? "Open 24 hours"
                : `${formatTime(hourRecord?.opening_time) || "10:00 am"} - ${formatTime(hourRecord?.closing_time) || "10:00 pm"}`,
        };
    }).filter(Boolean) as { day: string; hours: string }[];

    return mappedHours.length ? mappedHours : operatingHours;
};

const getMapCoordinates = (studio?: StudioRecord | null) => {
    const address = getAddress(studio);
    const latitude = Number(address.latitude);
    const longitude = Number(address.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
    }

    return { latitude: 34.0522, longitude: -118.2437 };
};

const StudioMap = ({ studio }: { studio?: StudioRecord | null }) => {
    const coordinates = getMapCoordinates(studio);
    const isValidToken = MAPBOX_TOKEN && !MAPBOX_TOKEN.includes("replace_with_your_token") && MAPBOX_TOKEN.length > 20;

    if (!isValidToken) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#101010] text-white/50">
                <MapPinIcon />
                <p className="text-sm mt-2">Map requires Mapbox token</p>
                <p className="text-xs mt-1 opacity-70">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env</p>
            </div>
        );
    }

    return (
        <Map
            initialViewState={{
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                zoom: 13,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
        >
            <NavigationControl position="top-right" showCompass={false} />
            <Marker latitude={coordinates.latitude} longitude={coordinates.longitude} anchor="bottom">
                <MapPinIcon />
            </Marker>
        </Map>
    );
};

const MapPinIcon = () => (
    <div className="relative">
        <div className="absolute -left-2 -top-2 h-9 w-9 rounded-full bg-[#E53935]/20" />
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#E53935] text-white shadow-lg">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8B1111]" />
        </div>
        <div className="mx-auto h-3 w-3 -translate-y-1 rotate-45 bg-[#E53935]" />
    </div>
);

const buildPersonName = (record?: StudioRecord | null) => {
    const firstLast = [record?.first_name, record?.last_name].map((item) => textValue(item)).filter(Boolean).join(" ");
    return textValue(
        record?.name ??
        record?.full_name ??
        record?.user_name ??
        record?.display_name ??
        firstLast,
    );
};

const getLoggedInUser = () => {
    if (typeof window === "undefined") return null;

    const rawUser = window.localStorage.getItem("revure_user");
    if (!rawUser) return null;

    try {
        return asRecord(JSON.parse(rawUser));
    } catch {
        return null;
    }
};

const resolveHostName = (studio?: StudioRecord | null, fallbackUser?: StudioRecord | null) => {
    const user = asRecord(studio?.user);
    const owner = asRecord(studio?.owner);
    const host = asRecord(studio?.host);
    const creator = asRecord(studio?.creator);

    return textValue(
        buildPersonName(user) ||
        buildPersonName(owner) ||
        buildPersonName(host) ||
        buildPersonName(creator) ||
        studio?.host_name ||
        studio?.owner_name ||
        studio?.user_name ||
        buildPersonName(fallbackUser),
        "Studio Host",
    );
};

const resolveHostAvatar = (studio?: StudioRecord | null, fallbackUser?: StudioRecord | null) => {
    const user = asRecord(studio?.user);
    const owner = asRecord(studio?.owner);
    const host = asRecord(studio?.host);
    const creator = asRecord(studio?.creator);

    return textValue(
        user?.avatar ??
        user?.profile_image ??
        user?.profile_photo ??
        owner?.avatar ??
        owner?.profile_image ??
        owner?.profile_photo ??
        host?.avatar ??
        host?.profile_image ??
        host?.profile_photo ??
        creator?.avatar ??
        creator?.profile_image ??
        creator?.profile_photo ??
        studio?.host_avatar ??
        fallbackUser?.avatar ??
        fallbackUser?.profile_image ??
        fallbackUser?.profile_photo,
        "https://i.pravatar.cc/100",
    );
};

export default function StudioOverviewTab({ isDark, studio }: { isDark: boolean; studio?: StudioRecord | null }) {
    const info = getInfo(studio);
    const [loggedInUser, setLoggedInUser] = useState<StudioRecord | null>(null);
    const details = asRecord(studio?.details);
    const hostName = resolveHostName(studio, loggedInUser);
    const hostAvatar = resolveHostAvatar(studio, loggedInUser);
    const description = getStudioDescription(studio);
    const location = getStudioLocation(studio);
    const locationDescription = textValue(details?.additional_info ?? studio?.additional_info, "Very dynamic and appreciated district by the people of Bordeaux thanks to rue St James and place Fernand Lafargue. Home to many historical monuments such as the Grosse Cloche, the Porte de Bourgogne and the Porte Cailhau, and cultural sites such as the Aquitaine Museum.");
    const dynamicAmenities = getAmenities(studio);
    const dynamicOperatingHours = getOperatingHours(studio);

    useEffect(() => {
        setLoggedInUser(getLoggedInUser());
    }, []);

    return (
        <div className={`rounded-xl p-8 ${isDark ? "bg-[#141414] border border-white/10" : "bg-white border border-[#E5E5E5]"}`}>

            {/* Additional Information */}
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-[#101010]"}`}>
                Additional Information
            </h3>
            <DottedDivider />

            {/* Host Info */}
            <div className="flex justify-between items-start mt-6 mb-6">
                <div>
                    <h4 className={`text-2xl font-semibold mb-2 ${isDark ? "text-white" : "text-[#101010]"}`}>
                        {textValue(info.space_title ?? info.studio_name, getStudioName(studio))} hosted by {hostName}
                    </h4>
                    {formatGuestsLine(studio) && (
                        <p className={`text-base ${isDark ? "text-white/50" : "text-black/50"}`}>
                            {formatGuestsLine(studio)}
                        </p>
                    )}
                </div>
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-[#22C55E]">
                    <img src={hostAvatar} alt="Host" className="w-full h-full object-cover" />
                </div>
            </div>

            <hr className={`my-6 border-none h-[1px] ${isDark ? "bg-white/10" : "bg-black/10"}`} />

            {/* Features */}

            <div className="flex flex-col gap-6 my-6">
                {getFeatures(studio).map((item, i) => (
                    <div key={i} className="flex items-start gap-5">
                        <span className={`shrink-0 mt-0.5 ${isDark ? "text-white/70" : "text-black/70"}`}>{item.icon}</span>
                        <div>
                            <p className={`text-base font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>{item.title}</p>
                            {item.desc && <p className={`text-sm mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>{item.desc}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <hr className={`my-6 border-none h-[1px] ${isDark ? "bg-white/10" : "bg-black/10"}`} />

            {/* Description */}
            <div className="my-6">
                <p className={`text-base leading-relaxed ${isDark ? "text-white/70" : "text-black/70"}`}>
                    {description}
                </p>
                <p className={`text-sm mt-2 mb-3 ${isDark ? "text-white/30" : "text-black/30"}`}>. . . .</p>
                <button className={`text-sm font-medium flex items-center gap-1 ${isDark ? "text-[#E5D5B8]" : "text-[#101010]"}`}>
                    Show more {"->"}
                </button>
            </div>

          <hr className={`my-6 border-none h-[1px] ${isDark ? "bg-white/10" : "bg-black/10"}`} />

            {/* Amenities */}
            <div className="my-6">
                <h4 className={`text-xl font-semibold mb-5 ${isDark ? "text-white" : "text-[#101010]"}`}>
                    What this place offers
                </h4>
                <div className="grid grid-cols-2 gap-5">
                    {dynamicAmenities.map((item) => (
                        <div key={item.label} className="flex items-center gap-4">
                            <span className={`text-2xl ${isDark ? "text-white/80" : "text-black/80"}`}>{item.icon}</span>
                            <span className={`text-base ${isDark ? "text-white/80" : "text-black/80"}`}>{item.label}</span>
                        </div>
                    ))}
                </div>
                <Button className="mt-6 bg-[#E5D5B8] text-black">
                    Show all {dynamicAmenities.length} amenities
                </Button>
            </div>

            <hr className={`my-6 border-none h-[1px] ${isDark ? "bg-white/10" : "bg-black/10"}`} />

            {/* Operating Hours */}
            <div className="my-6">
                <h4 className={`text-xl font-semibold mb-5 ${isDark ? "text-white" : "text-[#101010]"}`}>
                    Operating Hours
                </h4>
                <div className={`rounded-2xl overflow-hidden border w-full max-w-[340px] ${isDark ? "border-white/10 bg-[#1e1e1e]" : "border-black/10 bg-white"}`}>
                    {dynamicOperatingHours.map((item, i) => (
                        <div
                            key={item.day}
                            className={`flex justify-between items-center px-6 py-4 ${i !== dynamicOperatingHours.length - 1
                                ? isDark ? "border-b border-white/5" : "border-b border-black/5"
                                : ""}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shrink-0" />
                                <span className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>{item.day}</span>
                            </div>
                            <span className={`text-base ${isDark ? "text-white/50" : "text-black/50"}`}>{item.hours}</span>
                        </div>
                    ))}
                </div>
            </div>

            <hr className={`my-6 border-none h-[1px] ${isDark ? "bg-white/10" : "bg-black/10"}`} />

            {/* Location */}
            <div className="my-6">
                <h4 className={`text-xl font-semibold mb-5 ${isDark ? "text-white" : "text-[#101010]"}`}>
                    Where you&apos;ll be
                </h4>
                <div className="w-full h-[460px] rounded-2xl overflow-hidden">
                    <StudioMap studio={studio} />
                </div>
                <p className={`text-xl font-semibold mt-4 ${isDark ? "text-white" : "text-[#101010]"}`}>
                    {location}
                </p>
                <p className={`text-base mt-2 leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>
                    {locationDescription}
                </p>
                <button className={`text-sm font-medium flex items-center gap-1 mt-3 ${isDark ? "text-[#E5D5B8]" : "text-[#101010]"}`}>
                    Show more <span className="text-xs">{">"}</span>
                </button>
            </div>

            <hr className={`my-6 border-none h-[1px] ${isDark ? "bg-white/10" : "bg-black/10"}`} />

            {/* Reviews */}
            <div className="my-6" style={{ background: '#000', padding: '24px 20px', borderRadius: 12 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                    <span style={{ color: '#C8A96E', fontSize: 16 }}>*</span>
                    <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>5.0</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 400 }}>- 7 reviews</span>
                </div>

                {/* Rating Bars */}
                {["Cleanliness", "Communication", "Check-in"].map((label) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, minWidth: 120, flexShrink: 0 }}>{label}</span>
                        <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.18)', borderRadius: 2, maxWidth: 160 }}>
                            <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 2 }} />
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, minWidth: 28, textAlign: 'right' }}>5.0</span>
                    </div>
                ))}

                {/* Reviews List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 28 }}>
                    {[
                        { name: "Jose", date: "December 2021", review: "Host was very attentive.", showMore: false },
                        { name: "Shayna", date: "December 2021", review: "Wonderful neighborhood, easy access to restaurants and the subway, cozy studio apartment with a super comfortable bed. Great host, super helpful and responsive. Cool murphy bed...", showMore: true },
                        { name: "Vladko", date: "November 2020", review: "This is amazing place. It has everything one needs for a monthly business stay. Very clean and organized place. Amazing hospitality affordable price.", showMore: false },
                    ].map((r) => (
                        <div key={r.name}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                <img
                                    src={`https://i.pravatar.cc/44?u=${r.name}`}
                                    alt={r.name}
                                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>{r.name}</p>
                                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{r.date}</p>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{r.review}</p>
                            {r.showMore && (
                                <a style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 14, fontWeight: 500, color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>
                                    Show more <span style={{ fontSize: 12 }}>{">"}</span>
                                </a>
                            )}
                        </div>
                    ))}
                </div>

                {/* Button */}
                <button style={{ marginTop: 24, padding: '10px 20px', background: '#E5D5B8', color: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                    Show all 12 reviews
                </button>
            </div>
        </div>
    );
}
