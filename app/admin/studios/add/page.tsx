"use client";

import { useCallback, useState, useEffect, useMemo, useRef, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, CalendarDays, Check, ChevronDown, Clapperboard, PartyPopper, Trash2, Users } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DottedDivider from "@/components/admin/DottedDivider";
import { studioApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    LocationPicker,
    darkThemeColors,
} from "@/src/components/booking/v2/component/LocationPicker";

type LooseRecord = Record<string, unknown>;

const asRecord = (value: unknown): LooseRecord | null =>
    typeof value === "object" && value !== null ? value as LooseRecord : null;

const getStudioDraftCacheKey = (studioId: string | number) =>
    `revure_admin_studio_form_${studioId}`;

const toInputValue = (value: unknown) =>
    value === null || value === undefined ? "" : String(value);

const parseStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value !== "string" || !value.trim()) return [];

    try {
        const parsedValue = JSON.parse(value);
        return Array.isArray(parsedValue) ? parsedValue.map(String).filter(Boolean) : [];
    } catch {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
};

const activityLabels = ["Production", "Event", "Recreation", "Meetings"];
const amenityLabels = ["WiFi", "Hot Tub", "Fire Pit", "Pool Table", "BBQ Grill", "Indoor Fireplace", "Gym", "Patio", "Pool", "Outdoor Dining Area"];
const spaceTagLabels = ["Peaceful", "Podcast Friendly", "Spacious", "Pet Friendly", "Natural Lightning", "Luxury"];

export default function AddStudioPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";
    const searchParams = useSearchParams();
    const editId = searchParams.get("editId");
    const isEditMode = !!editId;

    const [view, setView] = useState<"address" | "info" | "facilities" | "step2" | "step2Details" | "step2Hours" | "step3Budget" | "step3Policies">("address");
    const isFlatStep = view === "step2" || view === "step2Details" || view === "step2Hours" || view === "step3Budget" || view === "step3Policies";

    // ── Step 1 State ──────────────────────────────────────────────────
    const [country, setCountry] = useState("United States");
    const [address, setAddress] = useState("");
    const [apartment, setApartment] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");
    type StudioLocationDetails = {
        lat?: number;
        lng?: number;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
        center?: [number, number];
        context?: Array<{
            id?: string;
            text?: string;
            short_code?: string;
        }>;
        place_name?: string;
    };
    const [studioLocationDetails, setStudioLocationDetails] =
        useState<StudioLocationDetails | null>(null);

    // ── Step 1 / Info State ───────────────────────────────────────────
    const [spaceTitle, setSpaceTitle] = useState("");
    const [brandName, setBrandName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [suggestType, setSuggestType] = useState("");
    const [propertySize, setPropertySize] = useState("");
    const [height, setHeight] = useState("");
    const [width, setWidth] = useState("");
    const [length, setLength] = useState("");
    const [maxFloor, setMaxFloor] = useState("");
    const [overnightStays, setOvernightStays] = useState(true);
    const [securityCamera, setSecurityCamera] = useState(true);
    const [securityDesc, setSecurityDesc] = useState("");

    // ── Step 1 / Facilities State ─────────────────────────────────────
    const [parkingOptions, setParkingOptions] = useState<string[]>([]);
    const [parkingDesc, setParkingDesc] = useState("");
    const [accessAvailability, setAccessAvailability] = useState(false);
    const [accessOptions, setAccessOptions] = useState<string[]>([]);
    const [generalFacilities, setGeneralFacilities] = useState(false);
    const [photoFeatures, setPhotoFeatures] = useState(false);
    const [videoFeatures, setVideoFeatures] = useState(false);
    const [podcastFeatures, setPodcastFeatures] = useState(false);
    const [productFeatures, setProductFeatures] = useState(false);

    // ── Step 2 State ──────────────────────────────────────────────────
    const [mediaFiles, setMediaFiles] = useState<{ url: string; type: "image" | "video"; _file?: File }[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorTopRef = useRef<HTMLDivElement>(null);
    const didApplyPolicyFallbackRef = useRef(false);
    const [preferredAge, setPreferredAge] = useState("");
    const [wifiName, setWifiName] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [hostActivities, setHostActivities] = useState(true);
    const [activityOptions, setActivityOptions] = useState({
        Production: true,
        Event: true,
        Recreation: true,
        Meetings: true,
    });
    const [spaceBasics, setSpaceBasics] = useState({
        Guests: 0,
        Bedrooms: 0,
        Beds: 0,
        Bathrooms: 0,
    });
    const [amenities, setAmenities] = useState<string[]>([]);
    const [spaceTags, setSpaceTags] = useState<string[]>([]);
    const [hoursMode, setHoursMode] = useState<"24" | "custom">("custom");
    const [operatingDays, setOperatingDays] = useState<string[]>([]);
    const [closedDays, setClosedDays] = useState<string[]>([]);
    const [setHoursDays, setSetHoursDays] = useState<string[]>(["Monday"]);
    const [selectedStudio, setSelectedStudio] = useState("");
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [spaceRules, setSpaceRules] = useState<Record<string, boolean>>({
        "Smoking and Drugs Allowed": false,
        "Alcohol Allowed": true,
        "Cooking Allowed": true,
        "Electricity usage Allowed": true,
        "External Food /Catering Allowed": false,
        "Pets Allowed": false,
    });
    const [customRule, setCustomRule] = useState("");
    const [hourlyRate, setHourlyRate] = useState("");
    const [overtimeRate, setOvertimeRate] = useState("");
    const [minimumBooking, setMinimumBooking] = useState("");
    const [bufferTime, setBufferTime] = useState("");
    const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({
        Production: true,
        Audio: false,
        Events: false,
    });
    const [equipmentEnabled, setEquipmentEnabled] = useState(true);
    const [equipmentName, setEquipmentName] = useState("");
    const [equipmentCost, setEquipmentCost] = useState("");
    const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
    const [isSavingStudio, setIsSavingStudio] = useState(false);

    const getEditStudioRecord = useCallback((response: unknown): LooseRecord | null => {
        const responseRecord = asRecord(response);
        const data = responseRecord?.data ?? response;
        if (Array.isArray(data)) {
            const match = data.find((item) => String(asRecord(item)?.id) === String(editId));
            return asRecord(match ?? data[0]) ?? null;
        }
        return asRecord(data);
    }, [editId]);

    const parseAdditionalInfo = (value: unknown) => {
        if (typeof value !== "string") return;

        value.split("\n").forEach((line) => {
            const [label, ...rest] = line.split(":");
            const content = rest.join(":").trim();
            const normalizedLabel = label.trim().toLowerCase();

            if (normalizedLabel === "brand") setBrandName(content);
            if (normalizedLabel === "preferred age") setPreferredAge(content);
            if (normalizedLabel === "wifi") setWifiName(content);
            if (normalizedLabel === "parking") setParkingDesc(content);
            if (normalizedLabel === "security camera") {
                setSecurityCamera(Boolean(content));
                setSecurityDesc(content === "Yes" ? "" : content);
            }
        });
    };

    const applyCachedFormState = useCallback((cachedStudio: LooseRecord | null) => {
        const form = asRecord(cachedStudio?.__form);
        if (!form) return;

        setCountry(toInputValue(form.country) || "United States");
        setAddress(toInputValue(form.address));
        setApartment(toInputValue(form.apartment));
        setCity(toInputValue(form.city));
        setState(toInputValue(form.state));
        setZipCode(toInputValue(form.zipCode));
        setSpaceTitle(toInputValue(form.spaceTitle));
        setBrandName(toInputValue(form.brandName));
        setDescription(toInputValue(form.description));
        setSelectedTypes(parseStringList(form.selectedTypes));
        setSuggestType(toInputValue(form.suggestType));
        setPropertySize(toInputValue(form.propertySize));
        setHeight(toInputValue(form.height));
        setWidth(toInputValue(form.width));
        setLength(toInputValue(form.length));
        setMaxFloor(toInputValue(form.maxFloor));
        setOvernightStays(Boolean(form.overnightStays));
        setSecurityCamera(Boolean(form.securityCamera));
        setSecurityDesc(toInputValue(form.securityDesc));
        setParkingOptions(parseStringList(form.parkingOptions));
        setParkingDesc(toInputValue(form.parkingDesc));
        setAccessAvailability(Boolean(form.accessAvailability));
        setAccessOptions(parseStringList(form.accessOptions));
        setGeneralFacilities(Boolean(form.generalFacilities));
        setPhotoFeatures(Boolean(form.photoFeatures));
        setVideoFeatures(Boolean(form.videoFeatures));
        setPodcastFeatures(Boolean(form.podcastFeatures));
        setProductFeatures(Boolean(form.productFeatures));

        if (Array.isArray(form.mediaFiles)) {
            setMediaFiles(form.mediaFiles.map((item) => {
                const media = asRecord(item) ?? {};
                return {
                    url: toInputValue(media.url),
                    type: toInputValue(media.type) === "video" ? "video" : "image",
                };
            }).filter((item) => item.url));
        }

        setPreferredAge(toInputValue(form.preferredAge));
        setWifiName(toInputValue(form.wifiName));
        setWifiPassword(toInputValue(form.wifiPassword));
        setHostActivities(Boolean(form.hostActivities));
        const cachedActivityOptions = asRecord(form.activityOptions);
        if (cachedActivityOptions) {
            setActivityOptions({
                Production: Boolean(cachedActivityOptions.Production),
                Event: Boolean(cachedActivityOptions.Event),
                Recreation: Boolean(cachedActivityOptions.Recreation),
                Meetings: Boolean(cachedActivityOptions.Meetings),
            });
        }

        const cachedSpaceBasics = asRecord(form.spaceBasics);
        if (cachedSpaceBasics) {
            setSpaceBasics({
                Guests: Number(cachedSpaceBasics.Guests) || 0,
                Bedrooms: Number(cachedSpaceBasics.Bedrooms) || 0,
                Beds: Number(cachedSpaceBasics.Beds) || 0,
                Bathrooms: Number(cachedSpaceBasics.Bathrooms) || 0,
            });
        }

        setAmenities(parseStringList(form.amenities));
        setSpaceTags(parseStringList(form.spaceTags));
        setHoursMode(toInputValue(form.hoursMode) === "24" ? "24" : "custom");
        setOperatingDays(parseStringList(form.operatingDays));
        setClosedDays(parseStringList(form.closedDays));
        setSetHoursDays(parseStringList(form.setHoursDays).length ? parseStringList(form.setHoursDays) : ["Monday"]);
        setSelectedStudio(toInputValue(form.selectedStudio));
        setOpeningTime(toInputValue(form.openingTime));
        setClosingTime(toInputValue(form.closingTime));

        const cachedRules = asRecord(form.spaceRules);
        if (cachedRules) {
            setSpaceRules({
                "Smoking and Drugs Allowed": Boolean(cachedRules["Smoking and Drugs Allowed"]),
                "Alcohol Allowed": Boolean(cachedRules["Alcohol Allowed"]),
                "Cooking Allowed": Boolean(cachedRules["Cooking Allowed"]),
                "Electricity usage Allowed": Boolean(cachedRules["Electricity usage Allowed"]),
                "External Food /Catering Allowed": Boolean(cachedRules["External Food /Catering Allowed"]),
                "Pets Allowed": Boolean(cachedRules["Pets Allowed"]),
            });
        }
        setCustomRule(toInputValue(form.customRule));
        setHourlyRate(toInputValue(form.hourlyRate));
        setOvertimeRate(toInputValue(form.overtimeRate));
        setMinimumBooking(toInputValue(form.minimumBooking));
        setBufferTime(toInputValue(form.bufferTime));
        setEquipmentEnabled(Boolean(form.equipmentEnabled));
        setEquipmentName(toInputValue(form.equipmentName));
        setEquipmentCost(toInputValue(form.equipmentCost));

        if (Array.isArray(form.studioCategories)) {
            setStudioCategories(form.studioCategories.map((item) => {
                const category = asRecord(item) ?? {};
                return {
                    id: toInputValue(category.id),
                    label: toInputValue(category.label),
                    pricePerHour: Number(category.pricePerHour) || 0,
                    minHours: Number(category.minHours) || 1,
                    maxPeople: Number(category.maxPeople) || 1,
                    isSelected: Boolean(category.isSelected),
                    includes: parseStringList(category.includes),
                };
            }).filter((category) => category.id && category.label));
        }

        if (Array.isArray(form.studioEquipments)) {
            const cachedEquipments = form.studioEquipments.map((item) => {
                const equipment = asRecord(item) ?? {};
                const price = Number(equipment.price ?? equipment.baseCost) || 0;
                return {
                    id: toInputValue(equipment.id),
                    name: toInputValue(equipment.name),
                    baseCost: Number(equipment.baseCost) || price,
                    price,
                };
            }).filter((equipment) => equipment.id && equipment.name);
            setStudioEquipments(cachedEquipments);
        }

        const cachedEquipmentPriceInputs = asRecord(form.equipmentPriceInputs);
        if (cachedEquipmentPriceInputs) {
            setEquipmentPriceInputs(Object.fromEntries(
                Object.entries(cachedEquipmentPriceInputs).map(([key, value]) => [key, toInputValue(value)]),
            ));
        }
        setSelectedPolicies(parseStringList(form.selectedPolicies));
    }, []);

    const getCachedStudioForm = useCallback((studioId: string | number): LooseRecord | null => {
        if (typeof window === "undefined") return null;

        try {
            return asRecord(JSON.parse(window.localStorage.getItem(getStudioDraftCacheKey(studioId)) || "null"));
        } catch (error) {
            console.error("Failed to read cached studio form", error);
            return null;
        }
    }, []);

    const saveCachedStudioForm = (studioId: string | number, payload: LooseRecord) => {
        if (typeof window === "undefined") return;

        try {
            window.localStorage.setItem(getStudioDraftCacheKey(studioId), JSON.stringify(payload));
        } catch (error) {
            console.error("Failed to cache studio form", error);
        }
    };


    useEffect(() => {
        if (!editId) return;
        const fetchStudio = async () => {
            try {
                const res = await studioApi.getStudioById(Number(editId));
                const apiStudio = getEditStudioRecord(res);
                const cachedStudio = getCachedStudioForm(editId);
                const s = apiStudio || cachedStudio
                    ? { ...(apiStudio ?? {}), ...(cachedStudio ?? {}) }
                    : null;
                if (!s) return;

                const addressData = { ...s, ...(asRecord(s.address) ?? {}) };
                const infoData = { ...s, ...(asRecord(s.info) ?? {}) };
                const budgetData = { ...s, ...(asRecord(s.budget) ?? {}) };
                const categories = Array.isArray(budgetData.categories)
                    ? budgetData.categories
                    : Array.isArray(s.categories)
                        ? s.categories
                        : [];

                const cityValue = toInputValue(addressData.city);
                const stateValue = toInputValue(addressData.state);
                const countryValue = toInputValue(addressData.country) || "United States";
                const addressValue = toInputValue(addressData.address_line1 ?? addressData.address) ||
                    [cityValue, stateValue, countryValue].filter(Boolean).join(", ");

                setAddress(addressValue);
                setApartment(toInputValue(addressData.address_line2 ?? addressData.apartment));
                setCity(cityValue);
                setState(stateValue);
                setCountry(countryValue);
                setZipCode(toInputValue(addressData.postal_code ?? addressData.zip_code));

                const latitude = Number(addressData.latitude);
                const longitude = Number(addressData.longitude);
                if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                    setStudioLocationDetails({
                        lat: latitude,
                        lng: longitude,
                        coordinates: { lat: latitude, lng: longitude },
                    });
                }

                setSpaceTitle(
                    toInputValue(infoData.studio_name ?? infoData.space_title) ||
                    toInputValue(infoData.brand_name) ||
                    (cityValue ? `Studio - ${cityValue}` : ""),
                );
                setBrandName(toInputValue(infoData.brand_name));
                setDescription(toInputValue(infoData.description));
                if (infoData.studio_type || infoData.suggest_type) {
                    const types = toInputValue(infoData.studio_type ?? infoData.suggest_type)
                        .split(",")
                        .map((t: string) => t.trim())
                        .filter(Boolean);
                    const known = ["Photography", "Product Shoot", "Videography", "Podcast"];
                    setSelectedTypes(types.filter((t: string) => known.includes(t)));
                    const custom = types.find((t: string) => !known.includes(t));
                    if (custom) setSuggestType(custom);
                }
                setPropertySize(toInputValue(infoData.size_sqft ?? infoData.property_size));
                setHeight(toInputValue(infoData.height));
                setWidth(toInputValue(infoData.width));
                setLength(toInputValue(infoData.length));
                setMaxFloor(toInputValue(infoData.max_floor ?? s.floor_level));
                setOvernightStays(Boolean(infoData.overnight_stays));
                setSecurityCamera(Boolean(infoData.security_camera));
                setSecurityDesc(toInputValue(infoData.security_desc));
                parseAdditionalInfo(s.additional_info);

                const detailsData = asRecord(s.details);
                if (detailsData) {
                    const g = Number(detailsData.guests);
                    const br = Number(detailsData.bedrooms);
                    const bd = Number(detailsData.beds);
                    const ba = Number(detailsData.bathrooms);
                    setSpaceBasics({
                        Guests: g > 0 ? g : 0,
                        Bedrooms: br > 0 ? br : 0,
                        Beds: bd > 0 ? bd : 0,
                        Bathrooms: ba > 0 ? ba : 0,
                    });
                }

                const capacityValue = Number(infoData.capacity);
                if (Number.isFinite(capacityValue) && capacityValue > 0) {
                    setSpaceBasics(prev => ({ ...prev, Guests: capacityValue }));
                }

                const media = Array.isArray(s.media) ? s.media.map(asRecord).filter(Boolean) : [];
                if (media.length) {
                    setMediaFiles(media.map((m) => ({
                        url: toInputValue(m?.url),
                        type: toInputValue(m?.type) === "video" ? "video" : "image",
                    })));
                }

                setHourlyRate(toInputValue(budgetData.hourly_rate));
                setOvertimeRate(toInputValue(budgetData.overtime_rate));
                if (budgetData.minimum_booking) {
                    const minBooking = Number.parseInt(String(budgetData.minimum_booking), 10);
                    setMinimumBooking(`${minBooking} hour${minBooking > 1 ? "s" : ""}`);
                }
                if (budgetData.buffer_time) setBufferTime(`${Number.parseInt(String(budgetData.buffer_time), 10)} minutes`);

                if (categories.length) {
                    const allCategoryIncludes = categories
                        .map(asRecord)
                        .flatMap((category) => parseStringList(category?.includes));
                    const selectedActivities = activityLabels.filter((label) => allCategoryIncludes.includes(label));
                    const selectedAmenities = amenityLabels.filter((label) => allCategoryIncludes.includes(label));
                    const selectedSpaceTags = spaceTagLabels.filter((label) => allCategoryIncludes.includes(label));

                    if (selectedActivities.length) {
                        setHostActivities(true);
                        setActivityOptions({
                            Production: selectedActivities.includes("Production"),
                            Event: selectedActivities.includes("Event"),
                            Recreation: selectedActivities.includes("Recreation"),
                            Meetings: selectedActivities.includes("Meetings"),
                        });
                    }
                    if (selectedAmenities.length) setAmenities(selectedAmenities);
                    if (selectedSpaceTags.length) setSpaceTags(selectedSpaceTags.slice(0, 2));

                    const maxPeople = Math.max(
                        ...categories.map(asRecord).map((category) => Number(category?.max_people) || 0),
                    );
                    if (maxPeople > 0) setSpaceBasics((prev) => ({ ...prev, Guests: maxPeople }));

                    setStudioCategories(prev => prev.map(cat => {
                        const match = categories
                            .map(asRecord)
                            .find((c) => toInputValue(c?.name).toLowerCase() === cat.label.toLowerCase());
                        if (!match) return cat;
                        return {
                            ...cat,
                            isSelected: Boolean(match.is_selected ?? true),
                            pricePerHour: Number(match.price_per_hour ?? cat.pricePerHour),
                            minHours: Number(match.min_hours ?? cat.minHours),
                            maxPeople: Number(match.max_people ?? cat.maxPeople),
                            includes: parseStringList(match.includes).length
                                ? parseStringList(match.includes)
                                : cat.includes,
                        };
                    }));
                }

                const equipment = Array.isArray(s.equipment) ? s.equipment : [];
                if (equipment.length) {
                    const equips = equipment.map((item, i: number) => {
                        const eq = asRecord(item) ?? {};
                        const cost = Number(eq.cost ?? 0);
                        return {
                            id: `eq-${i}`,
                            name: toInputValue(eq.name),
                            baseCost: cost,
                            price: cost,
                        };
                    });
                    setStudioEquipments(equips);
                    const inputs: Record<string, string> = {};
                    equips.forEach((eq: { id: string; baseCost: number }) => { inputs[eq.id] = (eq.baseCost ?? 0).toFixed(2); });
                    setEquipmentPriceInputs(inputs);
                }

                const policies = parseStringList(s.selected_policies);
                if (policies.length) setSelectedPolicies(policies);

                const hours = Array.isArray(s.hours) ? s.hours.map(asRecord).filter(Boolean) : [];
                if (hours.length) {
                    const openDays = hours.filter((h) => Boolean(h?.is_open)).map((h) => toInputValue(h?.day));
                    setOperatingDays(openDays);
                    const customHours: Record<string, { openingTime: string; closingTime: string }> = {};
                    hours.forEach((h) => {
                        if (h?.is_open && !h.is_24hrs && h.opening_time && h.closing_time) {
                            customHours[toInputValue(h.day)] = {
                                openingTime: toInputValue(h.opening_time),
                                closingTime: toInputValue(h.closing_time),
                            };
                        }
                    });
                    setSavedCustomHours(customHours);
                    if (hours.some((h) => Boolean(h?.is_24hrs))) setHoursMode("24");
                }

                const rules = asRecord(s.rules);
                if (rules) {
                    setSpaceRules({
                        "Smoking and Drugs Allowed": Boolean(rules.smoking_allowed ?? false),
                        "Alcohol Allowed": Boolean(rules.alcohol_allowed ?? true),
                        "Cooking Allowed": true,
                        "Electricity usage Allowed": Boolean(rules.loud_music_allowed ?? true),
                        "External Food /Catering Allowed": Boolean(rules.outside_food_allowed ?? false),
                        "Pets Allowed": Boolean(rules.pets_allowed ?? false),
                    });
                    if (rules.custom_rule) setCustomRule(toInputValue(rules.custom_rule));
                }

                const facilities = Array.isArray(s.facilities) ? s.facilities.map(asRecord).filter(Boolean) : [];
                if (facilities.length) {
                    const parkings = facilities
                        .map((f) => toInputValue(f?.facility_name))
                        .filter((facility) => facility.startsWith("Parking - "))
                        .map((facility) => facility.replace("Parking - ", ""));
                    if (parkings.length) setParkingOptions(parkings);

                    const accesses = facilities
                        .map((f) => toInputValue(f?.facility_name))
                        .filter((facility) => facility.startsWith("Access - "))
                        .map((facility) => facility.replace("Access - ", ""));
                    if (accesses.length) { setAccessAvailability(true); setAccessOptions(accesses); }

                    const facilityMap: Record<string, (v: boolean) => void> = {
                        "General Facilities": setGeneralFacilities,
                        "Photo Features": setPhotoFeatures,
                        "Video Features": setVideoFeatures,
                        "Podcast Features": setPodcastFeatures,
                        "Product Features": setProductFeatures,
                    };
                    facilities.forEach((f) => {
                        const facilityName = toInputValue(f?.facility_name);
                        if (facilityMap[facilityName]) facilityMap[facilityName](Boolean(f?.is_available));
                    });
                }
                applyCachedFormState(cachedStudio);
            } catch (err) {
                console.error("Failed to fetch studio for edit", err);
                toast.error("Failed to load studio data");
            }
        };
        void fetchStudio();
    }, [applyCachedFormState, editId, getCachedStudioForm, getEditStudioRecord]);
    
    type StudioCategory = {
        id: string;
        label: string;
        pricePerHour: number;
        minHours: number;
        maxPeople: number;
        isSelected: boolean;
        includes: string[];
    };
    type StudioEquipment = {
        id: string;
        name: string;
        baseCost: number;
        price: number;
    };
    const [studioCategories, setStudioCategories] = useState<StudioCategory[]>([
        {
            id: "production",
            label: "Production",
            pricePerHour: 50,
            minHours: 2,
            maxPeople: 6,
            isSelected: true,
            includes: ["Photo Shoots", "Video Shoots", "Product Shoots"],
        },
        {
            id: "audio",
            label: "Audio",
            pricePerHour: 40,
            minHours: 2,
            maxPeople: 4,
            isSelected: false,
            includes: ["Podcast", "Voiceover", "Audio Recording"],
        },
        {
            id: "events",
            label: "Events",
            pricePerHour: 120,
            minHours: 3,
            maxPeople: 20,
            isSelected: false,
            includes: ["Workshops", "Small Events", "Meetings"],
        },
    ]);
    const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
    const [activeCategoryForm, setActiveCategoryForm] = useState<string | null>(null);
    const [studioEquipments, setStudioEquipments] = useState<StudioEquipment[]>([
        { id: "green-screen", name: "Green Screen", baseCost: 300, price: 0 },
    ]);
    const [equipmentPriceInputs, setEquipmentPriceInputs] = useState<Record<string, string>>({
        "green-screen": "0.00",
    });
    const [savedCustomHours, setSavedCustomHours] = useState<
        Record<string, { openingTime: string; closingTime: string }>
    >({});

    // ── Progress ──────────────────────────────────────────────────────
    const progressSegmentWidths =
        view === "address" ? ["33%", "0%", "0%"] :
            view === "info" ? ["60%", "0%", "0%"] :
                view === "facilities" ? ["100%", "0%", "0%"] :
                    view === "step2" ? ["100%", "60%", "0%"] :
                        view === "step2Details" ? ["100%", "70%", "0%"] :
                            view === "step2Hours" ? ["100%", "100%", "0%"] :
                                view === "step3Budget" ? ["100%", "100%", "70%"] :
                                    ["100%", "100%", "100%"];

    const stepLabel =
        view === "address" ? "Step 1 - 0% Completed" :
            view === "info" ? "Step 1 - 40% Completed" :
                view === "facilities" ? "Step 1 - 50% Completed" :
                    view === "step2" ? "Step 2 - 60% Completed" :
                        view === "step2Details" ? "Step 2 - 70% Completed" :
                            view === "step2Hours" ? "Step 2 - 80% Completed" :
                                view === "step3Budget" ? "Step 3 - 90% Completed" :
                                    "Step 3 - 100% Completed";

    const scrollEditorToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        editorTopRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    }, []);

    useEffect(() => {
        const frame = window.requestAnimationFrame(scrollEditorToTop);
        return () => window.cancelAnimationFrame(frame);
    }, [scrollEditorToTop, view]);

    useEffect(() => {
        const normalizedAddress = address.trim().toLowerCase();
        if (!normalizedAddress) return;

        if (normalizedAddress.includes("ahmedabad") || normalizedAddress.includes("amdavad")) {
            setCountry("India");
            setCity((current) => current.trim() || "Ahmedabad");
            setState("Gujarat");
        } else if (normalizedAddress.includes("los angeles")) {
            setCountry("United States");
            setCity((current) => current.trim() || "Los Angeles");
            setState("CA");
        } else if (normalizedAddress.includes("new york")) {
            setCountry("United States");
            setCity((current) => current.trim() || "New York");
            setState("NY");
        }
    }, [address]);

    const getLocationContextText = (
        details: StudioLocationDetails | null,
        contextKey: string,
    ) =>
        details?.context?.find((item) => item.id?.startsWith(contextKey))?.text?.trim() ||
        "";

    const applyStudioLocation = (
        selectedAddress: string,
        details?: StudioLocationDetails,
    ) => {
        setAddress(selectedAddress);
        setStudioLocationDetails(details || null);

        if (!details) {
            return;
        }

        const nextCity =
            getLocationContextText(details, "place") ||
            getLocationContextText(details, "locality");
        const nextState =
            getLocationContextText(details, "region") ||
            getLocationContextText(details, "district");
        const nextCountry = getLocationContextText(details, "country");
        const nextPostalCode = getLocationContextText(details, "postcode");

        if (nextCity) setCity(nextCity);
        if (nextState) {
            const stateMap: Record<string, string> = {
                california: "CA",
                "new york": "NY",
                texas: "TX",
                florida: "FL",
                gujarat: "Gujarat",
                maharashtra: "Maharashtra",
                delhi: "Delhi",
            };
            setState(stateMap[nextState.toLowerCase()] || nextState);
        }
        if (nextCountry) setCountry(nextCountry);
        if (nextPostalCode) setZipCode(nextPostalCode);
    };

    const getStudioLatitude = () =>
        studioLocationDetails?.coordinates?.lat ??
        studioLocationDetails?.lat ??
        studioLocationDetails?.center?.[1];

    const getStudioLongitude = () =>
        studioLocationDetails?.coordinates?.lng ??
        studioLocationDetails?.lng ??
        studioLocationDetails?.center?.[0];

    const parseNumberInput = (value: string) => {
        const parsedValue = Number.parseFloat(value.replace(/[^\d.]/g, ""));
        return Number.isFinite(parsedValue) ? parsedValue : 0;
    };

    const getLoggedInUserId = () => {
        if (typeof window === "undefined") return null;

        try {
            const storedUser = window.localStorage.getItem("revure_user");
            if (!storedUser) return null;

            const parsedUser = JSON.parse(storedUser) as {
                id?: string | number;
                user_id?: string | number;
                userId?: string | number;
            };
            const numericUserId = Number(
                parsedUser.id ?? parsedUser.user_id ?? parsedUser.userId,
            );

            return Number.isInteger(numericUserId) && numericUserId > 0
                ? numericUserId
                : null;
        } catch (error) {
            console.error("Failed to read revure_user", error);
            return null;
        }
    };

    type StudioApiResponse = {
        success?: boolean;
        error?: string;
        data?: {
            studio_id?: string | number;
            id?: string | number;
        } | null;
        studio_id?: string | number;
        id?: string | number;
    };

    const extractStudioId = (response: StudioApiResponse) => {
        const value =
            response?.data?.studio_id ??
            response?.data?.id ??
            response?.studio_id ??
            response?.id;
        const numericStudioId = Number(value);
        return Number.isInteger(numericStudioId) && numericStudioId > 0
            ? numericStudioId
            : null;
    };

    const getCurrentStepValidationMessage = () => {
        if (view === "address") {
            if (!address.trim()) return "Address is required";
            if (!city.trim()) return "City is required";
            if (!state.trim()) return "State is required";
            if (!isEditMode && !zipCode.trim()) return "Postal code is required";
        }

        if (view === "info") {
            if (!isEditMode && !spaceTitle.trim()) return "Studio name is required";
            if (!isEditMode && !description.trim()) return "Description is required";
            if (!isEditMode && selectedTypes.length === 0 && !suggestType.trim()) {
                return "Select or suggest at least one studio type";
            }
        }

        if (!isEditMode && view === "facilities") {
            if (parkingOptions.length === 0) return "Select at least one parking option";
            if (!parkingDesc.trim()) return "Parking description is required";
            if (accessAvailability && accessOptions.length === 0) return "Select at least one access option";
            if (!generalFacilities && !photoFeatures && !videoFeatures && !podcastFeatures && !productFeatures) {
                return "Select at least one studio facility";
            }
        }

        if (view === "step2") {
            if (!isEditMode && mediaFiles.length === 0) return "Add at least one media file";
            if (!isEditMode && !preferredAge) return "Preferred age is required";
            if (!isEditMode && !wifiPassword.trim()) return "Wifi password is required";
        }

        if (view === "step2Details") {
            if (!isEditMode && spaceBasics.Guests <= 0) return "Guest capacity is required";
            if (!isEditMode && hostActivities && !Object.values(activityOptions).some(Boolean)) {
                return "Select at least one activity";
            }
            if (!isEditMode && amenities.length === 0) return "Select at least one amenity";
            if (!isEditMode && spaceTags.length === 0) return "Select at least one space highlight";
        }

        if (view === "step2Hours") {
            if (!isEditMode && operatingDays.length === 0) return "Select at least one operating day";
            if (!isEditMode && hoursMode === "custom" && (!openingTime || !closingTime)) {
                return "Opening and closing times are required";
            }
        }

        if (view === "step3Budget") {
            if (parseNumberInput(hourlyRate) <= 0) return "Hourly rate is required";
            if (!isEditMode && parseNumberInput(overtimeRate) <= 0) return "Overtime rate is required";
            if (!minimumBooking) return "Minimum booking is required";
            if (!bufferTime) return "Buffer time is required";
            if (!studioCategories.some((category) => category.isSelected)) {
                return "Select at least one category";
            }
        }

        if (!isEditMode && view === "step3Policies" && selectedPolicies.length === 0) {
            return "Select at least one policy";
        }

        return "";
    };

    const canContinue = !getCurrentStepValidationMessage();

    const setEditorView = (nextView: typeof view) => {
        setView(nextView);
        window.setTimeout(scrollEditorToTop, 0);
    };

    const handleBack = () => {
        if (view === "step3Policies") setEditorView("step3Budget");
        else if (view === "step3Budget") setEditorView("step2Hours");
        else if (view === "step2Hours") setEditorView("step2Details");
        else if (view === "step2Details") setEditorView("step2");
        else if (view === "step2") setEditorView("facilities");
        else if (view === "facilities") setEditorView("info");
        else if (view === "info") setEditorView("address");
        else router.back();
    };

    const handleSaveStudio = async () => {
        const validationMessage = getCurrentStepValidationMessage();
        if (validationMessage) {
            toast.error(validationMessage);
            return;
        }

        const userId = getLoggedInUserId();
        if (!userId) {
            toast.error("User id is missing. Please log in again.");
            return;
        }

        setIsSavingStudio(true);
        try {
            let studioId: number | null = isEditMode ? Number(editId) : null;

            if (!isEditMode) {
                const createResponse = await studioApi.createStudio(userId);
                if (createResponse?.error || createResponse?.success === false) {
                    throw new Error(createResponse?.error || "Failed to create studio");
                }
                studioId = extractStudioId(createResponse);
                if (!studioId) {
                    throw new Error("Studio created, but studio id was not returned");
                }
            }

            const facilityItems = [
                ...parkingOptions.map((facility) => ({
                    facility_name: `Parking - ${facility}`,
                    is_available: true,
                })),
                ...accessOptions.map((facility) => ({
                    facility_name: `Access - ${facility}`,
                    is_available: true,
                })),
                { facility_name: "General Facilities", is_available: generalFacilities },
                { facility_name: "Photo Features", is_available: photoFeatures },
                { facility_name: "Video Features", is_available: videoFeatures },
                { facility_name: "Podcast Features", is_available: podcastFeatures },
                { facility_name: "Product Features", is_available: productFeatures },
            ];

            const days = [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ];
            const selectedOperatingDays =
                operatingDays.length > 0 ? operatingDays : days.filter((day) => !closedDays.includes(day));

            const fullPayload = {
                address_line1: address.trim(),
                address: address.trim(),
                address_line2: apartment.trim() || undefined,
                apartment: apartment.trim() || undefined,
                city: city.trim(),
                state: state.trim(),
                country: country.trim(),
                postal_code: zipCode.trim(),
                zip_code: zipCode.trim(),
                latitude: getStudioLatitude(),
                longitude: getStudioLongitude(),
                studio_name: spaceTitle.trim(),
                space_title: spaceTitle.trim(),
                brand_name: brandName.trim() || undefined,
                studio_type: [...selectedTypes, suggestType.trim()].filter(Boolean).join(", "),
                suggest_type: suggestType.trim() || undefined,
                description: description.trim(),
                capacity: spaceBasics.Guests || undefined,
                size_sqft: parseNumberInput(propertySize) || undefined,
                property_size: parseNumberInput(propertySize) || undefined,
                height: parseNumberInput(height) || undefined,
                width: parseNumberInput(width) || undefined,
                length: parseNumberInput(length) || undefined,
                max_floor: parseNumberInput(maxFloor) || undefined,
                overnight_stays: overnightStays,
                security_camera: securityCamera,
                security_desc: securityDesc.trim() || undefined,
                facilities: facilityItems,
                media: mediaFiles.map((file, index) => ({ url: file.url, type: file.type, sort_order: index + 1 })),
                parking_available: parkingOptions.length > 0,
                accessibility: accessOptions.join(", ") || undefined,
                floor_level: parseNumberInput(maxFloor) || undefined,
                has_elevator: accessAvailability,
                additional_info: [
                    brandName ? `Brand: ${brandName}` : "",
                    preferredAge ? `Preferred age: ${preferredAge}` : "",
                    wifiName ? `WiFi: ${wifiName}` : "",
                    parkingDesc ? `Parking: ${parkingDesc}` : "",
                    securityCamera ? `Security camera: ${securityDesc || "Yes"}` : "",
                ].filter(Boolean).join("\n"),
                guests: spaceBasics.Guests,
                bedrooms: spaceBasics.Bedrooms,
                beds: spaceBasics.Beds,
                bathrooms: spaceBasics.Bathrooms,
                hours: days.map((day) => {
                    const isOpen = selectedOperatingDays.includes(day) && !closedDays.includes(day);
                    return {
                        day,
                        is_open: isOpen,
                        is_24hrs: isOpen && hoursMode === "24",
                        opening_time: isOpen && hoursMode === "custom" ? savedCustomHours[day]?.openingTime || openingTime || null : null,
                        closing_time: isOpen && hoursMode === "custom" ? savedCustomHours[day]?.closingTime || closingTime || null : null,
                    };
                }),
                rules: {
                    smoking_allowed: Boolean(spaceRules["Smoking and Drugs Allowed"]),
                    alcohol_allowed: Boolean(spaceRules["Alcohol Allowed"]),
                    pets_allowed: Boolean(spaceRules["Pets Allowed"]),
                    loud_music_allowed: Boolean(spaceRules["Electricity usage Allowed"]),
                    outside_food_allowed: Boolean(spaceRules["External Food /Catering Allowed"]),
                    custom_rule: customRule.trim() || undefined,
                },
                hourly_rate: parseNumberInput(hourlyRate),
                overtime_rate: parseNumberInput(overtimeRate) || undefined,
                minimum_booking: parseNumberInput(minimumBooking) || undefined,
                buffer_time: parseNumberInput(bufferTime) || undefined,
                categories: studioCategories.filter((c) => c.isSelected).map((c) => ({
                    name: c.label,
                    price_per_hour: c.pricePerHour,
                    min_hours: c.minHours,
                    max_people: c.maxPeople || undefined,
                    is_selected: c.isSelected,
                    includes: [
                        ...c.includes,
                        ...Object.entries(activityOptions).filter(([, v]) => v).map(([k]) => k),
                        ...amenities,
                        ...spaceTags,
                    ],
                })),
                equipment: equipmentEnabled ? studioEquipments.map((e) => ({ name: e.name, cost: e.price })) : [],
                selected_policies: selectedPolicies,
            };

            if (isEditMode) {
                const updateRes = await studioApi.updateStudio(studioId!, fullPayload) as StudioApiResponse;
                if (updateRes?.error || updateRes?.success === false) {
                    throw new Error(updateRes?.error || "Failed to update studio");
                }
            } else {
                const apiSteps = [
                    studioApi.saveAddress(studioId!, {
                        address_line1: fullPayload.address_line1,
                        address: fullPayload.address,
                        address_line2: fullPayload.address_line2,
                        apartment: fullPayload.apartment,
                        city: fullPayload.city,
                        state: fullPayload.state,
                        country: fullPayload.country,
                        postal_code: fullPayload.postal_code,
                        latitude: fullPayload.latitude,
                        longitude: fullPayload.longitude,
                    }),
                    studioApi.saveInfo(studioId!, {
                        studio_name: fullPayload.studio_name,
                        space_title: fullPayload.space_title,
                        brand_name: fullPayload.brand_name,
                        studio_type: fullPayload.studio_type,
                        suggest_type: fullPayload.suggest_type,
                        description: fullPayload.description,
                        capacity: fullPayload.capacity,
                        size_sqft: fullPayload.size_sqft,
                        property_size: fullPayload.property_size,
                        height: fullPayload.height,
                        width: fullPayload.width,
                        length: fullPayload.length,
                        max_floor: fullPayload.max_floor,
                        overnight_stays: fullPayload.overnight_stays,
                        security_camera: fullPayload.security_camera,
                        security_desc: fullPayload.security_desc,
                    }),
                    studioApi.saveFacilities(studioId!, { facilities: fullPayload.facilities }),
                    studioApi.saveMedia(studioId!, { media: fullPayload.media }),
                    studioApi.saveDetails(studioId!, {
                        parking_available: fullPayload.parking_available,
                        accessibility: fullPayload.accessibility,
                        floor_level: fullPayload.floor_level,
                        has_elevator: fullPayload.has_elevator,
                        additional_info: fullPayload.additional_info,
                        guests: spaceBasics.Guests,        
                        bedrooms: spaceBasics.Bedrooms,   
                        beds: spaceBasics.Beds,           
                        bathrooms: spaceBasics.Bathrooms,
                    }),
                    studioApi.saveHoursAndRules(studioId!, { hours: fullPayload.hours, rules: fullPayload.rules }),
                    studioApi.saveBudget(studioId!, {
                        hourly_rate: fullPayload.hourly_rate,
                        overtime_rate: fullPayload.overtime_rate,
                        minimum_booking: fullPayload.minimum_booking,
                        buffer_time: fullPayload.buffer_time,
                        categories: fullPayload.categories,
                        equipment: fullPayload.equipment,
                    }),
                    studioApi.savePolicies(studioId!, { selected_policies: fullPayload.selected_policies }),
                ];
                const responses = await Promise.all(apiSteps);
                const failedResponse = (responses as StudioApiResponse[]).find(
                    (r) => r?.error || r?.success === false,
                );
                if (failedResponse) {
                    throw new Error(failedResponse.error || "Failed to save studio");
                }
            }

            const formCachePayload = {
                ...fullPayload,
                __form: {
                    country,
                    address,
                    apartment,
                    city,
                    state,
                    zipCode,
                    spaceTitle,
                    brandName,
                    description,
                    selectedTypes,
                    suggestType,
                    propertySize,
                    height,
                    width,
                    length,
                    maxFloor,
                    overnightStays,
                    securityCamera,
                    securityDesc,
                    parkingOptions,
                    parkingDesc,
                    accessAvailability,
                    accessOptions,
                    generalFacilities,
                    photoFeatures,
                    videoFeatures,
                    podcastFeatures,
                    productFeatures,
                    mediaFiles,
                    preferredAge,
                    wifiName,
                    wifiPassword,
                    hostActivities,
                    activityOptions,
                    spaceBasics,
                    amenities,
                    spaceTags,
                    hoursMode,
                    operatingDays,
                    closedDays,
                    setHoursDays,
                    selectedStudio,
                    openingTime,
                    closingTime,
                    spaceRules,
                    customRule,
                    hourlyRate,
                    overtimeRate,
                    minimumBooking,
                    bufferTime,
                    categoryOpen,
                    equipmentEnabled,
                    equipmentName,
                    equipmentCost,
                    studioCategories,
                    categoryDrafts,
                    activeCategoryForm,
                    studioEquipments,
                    equipmentPriceInputs,
                    savedCustomHours,
                    selectedPolicies,
                },
            };
            saveCachedStudioForm(studioId!, formCachePayload);
            toast.success(isEditMode ? "Studio updated successfully" : "Studio saved successfully");
            window.setTimeout(() => {
                router.push("/admin/studios/my-studios");
            }, 450);
        } catch (error) {
            console.error("Failed to save studio", error);
            toast.error(error instanceof Error ? error.message : "Failed to save studio");
        } finally {
            setIsSavingStudio(false);
        }
    };

    const handleContinue = () => {
        if (!canContinue || isSavingStudio) return;

        if (view === "step3Policies") {
            void handleSaveStudio();
            return;
        }

        if (view === "address") setEditorView("info");
        else if (view === "info") setEditorView("facilities");
        else if (view === "facilities") setEditorView("step2");
        else if (view === "step2") setEditorView("step2Details");
        else if (view === "step2Details") setEditorView("step2Hours");
        else if (view === "step2Hours") setEditorView("step3Budget");
        else if (view === "step3Budget") setEditorView("step3Policies");
    };

    

    const handleFiles = async (files: FileList | null) => {
        if (!files) return;
        const selectedFiles = Array.from(files);

        const availableSlots = Math.max(0, 4 - mediaFiles.length);
        if (availableSlots === 0) {
            toast.error("You can upload a maximum of 4 files.");
            return;
        }

        if (selectedFiles.length > availableSlots) {
            toast.error("Only 4 media files are allowed.");
        }

        const filesToUpload = selectedFiles.slice(0, availableSlots);

        for (const file of filesToUpload) {
            const formData = new FormData();
            formData.append("file", file);

            try {
               const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/studios/upload`, {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json();

                if (!data.success) {
                    toast.error(`Failed to upload ${file.name}`);
                    continue;
                }

                setMediaFiles((prev) => [
                    ...prev,
                    {
                        url: data.url,
                        type: file.type.startsWith("video") ? "video" as const : "image" as const,
                    },
                ]);
            } catch (err) {
                console.error("Upload error:", err);
                toast.error(`Error uploading ${file.name}`);
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        void handleFiles(e.dataTransfer.files);
    };

    const updateCategory = (categoryId: string, updates: Partial<StudioCategory>) => {
        setStudioCategories((prev) =>
            prev.map((category) =>
                category.id === categoryId ? { ...category, ...updates } : category,
            ),
        );
    };

    const adjustCategoryNumber = (
        categoryId: string,
        field: "pricePerHour" | "minHours" | "maxPeople",
        delta: number,
    ) => {
        setStudioCategories((prev) =>
            prev.map((category) => {
                if (category.id !== categoryId) return category;
                const minimumValue = field === "pricePerHour" ? 0 : 1;
                return {
                    ...category,
                    [field]: Math.max(minimumValue, Number(category[field]) + delta),
                };
            }),
        );
    };

    const saveCategoryDraft = (categoryId: string) => {
        const nextCategoryName = categoryDrafts[categoryId]?.trim();
        if (!nextCategoryName) {
            toast.error("Category name is required");
            return;
        }

        setStudioCategories((prev) =>
            prev.map((category) =>
                category.id === categoryId
                    ? {
                        ...category,
                        includes: category.includes.includes(nextCategoryName)
                            ? category.includes
                            : [...category.includes, nextCategoryName],
                    }
                    : category,
            ),
        );
        setCategoryDrafts((prev) => ({ ...prev, [categoryId]: "" }));
        setActiveCategoryForm(null);
    };

    const removeCategoryInclude = (categoryId: string, include: string) => {
        setStudioCategories((prev) =>
            prev.map((category) =>
                category.id === categoryId
                    ? {
                        ...category,
                        includes: category.includes.filter((item) => item !== include),
                    }
                    : category,
            ),
        );
    };

    const addEquipment = () => {
        const name = equipmentName.trim();
        if (!name) {
            toast.error("Equipment name is required");
            return;
        }

        const cost = parseNumberInput(equipmentCost);
        const id = `equipment-${Date.now()}`;
        setStudioEquipments((prev) => [
            ...prev,
            {
                id,
                name,
                baseCost: cost,
                price: cost,
            },
        ]);
        setEquipmentPriceInputs((prev) => ({
            ...prev,
            [id]: cost.toFixed(2),
        }));
        setEquipmentName("");
        setEquipmentCost("");
    };

    const saveEquipmentPrice = (equipmentId: string) => {
        const price = parseNumberInput(equipmentPriceInputs[equipmentId] ?? "0");
        setStudioEquipments((prev) =>
            prev.map((equipment) =>
                equipment.id === equipmentId ? { ...equipment, baseCost: price, price } : equipment,
            ),
        );
        setEquipmentPriceInputs((prev) => ({
            ...prev,
            [equipmentId]: price.toFixed(2),
        }));
    };

    const saveCustomHours = () => {
        if (setHoursDays.length === 0) {
            toast.error("Select at least one day");
            return;
        }
        if (!openingTime || !closingTime) {
            toast.error("Select opening and closing time");
            return;
        }

        setHoursMode("custom");
        setSavedCustomHours((prev) => {
            const next = { ...prev };
            setHoursDays.forEach((day) => {
                next[day] = { openingTime, closingTime };
            });
            return next;
        });
        setOperatingDays((prev) => Array.from(new Set([...prev, ...setHoursDays])));
    };

    // ── Reusable Toggle ───────────────────────────────────────────────
    const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
        <button
            onClick={onToggle}
            className={`relative w-12 h-[28px] rounded-lg p-1 transition-colors duration-300 flex items-center ${value ? "bg-[#E8D1AB]" : "bg-[#333333]"}`}
        >
            <div
                className="w-5 h-5 rounded-md bg-white shadow-sm transition-all duration-300"
                style={{ transform: value ? "translateX(24px)" : "translateX(0px)" }}
            />
        </button>
    );

    // ── Reusable Checkbox ─────────────────────────────────────────────
    const Checkbox = ({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) => (
        <label className="flex items-center gap-2 cursor-pointer" onClick={onToggle}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${checked ? "bg-[#E8D1AB] border-[#E8D1AB]" : "border-[#FFFFFF50] bg-transparent"}`}>
                {checked && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </div>
            <span className="text-sm text-[#D3D3D3]">{label}</span>
        </label>
    );

    const toggleListValue = (value: string, list: string[], setList: Dispatch<SetStateAction<string[]>>) => {
        setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    };

    const SmallRadio = ({ checked }: { checked: boolean }) => (
        <span className={`w-[18px] h-[18px] rounded-full border flex shrink-0 items-center justify-center ${checked ? "border-[#E8D1AB]" : "border-[#6B6B6B]"}`}>
            {checked && <span className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
        </span>
    );

    const SelectBox = ({
        value,
        onChange,
        placeholder,
        options,
    }: {
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
        options: string[];
    }) => {
        const [open, setOpen] = useState(false);
        const selectRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                    setOpen(false);
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        return (
            <div className="relative" ref={selectRef}>
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className={`h-[52px] w-full rounded-lg border px-4 pr-11 text-left text-sm outline-none transition-all ${open ? "border-[#E8D1AB] ring-1 ring-[#8E826A]/30" : "border-[#333333]"} ${isDark ? "bg-[#101010] text-[#D3D3D3]" : "bg-white text-[#171717]"}`}
                >
                    <span className={value ? "text-inherit" : isDark ? "text-[#6B6B6B]" : "text-[#8A8A8A]"}>
                        {value || placeholder || "Select"}
                    </span>
                    <ChevronDown
                        size={18}
                        className={`absolute right-5 top-1/2 -translate-y-1/2 text-[#A1A1AA] transition-transform duration-300 ${open ? "rotate-180 text-[#E8D1AB]" : ""}`}
                    />
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.99, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.99, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-2xl p-2 shadow-[0_30px_60px_rgba(0,0,0,0.18)] ${isDark ? "border border-[#FFFFFF80] bg-[#0F0F0F]" : "border border-[#D7D7D7] bg-white"}`}
                        >
                            {options.map((option) => {
                                const selected = option === value;

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => {
                                            onChange(option);
                                            setOpen(false);
                                        }}
                                        className={`group mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all last:mb-0 ${selected
                                            ? "bg-[#FFFCE8] text-[#171717]"
                                            : isDark
                                                ? "text-[#FFFFFF85] hover:bg-[#FFFCE8] hover:text-[#171717]"
                                                : "text-black hover:bg-[#FFFCE8] hover:text-[#171717]"
                                            }`}
                                    >
                                        <span
                                            className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${selected
                                                ? "border-[#E8D1AB] bg-[#E8D1AB]"
                                                : isDark
                                                    ? "border-[#FFFFFF85] group-hover:border-[#171717]"
                                                    : "border-[#8A8A8A] group-hover:border-[#171717]"
                                                }`}
                                        >
                                            {selected && <span className="h-2 w-2 rounded-sm bg-[#101010]" />}
                                        </span>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const RuleChoiceButton = ({ active, label, onClick }: { active: boolean; label: "Yes" | "No"; onClick: () => void }) => (
        <Button
            type="button"
            onClick={onClick}
            className={`h-8 min-w-[60px] rounded-md border px-3 text-xs font-semibold shadow-none transition-all ${active
                ? "border-transparent bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]"
                : "border-[#2F2F2F] bg-[#0D0D0D] text-white hover:border-[#E8D1AB]/60 hover:bg-[#0D0D0D] hover:text-white"
                }`}
        >
            <span className="flex items-center justify-center gap-2">
                {label}
                <span className={`flex h-[11px] w-[11px] items-center justify-center rounded-full ${active ? "bg-black" : "border border-[#8A8A8A]"}`}>
                    {active && <span className="h-[4px] w-[4px] rounded-full bg-[#E8D1AB]" />}
                </span>
            </span>
        </Button>
    );

    const FieldLabel = useCallback(({ label, children }: { label: string; children: ReactNode }) => (
        <div className="relative">
            <div className="absolute -top-2.5 left-4 z-10 bg-[#0f0f0f] px-2">
                <span className="text-xs text-[#9F9FA9]">{label}</span>
            </div>
            {children}
        </div>
    ), []);

    const policySections = useMemo(() => [
        {
            title: "Cancellation & Refund Policy",
            description: "To balance flexibility for creators with fairness to studio operators:",
            groups: [
                {
                    title: "Cancellation Window & Refunded",
                    bullets: [
                        "Guests may cancel with a full refund if cancellation is submitted at least 48 hours before the booking start time.",
                        "If cancellation is made within 48 hours of start time, refunds may be reduced or unavailable depending on the policy selected at booking.",
                        "Different cancellation options let studios choose how strict their policy is — e.g., Very Flexible, Flexible, Standard 30-Day, Standard 90-Day, each with defined refund rules based on how far in advance the booking is cancelled.",
                        "Cleaning fees (if any) are refunded in full if the booking is cancelled and the space is not used.",
                        "Cancellation requests must be submitted through the platform to be valid.",
                    ],
                },
                {
                    title: "Host / Studio Cancellations",
                    bullets: [
                        "If a studio cancels a confirmed booking, the guest may receive a full refund or platform credit, and the studio may be subject to penalties to protect trust in the marketplace.",
                    ],
                },
            ],
        },
        {
            title: "Safety Policy",
            description: "The platform is built for safe, reliable booking, and we expect all users to act responsibly:",
            groups: [
                {
                    title: "User Responsibility",
                    bullets: [
                        "All communications and payments must be conducted through the platform to ensure security and protection against fraud.",
                        "Hosts and creators should only participate in bookings where they feel safe and comfortable.",
                        "Guests should provide accurate event information and be mindful of any local laws, age restrictions, or special permits that may apply.",
                        "Hosts are encouraged to disclose any safety features (e.g., surveillance cameras) and ensure they are compliant with privacy expectations.",
                    ],
                },
                {
                    title: "Conduct & Compliance",
                    bullets: [
                        "Users must follow the platform's community guidelines, respect neighbors, and avoid unsafe or unsanitary conditions.",
                        "Guests and hosts are responsible for the behavior of anyone on the premises during a booking.",
                    ],
                },
                {
                    title: "Trust & Protection",
                    bullets: [
                        "The platform may use risk detection, identity verification, and fraud safeguards to enhance community security.",
                        "If you feel unsafe or if conditions compromise your well-being or the space's integrity, you may cancel the booking and reach out to support.",
                    ],
                },
            ],
        },
        {
            title: "Cleanliness Policy",
            description: "Studios and creators must maintain cleanliness and hygiene standards:",
            groups: [
                {
                    title: "Studio Expectations",
                    bullets: [
                        "Hosts should provide a clean and orderly space that matches what has been advertised.",
                        "Basic amenities like restrooms should be in working order, and the space should be ready for use upon arrival.",
                    ],
                },
                {
                    title: "Guest Responsibility",
                    bullets: [
                        "Guests should leave the space in substantially the same condition as received.",
                        "Any damage or excessive mess beyond normal wear and tear may result in additional fees or charges.",
                        "Hosts may specify post-booking cleaning protocols if needed.",
                    ],
                },
            ],
        },
        {
            title: "Additional Policy",
            description: "These are inspired by marketplace standards and help round out your policies:",
            groups: [
                {
                    title: "Damage & Liability",
                    bullets: [
                        "Guests agree to be responsible for any damage they or their crew cause during a booking.",
                    ],
                },
                {
                    title: "Health & Safety",
                    bullets: [
                        "Hosts may require depending on type of shoot: proof of liability insurance, permits, or safety documentation",
                    ],
                },
                {
                    title: "Good Neighbor Policy",
                    bullets: [
                        "Especially for residential studio spaces, users must respect noise limits and local community rules.",
                    ],
                },
            ],
        },
    ], []);

    useEffect(() => {
        if (!isEditMode || didApplyPolicyFallbackRef.current || selectedPolicies.length > 0) return;

        const allPolicyTitles = policySections.flatMap((section) =>
            section.groups.map((group) => group.title),
        );
        setSelectedPolicies(allPolicyTitles);
        didApplyPolicyFallbackRef.current = true;
    }, [isEditMode, policySections, selectedPolicies.length]);

    return (
        <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-black"}`}>
            <Topbar
                pathname={pathname}
                actions={
                    <Button
                        type="button"
                        onClick={() => {
                            if (view === "step3Policies") {
                                void handleSaveStudio();
                            } else {
                                router.push("/admin/studios/my-studios");
                            }
                        }}
                        disabled={isSavingStudio}
                        className="bg-[#E5D5B8] text-black text-sm font-medium disabled:opacity-70"
                    >
                        {view === "step3Policies"
                            ? isSavingStudio
                                ? "Saving..."
                                : "Save & Exit"
                            : "Exit"}
                    </Button>
                }
            />

            <div ref={editorTopRef} className="px-4 pb-30 pt-6 lg:px-9 lg:pb-12 lg:pt-8">

                {/* Top Nav */}
                <div className="flex justify-between items-center mb-7">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-base text-[#D4D4D4] hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <span className="hidden lg:block text-base font-semibold text-white">
                        {stepLabel}
                    </span>
                </div>

                <div className="block lg:hidden mb-2">
                    <span className="text-sm font-semibold text-white">{stepLabel}</span>
                </div>

                {/* Progress Bars */}
                <div className="flex gap-3 mb-8 lg:mb-9">
                    {progressSegmentWidths.map((w, i) => (
                        <div key={i} className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden">
                            <div className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full" style={{ width: w }} />
                        </div>
                    ))}
                </div>

                {/* Main Card */}
                <div className={isFlatStep ? "mb-8" : "border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D]"}>

                    {/* ─── STEP 1 › ADDRESS ─────────────────────────────────────── */}
                    {view === "address" && (
                        <>
                            <div className="p-4 pt-5 lg:p-8">
                                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Space Address</h2>
                                <p className="text-sm text-[#A1A1AA]">
                                    The Address will be only shared with the guests to add the space in listings.
                                </p>
                            </div>
                            <hr className="border-t border-[#3D3D3D]" />

                            <div className="p-4 lg:p-8 space-y-6">
                                <div className="relative">
                                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                        <span className="text-sm text-[#D3D3D3] font-medium">Country / Region*</span>
                                    </div>
                                    <Input
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">Address*</span>
                                        </div>
                                        <Input value={address} onChange={(e) => setAddress(e.target.value)}
                                            className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white" />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">Apartment, Suite, etc*</span>
                                        </div>
                                        <Input value={apartment} onChange={(e) => setApartment(e.target.value)}
                                            className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">City*</span>
                                        </div>
                                        <Input value={city} onChange={(e) => setCity(e.target.value)}
                                            className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white" />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">State*</span>
                                        </div>
                                        <SelectBox
                                            value={state}
                                            onChange={setState}
                                            placeholder="Select State"
                                            options={["CA", "NY", "TX", "FL", "Gujarat", "Maharashtra", "Delhi"]}
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">Zip Code*</span>
                                        </div>
                                        <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                                            className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white" />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8">
                                <h3 className="text-base lg:text-lg font-medium text-white mb-1">Do we have the right spot?</h3>
                                <p className="text-sm text-[#A1A1AA] mb-6">
                                    Search your studio location, drop the pin, and confirm the exact spot. The selected coordinates will be saved with this studio.
                                </p>
                                <div className="rounded-2xl border border-[#3D3D3D] bg-[#0D0D0D] p-3 lg:p-5">
                                    <LocationPicker
                                        value={address}
                                        onChange={applyStudioLocation}
                                        placeholder="Search for your studio address"
                                        label="Studio Location*"
                                        colors={darkThemeColors}
                                    />
                                    {studioLocationDetails ? (
                                        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-[#2A2A2A] bg-[#101010] p-4 text-xs text-[#A1A1AA] sm:grid-cols-2">
                                            <div>
                                                <span className="text-white/70">Latitude</span>
                                                <p className="mt-1 text-white">
                                                    {getStudioLatitude()?.toFixed(6) || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-white/70">Longitude</span>
                                                <p className="mt-1 text-white">
                                                    {getStudioLongitude()?.toFixed(6) || "-"}
                                                </p>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ─── STEP 1 › SPACE INFO ──────────────────────────────────── */}
                    {view === "info" && (
                        <>
                            <div className="p-4 pt-5 lg:p-8">
                                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Space Information</h2>
                                <p className="text-sm text-[#A1A1AA]">
                                    Everything you need to know about the space — what&apos;s included, what&apos;s allowed, and how to set up for your shoot.
                                </p>
                            </div>
                            <hr className="border-t border-[#3D3D3D]" />

                            <div className="p-4 lg:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">Space Title</span>
                                        </div>
                                        <Input value={spaceTitle} onChange={(e) => setSpaceTitle(e.target.value)}
                                            placeholder="eg : Apartment, Photo Studio, Podcast Studio etc..."
                                            className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white placeholder:text-[#555]" />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">Add Brand Name (optional)</span>
                                        </div>
                                        <Input value={brandName} onChange={(e) => setBrandName(e.target.value)}
                                            placeholder="eg : Beige"
                                            className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white placeholder:text-[#555]" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                        <span className="text-sm text-[#D3D3D3] font-medium">Description</span>
                                    </div>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
                                        className="w-full bg-transparent border border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 outline-none p-6 pt-5 text-base text-white placeholder:text-[#555] resize-none" />
                                </div>
                            </div>

                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8">
                                <h3 className="text-base lg:text-lg font-medium text-white mb-1">Secondary Types</h3>
                                <p className="text-sm text-[#A1A1AA] mb-6">Select types that match your space. Each type is a unique parameter that will be shown when your listing gets created.</p>
                                <div className="flex flex-wrap gap-3">
                                    {["Photography", "Product Shoot", "Videography", "Podcast"].map((type) => (
                                        <button key={type}
                                            onClick={() => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                                            className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedTypes.includes(type) ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB]" : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8">
                                <h3 className="text-base lg:text-lg font-medium text-white mb-1">Suggest Type (Optional)</h3>
                                <p className="text-sm text-[#A1A1AA] mb-6">If you didn&apos;t find a suitable secondary location type in the list above, Please suggest one here.</p>
                                <div className="relative">
                                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                        <span className="text-sm text-[#D3D3D3] font-medium">Suggest Type</span>
                                    </div>
                                    <Input value={suggestType} onChange={(e) => setSuggestType(e.target.value)}
                                        className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white" />
                                </div>
                            </div>

                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8">
                                <h3 className="text-base lg:text-lg font-medium text-white mb-1">How Big is the space guests can book?</h3>
                                <p className="text-sm text-[#A1A1AA] mb-6">Please only include the size of the space that guests can use during their booking.</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {[
                                        { label: "Property Size (sq ft)", value: propertySize, set: setPropertySize },
                                        { label: "Height", value: height, set: setHeight },
                                        { label: "Width", value: width, set: setWidth },
                                        { label: "Length", value: length, set: setLength },
                                        { label: "Max Floor Number (if applicable)", value: maxFloor, set: setMaxFloor },
                                    ].map((field) => (
                                        <div key={field.label} className="relative">
                                            <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                                <span className="text-xs text-[#D3D3D3] font-medium">{field.label}</span>
                                            </div>
                                            <Input value={field.value} onChange={(e) => field.set(e.target.value)}
                                                className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 pl-6 text-base text-white" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8">
                                <h3 className="text-base lg:text-lg font-medium text-white mb-1">Do you offer overnight stays at this Space</h3>
                                <p className="text-sm text-[#A1A1AA] mb-6">Select &apos;Yes&apos; if your space is listed on Airbnb/can be used on other platforms to establish that it&apos;s subject to lodging taxes.</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setOvernightStays(true)}
                                        className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${overnightStays ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}>
                                        <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                                        <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${overnightStays ? "bg-black" : "border border-[#E5E5E5]"}`}>
                                            {overnightStays && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                        </div>
                                    </button>
                                    <button onClick={() => setOvernightStays(false)}
                                        className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!overnightStays ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}>
                                        <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                                        <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${!overnightStays ? "bg-black" : "border border-[#E5E5E5]"}`}>
                                            {!overnightStays && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base lg:text-lg font-medium text-white">Security Cameras and Recording Device</h3>
                                    <Toggle value={securityCamera} onToggle={() => setSecurityCamera(!securityCamera)} />
                                </div>
                                {securityCamera && (
                                    <div className="relative mb-4">
                                        <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                            <span className="text-sm text-[#D3D3D3] font-medium">Description</span>
                                        </div>
                                        <textarea value={securityDesc} onChange={(e) => setSecurityDesc(e.target.value)} rows={4}
                                            className="w-full bg-transparent border border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 outline-none p-6 pt-5 text-base text-white placeholder:text-[#555] resize-none" />
                                    </div>
                                )}
                                <div className={`flex items-start gap-2 ${securityCamera ? "mt-2" : ""}`}>
                                    <div className="w-4 h-4 rounded border border-[#FFFFFF30] flex items-center justify-center mt-0.5 shrink-0 bg-[#E8D1AB]/10">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E8D1AB" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <p className="text-xs text-[#666]">Recording Devices is listed in our streaming rates as published by the Beige Service Agreement.</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ─── STEP 1 › FACILITIES ──────────────────────────────────── */}
                    {view === "facilities" && (
                        <>
                            <div className="p-4 pt-5 lg:p-8">
                                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Describe Parking Option</h2>
                                <p className="text-sm text-[#A1A1AA]">Are there parking options at or near your space?</p>
                            </div>
                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8 space-y-6">
                                <div className="flex flex-wrap gap-x-6 gap-y-4">
                                    {["Free Onsite Parking", "Paid Onsite Parking", "Free Street Parking", "Metered Street Parking", "Valet", "Nearby Parking lot"].map((opt) => (
                                        <Checkbox key={opt} checked={parkingOptions.includes(opt)}
                                            onToggle={() => setParkingOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])}
                                            label={opt} />
                                    ))}
                                </div>
                                <div className="relative">
                                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                                        <span className="text-sm text-[#D3D3D3] font-medium">Description</span>
                                    </div>
                                    <textarea value={parkingDesc} onChange={(e) => setParkingDesc(e.target.value)} rows={4}
                                        className="w-full bg-transparent border border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 outline-none p-6 pt-5 text-base text-white placeholder:text-[#555] resize-none" />
                                </div>
                            </div>

                            <hr className="border-t border-[#3D3D3D]" />
                            <div className="p-4 lg:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base lg:text-lg font-medium text-white">
                                        Access Availability <span className="text-[#A1A1AA] font-normal text-sm">(Basic)</span>
                                    </h3>
                                    <Toggle value={accessAvailability} onToggle={() => setAccessAvailability(!accessAvailability)} />
                                </div>
                                {accessAvailability && (
                                    <div className="flex flex-wrap gap-x-6 gap-y-4">
                                        {["Elevator", "Stairs", "Street Level", "Freight Elevator", "Wheelchair / Handicap access"].map((opt) => (
                                            <Checkbox key={opt} checked={accessOptions.includes(opt)}
                                                onToggle={() => setAccessOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])}
                                                label={opt} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {[
                                { label: "General Studios Facilities", value: generalFacilities, set: setGeneralFacilities },
                                { label: "Photography Studio Features", value: photoFeatures, set: setPhotoFeatures },
                                { label: "Videography Studio Features", value: videoFeatures, set: setVideoFeatures },
                                { label: "Podcast Studio Features", value: podcastFeatures, set: setPodcastFeatures },
                                { label: "Product Studio Features", value: productFeatures, set: setProductFeatures },
                            ].map((item) => (
                                <div key={item.label}>
                                    <hr className="border-t border-[#3D3D3D]" />
                                    <div className="p-4 lg:p-8 flex items-center justify-between">
                                        <h3 className="text-base lg:text-lg font-medium text-white">{item.label}</h3>
                                        <Toggle value={item.value} onToggle={() => item.set(!item.value)} />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* ─── STEP 2 ────────────────────────────────────────────────── */}
                    {view === "step2" && (
                        <div className="space-y-6 lg:space-y-7">
                            <section>
                                <h2 className="mb-1 text-base font-semibold text-white">Add Photos and Videos</h2>
                                <p className="mb-5 text-xs text-[#A1A1AA]">Upload up to 4 photos or videos for your listing.</p>

                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`rounded-xl border border-[#2E2E2E] bg-[#101010] p-5 transition-colors ${isDragOver ? "bg-[#E8D1AB]/10" : ""}`}
                                >
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center px-4 py-8 text-center"
                                    >
                                        <img
                                            src="/images/Group_10.png"
                                            alt="Upload illustration"
                                            className="mb-5 h-auto w-[150px] select-none"
                                            draggable={false}
                                        />
                                        <p className="mb-1 text-sm text-white">
                                            <span className="font-semibold underline underline-offset-2">Click to upload</span>
                                            <span className="text-[#A1A1AA]"> or drag and drop</span>
                                        </p>
                                        <p className="text-xs text-[#777]">JPG, JPEG, PNG and MP4 less than 50MB. {mediaFiles.length}/4 selected.</p>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpg,image/jpeg,image/png,video/mp4"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />

                                    <div className="rounded-lg border border-dashed border-[#3A3A3A] p-3">
                                        <div className="flex items-center gap-3 overflow-x-auto">
                                            {mediaFiles.map((file, idx) => (
                                                <div key={idx} className="group relative h-[54px] w-[74px] shrink-0 overflow-hidden rounded-md border border-[#3D3D3D]">
                                                    {file.type === "video" ? (
                                                        <video src={file.url} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <img src={file.url} alt="" className="h-full w-full object-cover" />
                                                    )}
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMediaFiles(prev => prev.filter((_, i) => i !== idx));
                                                        }}
                                                        className="absolute inset-0 h-full w-full rounded-none bg-black/60 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </Button>
                                                </div>
                                            ))}

                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileInputRef.current?.click();
                                                }}
                                                disabled={mediaFiles.length >= 4}
                                                className="ml-auto h-[58px] w-[58px] shrink-0 rounded-lg bg-[#E8D1AB] p-0 text-black hover:bg-[#dfc89a] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="mb-1 text-base font-semibold text-white">Who&apos;s allowed in your space?</h3>
                                <p className="mb-5 text-xs text-[#A1A1AA]">Typically, only venues that serve alcohol age requirements.</p>
                                <FieldLabel label="Preferred Age">
                                    <SelectBox
                                        value={preferredAge}
                                        onChange={setPreferredAge}
                                        placeholder=""
                                        options={["18+ (Adults only)", "21+ (21 and over)", "All ages welcome"]}
                                    />
                                </FieldLabel>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="mb-1 text-base font-semibold text-white">What&apos;s your wifi name and password?</h3>
                                <p className="mb-5 text-xs text-[#A1A1AA]">Make it easy for your guests to get online by sharing your wifi information</p>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <FieldLabel label="Wifi Name (optional)">
                                        <Input
                                            value={wifiName}
                                            onChange={(e) => setWifiName(e.target.value)}
                                            className="h-[52px] rounded-lg border-[#3A3A3A] bg-transparent px-5 text-sm text-white focus:border-[#E8D1AB]"
                                        />
                                    </FieldLabel>
                                    <FieldLabel label="Password">
                                        <Input
                                            type="password"
                                            value={wifiPassword}
                                            onChange={(e) => setWifiPassword(e.target.value)}
                                            className="h-[52px] rounded-lg border-[#3A3A3A] bg-transparent px-5 text-sm text-white focus:border-[#E8D1AB]"
                                        />
                                    </FieldLabel>
                                </div>
                            </section>
                        </div>
                    )}

                    {view === "step2Details" && (
                        <div className="space-y-7 lg:space-y-9">
                            <section>
                                <h2 className="text-base lg:text-lg font-semibold text-white mb-1">
                                    What activities would u like to host?
                                </h2>
                                <p className="text-xs lg:text-sm text-[#A1A1AA] mb-5">
                                    You can choose how guests will use your space. Tap Yes at least for activities which will improve space visibility on search.
                                </p>

                                <div className="flex gap-4 mb-6">
                                    <button
                                        onClick={() => setHostActivities(true)}
                                        className={`h-[58px] w-[118px] rounded-xl border px-5 flex items-center justify-between transition-all ${hostActivities ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                                    >
                                        <span className="text-sm font-semibold">Yes</span>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${hostActivities ? "bg-black" : "border border-[#E5E5E5]"}`}>
                                            {hostActivities && <span className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setHostActivities(false)}
                                        className={`h-[58px] w-[118px] rounded-xl border px-5 flex items-center justify-between transition-all ${!hostActivities ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                                    >
                                        <span className="text-sm font-semibold">No</span>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${!hostActivities ? "bg-black" : "border border-[#E5E5E5]"}`}>
                                            {!hostActivities && <span className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                        </span>
                                    </button>
                                </div>

                                {hostActivities && (
                                    <div className="space-y-4">
                                        {[
                                            { label: "Production", icon: Clapperboard },
                                            { label: "Event", icon: CalendarDays },
                                            { label: "Recreation", icon: PartyPopper },
                                            { label: "Meetings", icon: Users },
                                        ].map(({ label, icon: Icon }) => (
                                            <div key={label} className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 text-[#A1A1AA]">
                                                    <Icon size={16} strokeWidth={1.6} />
                                                    <span className="text-sm">{label}</span>
                                                </div>
                                                <Toggle
                                                    value={activityOptions[label as keyof typeof activityOptions]}
                                                    onToggle={() => setActivityOptions((prev) => ({
                                                        ...prev,
                                                        [label]: !prev[label as keyof typeof activityOptions],
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                                    Share some basic about your space
                                </h3>
                                <p className="text-xs lg:text-sm text-[#A1A1AA] mb-5">
                                    Youll add more details later.
                                </p>

                                <div className="rounded-xl border border-[#2E2E2E] overflow-hidden">
                                    {Object.entries(spaceBasics).map(([label, value], index) => (
                                        <div
                                            key={label}
                                            className={`flex items-center justify-between px-4 py-4 lg:px-6 ${index !== 0 ? "border-t border-[#262626]" : ""}`}
                                        >
                                            <Checkbox
                                                checked={value > 0}
                                                onToggle={() => setSpaceBasics((prev) => ({ ...prev, [label]: value > 0 ? 0 : 1 }))}
                                                label={label}
                                            />
                                            <div className="flex h-8 min-w-[96px] items-center justify-between rounded-lg bg-[#E8D1AB] px-3 text-black">
                                                <button
                                                    onClick={() => setSpaceBasics((prev) => ({ ...prev, [label]: Math.max(0, value - 1) }))}
                                                    className="text-base font-semibold leading-none"
                                                    aria-label={`Decrease ${label}`}
                                                >
                                                    -
                                                </button>
                                                <span className="min-w-8 text-center text-sm font-semibold">
                                                    {String(value).padStart(2, "0")}
                                                </span>
                                                <button
                                                    onClick={() => setSpaceBasics((prev) => ({ ...prev, [label]: value + 1 }))}
                                                    className="text-base font-semibold leading-none"
                                                    aria-label={`Increase ${label}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-base lg:text-lg font-semibold text-white mb-5">
                                    Do you have any standout amenities?
                                </h3>
                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    {["WiFi", "Hot Tub", "Fire Pit", "Pool Table", "BBQ Grill", "Indoor Fireplace", "Gym", "Patio", "Pool", "Outdoor Dining Area"].map((item) => (
                                        <Checkbox
                                            key={item}
                                            checked={amenities.includes(item)}
                                            onToggle={() => toggleListValue(item, amenities, setAmenities)}
                                            label={item}
                                        />
                                    ))}
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                                    Let&apos;s describe your space
                                </h3>
                                <p className="text-xs lg:text-sm text-[#A1A1AA] mb-5">
                                    Choose up to 2 highlight, We&apos;ll use these to get your description started.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    {["Peaceful", "Podcast Friendly", "Spacious", "Pet Friendly", "Natural Lightning", "Luxury"].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                if (spaceTags.includes(tag)) {
                                                    setSpaceTags((prev) => prev.filter((item) => item !== tag));
                                                } else if (spaceTags.length < 2) {
                                                    setSpaceTags((prev) => [...prev, tag]);
                                                }
                                            }}
                                            className={`h-[54px] rounded-lg border px-7 text-sm transition-all ${spaceTags.includes(tag) ? "border-[#E8D1AB] bg-[#1D1A15] text-[#E8D1AB]" : "border-[#2F2F2F] bg-[#101010] text-[#D3D3D3] hover:border-[#E8D1AB]/70"}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                        
                    )}
                    {view === "step2Hours" && (
                        <div className="space-y-7 lg:space-y-9">
                            <section>
                                <h2 className="text-base font-semibold text-white mb-1">
                                    What are your operating hours?
                                </h2>
                                <p className="max-w-[980px] text-xs leading-5 text-[#A1A1AA] mb-5">
                                    Operating hours are the days and hours of the week that your space is open to host booking  <span className="font-semibold text-white">(i.e.your general availability)</span>. Guests will not be able to book times outside of your operating hours. <button type="button" className="text-[#E8D1AB] underline underline-offset-2">Learn More</button>
                                </p>

                                <div className="grid grid-cols-1 xl:grid-cols-[410px_minmax(0,1fr)] gap-4">
                                    <div className="rounded-lg border border-[#292929] bg-[#101010]">
                                        <div className="grid grid-cols-1 gap-4 border-b border-[#252525] px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                                            <button type="button" className="flex items-center gap-3 text-left text-sm leading-5 text-white">
                                                <span className="h-8 w-[3px] shrink-0 rounded-full bg-[#E8D1AB]" />
                                                Test Studio - Los Angeles
                                            </button>
                                            <button onClick={() => setHoursMode("24")} className="flex items-center gap-3 text-left text-sm leading-5 text-white">
                                                <SmallRadio checked={hoursMode === "24"} />
                                                Set as 24 hrs
                                            </button>
                                        </div>

                                        <div className="px-4 py-4 space-y-[13px]">
                                            <Checkbox
                                                checked={operatingDays.length === 7}
                                                onToggle={() => setOperatingDays((prev) => prev.length === 7 ? [] : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])}
                                                label="Days"
                                            />
                                            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                                                <div key={day} className="grid grid-cols-1 gap-3 rounded-lg border border-[#242424] p-3 sm:grid-cols-[128px_132px_108px] sm:items-center sm:border-0 sm:p-0">
                                                    <Checkbox checked={operatingDays.includes(day)} onToggle={() => toggleListValue(day, operatingDays, setOperatingDays)} label={day} />
                                                    <div className="flex items-center gap-3 text-xs text-[#D3D3D3]">
                                                        <Toggle
                                                            value={operatingDays.includes(day) && !closedDays.includes(day)}
                                                            onToggle={() => {
                                                                const isOpen = operatingDays.includes(day) && !closedDays.includes(day);
                                                                if (isOpen) {
                                                                    setClosedDays((prev) => prev.includes(day) ? prev : [...prev, day]);
                                                                } else {
                                                                    setClosedDays((prev) => prev.filter((item) => item !== day));
                                                                    setOperatingDays((prev) => prev.includes(day) ? prev : [...prev, day]);
                                                                }
                                                            }}
                                                        />
                                                        <span>{operatingDays.includes(day) && !closedDays.includes(day) ? "Open" : "Closed"}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setSetHoursDays([day]);
                                                            setOpeningTime(savedCustomHours[day]?.openingTime || openingTime);
                                                            setClosingTime(savedCustomHours[day]?.closingTime || closingTime);
                                                        }}
                                                        className="flex items-center gap-2 text-xs text-[#D3D3D3] whitespace-nowrap"
                                                    >
                                                        <SmallRadio checked={setHoursDays.includes(day)} />
                                                        Set Hours
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-[#292929] bg-[#101010]">
                                        <button onClick={() => setHoursMode("custom")} className="flex w-full items-center gap-3 border-b border-[#252525] px-4 py-4 text-left text-sm font-medium text-white">
                                            <span className="h-8 w-[3px] shrink-0 rounded-full bg-[#E8D1AB]" />
                                            Set Custom Hours ({setHoursDays.join(", ") || "Select day"})
                                        </button>
                                        <div className="space-y-4 px-4 py-4">
                                            <SelectBox value={selectedStudio} onChange={setSelectedStudio} placeholder="Select Studios" options={["Test Studio - Los Angeles", "Main Studio", "Podcast Studio"]} />
                                            <SelectBox value={openingTime} onChange={setOpeningTime} placeholder="Select Opening Time" options={["06:00 AM", "08:00 AM", "09:00 AM", "10:00 AM"]} />
                                            <SelectBox value={closingTime} onChange={setClosingTime} placeholder="Select Closing Time" options={["06:00 PM", "08:00 PM", "10:00 PM", "12:00 AM"]} />
                                            <Button
                                                type="button"
                                                onClick={saveCustomHours}
                                                className="h-8 rounded-md bg-[#E8D1AB] px-7 text-xs font-semibold text-black hover:bg-[#dfc89a]"
                                            >
                                                Save
                                            </Button>
                                            {setHoursDays.some((day) => savedCustomHours[day]) && (
                                                <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] px-4 py-3 text-xs text-[#D3D3D3]">
                                                    {setHoursDays.map((day) =>
                                                        savedCustomHours[day] ? (
                                                            <p key={day}>
                                                                {day}: {savedCustomHours[day].openingTime} - {savedCustomHours[day].closingTime}
                                                            </p>
                                                        ) : null,
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-base font-semibold text-white mb-1">
                                    Set your space rules
                                </h3>
                                <p className="text-xs text-[#A1A1AA] mb-5">
                                    Specify the rules that must be followed in your space.
                                </p>

                                <div className="rounded-lg border border-[#292929] bg-[#101010] px-5 py-2">
                                    {Object.entries(spaceRules).map(([rule, allowed]) => (
                                        <div key={rule} className="flex min-h-[52px] items-center justify-between gap-4 border-b border-[#202020] last:border-b-0">
                                            <span className="text-xs text-[#D3D3D3]">{rule}</span>
                                            <div className="flex items-center gap-2">
                                                <RuleChoiceButton
                                                    active={allowed}
                                                    label="Yes"
                                                    onClick={() => setSpaceRules((prev) => ({ ...prev, [rule]: true }))}
                                                />
                                                <RuleChoiceButton
                                                    active={!allowed}
                                                    label="No"
                                                    onClick={() => setSpaceRules((prev) => ({ ...prev, [rule]: false }))}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="relative my-4">
                                        <div className="absolute -top-2 left-4 bg-[#101010] px-2">
                                            <span className="text-xs text-[#777]">Add Custom Rule</span>
                                        </div>
                                        <Input
                                            value={customRule}
                                            onChange={(e) => setCustomRule(e.target.value)}
      /*  */                                      className="h-[52px] rounded-lg border-[#BFA780] bg-transparent px-5 text-sm text-white focus:border-[#E8D1AB]"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {view === "step3Budget" && (
                        <div className="space-y-7 lg:space-y-9">
                            <section>
                                <h2 className="text-base font-semibold text-white mb-1">Set your budget</h2>
                                <p className="text-xs text-[#A1A1AA] mb-7">
                                    Specify your project budget to optimize studio availability, crew allocation, and overall booking alignment.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FieldLabel label="Hourly Rate ($)*">
                                        <Input
                                            value={hourlyRate}
                                            onChange={(e) => setHourlyRate(e.target.value)}
                                            className="h-[68px] rounded-lg border-[#3A3A3A] bg-transparent px-5 text-sm text-white focus:border-[#E8D1AB]"
                                        />
                                    </FieldLabel>
                                    <FieldLabel label="Overtime Rate ($)*">
                                        <Input
                                            value={overtimeRate}
                                            onChange={(e) => setOvertimeRate(e.target.value)}
                                            className="h-[68px] rounded-lg border-[#3A3A3A] bg-transparent px-5 text-sm text-white focus:border-[#E8D1AB]"
                                        />
                                    </FieldLabel>
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-base font-semibold text-white mb-1">Booking Settings</h3>
                                <p className="text-xs text-[#A1A1AA] mb-7">
                                    Set minimum booking duration and buffer time to manage scheduling and prevent time conflicts between shoots.
                                </p>
                                <div className="space-y-6">
                                    <FieldLabel label="Minimum Booking (hours)*">
                                        <SelectBox
                                            value={minimumBooking}
                                            onChange={setMinimumBooking}
                                            placeholder=""
                                            options={["1 hour", "2 hours", "3 hours", "4 hours"]}
                                        />
                                    </FieldLabel>
                                    <FieldLabel label="Buffer Time (minutes)*">
                                        <SelectBox
                                            value={bufferTime}
                                            onChange={setBufferTime}
                                            placeholder=""
                                            options={["15 minutes", "30 minutes", "45 minutes", "60 minutes"]}
                                        />
                                    </FieldLabel>
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-base font-semibold text-white mb-1">Categories</h3>
                                <p className="text-xs text-[#A1A1AA] mb-5">
                                    Manage categories with pricing, minimum booking duration, and crew size limits.
                                </p>

                                <div className="space-y-4">
                                    {studioCategories.map((category) => (
                                        <div key={category.label} className="rounded-lg border border-[#292929] bg-[#101010]">
                                            <button
                                                onClick={() => setCategoryOpen((prev) => ({ ...prev, [category.label]: !prev[category.label] }))}
                                                className="flex min-h-[54px] w-full items-center justify-between px-4 text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            updateCategory(category.id, { isSelected: !category.isSelected });
                                                        }}
                                                        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${category.isSelected ? "border-[#E8D1AB] bg-[#E8D1AB]" : "border-[#555]"}`}
                                                    >
                                                        {category.isSelected && <Check size={11} className="text-black" strokeWidth={3} />}
                                                    </span>
                                                    <span className="text-sm font-medium text-white">{category.label}</span>
                                                    <span className="text-xs text-[#A1A1AA]">(${category.pricePerHour.toFixed(2)}) per hour</span>
                                                    {category.isSelected && (
                                                        <span className="ml-2 rounded bg-[#14C454] px-2 py-0.5 text-[10px] font-semibold text-black">Selected</span>
                                                    )}
                                                </div>
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A2A2A] text-[#A1A1AA]">
                                                    <ChevronDown size={16} className={categoryOpen[category.label] ? "rotate-180 transition-transform" : "transition-transform"} />
                                                </span>
                                            </button>

                                            {categoryOpen[category.label] && (
                                                <div className="border-t border-[#252525] px-4 pb-4 pt-3">
                                                    <p className="mb-3 text-xs text-[#A1A1AA]">Category Includes</p>
                                                    <div className="mb-4 flex flex-wrap gap-2">
                                                        {category.includes.map((tag) => (
                                                            <span key={tag} className="inline-flex items-center gap-1 rounded border border-[#383838] bg-[#1B1B1B] px-2 py-1 text-xs text-[#CFCFCF]">
                                                                {tag}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCategoryInclude(category.id, tag)}
                                                                    className="text-[#D56A6A]"
                                                                    aria-label={`Remove ${tag}`}
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveCategoryForm((current) =>
                                                                current === category.id ? null : category.id,
                                                            )
                                                        }
                                                        className="mb-4 h-8 rounded-md bg-[#E8D1AB] px-4 text-xs font-semibold text-black hover:bg-[#dfc89a]"
                                                    >
                                                        + Add Category
                                                    </Button>
                                                    {activeCategoryForm === category.id && (
                                                        <>
                                                            <FieldLabel label="Category Name">
                                                                <Input
                                                                    value={categoryDrafts[category.id] ?? ""}
                                                                    onChange={(event) =>
                                                                        setCategoryDrafts((prev) => ({
                                                                            ...prev,
                                                                            [category.id]: event.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder="Eg : Portrait, Commercial Video..."
                                                                    className="h-[52px] rounded-lg border-[#3A3A3A] bg-transparent px-5 text-sm text-white placeholder:text-[#555] focus:border-[#E8D1AB]"
                                                                />
                                                            </FieldLabel>
                                                            <div className="mt-4 flex gap-3">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => setActiveCategoryForm(null)}
                                                                    className="h-8 rounded-md border-[#333] bg-transparent px-4 text-xs text-white hover:bg-[#181818] hover:text-white"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => saveCategoryDraft(category.id)}
                                                                    className="h-8 rounded-md bg-[#E8D1AB] px-5 text-xs font-semibold text-black hover:bg-[#dfc89a]"
                                                                >
                                                                    Save
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-sm font-semibold text-white mb-4">Configure Selected Categories</h3>
                                <div className="space-y-4">
                                    {studioCategories.filter((category) => category.isSelected).map((category) => (
                                        <div key={category.id} className="rounded-lg border border-[#292929] bg-[#101010] p-4">
                                            <div className="mb-4 flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{category.label}</p>
                                                    <p className="text-xs text-[#A1A1AA]">Base: ${category.pricePerHour.toFixed(2)} per hour</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-[#A1A1AA]">Total</p>
                                                        <p className="text-xs font-semibold text-white">
                                                            ${(category.pricePerHour * category.minHours).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={() => updateCategory(category.id, { isSelected: false })}
                                                        className="h-8 w-8 rounded-full border border-[#5A3030] bg-[#2A1A1A] p-0 text-[#D56A6A] hover:bg-[#321E1E]"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div>
                                                    <p className="mb-2 text-xs text-[#A1A1AA]">Hourly Price</p>
                                                    <div className="flex h-10 items-center rounded-md border border-[#333333] bg-[#101010] text-xs text-white">
                                                        <Button
                                                            type="button"
                                                            onClick={() => adjustCategoryNumber(category.id, "pricePerHour", -5)}
                                                            className="h-full w-10 rounded-none rounded-l-md bg-[#E8D1AB] p-0 text-black hover:bg-[#dfc89a]"
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="flex-1 text-center">${category.pricePerHour}</span>
                                                        <Button
                                                            type="button"
                                                            onClick={() => adjustCategoryNumber(category.id, "pricePerHour", 5)}
                                                            className="h-full w-10 rounded-none rounded-r-md bg-[#E8D1AB] p-0 text-black hover:bg-[#dfc89a]"
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="mb-2 text-xs text-[#A1A1AA]">Min Hours</p>
                                                    <div className="flex h-10 items-center rounded-md border border-[#333333] bg-[#101010] text-xs text-white">
                                                        <Button
                                                            type="button"
                                                            onClick={() => adjustCategoryNumber(category.id, "minHours", -1)}
                                                            className="h-full w-10 rounded-none rounded-l-md bg-[#E8D1AB] p-0 text-black hover:bg-[#dfc89a]"
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="flex-1 text-center">{category.minHours} hrs</span>
                                                        <Button
                                                            type="button"
                                                            onClick={() => adjustCategoryNumber(category.id, "minHours", 1)}
                                                            className="h-full w-10 rounded-none rounded-r-md bg-[#E8D1AB] p-0 text-black hover:bg-[#dfc89a]"
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="mb-2 text-xs text-[#A1A1AA]">Max People Allowed</p>
                                                    <div className="flex h-10 items-center rounded-md border border-[#333333] bg-[#101010] text-xs text-white">
                                                        <Button
                                                            type="button"
                                                            onClick={() => adjustCategoryNumber(category.id, "maxPeople", -1)}
                                                            className="h-full w-10 rounded-none rounded-l-md bg-[#E8D1AB] p-0 text-black hover:bg-[#dfc89a]"
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="flex-1 text-center">{String(category.maxPeople).padStart(2, "0")}</span>
                                                        <Button
                                                            type="button"
                                                            onClick={() => adjustCategoryNumber(category.id, "maxPeople", 1)}
                                                            className="h-full w-10 rounded-none rounded-r-md bg-[#E8D1AB] p-0 text-black hover:bg-[#dfc89a]"
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <DottedDivider className="my-0" />

                            <section>
                                <h3 className="text-base font-semibold text-white mb-1">What would u like to add Equipments?</h3>
                                <p className="text-xs text-[#A1A1AA] mb-5">
                                    List the equipment you provide to help users understand what&apos;s included.
                                </p>
                                <div className="mb-5 flex gap-4">
                                    <button
                                        onClick={() => setEquipmentEnabled(true)}
                                        className={`h-[58px] w-[118px] rounded-xl border px-5 flex items-center justify-between transition-all ${equipmentEnabled ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                                    >
                                        <span className="text-sm font-semibold">Yes</span>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${equipmentEnabled ? "bg-black" : "border border-[#E5E5E5]"}`}>
                                            {equipmentEnabled && <span className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setEquipmentEnabled(false)}
                                        className={`h-[58px] w-[118px] rounded-xl border px-5 flex items-center justify-between transition-all ${!equipmentEnabled ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                                    >
                                        <span className="text-sm font-semibold">No</span>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${!equipmentEnabled ? "bg-black" : "border border-[#E5E5E5]"}`}>
                                            {!equipmentEnabled && <span className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                        </span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_320px]">
                                    <FieldLabel label="Equipment Name">
                                        <Input
                                            value={equipmentName}
                                            onChange={(e) => setEquipmentName(e.target.value)}
                                            placeholder="Eg : Green Screen, Lighting..."
                                            className="h-[52px] rounded-lg border-[#3A3A3A] bg-transparent px-5 text-sm text-white placeholder:text-[#555] focus:border-[#E8D1AB]"
                                        />
                                    </FieldLabel>
                                    <FieldLabel label="Cost">
                                        <Input
                                            value={equipmentCost}
                                            onChange={(e) => setEquipmentCost(e.target.value)}
                                            placeholder="$ 0.00"
                                            className="h-[52px] rounded-lg border-[#3A3A3A] bg-transparent px-5 text-sm text-white placeholder:text-[#555] focus:border-[#E8D1AB]"
                                        />
                                    </FieldLabel>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addEquipment}
                                    disabled={!equipmentEnabled}
                                    className="mt-4 h-8 rounded-md bg-[#E8D1AB] px-4 text-xs font-semibold text-black hover:bg-[#dfc89a] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    + Add New Equipment
                                </Button>
                                <div className="mt-5 space-y-3">
                                    {studioEquipments.map((equipment) => (
                                        <div
                                            key={equipment.id}
                                            className="flex flex-col gap-4 rounded-lg border border-[#292929] bg-[#101010] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-white">{equipment.name}</p>
                                                <p className="text-xs text-[#A1A1AA]">${equipment.baseCost.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white">$</span>
                                                    <Input
                                                        value={equipmentPriceInputs[equipment.id] ?? equipment.price.toFixed(2)}
                                                        onChange={(event) =>
                                                            setEquipmentPriceInputs((prev) => ({
                                                                ...prev,
                                                                [equipment.id]: event.target.value.replace(/[^\d.]/g, ""),
                                                            }))
                                                        }
                                                        onBlur={() =>
                                                            setEquipmentPriceInputs((prev) => ({
                                                                ...prev,
                                                                [equipment.id]: parseNumberInput(prev[equipment.id] ?? "0").toFixed(2),
                                                            }))
                                                        }
                                                        inputMode="decimal"
                                                        className="h-10 w-[150px] rounded-md border-[#333] bg-[#0D0D0D] pl-7 pr-3 text-xs text-white focus:border-[#E8D1AB]"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        setStudioEquipments((prev) =>
                                                            prev.filter((item) => item.id !== equipment.id),
                                                        )
                                                    }
                                                    className="h-7 w-7 bg-transparent p-0 text-[#D56A6A] hover:bg-[#1A1A1A]"
                                                >
                                                    <Trash2 size={13} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => saveEquipmentPrice(equipment.id)}
                                                    className="h-7 w-7 bg-transparent p-0 text-[#35C36A] hover:bg-[#1A1A1A]"
                                                >
                                                    <Check size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {view === "step3Policies" && (
                        <div className="space-y-7 lg:space-y-9">
                            {policySections.map((section, sectionIndex) => (
                                <section key={section.title}>
                                    {sectionIndex !== 0 && <DottedDivider className="mb-7 mt-0" />}
                                    <h2 className="mb-2 text-base lg:text-xl font-semibold text-white">{section.title}</h2>
                                    <p className="mb-7 text-xs lg:text-sm text-[#A1A1AA]">{section.description}</p>

                                    <div className="space-y-8">
                                        {section.groups.map((group) => (
                                            <div key={group.title} className="flex items-start gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleListValue(group.title, selectedPolicies, setSelectedPolicies)}
                                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${selectedPolicies.includes(group.title) ? "border-[#E8D1AB] bg-[#E8D1AB]" : "border-[#7A7A7A] bg-transparent"}`}
                                                    aria-label={group.title}
                                                >
                                                    {selectedPolicies.includes(group.title) && <Check size={13} className="text-black" strokeWidth={3} />}
                                                </button>
                                                <div>
                                                    <h3 className="mb-4 text-sm font-medium text-white">{group.title}</h3>
                                                    <ul className="space-y-3 pl-5 text-xs lg:text-sm leading-6 text-[#A1A1AA]">
                                                        {group.bullets.map((bullet) => (
                                                            <li key={bullet} className="list-disc">{bullet}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}

                </div>{/* end Main Card */}
               

                {/* Footer — Desktop */}
                <div className="hidden lg:flex items-center justify-between mt-8 pb-4">
                    <Button variant="outline" onClick={handleBack}
                        className="border border-[#363636] text-[#7A7A7A] hover:text-white hover:bg-[#181818] h-[62px] min-w-[166px] rounded-xl text-xl font-medium bg-transparent">
                        Back
                    </Button>
                    <Button onClick={handleContinue} disabled={!canContinue || isSavingStudio}
                        className={`h-[62px] min-w-[166px] rounded-xl text-xl font-bold transition-all ${canContinue && !isSavingStudio ? "bg-[#E8D1AB] text-[#101010]" : "bg-[#2A2B2D] text-zinc-600"}`}>
                        {view === "step3Policies" ? (isSavingStudio ? "Saving Studio..." : "Save Studio") : "Continue"}
                    </Button>
                </div>

                {/* Footer — Mobile */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-40 bg-[#0f0f0f] flex gap-2">
                    <Button variant="outline" onClick={handleBack}
                        className="flex-1 border border-[#363636] text-white hover:text-white hover:bg-[#181818] h-14 rounded-xl text-sm font-medium bg-transparent">
                        Back
                    </Button>
                    <Button onClick={handleContinue} disabled={!canContinue || isSavingStudio}
                        className={`flex-1 h-14 rounded-xl text-sm font-bold transition-all ${canContinue && !isSavingStudio ? "bg-[#E8D1AB] text-[#101010]" : "bg-[#2A2B2D] text-zinc-600"}`}>
                        {view === "step3Policies" ? (isSavingStudio ? "Saving Studio..." : "Save Studio") : "Continue"}
                    </Button>
                </div>

            </div>
        </div>
    );
}
