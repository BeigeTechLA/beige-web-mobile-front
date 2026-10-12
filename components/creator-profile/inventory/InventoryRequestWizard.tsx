'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Check, Minus, Plus, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/ui/Datepicker';
import TimePicker from '@/components/ui/Timepicker';
import { InventoryItem, InventoryRequest, ShootOption, RequestLine, RequestType, inventoryApi, available, currency, requestTotals } from '@/components/common/inventory/inventory';
import { InventoryGroupCard, InventoryImage, InventoryModelImageGallery, useInventoryStyle, InventoryButton } from '@/components/common/inventory/InventoryUI';
import InventoryRequestPurposeStep from './InventoryRequestPurposeStep';
import InventoryRequestCartStep from './InventoryRequestCartStep';

const parseLocalDateTime = (value: string): Date | null => {
  if (!value) return null;
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return null;
  return new Date(year, month - 1, day, hours, minutes);
};

const combineLocalDateTime = (date: Date | null, time: Date | null): string => {
  if (!date || !time) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}`;
};

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
  catalog?: InventoryItem[];
}) {
  const s = useInventoryStyle();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<RequestType>('personal');
  const [shootId, setShootId] = useState('');
  const [shoots, setShoots] = useState<ShootOption[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [items, setItems] = useState<RequestLine[]>([]);
  const [detail, setDetail] = useState<InventoryItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; description?: string; models: InventoryItem[] } | null>(null);
  const [fallbackCatalog, setFallbackCatalog] = useState<InventoryItem[]>([]);
  const [qty, setQty] = useState(1);
  const [pickupAt, setPickupAt] = useState('');
  const [returnAt, setReturnAt] = useState('');
  const [billingUnit, setBillingUnit] = useState<'hour' | 'day'>('day');
  const [rangeAvailable, setRangeAvailable] = useState<number | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!detail) return;
    const pickup = new Date(Date.now() + 60 * 60 * 1000);
    const due = new Date(pickup.getTime() + 24 * 60 * 60 * 1000);
    const localValue = (date: Date) => { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); };
    setPickupAt(localValue(pickup)); setReturnAt(localValue(due));
    setBillingUnit(Number(detail.daily_rental_rate || 0) > 0 ? 'day' : 'hour');
  }, [detail]);

  useEffect(() => {
    if (!detail || !pickupAt || !returnAt || new Date(returnAt) <= new Date(pickupAt)) { setRangeAvailable(null); setCheckingAvailability(false); return; }
    let active = true;
    setRangeAvailable(null);
    setCheckingAvailability(true);
    const timer = window.setTimeout(() => {
      inventoryApi.modelAvailability(detail.inventory_model_id || detail.id, new Date(pickupAt).toISOString(), new Date(returnAt).toISOString())
        .then(quantity => { if (active) setRangeAvailable(quantity); })
        .catch(() => { if (active) { setRangeAvailable(0); toast.error('Could not check availability for these dates. Try again.'); } })
        .finally(() => { if (active) setCheckingAvailability(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [detail, pickupAt, returnAt]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setType(editing?.request_type || 'personal');
    setShootId(editing?.shoot_id || '');
    setItems(editing?.items || []);
    setDetail(initialItem || null);
    setSelectedGroup(null);
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

  useEffect(() => {
    if (!open || catalog !== undefined) return;
    let active = true;
    inventoryApi.catalog({ page: 1, limit: 100 })
      .then(result => {
        if (active) setFallbackCatalog((result.data || []).filter(item => item.status === 'active'));
      })
      .catch(() => {
        if (active) toast.error('Unable to load inventory items. Please try again.');
      });
    return () => { active = false; };
  }, [open, catalog]);

  const availableCatalog = catalog ?? fallbackCatalog;
  const total = useMemo(() => requestTotals(items), [items]);
  const rentalEstimate = useMemo(() => {
    if (!detail || !pickupAt || !returnAt) return 0;
    const duration = new Date(returnAt).getTime() - new Date(pickupAt).getTime();
    if (duration <= 0) return 0;
    const unitMs = billingUnit === 'hour' ? 3_600_000 : 86_400_000;
    const rate = billingUnit === 'hour' ? Number(detail.hourly_rental_rate || 0) : Number(detail.daily_rental_rate || 0);
    return Math.max(1, Math.ceil(duration / unitMs)) * rate * qty;
  }, [detail, pickupAt, returnAt, billingUnit, qty]);
  const selectedAvailability = rangeAvailable ?? (detail ? available(detail) : 0);
  const pickupDateTime = parseLocalDateTime(pickupAt);
  const returnDateTime = parseLocalDateTime(returnAt);
  const minReturnDate = pickupDateTime ? new Date(pickupDateTime.getFullYear(), pickupDateTime.getMonth(), pickupDateTime.getDate()) : undefined;
  const minReturnTime = pickupDateTime && returnDateTime && pickupDateTime.toDateString() === returnDateTime.toDateString() ? pickupDateTime : undefined;
  const catalogGroups = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>();
    availableCatalog.forEach(model => {
      const key = model.inventory_item_id || model.inventory_name || model.id;
      groups.set(key, [...(groups.get(key) || []), model]);
    });
    return Array.from(groups.entries()).map(([id, models]) => ({ id, name: models[0].inventory_name || models[0].name, models }));
  }, [availableCatalog]);
  const filteredGroups = useMemo(() => {
    const search = catalogSearch.trim().toLowerCase();
    return catalogGroups.map(group => {
      const itemMatches = group.name.toLowerCase().includes(search);
      return { ...group, models: itemMatches ? group.models : group.models.filter(model => `${model.model_name || ''} ${model.description || ''}`.toLowerCase().includes(search)) };
    }).filter(group => group.models.length > 0);
  }, [catalogGroups, catalogSearch]);

  const maxQuantity = (id: string) => {
    if (detail && detail.id === id && rangeAvailable !== null) return rangeAvailable + (editing?.items.find(x => x.inventory_item_id === id)?.quantity || 0);
    const product = availableCatalog.find(x => x.id === id) || (initialItem?.id === id ? initialItem : undefined);
    return product ? available(product) + (editing?.items.find(x => x.inventory_item_id === id)?.quantity || 0) : items.find(x => x.inventory_item_id === id)?.quantity || 0;
  };

  const changeQuantity = (id: string, n: number) => {
    const line = items.find(item => item.inventory_item_id === id);
    const max = line?.available_for_dates ?? maxQuantity(id);
    if (n < 1 || !Number.isSafeInteger(n)) return;
    if (n > max) {
      toast.error(`Only ${max} unit${max === 1 ? '' : 's'} available`);
      return;
    }
    setItems(prev => prev.map(x => (x.inventory_item_id === id ? { ...x, quantity: n, line_total: x.base_rent ? x.base_rent / x.quantity * n : x.unit_price_snapshot * n, base_rent: x.base_rent ? x.base_rent / x.quantity * n : undefined } : x)));
  };

  const addItem = () => {
    if (!detail) return;
    if (!pickupAt || !returnAt || new Date(returnAt) <= new Date(pickupAt)) return toast.error('Choose a valid pickup and return date/time.');
    if (!(billingUnit === 'hour' ? detail.hourly_rental_rate : detail.daily_rental_rate)) return toast.error(`This model has no ${billingUnit} rental rate.`);
    const current = items.find(x => x.inventory_item_id === detail.id);
    const already = editing?.items.find(x => x.inventory_item_id === detail.id)?.quantity || 0;
    const max = selectedAvailability + already;
    const next = qty + (current?.quantity || 0);
    if (!Number.isSafeInteger(qty) || qty < 1 || next > max) return toast.error(`Available quantity is ${max}`);
    setItems(prev =>
      current
              ? prev.map(x => (x.inventory_item_id === detail.id ? { ...x, quantity: next, line_total: rentalEstimate * (next / qty), expected_pickup_at: new Date(pickupAt).toISOString(), expected_return_at: new Date(returnAt).toISOString(), billing_unit: billingUnit, base_rent: rentalEstimate * (next / qty), available_for_dates: selectedAvailability } : x))
        : [
            ...prev,
            {
              inventory_item_id: detail.id,
              inventory_model_id: detail.inventory_model_id || detail.id,
              item_name_snapshot: detail.model_name ? `${detail.inventory_name || detail.name} — ${detail.model_name}` : detail.name,
              item_image_snapshot: detail.image_url,
              unit_price_snapshot: billingUnit === 'hour' ? detail.hourly_rental_rate : detail.daily_rental_rate,
              quantity: qty,
              line_total: rentalEstimate,
              expected_pickup_at: new Date(pickupAt).toISOString(),
              expected_return_at: new Date(returnAt).toISOString(),
              billing_unit: billingUnit,
              base_rent: rentalEstimate,
              available_for_dates: selectedAvailability,
            },
          ]
    );
    setDetail(null);
    if (initialItem) setStep(2);
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
          items: items.map(({ inventory_item_id, inventory_model_id, quantity, expected_pickup_at, expected_return_at, billing_unit }) => ({ inventory_item_id, inventory_model_id, quantity, expected_pickup_at, expected_return_at, billing_unit })),
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

  const STEPS = initialItem
    ? ['Request Purpose', 'Set Quantity', 'Cart & Quantities', 'Review & Submit']
    : ['Request Purpose', 'Select Models', 'Cart & Quantities', 'Review & Submit'];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !submitting) onClose(); }}>
      <DialogContent className={`w-[calc(100vw-24px)] max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border p-4 sm:p-5 ${s.surface}`}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">{editing ? 'Edit Inventory Request' : 'New Equipment Request'}</DialogTitle>
        </DialogHeader>

        {/* Step Navigation Bar */}
        <div className={`grid gap-2 border-b pb-5 mb-5 ${STEPS.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} ${s.isDark ? 'border-[#262626]' : 'border-[#EAEAEA]'}`}>
          {STEPS.map((label, stepNumber) => {
            const isCurrent = step === stepNumber;
            const isPassed = step > stepNumber;
            return (
              <button
                key={label}
                disabled={stepNumber > step && ((stepNumber === 1 && type === 'shoot' && !shootId) || (stepNumber >= 2 && items.length === 0))}
                onClick={() => setStep(stepNumber)}
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
                  {isPassed ? <Check size={13} /> : stepNumber + 1}
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
            {step === 0 && <InventoryRequestPurposeStep type={type} onTypeChange={setType} shootId={shootId} onShootChange={setShootId} shoots={shoots} />}

            {/* Step 1: Browse Catalog */}
            {step === 1 && (
              <div className="space-y-4">
                {detail ? (
                  <div className={`mx-auto w-full min-w-0 max-w-2xl rounded-2xl border p-3 sm:p-4 space-y-3 ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                    <button onClick={() => setDetail(null)} className={`flex items-center gap-1.5 text-xs font-semibold hover:underline ${s.muted}`}>
                      <ArrowLeft size={14} /> Back to {selectedGroup ? 'models' : 'catalog'}
                    </button>
                    <div className="min-w-0 space-y-3">
                      <InventoryModelImageGallery images={detail.model_images || []} alt={`${detail.inventory_name || detail.name} ${detail.model_name || ''}`} compact />
                      <div className="min-w-0 space-y-3">
                        <div className="space-y-2">
                          <div>
                            <p className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>
                              {detail.inventory_name || detail.name}
                            </p>
                            {detail.model_name && (
                              <h3 className="mt-0.5 text-base font-bold">
                                {detail.model_name}
                              </h3>
                            )}
                          </div>
                          <p className={`text-xs ${s.muted}`}>{detail.description || 'No description available.'}</p>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div className={`min-w-0 rounded-lg border p-2.5 ${s.isDark ? 'border-white/10 bg-black/10' : 'border-black/10 bg-white'}`}>
                              <p className={`text-[11px] ${s.muted}`}>Hourly rate</p>
                              <p className="mt-0.5 truncate text-sm font-semibold">
                                {currency(detail.hourly_rental_rate || 0, detail.currency)} / hour
                              </p>
                            </div>
                            <div className={`min-w-0 rounded-lg border p-2.5 ${s.isDark ? 'border-white/10 bg-black/10' : 'border-black/10 bg-white'}`}>
                              <p className={`text-[11px] ${s.muted}`}>Daily rate</p>
                              <p className="mt-0.5 truncate text-sm font-semibold">
                                {currency(detail.daily_rental_rate || 0, detail.currency)} / day
                              </p>
                            </div>
                          </div>
                          <p className="text-xs font-medium text-emerald-500">{checkingAvailability ? 'Checking dates…' : `${selectedAvailability} units available for these dates`}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                            <section className="min-w-0 space-y-2">
                              <p className="text-sm font-semibold">Pickup</p>
                              <div className="space-y-2">
                                <div className="min-w-0">
                                  <label className={`mb-1 block text-[11px] ${s.muted}`}>Date</label>
                                  <DatePicker
                                    label=""
                                    value={pickupDateTime}
                                    onChange={date =>
                                      setPickupAt(current =>
                                        combineLocalDateTime(date, parseLocalDateTime(current)),
                                      )
                                    }
                                    isDark={s.isDark}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <label className={`mb-1 block text-[11px] ${s.muted}`}>Time</label>
                                  <TimePicker
                                    label=""
                                    value={pickupDateTime}
                                    onChange={time =>
                                      setPickupAt(current =>
                                        combineLocalDateTime(parseLocalDateTime(current), time),
                                      )
                                    }
                                    isDark={s.isDark}
                                    height="42px"
                                    fontSize="13px"
                                  />
                                </div>
                              </div>
                            </section>
                            <section className="min-w-0 space-y-2">
                              <p className="text-sm font-semibold">Expected Return</p>
                              <div className="space-y-2">
                                <div className="min-w-0">
                                  <label className={`mb-1 block text-[11px] ${s.muted}`}>Date</label>
                                  <DatePicker
                                    label=""
                                    value={returnDateTime}
                                    minDate={minReturnDate}
                                    onChange={date =>
                                      setReturnAt(current =>
                                        combineLocalDateTime(date, parseLocalDateTime(current)),
                                      )
                                    }
                                    isDark={s.isDark}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <label className={`mb-1 block text-[11px] ${s.muted}`}>Time</label>
                                  <TimePicker
                                    label=""
                                    value={returnDateTime}
                                    minTime={minReturnTime}
                                    onChange={time =>
                                      setReturnAt(current =>
                                        combineLocalDateTime(parseLocalDateTime(current), time),
                                      )
                                    }
                                    isDark={s.isDark}
                                    height="42px"
                                    fontSize="13px"
                                  />
                                </div>
                              </div>
                            </section>
                          </div>
                          <div className="grid min-w-0 gap-3">
                            <div className="block min-w-0 text-xs font-semibold"><label htmlFor="inventory-billing-rate">Billing rate</label>
                              <Select value={billingUnit} onValueChange={value => setBillingUnit(value as 'hour' | 'day')}>
                                <SelectTrigger
                                  id="inventory-billing-rate"
                                  className={`mt-1 h-11 w-full rounded-xl px-3 ${s.field}`}
                                >
                                  <SelectValue placeholder="Choose billing rate" />
                                </SelectTrigger>
                                <SelectContent
                                  position="popper"
                                  sideOffset={6}
                                  className={`z-[100] max-h-56 w-[var(--radix-select-trigger-width)] rounded-xl shadow-xl ${s.isDark ? 'border-[#3D3D3D] bg-[#1A1A1A] text-white' : 'border-[#E5E5E5] bg-white text-[#202020]'}`}
                                  viewportClassName="h-auto p-1.5"
                                >
                                  <SelectItem
                                    className="rounded-lg py-2 focus:bg-[#E8D1AB] focus:text-black"
                                    value="hour"
                                    disabled={!detail.hourly_rental_rate}
                                  >
                                    Hourly
                                  </SelectItem>
                                  <SelectItem
                                    className="rounded-lg py-2 focus:bg-[#E8D1AB] focus:text-black"
                                    value="day"
                                    disabled={!detail.daily_rental_rate}
                                  >
                                    Daily
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-semibold">Quantity</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${s.secondary}`}
                                  onClick={() => setQty(n => Math.max(1, n - 1))}
                                >
                                  <Minus size={16} />
                                </button>
                                <input
                                  aria-label="Item quantity"
                                  type="number"
                                  min={1}
                                  max={selectedAvailability}
                                  value={qty}
                                  onChange={event => setQty(Number(event.target.value))}
                                  className={`h-9 w-16 rounded-lg border text-center font-bold ${s.field}`}
                                />
                                <button
                                  type="button"
                                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${s.secondary}`}
                                  onClick={() =>
                                    setQty(quantity =>
                                      Math.min(selectedAvailability, quantity + 1),
                                    )
                                  }
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span>Line Total:</span>
                            <span className="text-base">{currency(rentalEstimate, detail.currency)}</span>
                          </div>
                          <InventoryButton
                            variant="beige"
                            disabled={qty < 1 || checkingAvailability || qty > selectedAvailability}
                            className="h-11 w-full rounded-xl font-semibold text-black shadow-xs hover:opacity-90"
                            onClick={addItem}
                          >
                            Add to Request
                          </InventoryButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedGroup ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setSelectedGroup(null)}
                      className={`flex items-center gap-1.5 text-xs font-semibold hover:underline ${s.muted}`}
                    >
                      <ArrowLeft size={14} /> Back to all equipment
                    </button>
                    <div>
                      <h3 className="text-lg font-bold">{selectedGroup.name} Models</h3>
                      {selectedGroup.description && (
                        <p className={`mt-1 text-sm ${s.muted}`}>
                          {selectedGroup.description}
                        </p>
                      )}
                    </div>
                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedGroup.models.map(model => (
                        <section
                          key={model.inventory_model_id || model.id}
                          className={`flex min-w-0 flex-col rounded-xl border p-2.5 ${
                            s.isDark
                              ? 'border-[#262626] bg-[#121212]'
                              : 'border-[#EAEAEA] bg-white'
                          }`}
                        >
                          <InventoryModelImageGallery
                            images={model.model_images || []}
                            alt={`${selectedGroup.name} ${model.model_name || model.name}`}
                            compact
                          />
                          <div className="flex flex-1 flex-col pt-3">
                            <p className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>
                              {selectedGroup.name}
                            </p>
                            <h4 className="mt-1 truncate text-base font-bold">
                              {model.model_name || model.name}
                            </h4>
                            <p className={`mt-1 line-clamp-2 min-h-10 text-xs ${s.muted}`}>
                              {model.description || 'No description available.'}
                            </p>
                            <div className="mt-auto pt-3">
                              <div className="flex items-center justify-between border-t border-current/10 py-3 text-sm">
                                <span className="font-semibold">
                                  {model.hourly_rental_rate > 0 && <>{currency(model.hourly_rental_rate, model.currency)} / hour</>}
                                  {model.hourly_rental_rate > 0 && model.daily_rental_rate > 0 && ' · '}
                                  {model.daily_rental_rate > 0 && <>{currency(model.daily_rental_rate, model.currency)} / day</>}
                                </span>
                                <span className="text-xs font-medium text-emerald-500">
                                  {available(model)} available
                                </span>
                              </div>
                              <InventoryButton
                                variant="beige"
                                className="w-full"
                                onClick={() => {
                                  setDetail(model);
                                  setQty(1);
                                }}
                              >
                                Choose model
                              </InventoryButton>
                            </div>
                          </div>
                        </section>
                      ))}
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

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredGroups.map(group => <InventoryGroupCard key={group.id} name={group.name} description={group.description} models={group.models} onClick={() => { setDetail(null); setSelectedGroup(group); }} />)}
                    </div>

                    {filteredGroups.length === 0 && (
                      <div className="py-12 text-center">
                        <p className={s.muted}>No matching available inventory items found.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 2 && <InventoryRequestCartStep items={items} maxQuantity={maxQuantity} onQuantityChange={changeQuantity} onRemove={id => setItems(current => current.filter(item => item.inventory_item_id !== id))} onBrowse={() => setStep(1)} />}

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
                          <p className={`text-xs ${s.muted}`}>Qty: {line.quantity} · {line.billing_unit === 'hour' ? 'Hourly' : 'Daily'} rental</p>
                        </div>
                        <span className="text-right font-bold whitespace-nowrap tabular-nums">{currency(line.base_rent || line.line_total)}</span>
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
