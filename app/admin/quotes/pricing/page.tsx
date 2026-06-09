"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
import { useAppSelector } from "@/lib/redux/hooks";
import { hasModulePermission } from "@/lib/permissions";

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
  isDark?: boolean;
}

function ItemRow({ item, section, onSave, onDelete, isProtected, isDark = true }: ItemRowProps) {
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
      className={`group rounded-lg border px-4 py-3 transition-all duration-200 ${editing
        ? isDark
          ? "border-[#8E826A]/50 bg-black/80"
          : "border-zinc-400 bg-zinc-50"
        : isDark
          ? "border-[#3D3D3D] bg-black hover:border-white/20"
          : "border-[#D7D7D7] bg-[#F4F5F7] hover:border-zinc-300"
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Icon Area */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all ${editing
            ? isDark
              ? "border border-[#8E826A]/30 bg-[#2A251E] text-[#E8D1AB]"
              : "border border-zinc-300 bg-zinc-200 text-zinc-800"
            : isDark
              ? "bg-[#302E2E] text-[#E8D1AB]"
              : "bg-zinc-100 text-zinc-700"
            }`}
        >
          <ServiceIcon size={16} />
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
              className={`h-10 rounded-xl text-sm transition-colors ${isDark
                ? "border-white/10 bg-[#0F0F0F] text-white placeholder:text-white/30 focus:border-[#8E826A]"
                : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500"
                }`}
            />
          ) : (
            <div className="flex min-w-0 items-center gap-3">
              <span className={`min-w-0 truncate text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-zinc-900"}`}>
                {item.label}
              </span>
              {isProtected ? (
                <span className={`hidden shrink-0 items-center justify-center self-center rounded-full border px-2.5 py-1 leading-none text-[10px] font-semibold capitalize tracking-wider sm:inline-flex ${isDark ? "border-[#E8D1AB26] bg-[#E8D1AB26] text-[#E8D1AB]" : "border-zinc-300 bg-zinc-100 text-zinc-700"}`}>
                  Default
                </span>
              ) : null}
            </div>
          )}
          <p className={`text-xs ${isDark ? "text-white/40" : "text-zinc-400"} ${editing ? "hidden" : "mt-0.5"}`}>
            {SECTION_META[section].rateLabel}
          </p>
        </div>

        {/* Desktop Price Display */}
        <div className={`hidden lg:block shrink-0 ${editing ? "w-24 sm:w-28" : "w-24 text-right sm:w-32"}`}>
          {editing ? (
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-white/40" : "text-zinc-400"}`}>$</span>
              <Input
                value={price}
                onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
                onKeyDown={handleKeyDown}
                inputMode="decimal"
                className={`h-10 rounded-xl pl-6 text-sm font-semibold ${isDark
                  ? "border-white/10 bg-[#0F0F0F] text-[#E8D1AB] focus:border-[#8E826A]"
                  : "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
                  }`}
              />
            </div>
          ) : (
            <span className={`lg:text-lg font-bold tabular-nums ${isDark ? "text-[#E8D1AB]" : "text-zinc-900"}`}>
              {formatCurrency(item.price)}
            </span>
          )}
        </div>

        {/* Control Button Actions */}
        <div className={`flex shrink-0 items-center justify-end gap-2 lg:pl-2.5 ${editing ? "w-20" : "w-[4.5rem] sm:w-18"}`}>
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isDark ? "bg-[#161616] text-white/50 hover:text-white" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"}`}
              >
                <X size={14} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all disabled:opacity-50 ${isDark
                  ? "border-[#2D4A2D] bg-[#1A2E1A] text-[#4ADE80] hover:bg-[#1E381E]"
                  : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${isDark
                  ? "bg-[#161616] text-white/55 hover:text-[#E8D1AB] sm:border-transparent sm:bg-transparent sm:text-white/30 sm:opacity-0 sm:group-hover:border-white/10 sm:group-hover:bg-[#1B1B1B] sm:group-hover:opacity-100"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 sm:border-transparent sm:bg-transparent sm:text-zinc-400 sm:opacity-0 sm:group-hover:border-zinc-200 sm:group-hover:bg-zinc-100 sm:group-hover:opacity-100"
                  }`}
              >
                <Pencil size={14} />
              </button>
              {!isProtected ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-50 ${isDark
                    ? "bg-[#161616] text-white/55 hover:text-[#EF4444] sm:border-transparent sm:bg-transparent sm:text-white/30 sm:opacity-0 sm:group-hover:border-white/10 sm:group-hover:bg-[#1B1B1B] sm:group-hover:opacity-100"
                    : "bg-white text-zinc-600 hover:text-red-600 sm:border-transparent sm:bg-transparent sm:text-zinc-400 sm:opacity-0 sm:group-hover:border-zinc-200 sm:group-hover:bg-zinc-100 sm:group-hover:opacity-100"
                    }`}
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Mobile only */}
      <div className={`lg:hidden shrink-0 mt-5 ${editing ? "w-24 sm:w-28" : "w-24 sm:w-32"}`}>
        {editing ? (
          <div className="relative">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-white/40" : "text-zinc-400"}`}>$</span>
            <Input
              value={price}
              onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
              onKeyDown={handleKeyDown}
              inputMode="decimal"
              className={`h-10 rounded-xl pl-6 text-sm font-semibold ${isDark
                ? "border-white/10 bg-[#0F0F0F] text-[#E8D1AB] focus:border-[#8E826A]"
                : "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
                }`}
            />
          </div>
        ) : (
          <span className={`font-bold tabular-nums ${isDark ? "text-[#E8D1AB]" : "text-zinc-900"}`}>
            {formatCurrency(item.price)}
          </span>
        )}
      </div>
    </div>
  );
}

interface AddItemFormProps {
  section: SectionKey;
  onAdd: (name: string, rate: number) => Promise<void>;
  onClose: () => void;
  isDark?: boolean;
}

function AddItemForm({ section, onAdd, onClose, isDark = true }: AddItemFormProps) {
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
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark
          ? "border-[#8E826A]/25 bg-[#1D1A15]"
          : "border-zinc-200 bg-zinc-50"
        }`}
    >
      {/* Plus Icon Container */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${isDark
            ? "border-[#8E826A]/25 bg-[#2A251E] text-[#E8D1AB]"
            : "border-zinc-300 bg-zinc-200 text-zinc-700"
          }`}
      >
        <Plus size={14} strokeWidth={3} />
      </div>

      {/* Name Input */}
      <div className="min-w-0 flex-1">
        <Input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${meta.label.slice(0, -1).toLowerCase()} name...`}
          maxLength={80}
          className={`h-10 rounded-xl text-sm transition-colors ${isDark
              ? "border-white/10 bg-[#0F0F0F] text-white placeholder:text-white/30 focus:border-[#8E826A]"
              : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500"
            }`}
        />
      </div>

      {/* Price Input Container */}
      <div className="relative w-28 shrink-0">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-white/40" : "text-zinc-400"}`}>$</span>
        <Input
          value={price}
          onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          inputMode="decimal"
          className={`h-10 rounded-xl pl-6 text-sm font-semibold transition-colors ${isDark ? "border-white/10 bg-[#0F0F0F] text-[#E8D1AB] placeholder:text-white/30 focus:border-[#8E826A]" : "border-zinc-300 bg-white text-black placeholder:text-[#0000004D] focus:border-[#00000080]"}`}
        />
      </div>

      {/* Action Controls */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onClose}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${isDark
              ? "border-white/10 bg-[#1B1B1B] text-white/50 hover:text-white"
              : "border-zinc-200 bg-zinc-200 text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900"
            }`}
        >
          <X size={14} />
        </button>

        <button
          onClick={handleAdd}
          disabled={saving || !name.trim() || !price}
          className={`flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isDark
              ? "border-[#2D4A2D] bg-[#1A2E1A] text-[#4ADE80] hover:bg-[#1E381E]"
              : "border-[#0DC752] bg-[#0DC752] text-black hover:bg-[#0DC752]/80"
            }`}
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
  isDark?: boolean;
}

function PricingSection({
  section,
  items,
  onSave,
  onDelete,
  onAdd,
  searchQuery,
  defaultExpanded = true,
  isDark = true
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
    <div className={`overflow-hidden rounded-lg lg:rounded-2xl border shadow-[0_8px_30px_rgba(0,0,0,0.18)] p-4 lg:p-6 transition-colors duration-100 ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-white"}`}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-colors duration-100`}>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors ${isDark ? "bg-[#302E2E] text-[#E8D1AB]" : "bg-[#E8D1AB] text-black"}`}>
            <Icon size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm lg:text-base font-semibold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>{meta.label}</h2>
              <span className={`rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-semibold transition-colors ${isDark ? "bg-[#302E2E] text-white/60" : "bg-zinc-200 text-zinc-600"}`}>
                {items.length}
              </span>
            </div>
            <p className={`mt-0.5 text-xs lg:text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>{meta.sub}</p>
          </div>

          <ChevronDown
            className={`w-5 h-5 lg:w-7 lg:h-7 ml-auto shrink-0 transition-all duration-300 ${isDark ? "text-white/40" : "text-zinc-400"} ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
          {items.length > 0 ? (
            <span className={`text-lg ${isDark ? "text-white/50" : "text-zinc-400"}`}>
              avg <span className={`font-semibold ${isDark ? "text-[#E8D1AB]" : "text-zinc-900"}`}>{formatCurrency(avgPrice)}</span>
            </span>
          ) : null}

          <Button
            onClick={() => {
              setExpanded(true);
              setShowAddForm((prev) => !prev);
            }}
            className={`h-10 shrink-0 whitespace-nowrap gap-1.5 rounded-lg px-3 text-sm font-semibold transition-all ${showAddForm
              ? isDark
                ? "border border-white/10 bg-[#24201A] text-[#E8D1AB] hover:bg-[#2B261F]"
                : "border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
              : isDark
                ? "border border-[#E5D5B8] bg-[#E5D5B8] text-black hover:bg-[#d9c8a6]"
                : "border border-black bg-black text-white hover:bg-zinc-900"
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
        <>
          <hr className={` my-4 lg:my-6 ${isDark ? "border-white/10" : "border-black/10"}`} />
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {showAddForm ? (
              <AddItemForm
                section={section}
                onAdd={async (name, rate) => {
                  await onAdd(section, name, rate);
                  setShowAddForm(false);
                }}
                onClose={() => setShowAddForm(false)}
                isDark={isDark}
              />
            ) : null}

            {filtered.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${isDark ? "border-white/10 bg-[#202020] text-white/30" : "border-zinc-200 bg-zinc-50 text-zinc-400"
                  }`}>
                  <Icon size={20} />
                </div>
                <p className={`text-sm ${isDark ? "text-white/50" : "text-zinc-500"}`}>
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
                  isDark={isDark}
                  isProtected={section === "service" && isProtectedService(item.label)}
                />
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function QuotePricingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canEdit = hasModulePermission(permissions, ["admin_quotes"], "edit");
  const isPermissionsLoading = !permissions;
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isPermissionsLoading && !canEdit) {
      router.replace("/admin/quotes");
    }
  }, [canEdit, isPermissionsLoading, router]);

  const isDark = !mounted || theme === "dark";
  const shouldBlockAccess = isPermissionsLoading || !canEdit;

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

  if (shouldBlockAccess) {
    return null;
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ create: "Master Pricing" }}
        actions={
          <Button
            onClick={fetchCatalog}
            disabled={loading}
            className={`h-12 rounded-lg px-4 lg:px-7 text-sm font-semibold transition-colors ${isDark ? "border border-white/15 bg-[#202020] text-white hover:bg-white/10" : "border border-[#E3E3E3] bg-[#F0F0F0] text-[#323232] hover:bg-[#E3E3E3]"}`}
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
              className={`mb-1 text-lg font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-black"}`}
            >
              Master Pricing
            </h1>
            <p
              className={`text-xs transition-colors duration-100 lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}
            >
              Manage default quote pricing for services, add-ons, and logistics in one place.
            </p>
          </div>

          <div className={`rounded-lg lg:rounded-2xl border px-4 py-3 text-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] lg:min-w-32 transition-colors duration-100 ${isDark ? "border-[#807E7E] bg-[#171717]" : "border-[#DFDDDD] bg-white"}`}>
            <p className={`text-lg font-semibold leading-none ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>{totalItems}</p>
            <p className={`text-xs ${isDark ? "text-[#FFFFFF99]" : "text-[#000000B2]"}`}>Total Items</p>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input Wrapper */}
            <div className="relative w-full max-w-md">
              <Search
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/35" : "text-zinc-400"}`}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pricing items..."
                className={`h-11 rounded-lg lg:rounded-2xl text-sm pl-9 transition-colors duration-100 ${isDark
                  ? "border-white/10 bg-[#111111] text-white placeholder:text-white/30 focus:border-[#8E826A]"
                  : "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400"
                  }`}
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-white/35 hover:text-white/70" : "text-zinc-400 hover:text-zinc-600"}`}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            {/* Tabs Row */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-lg lg:rounded-2xl border px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.key
                    ? "border-[#E8D1AB] bg-[#E8D1AB] text-[#101010]"
                    : isDark
                      ? "border-white/10 bg-[#111111] text-white/70 hover:border-white/20 hover:text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                    }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-sm lg:rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors ${activeTab === tab.key
                      ? "bg-[#FFFFFF4D] [#101010]"
                      : isDark ? "bg-white/5 text-white/50" : "bg-zinc-200/60 text-zinc-500"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {search ? (
            <p className={`mt-3 text-sm ${isDark ? "text-white/50" : "text-zinc-400"}`}>
              Searching across all sections
            </p>
          ) : null}
        </div>

        {/* Loader / Content Area */}
        {loading ? (
          <div className={`flex flex-col items-center justify-center gap-4 rounded-3xl border py-24 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors duration-100 ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-zinc-50"
            }`}>
            <Loader2 size={32} className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-zinc-800"}`} />
            <p className={`text-sm ${isDark ? "text-white/55" : "text-zinc-500"}`}>Loading pricing data...</p>
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
                isDark={isDark}
              />
            ))}

            {/* Sync Footer Banner */}
            <div className={`flex items-start gap-3 rounded-lg lg:rounded-3xl border p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors duration-100 ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-zinc-50"}`}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg lg:rounded-2xl transition-colors ${isDark ? "bg-[#302E2E] text-[#E8D1AB]" : "bg-[#E8D1AB] text-black"}`}>
                <AlertCircle size={24} />
              </div>
              <div>
                <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
                  Prices sync automatically
                </p>
                <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                  Any rate you update here becomes the default for new quotes. Existing saved quotes stay unchanged.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- FLOATING MOBILE BUTTON PANEL --- */}
        <div className={`lg:hidden w-full fixed flex items-center justify-center gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-100 ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>
          <Button
            onClick={fetchCatalog}
            disabled={loading}
            className={`h-12 rounded-lg px-4 lg:px-7 text-sm font-semibold transition-colors w-full shadow-sm ${isDark
              ? "border border-white/15 bg-[#202020] text-white hover:bg-white/10"
              : "border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
              }`}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>
    </>
  );
}
