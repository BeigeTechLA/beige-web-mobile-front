"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";
import {
  Video,
  Camera,
  Scissors,
  Radio,
  MapPin,
  Package,
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

type SectionKey = "service" | "addon" | "logistics";

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
}

interface SectionMeta {
  label: string;
  sub: string;
  rateLabel: string;
  sectionType: string;
  rateType: string;
  rateUnit: string | null;
}

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
    sub: "Fixed rates for optional upgrades and extras",
    rateLabel: "fixed",
    sectionType: "addon",
    rateType: "fixed",
    rateUnit: "fixed",
  },
  logistics: {
    label: "Logistics",
    sub: "Travel, equipment and permit costs",
    rateLabel: "fixed",
    sectionType: "logistics",
    rateType: "fixed",
    rateUnit: "fixed",
  },
};

const SECTION_KEYS: SectionKey[] = ["service", "addon", "logistics"];

const PROTECTED_SERVICES = [
  "videography",
  "photography",
  "ai editing",
  "livestream production",
  "studio",
];

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
  const normalized = label.toLowerCase();
  if (normalized.includes("video")) return Video;
  if (normalized.includes("photo")) return Camera;
  if (normalized.includes("edit")) return Scissors;
  if (normalized.includes("live")) return Radio;
  if (normalized.includes("studio") || normalized.includes("location")) return MapPin;
  return Zap;
};

const getSectionIcon = (section: SectionKey) => {
  switch (section) {
    case "service":
      return Zap;
    case "addon":
      return Package;
    case "logistics":
      return MapPin;
  }
};

interface ItemRowProps {
  item: PricingItem;
  section: SectionKey;
  onSave: (id: string, name: string, rate: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isProtected: boolean;
}

function ItemRow({ item, section, onSave, onDelete, isProtected }: ItemRowProps) {
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
      className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
        editing
          ? "border-[#8E826A]/50 bg-[#1D1A15]"
          : "border-white/10 bg-[#111111] hover:border-white/20"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all ${
          editing
            ? "border-[#8E826A]/30 bg-[#2A251E] text-[#E8D1AB]"
            : "border-white/10 bg-[#1B1B1B] text-white/55"
        }`}
      >
        <ServiceIcon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            onKeyDown={handleKeyDown}
            maxLength={80}
            className="h-10 rounded-xl border-white/10 bg-[#0F0F0F] text-sm text-white placeholder:text-white/30 focus:border-[#8E826A]"
          />
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-white">
              {item.label}
            </span>
            {isProtected ? (
              <span className="hidden shrink-0 items-center justify-center self-center rounded-full border border-[#8E826A]/25 bg-[#2A251E] px-2.5 py-1 leading-none text-[10px] font-semibold uppercase tracking-wider text-[#E8D1AB] sm:inline-flex">
                Default
              </span>
            ) : null}
          </div>
        )}
        <p className={`text-xs text-white/40 ${editing ? "hidden" : "mt-0.5"}`}>
          {SECTION_META[section].rateLabel}
        </p>
      </div>

      <div className={`shrink-0 ${editing ? "w-24 sm:w-28" : "w-24 text-right sm:w-32"}`}>
        {editing ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">$</span>
            <Input
              value={price}
              onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
              onKeyDown={handleKeyDown}
              inputMode="decimal"
              className="h-10 rounded-xl border-white/10 bg-[#0F0F0F] pl-6 text-sm font-semibold text-[#E8D1AB] focus:border-[#8E826A]"
            />
          </div>
        ) : (
          <span className="text-sm font-semibold tabular-nums text-[#E8D1AB]">
            {formatCurrency(item.price)}
          </span>
        )}
      </div>

      <div className={`flex shrink-0 items-center justify-end gap-2 ${editing ? "w-20" : "w-[4.5rem] sm:w-16"}`}>
        {editing ? (
          <>
            <button
              onClick={handleCancel}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1B1B1B] text-white/50 transition-colors hover:text-white"
            >
              <X size={14} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#2D4A2D] bg-[#1A2E1A] text-[#4ADE80] transition-all hover:bg-[#1E381E] disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1B1B1B] text-white/55 transition-all hover:text-[#E8D1AB] sm:border-transparent sm:bg-transparent sm:text-white/30 sm:opacity-0 sm:group-hover:border-white/10 sm:group-hover:bg-[#1B1B1B] sm:group-hover:opacity-100"
            >
              <Pencil size={14} />
            </button>
            {!isProtected ? (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1B1B1B] text-white/55 transition-all hover:text-[#EF4444] disabled:opacity-50 sm:border-transparent sm:bg-transparent sm:text-white/30 sm:opacity-0 sm:group-hover:border-white/10 sm:group-hover:bg-[#1B1B1B] sm:group-hover:opacity-100"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

interface AddItemFormProps {
  section: SectionKey;
  onAdd: (name: string, rate: number) => Promise<void>;
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
    <div className="flex items-center gap-3 rounded-2xl border border-[#8E826A]/25 bg-[#1D1A15] px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#8E826A]/25 bg-[#2A251E] text-[#E8D1AB]">
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
          className="h-10 rounded-xl border-white/10 bg-[#0F0F0F] text-sm text-white placeholder:text-white/30 focus:border-[#8E826A]"
        />
      </div>

      <div className="relative w-28 shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">$</span>
        <Input
          value={price}
          onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          inputMode="decimal"
          className="h-10 rounded-xl border-white/10 bg-[#0F0F0F] pl-6 text-sm font-semibold text-[#E8D1AB] placeholder:text-white/30 focus:border-[#8E826A]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1B1B1B] text-white/50 transition-colors hover:text-white"
        >
          <X size={14} />
        </button>
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim() || !price}
          className="flex h-8 items-center gap-1.5 rounded-xl border border-[#2D4A2D] bg-[#1A2E1A] px-3 text-xs font-semibold text-[#4ADE80] transition-all hover:bg-[#1E381E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}

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
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = SECTION_META[section];
  const Icon = getSectionIcon(section);
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const avgPrice = items.length ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#171717] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#1C1C1C] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#232323] text-[#E8D1AB]">
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-white">{meta.label}</h2>
              <span className="rounded-full border border-white/10 bg-[#252525] px-2 py-0.5 text-[11px] font-semibold text-white/60">
                {items.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/55">{meta.sub}</p>
          </div>

          <ChevronDown
            size={16}
            className={`ml-auto shrink-0 text-white/40 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          {items.length > 0 ? (
            <span className="text-xs text-white/50">
              avg <span className="font-semibold text-[#E8D1AB]">{formatCurrency(avgPrice)}</span>
            </span>
          ) : null}

          <Button
            onClick={() => {
              setExpanded(true);
              setShowAddForm((prev) => !prev);
            }}
            className={`h-8 shrink-0 whitespace-nowrap gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
              showAddForm
                ? "border border-white/10 bg-[#24201A] text-[#E8D1AB] hover:bg-[#2B261F]"
                : "border border-[#E5D5B8] bg-[#E5D5B8] text-black hover:bg-[#d9c8a6]"
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

      {expanded ? (
        <div className="flex flex-col gap-3 p-4 animate-in fade-in duration-200">
          {showAddForm ? (
            <AddItemForm
              section={section}
              onAdd={async (name, rate) => {
                await onAdd(section, name, rate);
                setShowAddForm(false);
              }}
              onClose={() => setShowAddForm(false)}
            />
          ) : null}

          {filtered.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#202020] text-white/30">
                <Icon size={20} />
              </div>
              <p className="text-sm text-white/50">
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
      ) : null}
    </div>
  );
}

export default function QuotePricingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { allowed, isLoading: isPermissionLoading } = useRequireModulePermission(
    "quotes",
    "edit",
    "/sales/quotes",
  );
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<CatalogData>({
    service: [],
    addon: [],
    logistics: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | SectionKey>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isLoading || isPermissionLoading) return;

    if (!user) {
      router.replace("/sales/dashboard");
    }
  }, [user, isLoading, isPermissionLoading, router]);

  if (isPermissionLoading || !allowed) {
    return null;
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesApi.getQuoteCatalog();
      if (!res.error && res.data) {
        const mapSection = (
          arr:
            | Array<{
                catalog_item_id?: string | number | null;
                name?: string;
                effective_rate?: string | number | null;
                created_at?: string | null;
              }>
            | null
            | undefined
        ): PricingItem[] =>
          (arr || []).map((it, idx) => ({
            id: String(it.catalog_item_id ?? `tmp-${idx}`),
            label: it.name?.trim() || "Unnamed",
            price: parseFloat(String(it.effective_rate ?? 0)) || 0,
            createdAt: it.created_at ?? null,
          }));

        setData({
          service: mapSection(res.data.service),
          addon: mapSection(res.data.addon),
          logistics: mapSection(res.data.logistics),
        });
      }
    } catch {
      toast.error("Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleSave = useCallback(
    async (id: string, name: string, rate: number) => {
      const section = SECTION_KEYS.find((key) => data[key].some((item) => item.id === id));
      if (!section) return;

      const meta = SECTION_META[section];

      try {
        const res = await salesApi.updateQuoteCatalog(id, {
          section_type: meta.sectionType,
          name,
          default_rate: rate,
          rate_type: meta.rateType,
          rate_unit: meta.rateUnit,
        });

        if (res && !res.error) {
          setData((prev) => ({
            ...prev,
            [section]: prev[section].map((item) =>
              item.id === id ? { ...item, label: name, price: rate } : item
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

  const handleDelete = useCallback(
    async (id: string) => {
      const section = SECTION_KEYS.find((key) => data[key].some((item) => item.id === id));
      const item = section ? data[section].find((entry) => entry.id === id) : null;

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
            [section]: prev[section].filter((entry) => entry.id !== id),
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

  const handleAdd = useCallback(async (section: SectionKey, name: string, rate: number) => {
    const meta = SECTION_META[section];

    try {
      const res = await salesApi.createQuoteCatalog({
        section_type: meta.sectionType,
        name,
        default_rate: rate,
        rate_type: meta.rateType,
        rate_unit: meta.rateUnit,
      });

      if (res && !res.error) {
        const newItem: PricingItem = {
          id: String((res.data as { catalog_item_id?: string | number })?.catalog_item_id ?? Date.now()),
          label: name,
          price: rate,
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
  }, []);

  const totalItems = Object.values(data).flat().length;
  const visibleSections: SectionKey[] = activeTab === "all" ? SECTION_KEYS : [activeTab];
  const tabs: Array<{ key: "all" | SectionKey; label: string; count: number }> = [
    { key: "all", label: "All", count: totalItems },
    { key: "service", label: "Services", count: data.service.length },
    { key: "addon", label: "Add-ons", count: data.addon.length },
    { key: "logistics", label: "Logistics", count: data.logistics.length },
  ];

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ create: "Master Pricing" }}
        actions={
          <Button
            onClick={fetchCatalog}
            disabled={loading}
            className={`h-12 rounded-lg px-4 lg:px-7 text-sm font-semibold transition-colors ${
              isDark
                ? "border border-white/15 bg-[#202020] text-white hover:bg-white/10"
                : "border border-[#E3E3E3] bg-[#F0F0F0] text-[#323232] hover:bg-[#E3E3E3]"
            }`}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      <div
        className="overflow-hidden p-4 pb-20 lg:p-6 lg:px-10 lg:py-9 space-y-6"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1
              className={`mb-1 text-lg font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${
                isDark ? "text-white" : "text-[#000]"
              }`}
            >
              Master Pricing
            </h1>
            <p
              className={`text-xs transition-colors duration-100 lg:text-sm ${
                isDark ? "text-white/70" : "text-[#000000B2]"
              }`}
            >
              Manage default quote pricing for services, add-ons, and logistics in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-center shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <p className="text-lg font-semibold text-[#E8D1AB]">{totalItems}</p>
            <p className="text-xs text-white/55">Total Items</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#171717] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pricing items..."
                className="h-11 rounded-2xl border-white/10 bg-[#111111] pl-9 text-sm text-white placeholder:text-white/30 focus:border-[#8E826A]"
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "border-[#E8D1AB] bg-[#E8D1AB] text-black"
                      : "border-white/10 bg-[#111111] text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      activeTab === tab.key
                        ? "bg-black/10 text-black"
                        : "bg-white/5 text-white/50"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {search ? <p className="mt-3 text-sm text-white/50">Searching across all sections</p> : null}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-[#171717] py-24 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <Loader2 size={32} className="animate-spin text-[#E8D1AB]" />
            <p className="text-sm text-white/55">Loading pricing data...</p>
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

            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-[#171717] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#232323] text-[#E8D1AB]">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Prices sync automatically</p>
                <p className="mt-1 text-sm text-white/55">
                  Any rate you update here becomes the default for new quotes. Existing saved quotes stay unchanged.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
