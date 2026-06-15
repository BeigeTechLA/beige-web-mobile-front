"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Zap,
  Video,
  Camera,
  PenLine,
  Radio,
  MapPin,
  Package,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Info,
  RefreshCw,
  Search,
  Plus,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salesApi } from "@/lib/api";

// ============ TYPES ============
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

// ============ CONSTANTS ============
const PROTECTED_SERVICES = [
  "videography",
  "photography",
  "ai editing",
  "livestream production",
  "studio",
];

const SECTION_META: Record<SectionKey, { label: string; sub: string; sectionType: string; rateType: string; rateUnit: string | null }> = {
  service: {
    label: "Services",
    sub: "Per-Hour rates for core production services.",
    sectionType: "service",
    rateType: "per_hour",
    rateUnit: "per hour",
  },
  addon: {
    label: "Add-ons",
    sub: "Fixed rates for optional upgrades and extras.",
    sectionType: "addon",
    rateType: "fixed",
    rateUnit: "fixed",
  },
  logistics: {
    label: "Logistics",
    sub: "Travels, Equipment's and permit costs.",
    sectionType: "logistics",
    rateType: "fixed",
    rateUnit: "fixed",
  },
};

// ============ HELPERS ============
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
  if (normalized.includes("edit")) return PenLine;
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

// ============ SERVICE ROW COMPONENT ============
const ServiceRow = ({
  item,
  section,
  onSave,
  onDelete,
  isProtected,
  isDark = true,
}: {
  item: PricingItem;
  section: SectionKey;
  onSave: (id: string, name: string, rate: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isProtected: boolean;
  isDark?: boolean;
}) => {
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
  const unitLabel = SECTION_META[section].rateUnit === "per hour" ? "per hour" : "fixed";

  return (
    <div
      className={`group rounded-[16px] min-h-[64px] px-4 py-3 transition-all duration-200 ${editing
        ? isDark
          ? "bg-[#1a1a1a] border border-[rgba(229,208,166,0.3)]"
          : "bg-zinc-50 border border-zinc-300"
        : isDark
          ? "bg-[#000000] hover:bg-[#0a0a0a]"
          : "bg-white hover:bg-zinc-50 border border-zinc-200"
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Icon Area */}
        <div className={`w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#302E2E]" : "bg-zinc-100"}`}>
          <span className={isDark ? "text-[#E5D0A6]" : "text-zinc-700"}>
            <ServiceIcon className="w-4 h-4" />
          </span>
        </div>

        {/* Name and Meta text */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              onKeyDown={handleKeyDown}
              maxLength={80}
              className={`h-9 rounded-lg text-sm focus:border-[#E5D0A6] ${isDark
                ? "bg-[#0F0F0F] border-white/10 text-white"
                : "bg-white border-zinc-300 text-zinc-900"
                }`}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-[14px] font-semibold truncate ${isDark ? "text-white" : "text-zinc-900"}`}>
                {item.label}
              </span>
              {isProtected && (
                <span className={`px-2 py-0.5 rounded-[46px] text-[11px] font-medium flex-shrink-0 ${isDark
                  ? "bg-[rgba(229,208,166,0.12)] text-[#E5D0A6]"
                  : "bg-zinc-100 text-zinc-700"
                  }`}>
                  Default
                </span>
              )}
            </div>
          )}
          {!editing && (
            <span className={`text-[12px] ${isDark ? "text-[rgba(255,255,255,0.45)]" : "text-zinc-500"}`}>
              {unitLabel}
            </span>
          )}
        </div>

        {/* Desktop Price Display */}
        <div className={`hidden lg:block shrink-0 ${editing ? "w-24 sm:w-28" : "w-24 text-right sm:w-32"}`}>
          {editing ? (
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                $
              </span>
              <Input
                value={price}
                onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
                onKeyDown={handleKeyDown}
                inputMode="decimal"
                className={`h-9 rounded-lg pl-6 text-sm font-semibold focus:border-[#E5D0A6] ${isDark
                  ? "bg-[#0F0F0F] border-white/10 text-[#E5D0A6]"
                  : "bg-white border-zinc-300 text-zinc-900"
                  }`}
              />
            </div>
          ) : (
            <span className={`text-[18px] font-semibold tabular-nums ${isDark ? "text-[#E5D0A6]" : "text-zinc-900"}`}>
              {formatCurrency(item.price)}
            </span>
          )}
        </div>

        {/* Control Button Actions - FIXED WIDTH (w-20 = 80px) to prevent layout shift */}
        <div className="flex shrink-0 items-center justify-end gap-2 lg:pl-2.5 w-25">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className={`w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-colors ${isDark
                  ? "bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:bg-[#1a1a1a] text-[rgba(255,255,255,0.7)]"
                  : "bg-zinc-200 border border-zinc-300 hover:bg-zinc-300 text-zinc-600"
                  }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className={`w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-colors disabled:opacity-50 ${isDark
                  ? "bg-[#1A2E1A] border border-[#2D4A2D] hover:bg-[#1E381E] text-[#4ADE80]"
                  : "bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-600"
                  }`}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className={`w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-colors ${isDark
                  ? "bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:bg-[#1a1a1a] text-[rgba(255,255,255,0.7)]"
                  : "bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-600"
                  }`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {!isProtected && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-colors disabled:opacity-50 ${isDark
                    ? "bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:bg-[#2a1a1a] text-[rgba(255,255,255,0.7)] hover:text-[#EF4444]"
                    : "bg-zinc-100 border border-zinc-200 hover:bg-red-50 text-zinc-600 hover:text-red-600"
                    }`}
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile only Price Display */}
      <div className="lg:hidden shrink-0 mt-5 w-full sm:w-32">
        {editing ? (
          <div className="relative w-full">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-white/40" : "text-zinc-400"}`}>
              $
            </span>
            <Input
              value={price}
              onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
              onKeyDown={handleKeyDown}
              inputMode="decimal"
              className={`h-9 rounded-lg pl-6 text-sm font-semibold w-full focus:border-[#E5D0A6] ${isDark
                ? "bg-[#0F0F0F] border-white/10 text-[#E5D0A6]"
                : "bg-white border-zinc-300 text-zinc-900"
                }`}
            />
          </div>
        ) : (
          <span className={`text-[18px] font-semibold tabular-nums ${isDark ? "text-[#E5D0A6]" : "text-zinc-900"}`}>
            {formatCurrency(item.price)}
          </span>
        )}
      </div>
    </div>
  );
};

// ============ ADD ITEM FORM COMPONENT ============
const AddItemForm = ({
  section,
  onAdd,
  onClose,
  isDark = true,
}: {
  section: SectionKey;
  onAdd: (name: string, rate: number) => Promise<void>;
  onClose: () => void;
  isDark?: boolean;
}) => {
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
    <div className={`rounded-[16px] px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark
      ? "border border-[rgba(229,208,166,0.2)] bg-[#1D1A15]"
      : "border border-zinc-200 bg-zinc-50"
      }`}>
      <div className={`w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0 ${isDark
        ? "bg-[#2A251E] border border-[rgba(229,208,166,0.2)] text-[#E5D0A6]"
        : "bg-zinc-200 border border-zinc-300 text-zinc-700"
        }`}>
        <Plus className="w-4 h-4" strokeWidth={3} />
      </div>

      <div className="flex-1 min-w-0">
        <Input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${meta.label.slice(0, -1).toLowerCase()} name...`}
          maxLength={80}
          className={`h-9 rounded-lg text-sm focus:border-[#E5D0A6] ${isDark
            ? "bg-[#0F0F0F] border-white/10 text-white placeholder:text-white/30"
            : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400"
            }`}
        />
      </div>

      <div className="relative w-[100px] flex-shrink-0">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-white/40" : "text-zinc-400"
          }`}>
          $
        </span>
        <Input
          value={price}
          onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          inputMode="decimal"
          className={`h-9 rounded-lg pl-6 text-sm font-semibold focus:border-[#E5D0A6] ${isDark
            ? "bg-[#0F0F0F] border-white/10 text-[#E5D0A6] placeholder:text-white/30"
            : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400"
            }`}
        />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onClose}
          className={`w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-colors ${isDark
            ? "bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:bg-[#1a1a1a] text-[rgba(255,255,255,0.7)]"
            : "bg-zinc-200 border border-zinc-300 hover:bg-zinc-300 text-zinc-600"
            }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim() || !price}
          className={`h-[34px] px-3 rounded-[8px] flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isDark
            ? "bg-[#1A2E1A] border border-[#2D4A2D] hover:bg-[#1E381E] text-[#4ADE80]"
            : "bg-emerald-500 border border-emerald-500 hover:bg-emerald-600 text-white"
            }`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          )}
          <span className="text-xs font-semibold">
            {saving ? "Adding..." : "Add"}
          </span>
        </button>
      </div>
    </div>
  );
};

// ============ ACCORDION SECTION COMPONENT ============
const AccordionSectionComponent = ({
  sectionKey,
  items,
  onSave,
  onDelete,
  onAdd,
  searchQuery,
  isExpanded,
  onToggle,
  isDark = true,
}: {
  sectionKey: SectionKey;
  items: PricingItem[];
  onSave: (id: string, name: string, rate: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (section: SectionKey, name: string, rate: number) => Promise<void>;
  searchQuery: string;
  isExpanded: boolean;
  onToggle: () => void;
  isDark?: boolean;
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const meta = SECTION_META[sectionKey];
  const Icon = getSectionIcon(sectionKey);

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgPrice = items.length
    ? items.reduce((sum, item) => sum + item.price, 0) / items.length
    : 0;

  return (
    <div className={`rounded-[16px] overflow-hidden border transition-colors ${isDark
      ? "bg-[#151515] border-[rgba(255,255,255,0.08)]"
      : "bg-white border-zinc-200"
      }`}>
      <div className="px-5 py-4 flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className={`w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0 border ${isDark
            ? "bg-[#302E2E] border-[rgba(255,255,255,0.06)] text-[#E5D0A6]"
            : "bg-zinc-100 border-zinc-200 text-zinc-700"
            }`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-[16px] font-semibold ${isDark ? "text-white" : "text-zinc-900"
                }`}>
                {meta.label}
              </h3>
              <span className={`w-[20px] h-[20px] rounded-[48px] flex items-center justify-center text-[11px] font-medium ${isDark
                ? "bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)]"
                : "bg-zinc-200 text-zinc-600"
                }`}>
                {items.length}
              </span>
            </div>
            <p className={`text-[13px] mt-0.5 ${isDark ? "text-[rgba(255,255,255,0.5)]" : "text-zinc-500"
              }`}>
              {meta.sub}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className={`transition-colors ${isDark
              ? "text-[rgba(255,255,255,0.6)] hover:text-white"
              : "text-zinc-400 hover:text-zinc-600"
              }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {items.length > 0 && (
            <div className={`text-[14px] ${isDark ? "text-[rgba(255,255,255,0.5)]" : "text-zinc-500"
              }`}>
              avg{" "}
              <span className={`text-[18px] font-normal ${isDark ? "text-[#E5D0A6]" : "text-zinc-900"
                }`}>
                {formatCurrency(avgPrice)}
              </span>
            </div>
          )}
          <button
            onClick={() => {
              if (!isExpanded) {
                onToggle();
                setTimeout(() => setShowAddForm(true), 100);
              } else {
                setShowAddForm((prev) => !prev);
              }
            }}
            className={`h-[38px] px-4 rounded-[8px] font-semibold text-[13px] flex items-center gap-1.5 transition-colors ${showAddForm
              ? isDark
                ? "bg-[#24201A] border border-white/10 text-[#E5D0A6] hover:bg-[#2B261F]"
                : "bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200"
              : isDark
                ? "bg-[#E5D0A6] text-black hover:bg-[#d4bf96]"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
          >
            {showAddForm ? (
              <>
                <X className="w-3.5 h-3.5" /> Cancel
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Add New
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className={`mx-5 border-t ${isDark ? "border-[rgba(255,255,255,0.08)]" : "border-zinc-200"
            }`} />
          <div className="p-5 pt-4 space-y-2.5">
            {showAddForm && (
              <AddItemForm
                section={sectionKey}
                onAdd={async (name, rate) => {
                  await onAdd(sectionKey, name, rate);
                  setShowAddForm(false);
                }}
                onClose={() => setShowAddForm(false)}
                isDark={isDark}
              />
            )}

            {filtered.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${isDark
                  ? "border-white/10 bg-[#202020] text-white/30"
                  : "border-zinc-200 bg-zinc-50 text-zinc-400"
                  }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-sm ${isDark ? "text-white/50" : "text-zinc-500"
                  }`}>
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "No items yet. Click Add New to get started."}
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  section={sectionKey}
                  onSave={onSave}
                  onDelete={onDelete}
                  isProtected={sectionKey === "service" && isProtectedService(item.label)}
                  isDark={isDark}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============ MAIN PAGE COMPONENT ============
export default function QuotePricingPage() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [data, setData] = useState<CatalogData>({
    service: [],
    addon: [],
    logistics: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | SectionKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    service: true,
    addon: false,
    logistics: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode based on theme
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
      const section = (["service", "addon", "logistics"] as SectionKey[]).find((key) =>
        data[key].some((item) => item.id === id)
      );
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
      const section = (["service", "addon", "logistics"] as SectionKey[]).find((key) =>
        data[key].some((item) => item.id === id)
      );
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
        setExpandedSections((prev) => ({ ...prev, [section]: true }));
        toast.success(`${name} added to ${meta.label}`);
      } else {
        toast.error("Failed to add item");
      }
    } catch {
      toast.error("Failed to add item");
    }
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalItems = Object.values(data).flat().length;
  const visibleSections: SectionKey[] = activeTab === "all" ? ["service", "addon", "logistics"] : [activeTab];

  const tabs = [
    { id: "all" as const, label: "All", count: totalItems },
    { id: "service" as const, label: "Services", count: data.service.length },
    { id: "addon" as const, label: "Add Ons", count: data.addon.length },
    { id: "logistics" as const, label: "Logistics", count: data.logistics.length },
  ];

  return (
    <div
      className={`min-h-screen transition-colors ${isDark ? "bg-[#0a0a0a] text-white" : "bg-white text-zinc-900"
        }`}
      style={{ fontFamily: '"Instrument Sans", sans-serif' }}
    >
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ create: "Master Pricing" }}
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={fetchCatalog}
              disabled={loading}
              className={`text-[14px] font-medium h-[48px] rounded-[8px] transition-colors ${isDark
                ? "text-white bg-[#202020] border border-white/20 hover:bg-white/10"
                : "text-zinc-700 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200"
                }`}
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        }
      />

      <main className="relative overflow-hidden">
        <div className="px-8 py-8 max-w-[1400px]">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className={`text-[24px] font-semibold leading-tight tracking-tight ${isDark ? "text-white" : "text-zinc-900"
                }`}>
                Master Pricing
              </h1>
              <p className={`text-[14px] mt-1.5 ${isDark ? "text-[rgba(255,255,255,0.55)]" : "text-zinc-500"
                }`}>
                Manage default quote pricing for services, add-ons, and logistics in one place.
              </p>
            </div>
            <div className={`w-[110px] h-[60px] rounded-[16px] border flex flex-col items-center justify-center transition-colors ${isDark
              ? "border-[rgba(255,255,255,0.1)] bg-[#151515]"
              : "border-zinc-200 bg-zinc-50"
              }`}>
              <span className={`text-[20px] font-semibold ${isDark ? "text-[#E5D0A6]" : "text-zinc-900"
                }`}>
                {totalItems}
              </span>
              <span className={`text-[12px] mt-0.5 ${isDark ? "text-[rgba(255,255,255,0.5)]" : "text-zinc-500"
                }`}>
                Total Items
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-[600px]">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[rgba(255,255,255,0.4)]" : "text-zinc-400"
                }`} />
              <input
                type="text"
                placeholder="Search pricing items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-[44px] rounded-[16px] pl-10 pr-4 text-[14px] focus:outline-none transition-colors ${isDark
                  ? "bg-[#151515] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(229,208,166,0.3)]"
                  : "bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400"
                  }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark
                    ? "text-[rgba(255,255,255,0.4)] hover:text-white/70"
                    : "text-zinc-400 hover:text-zinc-600"
                    }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-[44px] px-4 rounded-[16px] flex items-center gap-2 text-[14px] font-medium transition-colors ${activeTab === tab.id
                    ? isDark
                      ? "bg-[#E5D0A6] text-black"
                      : "bg-zinc-900 text-white"
                    : isDark
                      ? "bg-[#151515] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.75)] hover:bg-[#1a1a1a]"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`w-[24px] px-1.5 py-0.5 rounded-[8px] text-[11px] font-medium ${activeTab === tab.id
                      ? isDark
                        ? "bg-black/15 text-black"
                        : "bg-white/20 text-white"
                      : isDark
                        ? "bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)]"
                        : "bg-zinc-200 text-zinc-600"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {searchQuery && (
            <p className={`mb-3 text-sm ${isDark ? "text-white/50" : "text-zinc-500"
              }`}>
              Searching across all sections
            </p>
          )}

          {/* Accordion Sections */}
          {loading ? (
            <div className={`flex flex-col items-center justify-center gap-4 rounded-[16px] border py-24 transition-colors ${isDark
              ? "border-white/10 bg-[#151515]"
              : "border-zinc-200 bg-zinc-50"
              }`}>
              <Loader2 size={32} className={`animate-spin ${isDark ? "text-[#E5D0A6]" : "text-zinc-600"
                }`} />
              <p className={`text-sm ${isDark ? "text-white/55" : "text-zinc-500"
                }`}>
                Loading pricing data...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSections.map((sectionKey) => (
                <AccordionSectionComponent
                  key={sectionKey}
                  sectionKey={sectionKey}
                  items={data[sectionKey]}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onAdd={handleAdd}
                  searchQuery={searchQuery}
                  isExpanded={expandedSections[sectionKey]}
                  onToggle={() => toggleSection(sectionKey)}
                  isDark={isDark}
                />
              ))}

              {/* Price Sync Card */}
              <div className={`mt-4 rounded-[16px] px-5 py-4 flex items-center gap-4 border transition-colors ${isDark
                ? "bg-[#151515] border-[rgba(255,255,255,0.08)]"
                : "bg-zinc-50 border-zinc-200"
                }`}>
                <div className={`w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0 border ${isDark
                  ? "bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.06)] text-[#E5D0A6]"
                  : "bg-zinc-100 border-zinc-200 text-zinc-700"
                  }`}>
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-[15px] font-semibold ${isDark ? "text-white" : "text-zinc-900"
                    }`}>
                    Price Sync Automatically
                  </h3>
                  <p className={`text-[13px] mt-0.5 ${isDark ? "text-[rgba(255,255,255,0.5)]" : "text-zinc-500"
                    }`}>
                    Any rates you update here becomes default for new quote. Existing saved quotes stay unchanged.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}