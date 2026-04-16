"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
    Video,
    Camera,
    Scissors,
    Clapperboard,
    Zap,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    Search,
    Loader2,
    ChevronDown,
    AlertCircle,
    RefreshCw,
    ImageIcon,
    Film,
} from "lucide-react";
import { toast } from "sonner";
import { bookingPricingApi } from "@/lib/api";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SectionKey = "services" | "video_editing" | "photo_editing" | "pre_production" | "rush_order";

interface PricingItem {
    id: string;
    label: string;
    price: number;
    isMandatory: boolean;
    isHidden: boolean;
    categorySlug: string;
}

interface CatalogData {
    services: PricingItem[];
    video_editing: PricingItem[];
    photo_editing: PricingItem[];
    pre_production: PricingItem[];
    rush_order: PricingItem[];
}

interface SectionMeta {
    label: string;
    sub: string;
    rateLabel: string;
    categorySlug: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SECTION_META: Record<SectionKey, SectionMeta> = {
    services: {
        label: "CP Pricing",
        sub: "Per-hour rates for Videographers & Photographers",
        rateLabel: "per hour",
        categorySlug: "services",
    },
    video_editing: {
        label: "Video Edits",
        sub: "Pricing for video editing packages",
        rateLabel: "fixed",
        categorySlug: "editing",
    },
    photo_editing: {
        label: "Photo Edits",
        sub: "Pricing for photo editing packages",
        rateLabel: "fixed",
        categorySlug: "editing",
    },
    pre_production: {
        label: "Pre Production",
        sub: "Pre-production service fees",
        rateLabel: "fixed",
        // FIX: API slug is "pre-production" (hyphen), stored here for display only
        categorySlug: "pre-production",
    },
    rush_order: {
        label: "Rush Order",
        sub: "Rush order fees & surcharges",
        rateLabel: "fixed",
        categorySlug: "rush_order",
    },
};

const SECTION_KEYS: SectionKey[] = [
    "services",
    "video_editing",
    "photo_editing",
    "pre_production",
    "rush_order",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const sanitizeCurrencyInput = (value: string) => {
    const normalized = value.replace(/[^\d.]/g, "");
    const decimalIndex = normalized.indexOf(".");
    if (decimalIndex === -1) return normalized;
    const intPart = normalized.slice(0, decimalIndex);
    const decPart = normalized
        .slice(decimalIndex + 1)
        .replace(/\./g, "")
        .slice(0, 2);
    return `${intPart}.${decPart}`;
};

const getSectionIcon = (section: SectionKey) => {
    switch (section) {
        case "services": return Video;
        case "video_editing": return Film;
        case "photo_editing": return ImageIcon;
        case "pre_production": return Clapperboard;
        case "rush_order": return Zap;
    }
};

const getItemIcon = (section: SectionKey, label: string) => {
    const l = label.toLowerCase();
    if (section === "services") {
        if (l.includes("video")) return Video;
        if (l.includes("photo")) return Camera;
        return Zap;
    }
    if (section === "video_editing") return Film;
    if (section === "photo_editing") return ImageIcon;
    if (section === "pre_production") return Clapperboard;
    if (section === "rush_order") return Zap;
    return Scissors;
};

// ─── ItemRow ───────────────────────────────────────────────────────────────────

interface ItemRowProps {
    item: PricingItem;
    section: SectionKey;
    onSave: (id: string, name: string, price: number) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

function ItemRow({ item, section, onSave, onDelete }: ItemRowProps) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(item.label);
    const [price, setPrice] = useState(item.price.toFixed(2));
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) nameRef.current?.focus();
    }, [editing]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        await onSave(item.id, name.trim(), parseFloat(price) || 0);
        setSaving(false);
        setEditing(false);
    };

    const handleCancel = () => {
        setName(item.label);
        setPrice(item.price.toFixed(2));
        setEditing(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete(item.id);
        setDeleting(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") handleCancel();
    };

    const ItemIcon = getItemIcon(section, item.label);

    return (
        <div
            className={`group flex items-center gap-3 rounded-xl border px-4 py-2 transition-all duration-200 ${editing
                    ? "border-[#8E826A]/60 bg-[#1D1A15]"
                    : "border-[#2A2A28] bg-[#111110] hover:border-[#3D3D3A]"
                }`}
        >
            {/* Icon */}
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all ${editing
                        ? "border-[#3D3930] bg-[#2D2820] text-[#E8D1AB]"
                        : "border-[#2A2A28] bg-[#1A1A18] text-[#555550]"
                    }`}
            >
                <ItemIcon size={15} />
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
                {editing ? (
                    <Input
                        ref={nameRef}
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, 80))}
                        onKeyDown={handleKeyDown}
                        maxLength={80}
                        disabled={item.isMandatory}
                        className="h-9 border-[#3D3D3A] bg-[#0F0F0E] text-sm text-white placeholder:text-[#444] focus:border-[#8E826A] disabled:opacity-60"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-[#E0E0DC]">
                            {item.label}
                        </span>
                        {item.isMandatory && (
                            <span className="shrink-0 rounded-full border border-[#3D3930] bg-[#1D1C18] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8E826A]">
                                Default
                            </span>
                        )}
                    </div>
                )}
                <p className={`text-xs text-[#444] ${editing ? "hidden" : "mt-0.5"}`}>
                    {SECTION_META[section].rateLabel}
                </p>
            </div>

            {/* Price */}
            <div className={`shrink-0 ${editing ? "w-28" : "w-32 text-right"}`}>
                {editing ? (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#666]">
                            $
                        </span>
                        <Input
                            value={price}
                            onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
                            onKeyDown={handleKeyDown}
                            inputMode="decimal"
                            className="h-9 border-[#3D3D3A] bg-[#0F0F0E] pl-6 text-sm font-semibold text-[#E8D1AB] focus:border-[#8E826A]"
                        />
                    </div>
                ) : (
                    <span className="text-sm font-bold tabular-nums text-[#E8D1AB]">
                        {formatCurrency(item.price)}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div
                className={`flex shrink-0 items-center justify-end gap-2 ${editing ? "w-20" : "w-16"
                    }`}
            >
                {editing ? (
                    <>
                        <button
                            onClick={handleCancel}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2A28] bg-[#1A1A18] text-[#666] transition-colors hover:text-[#999]"
                        >
                        
                            <X size={14} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !name.trim()}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2D4A2D] bg-[#1A2E1A] text-[#4ADE80] transition-all hover:bg-[#1E381E] disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Check size={14} strokeWidth={3} />
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setEditing(true)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#444] opacity-0 transition-all group-hover:border-[#2A2A28] group-hover:bg-[#1A1A18] group-hover:opacity-100 hover:text-[#E8D1AB]"
                        >
                            <Pencil size={14} />
                        </button>
                        {!item.isMandatory && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#444] opacity-0 transition-all group-hover:border-[#2A2A28] group-hover:bg-[#1A1A18] group-hover:opacity-100 hover:text-[#EF4444] disabled:opacity-50"
                            >
                                {deleting ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── AddItemForm ───────────────────────────────────────────────────────────────

interface AddItemFormProps {
    section: SectionKey;
    onAdd: (name: string, price: number) => Promise<void>;
    onClose: () => void;
}

function AddItemForm({ section, onAdd, onClose }: AddItemFormProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [saving, setSaving] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const handleAdd = async () => {
        if (!name.trim() || !price) return;
        setSaving(true);
        await onAdd(name.trim(), parseFloat(price) || 0);
        setSaving(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAdd();
        if (e.key === "Escape") onClose();
    };

    const meta = SECTION_META[section];

    return (
        <div className="flex items-center gap-3 rounded-xl border border-[#3D3930] bg-[#1A1814] px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3D3930] bg-[#2D2820] text-[#E8D1AB]">
                <Plus size={14} strokeWidth={3} />
            </div>

            <div className="min-w-0 flex-1">
                <Input
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 80))}
                    onKeyDown={handleKeyDown}
                    placeholder={`Enter ${meta.label.toLowerCase()} item name...`}
                    maxLength={80}
                    className="h-9 border-[#3D3D3A] bg-[#0F0F0E] text-sm text-white placeholder:text-[#333] focus:border-[#8E826A]"
                />
            </div>

            <div className="relative w-28 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#666]">
                    $
                </span>
                <Input
                    value={price}
                    onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
                    onKeyDown={handleKeyDown}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="h-9 border-[#3D3D3A] bg-[#0F0F0E] pl-6 text-sm font-semibold text-[#E8D1AB] placeholder:text-[#333] focus:border-[#8E826A]"
                />
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2A28] bg-[#1A1A18] text-[#666] transition-colors hover:text-[#999]"
                >
                    <X size={14} />
                </button>
                <button
                    onClick={handleAdd}
                    disabled={saving || !name.trim() || !price}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[#2D4A2D] bg-[#1A2E1A] px-3 text-xs font-semibold text-[#4ADE80] transition-all hover:bg-[#1E381E] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {saving ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : (
                        <Check size={13} strokeWidth={3} />
                    )}
                    {saving ? "Adding..." : "Add"}
                </button>
            </div>
        </div>
    );
}

// ─── PricingSection ────────────────────────────────────────────────────────────

interface PricingSectionProps {
    section: SectionKey;
    items: PricingItem[];
    onSave: (id: string, name: string, price: number) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onAdd: (section: SectionKey, name: string, price: number) => Promise<void>;
    searchQuery: string;
    defaultExpanded?: boolean;
}

function PricingSection({
    section,
    items,
    onSave,
    onDelete,
    onAdd,
    searchQuery,
    defaultExpanded = true,
}: PricingSectionProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [expanded, setExpanded] = useState(defaultExpanded);
    const meta = SECTION_META[section];
    const Icon = getSectionIcon(section);
    const filtered = items.filter((it) =>
        it.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const avgPrice = items.length
        ? items.reduce((s, i) => s + i.price, 0) / items.length
        : 0;

    return (
        <div className="overflow-hidden rounded-2xl border border-[#222220] bg-[#0D0D0C]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E1E1C] bg-gradient-to-r from-[#111110] to-[#0D0D0C] px-6 py-4">
                <button
                    onClick={() => setExpanded((p) => !p)}
                    className="flex items-center gap-3 text-left"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2D2D2A] bg-[#1D1D1A] text-[#E8D1AB]">
                        <Icon size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight text-[#E0E0DC]">
                                {meta.label}
                            </h2>
                            <span className="rounded-full border border-[#2D2D2A] bg-[#1A1A18] px-2 py-0.5 text-[11px] font-semibold text-[#555]">
                                {items.length}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#444]">{meta.sub}</p>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`ml-1 text-[#444] transition-transform duration-300 ${expanded ? "rotate-180" : ""
                            }`}
                    />
                </button>

                <div className="flex items-center gap-3">
                    {items.length > 0 && (
                        <span className="text-xs text-[#555]">
                            avg{" "}
                            <span className="font-semibold text-[#8E826A]">
                                {formatCurrency(avgPrice)}
                            </span>
                        </span>
                    )}
                    <Button
                        onClick={() => {
                            setExpanded(true);
                            setShowAddForm((p) => !p);
                        }}
                        className={`h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${showAddForm
                            ? "border border-[#3D3930] bg-[#1D1A14] text-[#E8D1AB] hover:bg-[#252018]"
                            : "border border-[#2D4020] bg-[#E5D5B8] text-black "
                            }`}
                    >
                        {showAddForm ? (
                            <>
                                <X size={13} /> Cancel
                            </>
                        ) : (
                            <>
                                <Plus size={13} strokeWidth={3} /> Add New
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Items */}
            {expanded && (
                <div className="flex flex-col gap-2 p-4 animate-in fade-in duration-200">
                    {showAddForm && (
                        <AddItemForm
                            section={section}
                            onAdd={async (name, price) => {
                                await onAdd(section, name, price);
                                setShowAddForm(false);
                            }}
                            onClose={() => setShowAddForm(false)}
                        />
                    )}

                    {filtered.length === 0 && !showAddForm ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A28] bg-[#1A1A18] text-[#333]">
                                <Icon size={20} />
                            </div>
                            <p className="text-sm text-[#444]">
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : "No items yet. Click Add New to get started."}
                            </p>
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                section={section}
                                onSave={onSave}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MasterBookingPricingPage() {
    const pathname = usePathname();

    const [data, setData] = useState<CatalogData>({
        services: [],
        video_editing: [],
        photo_editing: [],
        pre_production: [],
        rush_order: [],
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | SectionKey>("all");
    const [search, setSearch] = useState("");

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchPricing = useCallback(async () => {
        setLoading(true);
        try {
            const res = await bookingPricingApi.getAll();
            if (!res.error && res.data) {

                // ✅ FIX 1: API returns { success, data: [...], count }
                // res.data is the full API response object, actual items are in res.data.data
                const lineItems: Array<{
                    item_id?: number | string;
                    name?: string;           // ✅ FIX 2: API uses 'name', not 'item_name'
                    rate?: string;           // ✅ FIX 3: API uses 'rate' (string), not 'unit_price'
                    is_active?: number;
                    category?: {             // ✅ FIX 4: category is a nested object
                        category_id?: number;
                        name?: string;
                        slug?: string;
                    };
                }> = Array.isArray(res.data)
                        ? res.data
                        : Array.isArray((res.data as { data?: unknown[] })?.data)
                            ? (res.data as { data: unknown[] }).data as typeof lineItems
                            : [];

                const map: CatalogData = {
                    services: [],
                    video_editing: [],
                    photo_editing: [],
                    pre_production: [],
                    rush_order: [],
                };

                lineItems.forEach((it, idx) => {

                    const slug = it.category?.slug ?? "";

                    const base: PricingItem = {
                        id: String(it.item_id ?? `tmp-${idx}`),
                        label: it.name?.trim() || "Unnamed",         
                        price: parseFloat(it.rate ?? "0"),           
                        isMandatory: false,
                        isHidden: it.is_active === 0,
                        categorySlug: slug,
                    };

                    if (slug === "services") {
                        map.services.push(base);
                    } else if (slug === "editing") {
                        const l = (it.name ?? "").toLowerCase();
                        if (
                            l.includes("reel") ||
                            l.includes("video") ||
                            l.includes("highlight") ||
                            l.includes("film") ||
                            l.includes("commercial") ||
                            l.includes("podcast") ||
                            l.includes("music") ||
                            l.includes("animation") ||
                            l.includes("vfx") ||
                            l.includes("subtitle") ||
                            l.includes("translation") ||
                            l.includes("voiceover")
                        ) {
                            map.video_editing.push(base);
                        } else {
                            // photos, etc.
                            map.photo_editing.push(base);
                        }
                    } else if (slug === "pre-production") {
                        map.pre_production.push(base);
                    } else if (slug === "rush_order" || (it.name ?? "").toLowerCase().includes("rush")) {
                        map.rush_order.push(base);
                    }
                });

                setData(map);
            }
        } catch {
            toast.error("Failed to load booking pricing");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = useCallback(
        async (id: string, name: string, price: number) => {
            const section = SECTION_KEYS.find((s) =>
                data[s].some((it) => it.id === id)
            );
            if (!section) return;
            try {
                // ✅ FIX 8: API expects 'rate' (string), not 'unit_price'
                const res = await bookingPricingApi.update(id, {
                    name,
                    rate: price.toString(),
                });
                if (res && !res.error) {
                    setData((prev) => ({
                        ...prev,
                        [section]: prev[section].map((it) =>
                            it.id === id ? { ...it, label: name, price } : it
                        ),
                    }));
                    toast.success(`${name} updated successfully`);
                } else {
                    toast.error("Failed to update item");
                }
            } catch {
                toast.error("Failed to update item");
            }
        },
        [data]
    );

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = useCallback(
        async (id: string) => {
            const section = SECTION_KEYS.find((s) =>
                data[s].some((it) => it.id === id)
            );
            const item = section ? data[section].find((it) => it.id === id) : null;
            if (!section || !item) return;
            if (item.isMandatory) {
                toast.error("Default items cannot be deleted");
                return;
            }
            try {
                const res = await bookingPricingApi.delete(id);
                if (res && !res.error) {
                    setData((prev) => ({
                        ...prev,
                        [section]: prev[section].filter((it) => it.id !== id),
                    }));
                    toast.success(`${item.label} deleted`);
                } else {
                    toast.error("Failed to delete item");
                }
            } catch {
                toast.error("Failed to delete item");
            }
        },
        [data]
    );

    // ── Add ────────────────────────────────────────────────────────────────────
    const handleAdd = useCallback(
        async (section: SectionKey, name: string, price: number) => {
            const meta = SECTION_META[section];
            try {
                // ✅ FIX 9: Send 'rate' as string, use correct category_slug
                const res = await bookingPricingApi.create({
                    name,
                    rate: price.toString(),
                    category_slug: meta.categorySlug,
                    section_key: section,
                });
                if (res && !res.error) {
                    const newItem: PricingItem = {
                        id: String((res.data as { item_id?: string | number })?.item_id ?? Date.now()),
                        label: name,
                        price,
                        isMandatory: false,
                        isHidden: false,
                        categorySlug: meta.categorySlug,
                    };
                    setData((prev) => ({
                        ...prev,
                        [section]: [...prev[section], newItem],
                    }));
                    toast.success(`${name} added to ${meta.label}`);
                } else {
                    toast.error("Failed to add item");
                }
            } catch {
                toast.error("Failed to add item");
            }
        },
        []
    );

    // ── Derived ────────────────────────────────────────────────────────────────
    const allItems = Object.values(data).flat();
    const totalItems = allItems.length;

    const visibleSections: SectionKey[] =
        activeTab === "all" ? SECTION_KEYS : [activeTab];

    const TABS: Array<{ key: "all" | SectionKey; label: string; count: number }> =
        [
            { key: "all", label: "All", count: totalItems },
            { key: "services", label: "CP Pricing", count: data.services.length },
            { key: "video_editing", label: "Video Edits", count: data.video_editing.length },
            { key: "photo_editing", label: "Photo Edits", count: data.photo_editing.length },
            { key: "pre_production", label: "Pre Production", count: data.pre_production.length },
            { key: "rush_order", label: "Rush Order", count: data.rush_order.length },
        ];

    return (
        <div className="min-h-screen bg-[#0A0A09] text-white">
            {/* Topbar */}
            <Topbar
                pathname={pathname}
                breadcrumbOverrides={{ "master-booking-pricing": "Master Booking Pricing" }}
            />

            {/* Page Header */}
            <div className="border-b border-[#1E1E1C] bg-[#0D0D0C] px-4 lg:px-9">
                <div className="py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#E0E0DC] lg:text-3xl">
                                Master Booking
                                <span className="ml-2 text-[#E0E0DC]">Pricing</span>
                            </h1>
                            <p className="mt-1 text-sm text-[#555]">
                                Edit prices here → auto-reflects in all new bookings
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xl font-bold tracking-tight text-[#E8D1AB]">
                                    {totalItems}
                                </p>
                                <p className="text-xs text-[#444]">Total Items</p>
                            </div>
                            <div className="h-8 w-px bg-[#1E1E1C]" />
                            <button
                                onClick={fetchPricing}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl border border-[#2A2A28] bg-[#111110] px-4 py-2 text-sm font-medium text-[#888] transition-all hover:border-[#3D3D3A] hover:text-[#E0E0DC] disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={14}
                                    className={loading ? "animate-spin" : ""}
                                />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mt-5 flex gap-1 overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.key
                                        ? "border-[#E8D1AB] text-[#E8D1AB]"
                                        : "border-transparent text-[#555] hover:text-[#888]"
                                    }`}
                            >
                                {tab.label}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold transition-all ${activeTab === tab.key
                                            ? "bg-[#2D2820] text-[#E8D1AB]"
                                            : "bg-[#1A1A18] text-[#444]"
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 pb-20 pt-6 lg:px-9">
                {/* Search */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]"
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search pricing items..."
                            className="h-10 border-[#2A2A28] bg-[#111110] pl-9 text-sm text-[#E0E0DC] placeholder:text-[#333] focus:border-[#8E826A]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {search && (
                        <p className="text-sm text-[#555]">Searching across all sections</p>
                    )}
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-24">
                        <Loader2 size={32} className="animate-spin text-[#E8D1AB]" />
                        <p className="text-sm text-[#555]">Loading booking pricing...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {visibleSections.map((section) => (
                            <PricingSection
                                key={section}
                                section={section}
                                items={data[section]}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onAdd={handleAdd}
                                searchQuery={search}
                                defaultExpanded={
                                    activeTab !== "all" || section === "services"
                                }
                            />
                        ))}

                        {/* Info Banner */}
                        <div className="flex items-start gap-3 rounded-xl border border-[#2A2520] bg-[#0F0E0C] p-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2D2A20] bg-[#1D1C18] text-[#E8D1AB]">
                                <AlertCircle size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#C5B48A]">
                                    Prices sync automatically
                                </p>
                                <p className="mt-0.5 text-xs text-[#555]">
                                    Any rate you update here will be the default price loaded in
                                    all new bookings. Existing confirmed bookings are not affected.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}