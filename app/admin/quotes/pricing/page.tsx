"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Video,
  Camera,
  Scissors,
  Radio,
  MapPin,
  Package,
  List,
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
} from "lucide-react";
import { toast } from "sonner";
import { salesApi } from "@/lib/api";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey = "service" | "addon" | "logistics" | "line_item";

interface PricingItem {
  id: string;
  label: string;
  price: number;
  createdAt: string | null;
}

interface CatalogData {
  service: PricingItem[];
  addon: PricingItem[];
  logistics: PricingItem[];
  line_item: PricingItem[];
}

interface SectionMeta {
  label: string;
  sub: string;
  rateLabel: string;
  sectionType: string;
  rateType: string;
  rateUnit: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_META: Record<SectionKey, SectionMeta> = {
  service: {
    label: "Services",
    sub: "Per-hour rates for core production services",
    rateLabel: "per hour",
    sectionType: "service",
    rateType: "per_hour",
    rateUnit: "per hour",
  },
  addon: {
    label: "Add-ons",
    sub: "Fixed rates for optional upgrades & extras",
    rateLabel: "fixed",
    sectionType: "addon",
    rateType: "fixed",
    rateUnit: "fixed",
  },
  logistics: {
    label: "Logistics",
    sub: "Travel, equipment & permit costs",
    rateLabel: "fixed",
    sectionType: "logistics",
    rateType: "fixed",
    rateUnit: "fixed",
  },
  line_item: {
    label: "Custom Line Items",
    sub: "Miscellaneous fees & custom charges",
    rateLabel: "fixed",
    sectionType: "custom",
    rateType: "flat",
    rateUnit: null,
  },
};

const SECTION_KEYS: SectionKey[] = ["service", "addon", "logistics", "line_item"];

const PROTECTED_SERVICES = [
  "videography",
  "photography",
  "ai editing",
  "livestream production",
  "studio",
];

const LINE_ITEM_KEYS = [
  "line_item",
  "line_items",
  "custom_line_items",
  "customLineItems",
  "custom_line_item",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const decPart = normalized.slice(decimalIndex + 1).replace(/\./g, "").slice(0, 2);
  return `${intPart}.${decPart}`;
};

const isProtectedService = (label: string) =>
  PROTECTED_SERVICES.includes(label.trim().toLowerCase());

const getServiceIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("video")) return Video;
  if (l.includes("photo")) return Camera;
  if (l.includes("edit")) return Scissors;
  if (l.includes("live")) return Radio;
  if (l.includes("studio") || l.includes("location")) return MapPin;
  return Zap;
};

const getSectionIcon = (section: SectionKey) => {
  switch (section) {
    case "service":   return Zap;
    case "addon":     return Package;
    case "logistics": return MapPin;
    case "line_item": return List;
  }
};

// ─── ItemRow Component ───────────────────────────────────────────────────────

interface ItemRowProps {
  item: PricingItem;
  section: SectionKey;
  onSave: (id: string, name: string, rate: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isProtected: boolean;
}

function ItemRow({ item, section, onSave, onDelete, isProtected }: ItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(item.label);
  const [price, setPrice]     = useState(item.price.toFixed(2));
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) nameRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    await onSave(item.id, trimmedName, parseFloat(price) || 0);
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

  const ServiceIcon = section === "service" ? getServiceIcon(item.label) : getSectionIcon(section);

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-4 py-2 transition-all duration-200 ${
        editing
          ? "border-[#8E826A]/60 bg-[#1D1A15]"
          : "border-[#2A2A28] bg-[#111110] hover:border-[#3D3D3A]"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all ${
          editing
            ? "border-[#3D3930] bg-[#2D2820] text-[#E8D1AB]"
            : "border-[#2A2A28] bg-[#1A1A18] text-[#555550]"
        }`}
      >
        <ServiceIcon size={15} />
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
            className="h-9 border-[#3D3D3A] bg-[#0F0F0E] text-sm text-white placeholder:text-[#444] focus:border-[#8E826A]"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[#E0E0DC]">
              {item.label}
            </span>
            {isProtected && (
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#666]">$</span>
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
      <div className={`flex shrink-0 items-center justify-end gap-2 ${editing ? "w-20" : "w-16"}`}>
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
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
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
            {!isProtected && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#444] opacity-0 transition-all group-hover:border-[#2A2A28] group-hover:bg-[#1A1A18] group-hover:opacity-100 hover:text-[#EF4444] disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── AddItemForm Component ───────────────────────────────────────────────────

interface AddItemFormProps {
  section: SectionKey;
  onAdd: (name: string, rate: number) => Promise<void>;
  onClose: () => void;
}

function AddItemForm({ section, onAdd, onClose }: AddItemFormProps) {
  const [name, setName]   = useState("");
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
          placeholder={`Enter ${meta.label.slice(0, -1).toLowerCase()} name...`}
          maxLength={80}
          className="h-9 border-[#3D3D3A] bg-[#0F0F0E] text-sm text-white placeholder:text-[#333] focus:border-[#8E826A]"
        />
      
      </div>

      <div className="relative w-28 shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#666]">$</span>
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
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}

// ─── PricingSection Component ─────────────────────────────────────────────────

interface PricingSectionProps {
  section: SectionKey;
  items: PricingItem[];
  onSave: (id: string, name: string, rate: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (section: SectionKey, name: string, rate: number) => Promise<void>;
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
  const [expanded, setExpanded]       = useState(defaultExpanded);
  const meta    = SECTION_META[section];
  const Icon    = getSectionIcon(section);
  const filtered = items.filter((it) =>
    it.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const avgPrice = items.length
    ? items.reduce((s, i) => s + i.price, 0) / items.length
    : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#222220] bg-[#0D0D0C]">
      {/* Section Header */}
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
            className={`ml-1 text-[#444] transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
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
            className={`h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
              showAddForm
                ? "border border-[#3D3930] bg-[#1D1A14] text-[#E8D1AB] hover:bg-[#231F18]"
                : "border border-[#2D4020] bg-[#1A2814] text-[#86EFAC] hover:bg-[#1E3018]"
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

      {/* Items List */}
      {expanded && (
        <div className="flex flex-col gap-2 p-4 animate-in fade-in duration-200">
          {showAddForm && (
            <AddItemForm
              section={section}
              onAdd={async (name, rate) => {
                await onAdd(section, name, rate);
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
                isProtected={section === "service" && isProtectedService(item.label)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuotePricingPage() {
  const pathname = usePathname();

  const [data, setData]       = useState<CatalogData>({
    service: [], addon: [], logistics: [], line_item: [],
  });
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | SectionKey>("all");
  const [search, setSearch]     = useState("");

  // ── Fetch catalog ──────────────────────────────────────────────────────────
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesApi.getQuoteCatalog();
      if (!res.error && res.data) {
        const mapSection = (
          arr: Array<{ catalog_item_id?: string | number | null; name?: string; effective_rate?: string | number | null; created_at?: string | null }> | null | undefined
        ): PricingItem[] =>
          (arr || []).map((it, idx) => ({
            id:        String(it.catalog_item_id ?? `tmp-${idx}`),
            label:     it.name?.trim() || "Unnamed",
            price:     parseFloat(String(it.effective_rate ?? 0)) || 0,
            createdAt: it.created_at ?? null,
          }));

        const lineArr =
          LINE_ITEM_KEYS.map((k) => (res.data as Record<string, unknown>)[k])
            .find((v): v is unknown[] => Array.isArray(v)) ?? [];

        setData({
          service:   mapSection(res.data.service),
          addon:     mapSection(res.data.addon),
          logistics: mapSection(res.data.logistics),
          line_item: mapSection(lineArr as Parameters<typeof mapSection>[0]),
        });
      }
    } catch {
      toast.error("Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (id: string, name: string, rate: number) => {
      const section = SECTION_KEYS.find((s) => data[s].some((it) => it.id === id));
      if (!section) return;
      const meta = SECTION_META[section];
      try {
        const res = await salesApi.updateQuoteCatalog(id, {
          section_type: meta.sectionType,
          name,
          default_rate: rate,
          rate_type:    meta.rateType,
          rate_unit:    meta.rateUnit,
        });
        if (res && !res.error) {
          setData((prev) => ({
            ...prev,
            [section]: prev[section].map((it) =>
              it.id === id ? { ...it, label: name, price: rate } : it
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
      const section = SECTION_KEYS.find((s) => data[s].some((it) => it.id === id));
      const item    = section ? data[section].find((it) => it.id === id) : null;
      if (!section || !item) return;
      if (section === "service" && isProtectedService(item.label)) {
        toast.error("Default services cannot be deleted");
        return;
      }
      try {
        const res = await salesApi.deleteQuoteCatalog(id);
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
    async (section: SectionKey, name: string, rate: number) => {
      const meta = SECTION_META[section];
      try {
        const res = await salesApi.createQuoteCatalog({
          section_type: meta.sectionType,
          name,
          default_rate: rate,
          rate_type:    meta.rateType,
          rate_unit:    meta.rateUnit,
        });
        if (res && !res.error) {
          const newItem: PricingItem = {
            id:        String((res.data as { catalog_item_id?: string | number })?.catalog_item_id ?? Date.now()),
            label:     name,
            price:     rate,
            createdAt: new Date().toISOString(),
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
  const allItems     = Object.values(data).flat();
  const totalItems   = allItems.length;
  const visibleSections: SectionKey[] =
    activeTab === "all" ? SECTION_KEYS : [activeTab];

  const TABS: Array<{ key: "all" | SectionKey; label: string; count: number }> = [
    { key: "all",       label: "All",       count: totalItems },
    { key: "service",   label: "Services",  count: data.service.length },
    { key: "addon",     label: "Add-ons",   count: data.addon.length },
    { key: "logistics", label: "Logistics", count: data.logistics.length },
    { key: "line_item", label: "Line Items",count: data.line_item.length },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A09] text-white">
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ create: "Master Pricing" }}
      />

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="border-b border-[#1E1E1C] bg-[#0D0D0C] px-4 lg:px-9">
        <div className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#E0E0DC] lg:text-3xl">
                Master Pricing
                <span className="ml-2 text-[#E8D1AB]">Control</span>
              </h1>
              <p className="mt-1 text-sm text-[#555]">
                Edit prices here → auto-reflects in all new quotes
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
                onClick={fetchCatalog}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-[#2A2A28] bg-[#111110] px-4 py-2 text-sm font-medium text-[#888] transition-all hover:border-[#3D3D3A] hover:text-[#E0E0DC] disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
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
                className={`flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "border-[#E8D1AB] text-[#E8D1AB]"
                    : "border-transparent text-[#555] hover:text-[#888]"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold transition-all ${
                    activeTab === tab.key
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

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="px-4 pb-20 pt-6 lg:px-9">
        {/* Search */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
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
            <p className="text-sm text-[#555]">
              Searching across all sections
            </p>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 size={32} className="animate-spin text-[#E8D1AB]" />
            <p className="text-sm text-[#555]">Loading pricing data...</p>
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
                defaultExpanded={activeTab !== "all" || section === "service"}
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
                  Any rate you update here will be the default price loaded in all
                  new quotes. Existing saved quotes are not affected.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
