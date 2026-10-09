'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Check, Minus, Plus, Search, Trash2, Package, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem, InventoryRequest, ShootOption, RequestLine, RequestType, inventoryApi, available, currency, formatInventoryDate, requestTotals } from '@/components/common/inventory/inventory';
import { InventoryCard, InventoryImage, useInventoryStyle, InventoryButton } from '@/components/common/inventory/InventoryUI';

// Shared grid template so the cart header and every cart row line up perfectly.
// Columns: image | item name | quantity | line total | remove
const CART_GRID = 'grid grid-cols-[64px_minmax(0,1fr)_72px_96px_40px] items-center gap-4';

export default function InventoryRequestWizard({
  open,
  onClose,
  onSubmitted,
  editing,
  initialItem,
  catalog
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  editing?: InventoryRequest | null;
  initialItem?: InventoryItem | null;
  catalog: InventoryItem[];
}) {
  const s = useInventoryStyle();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<RequestType>('personal');
  const [shootId, setShootId] = useState('');
  const [shoots, setShoots] = useState<ShootOption[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [items, setItems] = useState<RequestLine[]>([]);
  const [detail, setDetail] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const firstLine: RequestLine | undefined = initialItem
      ? {
          inventory_item_id: initialItem.id,
          item_name_snapshot: initialItem.name,
          item_image_snapshot: initialItem.image_url,
          unit_price_snapshot: initialItem.unit_price,
          quantity: 1,
          line_total: initialItem.unit_price,
        }
      : undefined;
    setStep(0);
    setType(editing?.request_type || 'personal');
    setShootId(editing?.shoot_id || '');
    setItems(editing?.items || (firstLine ? [firstLine] : []));
    setDetail(null);
  }, [open, editing, initialItem]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    inventoryApi.shoots()
      .then(assigned => {
        if (active) setShoots(assigned || []);
      })
      .catch(e => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load assigned shoots');
          toast.error('Unable to load assigned shoots. Please try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const total = useMemo(() => requestTotals(items), [items]);
  const filteredCatalog = useMemo(
    () => catalog.filter(item => `${item.name} ${item.description || ''}`.toLowerCase().includes(catalogSearch.trim().toLowerCase())),
    [catalog, catalogSearch]
  );

  const changeQuantity = (id: string, n: number) => {
    const product = catalog.find(x => x.id === id);
    const existing = items.find(x => x.inventory_item_id === id);
    const max = product ? available(product) + (editing?.items.find(x => x.inventory_item_id === id)?.quantity || 0) : existing?.quantity || 0;
    if (n < 1 || !Number.isSafeInteger(n) || n > max) return;
    setItems(prev => prev.map(x => (x.inventory_item_id === id ? { ...x, quantity: n, line_total: x.unit_price_snapshot * n } : x)));
  };

  const addItem = () => {
    if (!detail) return;
    const current = items.find(x => x.inventory_item_id === detail.id);
    const already = editing?.items.find(x => x.inventory_item_id === detail.id)?.quantity || 0;
    const max = available(detail) + already;
    const next = qty + (current?.quantity || 0);
    if (!Number.isSafeInteger(qty) || qty < 1 || next > max) return toast.error(`Available quantity is ${max}`);
    setItems(prev =>
      current
        ? prev.map(x => (x.inventory_item_id === detail.id ? { ...x, quantity: next, line_total: x.unit_price_snapshot * next } : x))
        : [
            ...prev,
            {
              inventory_item_id: detail.id,
              item_name_snapshot: detail.name,
              item_image_snapshot: detail.image_url,
              unit_price_snapshot: detail.unit_price,
              quantity: qty,
              line_total: detail.unit_price * qty,
            },
          ]
    );
    setDetail(null);
    toast.success('Item added to request');
  };

  const submit = async () => {
    if (items.length === 0) return toast.error('Choose at least one item');
    if (type === 'shoot' && !shootId) return toast.error('Choose an assigned shoot');
    if (type === 'shoot' && !shoots.some(x => x.id === shootId)) return toast.error('Selected shoot is not assigned');
    setSubmitting(true);
    try {
      await inventoryApi.submit(
        {
          request_type: type,
          shoot_id: type === 'shoot' ? shootId : null,
          items: items.map(({ inventory_item_id, quantity }) => ({ inventory_item_id, quantity })),
        },
        editing?.id
      );
      toast.success(editing ? 'Request updated' : 'Inventory request submitted');
      onSubmitted();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed. Check availability and try again');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ['Request Purpose', 'Select Items', 'Cart & Quantities', 'Review & Submit'];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !submitting) onClose(); }}>
      <DialogContent className={`w-[calc(100vw-24px)] max-w-[840px] max-h-[92vh] overflow-y-auto rounded-2xl border p-6 ${s.surface}`}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">{editing ? 'Edit Inventory Request' : 'New Equipment Request'}</DialogTitle>
        </DialogHeader>

        {/* Step Navigation Bar */}
        <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 border-b pb-5 mb-5 ${s.isDark ? 'border-[#262626]' : 'border-[#EAEAEA]'}`}>
          {STEPS.map((label, i) => {
            const isCurrent = step === i;
            const isPassed = step > i;
            return (
              <button
                key={label}
                disabled={i > step && ((i === 1 && type === 'shoot' && !shootId) || (i >= 2 && items.length === 0))}
                onClick={() => setStep(i)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                  isCurrent
                    ? 'bg-[#E8D1AB] text-black font-semibold shadow-xs'
                    : isPassed
                    ? s.isDark
                      ? 'bg-zinc-800/80 text-white hover:bg-zinc-800'
                      : 'bg-zinc-100 text-black hover:bg-zinc-200'
                    : `opacity-40 cursor-not-allowed ${s.muted}`
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? 'bg-black text-[#E8D1AB]'
                      : isPassed
                      ? 'bg-[#E8D1AB] text-black'
                      : s.isDark
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-zinc-300 text-zinc-700'
                  }`}
                >
                  {isPassed ? <Check size={13} /> : i + 1}
                </span>
                <span className="text-xs truncate font-medium">{label}</span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent text-[#E8D1AB] mb-3"></div>
            <p className={s.muted}>Loading assigned shoots…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Step 0: Purpose */}
            {step === 0 && (
              <div className="space-y-6 py-2">
                <div>
                  <h3 className="text-base font-bold">What is this equipment request for?</h3>
                  <p className={`text-sm ${s.muted}`}>Select whether this request is for personal creative use or an upcoming shoot assignment.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {(
                    [
                      { id: 'personal', label: 'Personal Use', sub: 'For personal projects or skill practice', icon: Package },
                      { id: 'shoot', label: 'Assigned Shoot', sub: 'For an officially assigned BEIGE shoot', icon: Calendar },
                    ] as const
                  ).map(o => {
                    const Icon = o.icon;
                    const isSelected = type === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`group relative rounded-2xl border p-5 text-left transition-all ${
                          isSelected
                            ? 'border-[#E8D1AB] ring-2 ring-[#E8D1AB]/50 ' + (s.isDark ? 'bg-zinc-900' : 'bg-[#FFFCF6]')
                            : s.isDark
                            ? 'border-[#262626] bg-[#161616] hover:border-zinc-700'
                            : 'border-[#EAEAEA] bg-white hover:border-zinc-300'
                        }`}
                        onClick={() => setType(o.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-xl mb-3 ${isSelected ? 'bg-[#E8D1AB] text-black' : s.isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                            <Icon size={22} />
                          </div>
                          {isSelected && <Check size={20} className="text-[#E8D1AB]" />}
                        </div>
                        <h4 className="text-base font-bold">{o.label}</h4>
                        <p className={`mt-1 text-xs leading-relaxed ${s.muted}`}>{o.sub}</p>
                      </button>
                    );
                  })}
                </div>

                {type === 'shoot' && (
                  <div className={`space-y-2.5 p-4 rounded-xl border ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                    <label htmlFor="assigned-shoot" className="block text-sm font-semibold">
                      Select Assigned Shoot
                    </label>
                    <Select value={shootId} onValueChange={setShootId}>
                      <SelectTrigger id="assigned-shoot" className={`h-11 w-full rounded-xl ${s.field}`}>
                        <SelectValue placeholder="Select from your assigned shoots list" />
                      </SelectTrigger>
                      <SelectContent>
                        {shoots.length === 0 ? (
                          <div className="p-3 text-xs text-center text-zinc-500">No assigned shoots found.</div>
                        ) : (
                          shoots.map(shoot => (
                            <SelectItem key={shoot.id} value={shoot.id}>
                              {shoot.name} ({shoot.id}) {shoot.date ? `· ${formatInventoryDate(shoot.date)}` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Browse Catalog */}
            {step === 1 && (
              <div className="space-y-4">
                {detail ? (
                  <div className={`p-5 rounded-2xl border space-y-4 ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                    <button onClick={() => setDetail(null)} className={`flex items-center gap-1.5 text-xs font-semibold hover:underline ${s.muted}`}>
                      <ArrowLeft size={14} /> Back to catalog
                    </button>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <InventoryImage src={detail.image_url} alt={detail.name} className="w-full h-56 rounded-xl" />
                      <div className="flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold">{detail.name}</h3>
                          <p className={`text-xs ${s.muted}`}>{detail.description || 'No description available.'}</p>
                          <div className="pt-2 flex items-center justify-between text-sm">
                            <span className="font-semibold">{currency(detail.unit_price, detail.currency)} / unit</span>
                            <span className="text-xs font-medium text-emerald-500">{available(detail)} units available</span>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <label className="block text-xs font-semibold">Select Quantity</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className={`h-10 w-10 flex items-center justify-center rounded-xl border ${s.secondary}`}
                              onClick={() => setQty(n => Math.max(1, n - 1))}
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              aria-label="Item quantity"
                              type="number"
                              min={1}
                              max={available(detail)}
                              value={qty}
                              onChange={e => setQty(Number(e.target.value))}
                              className={`h-10 w-20 rounded-xl text-center font-bold border ${s.field}`}
                            />
                            <button
                              type="button"
                              className={`h-10 w-10 flex items-center justify-center rounded-xl border ${s.secondary}`}
                              onClick={() => setQty(n => Math.min(available(detail), n + 1))}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-sm font-bold pt-1">
                            <span>Line Total:</span>
                            <span className="text-base">{currency(detail.unit_price * qty, detail.currency)}</span>
                          </div>
                          <InventoryButton
                            variant="beige"
                            disabled={qty < 1 || qty > available(detail)}
                            className="h-11 w-full rounded-xl font-semibold text-black shadow-xs hover:opacity-90"
                            onClick={addItem}
                          >
                            Add to Request
                          </InventoryButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${s.muted}`} />
                        <input
                          value={catalogSearch}
                          onChange={event => setCatalogSearch(event.target.value)}
                          placeholder="Search available inventory catalog..."
                          className={`h-11 w-full rounded-xl border pl-10 pr-4 text-sm ${s.field}`}
                        />
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${s.muted}`}>{items.length} items in cart</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {filteredCatalog.map(item => (
                        <InventoryCard
                          key={item.id}
                          item={item}
                          selected={items.some(x => x.inventory_item_id === item.id)}
                          onClick={() => {
                            setDetail(item);
                            setQty(1);
                          }}
                        />
                      ))}
                    </div>

                    {filteredCatalog.length === 0 && (
                      <div className="py-12 text-center">
                        <p className={s.muted}>No matching available inventory items found.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 2: Selected Items List */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">Selected Request Items</h3>
                  <button onClick={() => setStep(1)} className={`text-xs font-semibold text-[#E8D1AB] hover:underline`}>
                    + Add More Items
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className={`p-12 text-center rounded-2xl border ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                    <Package size={36} className={`mx-auto mb-3 ${s.muted}`} />
                    <p className="font-semibold">No items added to request</p>
                    <p className={`mt-1 text-xs ${s.muted}`}>Please browse inventory to select equipment items.</p>
                    <button onClick={() => setStep(1)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#E8D1AB] text-black">
                      Browse Inventory
                    </button>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto pr-1">
                    {/* Column header (same grid as the rows below) */}
                    <div className={`${CART_GRID} px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>
                      <span aria-hidden="true" />
                      <span className="text-left">Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Total</span>
                      <span aria-hidden="true" />
                    </div>
                    <div className="space-y-3">
                      {items.map(line => (
                        <div
                          key={line.inventory_item_id}
                          className={`${CART_GRID} rounded-xl border p-3.5 ${
                            s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-white'
                          }`}
                        >
                          <InventoryImage src={line.item_image_snapshot} alt={line.item_name_snapshot} className="h-16 w-16 shrink-0 rounded-lg" />
                          <div className="min-w-0 text-left">
                            <p className="font-bold text-sm truncate">{line.item_name_snapshot}</p>
                            <p className={`text-xs ${s.muted}`}>{currency(line.unit_price_snapshot)} per unit</p>
                          </div>
                          <div className="flex justify-center">
                            <input
                              aria-label={`Quantity for ${line.item_name_snapshot}`}
                              type="number"
                              min={1}
                              value={line.quantity}
                              className={`w-16 h-9 p-1 rounded-lg border text-center font-bold text-sm ${s.field}`}
                              onChange={e => changeQuantity(line.inventory_item_id, Number(e.target.value))}
                            />
                          </div>
                          <p className="text-right text-sm font-bold whitespace-nowrap tabular-nums">{currency(line.unit_price_snapshot * line.quantity)}</p>
                          <div className="flex justify-end">
                            <button
                              aria-label={`Remove ${line.item_name_snapshot}`}
                              onClick={() => setItems(prev => prev.filter(x => x.inventory_item_id !== line.inventory_item_id))}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-5">
                <div className={`border rounded-xl p-4 space-y-2.5 ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm">Request Overview</h4>
                    <button className="text-xs font-semibold text-[#E8D1AB] underline" onClick={() => setStep(0)}>
                      Change
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className={s.muted}>Request Purpose: </span>
                      <span className="font-semibold">{type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}</span>
                    </div>
                    {type === 'shoot' && (
                      <div>
                        <span className={s.muted}>Shoot: </span>
                        <span className="font-semibold">{shoots.find(x => x.id === shootId)?.name || shootId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm">Requested Equipment ({items.length} items)</h4>
                    <button className="text-xs font-semibold text-[#E8D1AB] underline" onClick={() => setStep(2)}>
                      Edit Items
                    </button>
                  </div>
                  <div className={`border rounded-xl divide-y ${s.isDark ? 'border-[#262626] bg-[#161616] divide-[#262626]' : 'border-[#EAEAEA] bg-white divide-[#EAEAEA]'}`}>
                    {items.map(line => (
                      <div key={line.inventory_item_id} className="grid grid-cols-[40px_minmax(0,1fr)_96px] items-center gap-3 p-3 text-sm">
                        <InventoryImage src={line.item_image_snapshot} alt={line.item_name_snapshot} className="h-10 w-10 rounded" />
                        <div className="min-w-0 text-left">
                          <p className="font-semibold truncate">{line.item_name_snapshot}</p>
                          <p className={`text-xs ${s.muted}`}>Qty: {line.quantity}</p>
                        </div>
                        <span className="text-right font-bold whitespace-nowrap tabular-nums">{currency(line.quantity * line.unit_price_snapshot)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Summary & Controls */}
            <div className={`mt-6 border-t pt-4 ${s.isDark ? 'border-[#262626]' : 'border-[#EAEAEA]'}`}>
              <div className="mb-4 flex items-center justify-between text-xs px-1">
                <span className={s.muted}>
                  Total Items: <b className="text-current font-bold">{total.total_items}</b>
                </span>
                <span className={s.muted}>
                  Total Quantity: <b className="text-current font-bold">{total.total_quantity}</b>
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <InventoryButton
                  type="button"
                  variant="outline"
                  className={`h-11 rounded-xl px-5 font-semibold ${s.secondary}`}
                  onClick={() => (step ? setStep(step - 1) : onClose())}
                >
                  {step ? (
                    <>
                      <ArrowLeft size={16} className="mr-1.5" /> Back
                    </>
                  ) : (
                    'Cancel'
                  )}
                </InventoryButton>

                {step === 3 ? (
                  <InventoryButton
                    type="button"
                    variant="beige"
                    disabled={submitting || loading}
                    onClick={() => void submit()}
                    className="h-11 rounded-xl px-7 font-bold text-black shadow-xs hover:opacity-90"
                  >
                    {submitting ? 'Submitting...' : editing ? 'Save Changes' : 'Submit Request'}
                  </InventoryButton>
                ) : (
                  <InventoryButton
                    type="button"
                    variant="beige"
                    disabled={
                      loading ||
                      !!error ||
                      (step === 0 && type === 'shoot' && !shootId) ||
                      (step === 2 && items.length === 0) ||
                      (step === 1 && !!detail)
                    }
                    onClick={() => setStep(step + 1)}
                    className="h-11 rounded-xl px-7 font-bold text-black shadow-xs hover:opacity-90"
                  >
                    Continue
                  </InventoryButton>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
