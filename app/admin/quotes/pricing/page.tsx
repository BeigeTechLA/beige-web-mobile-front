"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
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
import { usePermissions } from "@/lib/hooks/usePermissions";

type SectionKey = "service" | "addon" | "logistics";
type PageTab = "all" | SectionKey | "types";
type ShootTypeKind = "video" | "photo";
type EditingCategory = ShootTypeKind | "both";

interface ManagedTypeItem {
  id: string;
  apiId: string | null;
  label: string;
  isSystemDefault: boolean;
}

interface EditingTypeItem extends ManagedTypeItem {
  categories: EditingCategory[];
  apiIds: Partial<Record<ShootTypeKind, string | null>>;
}

interface PricingItem {
  id: string;
  label: string;
  price: number;
  createdAt: string | null;
  isSystemDefault?: boolean;
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
const PAGE_TABS: Array<{ key: PageTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "service", label: "Services" },
  { key: "addon", label: "Add-ons" },
  { key: "logistics", label: "Logistics" },
  { key: "types", label: "Types" },
];

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

const normalizeTypeLabel = (value: string) =>
  value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");

const mapManagedShootTypes = (rows: Array<Record<string, unknown>> = []): ManagedTypeItem[] =>
  rows.map((row, idx) => {
    const apiId = Number(row.sales_shoot_type_id ?? row.id ?? 0);
    return {
      id: Number.isInteger(apiId) && apiId > 0 ? String(apiId) : `shoot-${idx}`,
      apiId: Number.isInteger(apiId) && apiId > 0 ? String(apiId) : null,
      label: String(row.name ?? row.label ?? "Untitled").trim(),
      isSystemDefault: Number(row.is_system_default ?? row.isSystemDefault ?? 0) === 1,
    };
  });

const mapManagedEditingTypes = (rows: Array<Record<string, unknown>> = []): EditingTypeItem[] =>
  rows.map((row, idx) => {
    const apiId = Number(row.ai_editing_type_id ?? row.id ?? 0);
    const category = row.category === "photo" ? "photo" : "video";
    return {
      id: Number.isInteger(apiId) && apiId > 0 ? String(apiId) : `edit-${idx}`,
      apiId: Number.isInteger(apiId) && apiId > 0 ? String(apiId) : null,
      label: String(row.value ?? row.label ?? "Untitled").trim(),
      isSystemDefault: Number(row.is_system_default ?? row.isSystemDefault ?? 0) === 1,
      categories: [category],
      apiIds: { [category]: Number.isInteger(apiId) && apiId > 0 ? String(apiId) : null },
    };
  });

const mergeEditingTypes = (videoRows: Array<Record<string, unknown>> = [], photoRows: Array<Record<string, unknown>> = []) => {
  const merged = new Map<string, EditingTypeItem>();
  const addRows = (rows: Array<Record<string, unknown>>, category: ShootTypeKind) => {
    mapManagedEditingTypes(rows).forEach((item) => {
      const key = normalizeTypeLabel(item.label);
      const existing = merged.get(key);
      if (existing) {
        if (!existing.categories.includes(category)) existing.categories.push(category);
        existing.apiIds[category] = item.apiId;
        existing.apiId = existing.apiId ?? item.apiId;
        existing.isSystemDefault = existing.isSystemDefault || item.isSystemDefault;
        return;
      }
      merged.set(key, {
        ...item,
        categories: [category],
        apiIds: { [category]: item.apiId },
      });
    });
  };

  addRows(videoRows, "video");
  addRows(photoRows, "photo");
  return Array.from(merged.values());
};

const resolveTypeTargets = (services: PricingItem[]) => {
  const byName = (names: string[]) => services.find((item) => names.includes(normalizeTypeLabel(item.label)));
  const defaults = services.filter((item) => item.isSystemDefault);
  const video = byName(["videography", "video production"]) ?? defaults[0];
  const photo = byName(["photography", "photo production"]) ?? defaults[1];
  const editing = byName(["ai editing", "editing"]) ?? defaults[2];

  return {
    videoId: video?.id ?? null,
    photoId: photo?.id ?? null,
    videoLabel: video?.label || "Video Shoot Types",
    photoLabel: photo?.label || "Photo Shoot Types",
    editingLabel: editing?.label || "Editing Types",
  };
};

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

const getTypeCardIcon = (title: string) => {
  const normalized = title.toLowerCase();
  if (normalized.includes("editing")) return Scissors;
  if (normalized.includes("photo")) return Camera;
  if (normalized.includes("video")) return Video;
  return Scissors;
};

interface ItemRowProps {
  item: PricingItem;
  section: SectionKey;
  onSave: (id: string, name: string, rate: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isProtected: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isDark?: boolean;
}

function ItemRow({ item, section, onSave, onDelete, isProtected, canEdit, canDelete, isDark = true }: ItemRowProps) {
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
    if (!canEdit) return;
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
    if (!canDelete) return;
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
                disabled={saving || !name.trim() || !canEdit}
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
                disabled={!canEdit}
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
                  disabled={deleting || !canDelete}
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
  canCreate: boolean;
  isDark?: boolean;
}

function AddItemForm({ section, onAdd, onClose, canCreate, isDark = true }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleAdd = async () => {
    if (!canCreate) return;
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
          disabled={!canCreate}
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
          disabled={!canCreate}
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
          disabled={saving || !name.trim() || !price || !canCreate}
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
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
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
  canCreate,
  canEdit,
  canDelete,
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
            if (!canCreate) return;
            setExpanded(true);
            setShowAddForm((prev) => !prev);
          }}
          disabled={!canCreate}
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
                  canCreate={canCreate}
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
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

interface TypeCardProps {
  title: string;
  subtitle: string;
  items: Array<ManagedTypeItem | EditingTypeItem>;
  count: number;
  isDark: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAdd: (name: string) => Promise<void>;
  onRename: (item: ManagedTypeItem | EditingTypeItem, name: string) => Promise<void>;
  onDelete: (item: ManagedTypeItem | EditingTypeItem) => Promise<void>;
  addPlaceholder: string;
  defaultExpanded?: boolean;
  relatedLines?: string[];
}

function TypeAddForm({
  isDark,
  canCreate,
  placeholder,
  onAdd,
  onClose,
}: {
  isDark: boolean;
  canCreate: boolean;
  placeholder: string;
  onAdd: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed || !canCreate) return;
    setSaving(true);
    await onAdd(trimmed);
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? "border-[#8E826A]/25 bg-[#1D1A15]" : "border-zinc-200 bg-zinc-50"}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${isDark ? "border-[#8E826A]/25 bg-[#2A251E] text-[#E8D1AB]" : "border-zinc-300 bg-zinc-200 text-zinc-700"}`}>
        <Plus size={14} strokeWidth={3} />
      </div>
      <div className="min-w-0 flex-1">
        <Input
          ref={inputRef}
          value={name}
          disabled={!canCreate}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={80}
          className={`h-10 rounded-xl text-sm transition-colors ${isDark ? "border-white/10 bg-[#0F0F0F] text-white placeholder:text-white/30 focus:border-[#8E826A]" : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500"}`}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onClose}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${isDark ? "border-white/10 bg-[#1B1B1B] text-white/50 hover:text-white" : "border-zinc-200 bg-zinc-200 text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900"}`}
        >
          <X size={14} />
        </button>
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim() || !canCreate}
          className={`flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "border-[#2D4A2D] bg-[#1A2E1A] text-[#4ADE80] hover:bg-[#1E381E]" : "border-[#0DC752] bg-[#0DC752] text-black hover:bg-[#0DC752]/80"}`}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}

function TypeListItem({
  item,
  isDark,
  canEdit,
  canDelete,
  onRename,
  onDelete,
}: {
  item: ManagedTypeItem | EditingTypeItem;
  isDark: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.label);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setName(item.label);
  }, [item.label]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || !canEdit) return;
    setSaving(true);
    await onRename(trimmed);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(item.label);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? "border-white/10 bg-black/30" : "border-zinc-200 bg-zinc-50"}`}>
      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            onKeyDown={handleKeyDown}
            maxLength={80}
            className={`h-10 rounded-xl text-sm ${isDark ? "border-white/10 bg-[#0F0F0F] text-white placeholder:text-white/30 focus:border-[#8E826A]" : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500"}`}
          />
        ) : (
          <span className={`block truncate text-sm font-medium ${isDark ? "text-white" : "text-zinc-900"}`}>{item.label}</span>
        )}
      </div>
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${item.isSystemDefault ? (isDark ? "border-[#E8D1AB30] bg-[#E8D1AB1A] text-[#E8D1AB]" : "border-zinc-300 bg-zinc-100 text-zinc-700") : (isDark ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700")}`}>
        {item.isSystemDefault ? "Default" : "Custom"}
      </span>
      {editing ? (
        <>
          <button
            onClick={handleCancel}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-[#161616] text-white/60" : "bg-white text-zinc-600"}`}
          >
            <X size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !canEdit}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50 ${isDark ? "bg-[#161616] text-[#E8D1AB]" : "bg-white text-zinc-600"}`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setEditing(true)}
            disabled={!canEdit}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50 ${isDark ? "bg-[#161616] text-white/60" : "bg-white text-zinc-600"}`}
          >
            <Pencil size={14} />
          </button>
          {!item.isSystemDefault ? (
            <button
              onClick={onDelete}
              disabled={!canDelete}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50 ${isDark ? "bg-[#161616] text-white/60" : "bg-white text-zinc-600"}`}
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function TypeCard({
  title,
  subtitle,
  items,
  count,
  isDark,
  canCreate,
  canEdit,
  canDelete,
  onAdd,
  onRename,
  onDelete,
  addPlaceholder,
  defaultExpanded = false,
  relatedLines = [],
}: TypeCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = getTypeCardIcon(title);
  return (
    <div className={`rounded-lg lg:rounded-2xl border p-4 lg:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.18)] ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-[#302E2E] text-[#E8D1AB]" : "bg-[#E8D1AB] text-black"}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>{title}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-white/10 text-white/55" : "bg-zinc-200 text-zinc-600"}`}>{count}</span>
            </div>
            <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>{subtitle}</p>
            {relatedLines.length > 0 ? (
              <div className={`mt-1 flex flex-wrap gap-2 text-[11px] ${isDark ? "text-white/45" : "text-zinc-500"}`}>
                {relatedLines.map((line) => <span key={line}>{line}</span>)}
              </div>
            ) : null}
          </div>
          <ChevronDown className={`ml-auto h-5 w-5 shrink-0 transition-transform ${isDark ? "text-white/40" : "text-zinc-400"} ${expanded ? "rotate-180" : ""}`} />
        </button>
        <Button
          onClick={() => {
            if (!canCreate) return;
            setExpanded(true);
            setShowAddForm((prev) => !prev);
          }}
          disabled={!canCreate}
          className={`h-9 rounded-lg px-3 text-sm font-semibold ${showAddForm ? (isDark ? "border border-white/10 bg-[#24201A] text-[#E8D1AB]" : "border border-zinc-200 bg-zinc-100 text-zinc-800") : isDark ? "bg-[#E5D5B8] text-black" : "bg-black text-white"}`}
        >
          {showAddForm ? <X size={13} /> : <Plus size={14} />}
          {showAddForm ? "Cancel" : "Add New"}
        </Button>
      </div>

      {expanded ? (
        <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {showAddForm ? (
            <TypeAddForm
              isDark={isDark}
              canCreate={canCreate}
              placeholder={addPlaceholder}
              onClose={() => setShowAddForm(false)}
              onAdd={async (name) => {
                await onAdd(name);
                setShowAddForm(false);
              }}
            />
          ) : null}
          {items.length === 0 && !showAddForm ? (
            <div className={`rounded-xl border p-4 text-sm ${isDark ? "border-white/10 text-white/50" : "border-zinc-200 text-zinc-500"}`}>
              No items yet.
            </div>
          ) : (
            items.map((item) => (
              <TypeListItem
                key={item.id}
                item={item}
                isDark={isDark}
                canEdit={canEdit}
                canDelete={canDelete}
                onRename={async (name) => onRename(item, name)}
                onDelete={async () => onDelete(item)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function TypesManagementPanel({
  services,
  searchQuery,
  isDark,
  canCreate,
  canEdit,
  canDelete,
  onCountChange,
  refreshToken,
  showFooter = true,
}: {
  services: PricingItem[];
  searchQuery: string;
  isDark: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCountChange: (count: number) => void;
  refreshToken: number;
  showFooter?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [videoShootTypes, setVideoShootTypes] = useState<ManagedTypeItem[]>([]);
  const [photoShootTypes, setPhotoShootTypes] = useState<ManagedTypeItem[]>([]);
  const [editingTypes, setEditingTypes] = useState<EditingTypeItem[]>([]);
  const targets = useMemo(() => resolveTypeTargets(services), [services]);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    try {
      const [videoRes, photoRes, editingRes] = await Promise.all([
        targets.videoId ? salesApi.getShootTypes(targets.videoId) : Promise.resolve(null),
        targets.photoId ? salesApi.getShootTypes(targets.photoId) : Promise.resolve(null),
        salesApi.getAiEditingTypes(),
      ]);

      setVideoShootTypes(videoRes && !videoRes.error && Array.isArray(videoRes.data) ? mapManagedShootTypes(videoRes.data as Array<Record<string, unknown>>) : []);
      setPhotoShootTypes(photoRes && !photoRes.error && Array.isArray(photoRes.data) ? mapManagedShootTypes(photoRes.data as Array<Record<string, unknown>>) : []);

      const editingData = editingRes && !editingRes.error ? editingRes.data : null;
      const mergedEditing = mergeEditingTypes(
        Array.isArray(editingData?.video_edit_types) ? (editingData.video_edit_types as Array<Record<string, unknown>>) : [],
        Array.isArray(editingData?.photo_edit_types) ? (editingData.photo_edit_types as Array<Record<string, unknown>>) : []
      );
      setEditingTypes(mergedEditing);
      onCountChange(
        [
          ...mapManagedShootTypes(videoRes && !videoRes.error && Array.isArray(videoRes.data) ? videoRes.data as Array<Record<string, unknown>> : []),
          ...mapManagedShootTypes(photoRes && !photoRes.error && Array.isArray(photoRes.data) ? photoRes.data as Array<Record<string, unknown>> : []),
          ...mergedEditing,
        ].length
      );
    } catch {
      onCountChange(0);
      toast.error("Failed to load shoot type data");
    } finally {
      setLoading(false);
    }
  }, [onCountChange, targets.photoId, targets.videoId]);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes, refreshToken]);

  const matchesSearch = (label: string) => label.toLowerCase().includes(searchQuery.toLowerCase());

  const renameType = async (item: ManagedTypeItem | EditingTypeItem, kind: "shoot" | "edit", nextValue: string) => {
    if (!canEdit) return;
    if (!nextValue?.trim()) return;

    if (kind === "shoot") {
      const res = await salesApi.updateShootType(item.apiId ?? item.id, { name: nextValue.trim() });
      if (res && !res.error) {
        toast.success(`${nextValue.trim()} updated`);
        await loadTypes();
      } else {
        toast.error("Failed to update shoot type");
      }
      return;
    }

    const editItem = item as EditingTypeItem;
    const editingCategories = editItem.categories.includes("both") ? ["video", "photo"] : editItem.categories;
    const responses = await Promise.all(
      editingCategories.map((category) => salesApi.updateAiEditingType(editItem.apiIds[category] ?? editItem.apiId ?? editItem.id, { label: nextValue.trim(), category }))
    );
    if (responses.every((res) => res && !res.error)) {
      toast.success(`${nextValue.trim()} updated`);
      await loadTypes();
    } else {
      toast.error("Failed to update editing type");
    }
  };

  const deleteType = async (item: ManagedTypeItem | EditingTypeItem, kind: "shoot" | "edit") => {
    if (!canDelete || item.isSystemDefault) return;

    if (kind === "shoot") {
      const res = await salesApi.deleteShootType(item.apiId ?? item.id);
      if (res && !res.error) {
        toast.success(`${item.label} deleted`);
        await loadTypes();
      } else {
        toast.error("Failed to delete shoot type");
      }
      return;
    }

    const editItem = item as EditingTypeItem;
    const editingCategories = editItem.categories.includes("both") ? ["video", "photo"] : editItem.categories;
    const responses = await Promise.all(
      editingCategories.map((category) => salesApi.deleteAiEditingType(editItem.apiIds[category] ?? editItem.apiId ?? editItem.id))
    );
    if (responses.every((res) => res && !res.error)) {
      toast.success(`${item.label} deleted`);
      await loadTypes();
    } else {
      toast.error("Failed to delete editing type");
    }
  };

  const addShootType = async (kind: ShootTypeKind, label: string) => {
    if (!canCreate || !label.trim()) return;
    const targetId = kind === "video" ? targets.videoId : targets.photoId;
    if (!targetId) {
      toast.error(`Missing ${kind} service`);
      return;
    }
    const res = await salesApi.createShootType({ name: label.trim(), content_type: Number(targetId) });
    if (res && !res.error) {
      toast.success(`${label.trim()} added`);
      await loadTypes();
    } else {
      toast.error("Failed to add shoot type");
    }
  };

  const addEditingType = async (_kind: ShootTypeKind, label: string) => {
    if (!canCreate || !label.trim()) return;

    // Keep editing type creation aligned with the quote builder flow:
    // one server-side category is enough because the UI merges labels
    // across video/photo editing types when it reloads.
    const res = await salesApi.createAiEditingType({
      category: "video",
      label: label.trim(),
    });

    if (res && !res.error) {
      toast.success(`${label.trim()} added`);
      await loadTypes();
    } else {
      toast.error("Failed to add editing type");
    }
  };

  const cards = [
    {
      title: `${targets.videoLabel} - Shoot Types`,
      subtitle: "Rename defaults or add custom video shoot types.",
      items: videoShootTypes.filter((item) => matchesSearch(item.label)),
      count: videoShootTypes.length,
      onAdd: (name: string) => addShootType("video", name),
      onRename: (item: ManagedTypeItem, name: string) => renameType(item, "shoot", name),
      onDelete: (item: ManagedTypeItem) => deleteType(item, "shoot"),
      relatedLines: [],
    },
    {
      title: `${targets.photoLabel} - Shoot Types`,
      subtitle: "Rename defaults or add custom photo shoot types.",
      items: photoShootTypes.filter((item) => matchesSearch(item.label)),
      count: photoShootTypes.length,
      onAdd: (name: string) => addShootType("photo", name),
      onRename: (item: ManagedTypeItem, name: string) => renameType(item, "shoot", name),
      onDelete: (item: ManagedTypeItem) => deleteType(item, "shoot"),
      relatedLines: [],
    },
    {
      title: "Editing Types",
      subtitle: "Shared editing labels used across create quotes.",
      items: editingTypes.filter((item) => matchesSearch(item.label)),
      count: editingTypes.length,
      onAdd: (name: string) => addEditingType("video", name),
      onRename: (item: ManagedTypeItem, name: string) => renameType(item, "edit", name),
      onDelete: (item: ManagedTypeItem) => deleteType(item, "edit"),
      relatedLines: [
        `Video ${editingTypes.filter((item) => item.categories.includes("video")).length}`,
        `Photo ${editingTypes.filter((item) => item.categories.includes("photo")).length}`,
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className={`flex flex-col items-center justify-center gap-4 rounded-3xl border py-24 ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-zinc-50"}`}>
          <Loader2 size={32} className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-zinc-800"}`} />
          <p className={`text-sm ${isDark ? "text-white/55" : "text-zinc-500"}`}>Loading types...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {cards.map((card) => (
            <TypeCard
              key={card.title}
              title={card.title}
              subtitle={card.subtitle}
              items={card.items}
              isDark={isDark}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
              onAdd={card.onAdd}
              onRename={card.onRename}
              onDelete={card.onDelete}
              addPlaceholder={card.title === "Editing Types" ? "Enter editing type name..." : `Enter ${card.title.toLowerCase().replace(/\s+-\s+shoot types$/, "").replace(/\s+types$/, "")} name...`}
              defaultExpanded={false}
              count={card.count}
              relatedLines={card.relatedLines}
            />
          ))}
        </div>
      )}

      {showFooter ? (
        <div className={`flex items-start gap-3 rounded-lg lg:rounded-3xl border p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-zinc-50"}`}>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg lg:rounded-2xl ${isDark ? "bg-[#302E2E] text-[#E8D1AB]" : "bg-[#E8D1AB] text-black"}`}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
              Create quote options stay the same
            </p>
            <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>
              These lists manage the source data used by the quote builder. Existing create-quote flows stay unchanged.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function QuotePricingPage() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { canCreate, canEdit, canDelete } = usePermissions("quotes");
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<CatalogData>({
    service: [],
    addon: [],
    logistics: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PageTab>("all");
  const [search, setSearch] = useState("");
  const [typesCount, setTypesCount] = useState(0);
  const [typesRefreshToken, setTypesRefreshToken] = useState(0);

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
            isSystemDefault: Number((it as { is_system_default?: unknown }).is_system_default ?? 0) === 1,
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

  const refreshAll = useCallback(async () => {
    setTypesRefreshToken((prev) => prev + 1);
    await fetchCatalog();
  }, [fetchCatalog]);

  const handleSave = useCallback(
    async (id: string, name: string, rate: number) => {
      if (!canEdit) {
        toast.error("You do not have permission to edit pricing items");
        return;
      }
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
    [canEdit, data]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!canDelete) {
        toast.error("You do not have permission to delete pricing items");
        return;
      }
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
    [canDelete, data]
  );

  const handleAdd = useCallback(async (section: SectionKey, name: string, rate: number) => {
    if (!canCreate) {
      toast.error("You do not have permission to add pricing items");
      return;
    }
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
  }, [canCreate]);

  const totalTypes = typesCount;
  const totalPricingItems = Object.values(data).flat().length;
  const totalAllItems = totalPricingItems + totalTypes;
  const visibleSections: SectionKey[] = activeTab === "all" ? SECTION_KEYS : SECTION_KEYS.includes(activeTab as SectionKey) ? [activeTab as SectionKey] : [];
  const tabs = PAGE_TABS.map((tab) => ({
    ...tab,
    count:
      tab.key === "all"
        ? totalAllItems
        : tab.key === "service"
          ? data.service.length
          : tab.key === "addon"
            ? data.addon.length
            : tab.key === "logistics"
              ? data.logistics.length
              : totalTypes,
  }));

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ create: "Master Pricing" }}
        actions={
          <Button
            onClick={refreshAll}
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
            <p className={`text-lg font-semibold leading-none ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>{totalAllItems}</p>
            <p className={`text-xs ${isDark ? "text-[#FFFFFF99]" : "text-[#000000B2]"}`}>Total Items</p>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/35" : "text-zinc-400"}`}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === "types" ? "Search shoot and editing types..." : "Search pricing items..."}
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

          {activeTab !== "types" && search ? (
            <p className={`mt-3 text-sm ${isDark ? "text-white/50" : "text-zinc-400"}`}>
              Searching across all sections
            </p>
          ) : null}
        </div>

        {/* Loader / Content Area */}
        {activeTab === "types" ? (
          <TypesManagementPanel
            services={data.service}
            searchQuery={search}
            isDark={isDark}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            onCountChange={setTypesCount}
            refreshToken={typesRefreshToken}
            showFooter
          />
        ) : loading ? (
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
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                defaultExpanded={activeTab !== "all" || section === "service"}
                isDark={isDark}
              />
            ))}
            {activeTab === "all" ? (
              <TypesManagementPanel
                services={data.service}
                searchQuery={search}
                isDark={isDark}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCountChange={setTypesCount}
                refreshToken={typesRefreshToken}
                showFooter={false}
              />
            ) : null}

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
            onClick={refreshAll}
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
