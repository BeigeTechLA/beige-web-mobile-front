"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/landing/ui/button";
import { adminApi, salesApi } from "@/lib/api";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { ReviewAddOnsModal } from "@/components/admin/shoot-details/ReviewAddOnsModal";
import { AddOnsPaymentModal, type ManualPaymentPayload } from "@/components/admin/shoot-details/AddOnsPaymentModal";

type QuoteLineItem = {
  line_item_id?: number | string | null;
  catalog_item_id?: number | string | null;
  section_type?: string | null;
  source_type?: string | null;
  item_name?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_rate?: number | string | null;
  estimated_pricing?: number | string | null;
  line_total?: number | string | null;
  sort_order?: number | string | null;
  is_active?: number | string | null;
};

type CatalogAddonApiItem = {
  catalog_item_id?: number | string | null;
  name?: string | null;
  effective_rate?: number | string | null;
  default_rate?: number | string | null;
};

type QuoteDetailLineItem = {
  line_item_id?: number | string | null;
  sales_quote_line_item_id?: number | string | null;
  catalog_item_id?: number | string | null;
  section_type?: string | null;
  source_type?: string | null;
  item_name?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_rate?: number | string | null;
  estimated_pricing?: number | string | null;
  line_total?: number | string | null;
  sort_order?: number | string | null;
  is_active?: number | string | null;
};

type AddOnDraft = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selected: boolean;
  catalogItemId: number | null;
  sourceType: "catalog" | "custom";
  description?: string | null;
};

const asNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const buildDrafts = (
  catalog: Array<{ id: string; catalogItemId: number | null; name: string; price: number }>,
  lineItems: Array<QuoteLineItem | QuoteDetailLineItem>
) => {
  const byCatalogId = new Map<string, (typeof catalog)[number]>();
  const byName = new Map<string, (typeof catalog)[number]>();

  catalog.forEach((item) => {
    byCatalogId.set(String(item.catalogItemId ?? item.id), item);
    byName.set(normalize(item.name), item);
  });

  const drafts: AddOnDraft[] = catalog.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: 0,
    selected: false,
    catalogItemId: item.catalogItemId,
    sourceType: "catalog",
  }));

  lineItems
    .filter((item) => String(item.section_type || "").toLowerCase() === "addon" && Number(item.is_active ?? 1) !== 0)
    .forEach((item) => {
      const quantity = Math.max(1, Math.round(asNumber(item.quantity, 1)));
      const price = asNumber(item.unit_rate ?? item.estimated_pricing ?? item.line_total, 0);
      const matched =
        (item.catalog_item_id != null && byCatalogId.get(String(item.catalog_item_id))) ||
        byName.get(normalize(item.item_name));

      if (matched) {
        const existing = drafts.find((entry) => entry.id === matched.id);
        if (existing) {
          existing.selected = true;
          existing.quantity = quantity;
          existing.price = price || existing.price;
          existing.description = item.description ?? null;
        }
        return;
      }

      drafts.push({
        id: `custom-${item.line_item_id ?? item.sort_order ?? Date.now()}`,
        name: String(item.item_name || "Custom Add-on"),
        price,
        quantity,
        selected: true,
        catalogItemId: null,
        sourceType: "custom",
        description: item.description ?? null,
      });
    });

  return drafts;
};

export default function AddOnsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [addOns, setAddOns] = useState<AddOnDraft[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customAddonName, setCustomAddonName] = useState("");
  const [customAddonCost, setCustomAddonCost] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const [projectRes, catalogRes] = await Promise.all([
          adminApi.getProjectDetails(id),
          salesApi.getQuoteCatalog(),
        ]);

        const project = projectRes?.data?.project || projectRes?.data || null;
        const primaryQuote = project?.primary_quote || null;
        const resolvedQuoteId = Number(project?.converted_sales_quote_id || project?.sales_quote_id || project?.quote_id || primaryQuote?.quote_id || 0);
        let lineItems: Array<QuoteLineItem | QuoteDetailLineItem> = [];

        if (resolvedQuoteId > 0) {
          const quoteRes = await salesApi.getQuoteDetail(resolvedQuoteId);
          const quoteDetail = unwrapSalesQuoteDetail(quoteRes?.data ?? null);
          if (Array.isArray(quoteDetail?.line_items) && quoteDetail.line_items.length > 0) {
            lineItems = quoteDetail.line_items;
          }
        }

        if (!lineItems.length && Array.isArray(primaryQuote?.line_items)) {
          lineItems = primaryQuote.line_items;
        }

        const catalog = Array.isArray(catalogRes?.data?.addon)
          ? catalogRes.data.addon.map((item: CatalogAddonApiItem, index: number) => ({
              id: String(item.catalog_item_id ?? `addon-${index}`),
              catalogItemId: item.catalog_item_id ?? null,
              name: String(item.name || ""),
              price: asNumber(item.effective_rate ?? item.default_rate, 0),
            }))
          : [];

        if (!alive) return;
        setQuoteId(Number.isFinite(resolvedQuoteId) && resolvedQuoteId > 0 ? resolvedQuoteId : null);
        setAddOns(buildDrafts(catalog, lineItems));
      } catch (error) {
        console.error("Failed to load add-ons", error);
        if (alive) toast.error("Failed to load add-ons");
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, [id]);

  const selectedItems = useMemo(
    () => addOns.filter((item) => item.selected && item.quantity > 0),
    [addOns]
  );

  const totalAmount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  );

  const updateAddon = (addonId: string, updater: (current: AddOnDraft) => AddOnDraft) => {
    setAddOns((prev) => prev.map((item) => (item.id === addonId ? updater(item) : item)));
  };

  const toggleAddon = (addonId: string) => {
    updateAddon(addonId, (current) => {
      const nextSelected = !current.selected;
      return {
        ...current,
        selected: nextSelected,
        quantity: nextSelected ? Math.max(1, current.quantity || 1) : 0,
      };
    });
  };

  const changeQuantity = (addonId: string, delta: number) => {
    updateAddon(addonId, (current) => {
      const nextQuantity = Math.max(0, current.quantity + delta);
      return { ...current, quantity: nextQuantity, selected: nextQuantity > 0 };
    });
  };

  const changePrice = (addonId: string, rawValue: string) => {
    const price = asNumber(rawValue.replace(/[^0-9.]/g, ""), 0);
    updateAddon(addonId, (current) => ({ ...current, price }));
  };

  const addCustomAddon = () => {
    const name = customAddonName.trim();
    const price = asNumber(customAddonCost.replace(/[^0-9.]/g, ""), 0);

    if (!name) return toast.error("Add-on name is required");
    if (!(price > 0)) return toast.error("Add-on cost is required");

    setAddOns((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name,
        price,
        quantity: 1,
        selected: true,
        catalogItemId: null,
        sourceType: "custom",
      },
    ]);

    setCustomAddonName("");
    setCustomAddonCost("");
    setShowCustomForm(false);
  };

  const removeAddon = (addonId: string) => {
    setAddOns((prev) =>
      prev.filter((item) => item.id !== addonId || item.sourceType !== "custom").map((item) =>
        item.id === addonId ? { ...item, selected: false, quantity: 0 } : item
      )
    );
  };

  const handleSave = async (manualPayment: ManualPaymentPayload) => {
    if (!selectedItems.length) {
      toast.error("Please select at least one add-on");
      return;
    }

    setIsSaving(true);
    try {
      const uploadedProof = await salesApi.uploadManualPaymentProof(manualPayment.proof_file);
      if (!uploadedProof?.success) {
        throw new Error(uploadedProof?.message || uploadedProof?.error || "Failed to upload payment proof");
      }

      const proofUrl = uploadedProof?.data?.proof_url || uploadedProof?.data?.proofUrl;
      const proofFilePath = uploadedProof?.data?.file_path || uploadedProof?.data?.proof_file_path || null;
      if (!proofUrl) {
        throw new Error("Proof URL is missing after upload");
      }

      const response = await adminApi.updateShootAddOns(id, {
        quote_id: quoteId ?? undefined,
        line_items: selectedItems.map((item, index) => ({
          catalog_item_id: item.catalogItemId,
          section_type: "addon",
          source_type: item.sourceType,
          item_name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit_rate: item.price,
          estimated_pricing: item.price,
          rate_type: "flat",
          rate_unit: "fixed",
          sort_order: index,
        })),
        manual_payment: {
          payment_type: manualPayment.payment_type,
          amount: manualPayment.amount,
          payment_mode: manualPayment.payment_mode,
          other_payment_mode: manualPayment.other_payment_mode,
          proof_url: proofUrl,
          proof_file_path: proofFilePath,
          proof_file_name: manualPayment.proof_file.name,
          notes: manualPayment.notes,
          transaction_id: manualPayment.transaction_id,
        },
        edit_reason: "Updated shoot add-ons",
        ops_review_confirmed: true,
      });

      if (!response?.success) {
        throw new Error(response?.message || response?.error || "Failed to update add-ons");
      }

      toast.success("Add-ons updated successfully");
      router.back();
    } catch (error) {
      console.error("Failed to save add-ons", error);
      toast.error(error instanceof Error ? error.message : "Failed to save add-ons");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 text-white lg:p-10">
      <button
        onClick={() => router.back()}
        className="mb-8 flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold">Add-ons</h1>
        <p className="text-sm text-zinc-400 md:text-base">
          Customize your shoot with professional equipment and premium services tailored to your production needs.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#111111] p-8 text-sm text-zinc-400">
          Loading add-ons...
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-zinc-800 bg-[#111111] p-8">
            <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {addOns.map((item) => (
                <div key={item.id} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAddon(item.id)}
                        className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                          item.selected ? "border-[#E8D1AB] bg-[#E8D1AB]" : "border-zinc-600 bg-transparent"
                        }`}
                      >
                        {item.selected ? <Check size={14} className="text-black" /> : null}
                      </button>
                      <span className={`text-sm font-medium ${item.selected ? "text-white" : "text-zinc-400"}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-[#E8D1AB]">{money(item.price)}</span>
                  </div>

                  <div
                    className={`flex h-12 items-center justify-between overflow-hidden rounded-lg transition-colors ${
                      item.selected ? "bg-[#E8D1AB] text-black" : "bg-[#E8D1AB]/30 text-black"
                    }`}
                  >
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                      className="flex h-full items-center justify-center px-4 hover:bg-black/10"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-bold">{String(item.quantity).padStart(2, "0")}</span>
                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                      className="flex h-full items-center justify-center px-4 hover:bg-black/10"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <input
                    value={item.price.toFixed(2)}
                    onChange={(e) => changePrice(item.id, e.target.value)}
                    inputMode="decimal"
                    className="h-11 rounded-lg border border-zinc-700 bg-transparent px-3 text-sm text-white outline-none focus:border-[#E8D1AB]"
                  />

                  {item.sourceType === "custom" ? (
                    <button
                      onClick={() => removeAddon(item.id)}
                      className="flex w-fit items-center gap-1 text-sm text-[#FF6467] transition-colors hover:text-red-400"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-14 rounded-lg border-zinc-700 bg-transparent px-12 text-white hover:bg-zinc-900"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                if (!selectedItems.length) {
                  toast.error("Please select at least one add-on");
                  return;
                }
                setIsReviewOpen(true);
              }}
              className="h-14 rounded-lg bg-[#E8D1AB] px-12 font-bold text-black hover:bg-[#d9c5a0]"
            >
              Continue
            </Button>
          </div>

          <div className="mt-10">
            <Button
              onClick={() => setShowCustomForm((prev) => !prev)}
              className="h-12 rounded-lg bg-[#E8D1AB] px-5 font-bold text-black hover:bg-[#d9c5a0]"
            >
              <Plus size={16} className="mr-2" />
              Add More Add-ons
            </Button>

            {showCustomForm ? (
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px_auto] lg:items-end">
                <div className="relative">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Add-on Name
                  </label>
                  <input
                    value={customAddonName}
                    onChange={(e) => setCustomAddonName(e.target.value)}
                    placeholder="Eg : 4K RAW Recording"
                    className="h-12 w-full rounded-lg border border-zinc-700 bg-transparent px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#E8D1AB]"
                  />
                </div>
                <div className="relative">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Cost
                  </label>
                  <input
                    value={customAddonCost}
                    onChange={(e) => setCustomAddonCost(e.target.value)}
                    placeholder="$ 0.00"
                    inputMode="decimal"
                    className="h-12 w-full rounded-lg border border-zinc-700 bg-transparent px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#E8D1AB]"
                  />
                </div>
                <Button onClick={addCustomAddon} className="h-12 rounded-lg bg-[#E8D1AB] px-5 font-bold text-black hover:bg-[#d9c5a0]">
                  <Check size={16} className="mr-2" />
                  Add
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}

      <ReviewAddOnsModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onContinue={() => {
          setIsReviewOpen(false);
          setIsPaymentOpen(true);
        }}
        selectedItems={selectedItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))}
        totalAmount={totalAmount}
      />

      <AddOnsPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
