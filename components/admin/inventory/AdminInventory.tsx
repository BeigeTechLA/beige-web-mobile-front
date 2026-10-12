'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Check, Eye, MoreVertical, Package, Pencil, Plus, Power, RotateCcw, Search, X } from 'lucide-react';
import Topbar from '@/components/admin/Topbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem, InventoryRequest, inventoryApi, available, currency, formatInventoryDate, fulfillmentStatusFor, ListParams } from '@/components/common/inventory/inventory';
import InventoryConditionImagePicker from '@/components/common/inventory/InventoryConditionImagePicker';
import AdminInventoryItemForm from '@/components/admin/inventory/AdminInventoryItemForm';
import { inventoryHttpApi } from '@/lib/api';
import { InventoryButton, InventoryImage, InventoryModelImageGallery, StatusBadge, useInventoryStyle } from '@/components/common/inventory/InventoryUI';

const PAGE_SIZE = 10;

type Align = 'left' | 'center' | 'right';
type Column = { label: string; align: Align; width: string };

const ALIGN_CLASS: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// Header and body cells share the same alignment + width so columns always line up.
const REQUEST_COLUMNS: Column[] = [
  { label: 'Request ID', align: 'left', width: '12%' },
  { label: 'Creative Partner', align: 'left', width: '16%' },
  { label: 'Purpose / Shoot', align: 'left', width: '17%' },
  { label: 'Requested Equipment', align: 'left', width: '20%' },
  { label: 'Submitted Date', align: 'left', width: '11%' },
  { label: 'Fulfillment Status', align: 'left', width: '14%' },
  { label: 'Request Status / Actions', align: 'center', width: '10%' },
];

const ITEM_COLUMNS: Column[] = [
  { label: 'Inventory Item', align: 'left', width: '24%' },
  { label: 'Model', align: 'left', width: '16%' },
  { label: 'Total', align: 'center', width: '8%' },
  { label: 'Available', align: 'center', width: '10%' },
  { label: 'Requested', align: 'center', width: '10%' },
  { label: 'Assigned', align: 'center', width: '10%' },
  { label: 'Status', align: 'center', width: '12%' },
  { label: 'Actions', align: 'right', width: '10%' },
];

const thClass = (align: Align) => `px-6 py-4 align-middle whitespace-nowrap font-semibold ${ALIGN_CLASS[align]}`;
const tdClass = (align: Align, extra = '') => `px-6 py-4 align-middle text-sm ${ALIGN_CLASS[align]} ${extra}`.trim();

function TableColGroup({ columns }: { columns: Column[] }) {
  return (
    <colgroup>
      {columns.map(column => (
        <col key={column.label} style={{ width: column.width }} />
      ))}
    </colgroup>
  );
}

export default function AdminInventory({ mode }: { mode: 'requests' | 'items' }) {
  const s = useInventoryStyle();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemDetails, setItemDetails] = useState<InventoryItem | null>(null);
  const [editModelId, setEditModelId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [statusItem, setStatusItem] = useState<InventoryItem | null>(null);
  const [issueTarget, setIssueTarget] = useState<{ request: InventoryRequest; item: InventoryRequest['items'][number] } | null>(null);
  const [conditionFiles, setConditionFiles] = useState<File[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      if (mode === 'requests') {
        const result = await inventoryApi.adminRequests({ page, limit: PAGE_SIZE, search: debouncedSearch, status });
        setRequests(result.data || []);
        setTotal(result.total || 0);
      } else {
        const params: ListParams = { page: 1, limit: 100, status: 'all' };
        const firstPage = await inventoryApi.adminItems(params);
        const pageCount = Math.ceil((firstPage.total || 0) / 100);
        const remainingPages = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => inventoryApi.adminItems({ ...params, page: index + 2 })));
        setItems([...(firstPage.data || []), ...remainingPages.flatMap(result => result.data || [])]);
        setTotal(firstPage.total || 0);
      }
    } catch {
      toast.error(mode === 'requests'
        ? 'Unable to load inventory requests. Please try again.'
        : 'Unable to load inventory items. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [mode, page, debouncedSearch, status]);

  const filteredModelRows = useMemo(() => items.flatMap(item => (item.models || []).map(model => ({
    ...item,
    id: model.id || `${item.id}-${model.name}`,
    inventory_item_id: item.id,
    inventory_model_id: model.id,
    model_name: model.name,
    image_url: model.images?.[0]?.url || item.image_url,
    models: [model],
    total_quantity: model.total_quantity,
    requested_quantity: model.requested_quantity,
    assigned_quantity: model.assigned_quantity,
    status: model.is_active === 1 ? 'active' as const : 'inactive' as const,
  }))).filter(row => (status === 'all' || row.status === status) && (!debouncedSearch || `${row.name} ${row.model_name} ${row.models?.[0]?.description || ''}`.toLowerCase().includes(debouncedSearch.toLowerCase()))), [items, status, debouncedSearch]);
  const visibleModelRows = filteredModelRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const entryTotal = mode === 'requests' ? total : filteredModelRows.length;

  const refresh = () => {
    inventoryApi.invalidateRequests('admin');
    void load();
  };

  useEffect(() => {
    void load();
  }, [load]);

  const transitionRequest = async () => {
    if (!selectedRequest || !confirmAction) return;
    setWorking(true);
    try {
      if (confirmAction === 'accept') await inventoryApi.approve(selectedRequest.id);
      else await inventoryApi.reject(selectedRequest.id, adminNote.trim());
      toast.success(confirmAction === 'accept' ? 'Inventory request accepted' : 'Inventory request rejected');
      setSelectedRequest(null);
      setConfirmAction(null);
      setAdminNote('');
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update request.');
    } finally {
      setWorking(false);
    }
  };

  const issueRequest = async () => {
    if (!issueTarget || !conditionFiles.length) return toast.error('Add handover condition photos first.');
    setWorking(true);
    try {
      const uploaded = await inventoryHttpApi.uploadInventoryConditionImages('admin', conditionFiles);
      const paths = (uploaded?.data || []).map((image: { file_path: string }) => image.file_path);
      await inventoryHttpApi.issueAdminInventoryItem(issueTarget.request.id, issueTarget.item.request_item_id || '', paths);
      toast.success('Inventory model issued'); setIssueTarget(null); setConditionFiles([]);
      inventoryApi.invalidateRequests('admin');
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to issue inventory model.');
    } finally { setWorking(false); }
  };

  const changeItemStatus = async () => {
    if (!statusItem) return;
    setWorking(true);
    try {
      const next = statusItem.status === 'active' ? 'inactive' : 'active';
      await inventoryApi.setStatus(statusItem.inventory_model_id || statusItem.id, next);
      toast.success(`Model ${next === 'active' ? 'activated' : 'deactivated'}`);
      setStatusItem(null);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update item.');
    } finally {
      setWorking(false);
    }
  };

  const openForm = (item: InventoryItem | null = null, modelId?: string) => {
    setSelectedItem(item);
    setEditModelId(modelId);
    setShowForm(true);
  };
  const parentItem = (row: InventoryItem) => items.find(item => item.id === row.inventory_item_id) || row;
  const title = mode === 'requests' ? 'Inventory Requests' : 'Manage Inventory';
  const headRowClass = `text-sm font-medium border-b ${s.isDark ? 'bg-[#101010] text-[#E8D1AB] border-b-[#3D3D3D]' : 'bg-[#FFFCF6] text-black border-b-[#E5E5E5]'}`;
  const bodyRowClass = `border-t transition-colors ${s.isDark ? 'border-[#222] hover:bg-white/[0.02]' : 'border-[#EAEAEA] hover:bg-black/[0.015]'}`;

  return (
    <>
      <Topbar
        pathname={pathname}
        title={title}
        actions={
          mode === 'items' ? (
            <InventoryButton variant="beige" className="h-10 rounded-xl px-5 font-semibold text-black shadow-xs hover:opacity-90" onClick={() => openForm()}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Inventory Item
            </InventoryButton>
          ) : undefined
        }
      />
      <main className="space-y-6 p-4 lg:px-10 lg:py-9">
        {mode === 'items' && (
          <button
            type="button"
            onClick={() => router.push('/admin/inventory')}
            className={`flex items-center gap-2 text-sm font-medium transition hover:text-[#BFA780] ${
              s.isDark ? 'text-white/85' : 'text-[#323232]'
            }`}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        )}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className={`mt-1 text-sm ${s.muted}`}>
              {mode === 'requests'
                ? 'Review personal-use and assigned-shoot equipment requests submitted by Creative Partners.'
                : 'Manage inventory items, equipment specs, photos, stock quantities, and availability.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {mode === 'requests' ? (
              <InventoryButton
                variant="beige"
                className="h-10 rounded-lg px-5 font-semibold text-black shadow-none hover:bg-[#E5D5B8]/90"
                onClick={() => router.push('/admin/inventory/items')}
              >
                <Package className="h-4 w-4 mr-2" /> Manage Inventory
              </InventoryButton>
            ) : null}
          </div>
        </header>

        <section className={`overflow-hidden rounded-2xl border ${s.isDark ? 'border-[#333333] bg-[#111111]' : 'border-[#E5E5E5] bg-white'}`}>
          <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center lg:p-6 border-b border-current/10">
            <h2 className="text-base font-semibold">{mode === 'requests' ? 'Submitted Requests' : 'Inventory Models Catalog'}</h2>
            <div className="flex flex-wrap items-center gap-3">
              {mode === 'items' && (
                <label className="relative w-full sm:w-[280px]">
                  <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.isDark ? 'text-[#666]' : 'text-[#999]'}`} />
                  <input
                    value={search}
                    onChange={event => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search equipment..."
                    className={`h-10 w-full rounded-lg border pl-10 pr-4 text-sm focus:outline-none transition-colors ${
                      s.isDark ? 'border-[#333333] bg-zinc-900 text-white focus:border-[#E8D1AB]' : 'border-[#E5E5E5] bg-white text-black focus:border-[#E8D1AB]'
                    }`}
                  />
                </label>
              )}
              <Select
                value={status}
                onValueChange={value => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter by status" className={`h-10 w-full rounded-lg sm:w-[170px] text-sm focus:ring-0 capitalize ${s.isDark ? 'bg-zinc-900 border-[#333333] text-white/70' : 'bg-white border-[#E5E5E5] text-[#666]'}`}>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className={`${s.isDark ? 'bg-[#111111] border-[#333333]' : 'bg-white border-[#E5E5E5] text-black'}`}>
                  {(mode === 'requests' ? ['all', 'pending', 'accepted', 'rejected'] : ['all', 'active', 'inactive']).map(value => (
                    <SelectItem key={value} value={value}>
                      {value === 'all' ? 'All Statuses' : value.charAt(0).toUpperCase() + value.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InventoryButton
                variant="outline"
                className={`h-10 w-10 rounded-lg border p-0 shadow-none ${s.isDark ? 'border-[#333333] bg-[#202020] text-white/70' : 'border-[#E5E5E5] bg-white text-[#666]'}`}
                aria-label="Refresh"
                onClick={refresh}
              >
                <RotateCcw size={16} />
              </InventoryButton>
            </div>
          </div>

          {busy ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent text-[#E8D1AB] mb-3"></div>
              <p className={s.muted}>Loading {mode === 'requests' ? 'requests' : 'inventory'}…</p>
            </div>
          ) : (
            <div className="w-full">
              {mode === 'requests' ? (
                <>
                  {/* Mobile Cards View */}
                  <div className="space-y-4 p-4 lg:hidden">
                    {requests.map(request => (
                      <article key={request.id} className={`rounded-xl border p-4 ${s.isDark ? 'border-[#2A2A2A] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {request.id}
                            </span>
                            <p className="mt-2 text-sm font-bold">{request.creator_name || request.creator_id}</p>
                          </div>
                          {request.status === 'pending' ? (
                            <InventoryActionMenu
                              isDark={s.isDark}
                              disabled={working}
                              actions={[
                                { label: 'Accept request', icon: <Check size={16} />, onSelect: () => { setSelectedRequest(request); setConfirmAction('accept'); } },
                                { label: 'Reject request', icon: <X size={16} />, danger: true, onSelect: () => { setSelectedRequest(request); setConfirmAction('reject'); } },
                              ]}
                            />
                          ) : request.status === 'accepted' && request.items.some(line => line.request_item_id && !line.issued_at) ? <InventoryActionMenu isDark={s.isDark} disabled={working} actions={[{ label: 'Issue model & record condition', icon: <Package size={16} />, onSelect: () => { const line = request.items.find(value => value.request_item_id && !value.issued_at); if (line) setIssueTarget({ request, item: line }); } }]} /> : <StatusBadge status={request.status} />}
                        </div>
                        <div className={`my-3 border-t ${s.isDark ? 'border-[#2A2A2A]' : 'border-[#EAEAEA]'}`} />
                        <p className="text-sm font-medium">
                          {request.request_type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}
                          {request.shoot_name && <> · {request.shoot_name}</>}
                        </p>
                        <div className="mt-2">
                          <RequestItems request={request} muted={s.muted} />
                        </div>
                        <div className={`mt-3 border-t pt-3 ${s.isDark ? 'border-[#2A2A2A]' : 'border-[#EAEAEA]'}`}><p className={`mb-2 text-xs font-semibold ${s.muted}`}>Fulfillment Status</p><div className="space-y-1.5">{request.items.map(line => { const value = fulfillmentStatusFor(request.status, line); const tone = value === 'overdue' ? 'text-red-500' : value === 'issued' || value === 'returned' ? 'text-emerald-500' : value === 'pending_issue' ? 'text-amber-500' : ''; return <p key={line.request_item_id || line.inventory_model_id} className={`text-xs font-medium capitalize ${tone}`}>{value.replaceAll('_', ' ')}</p>; })}</div></div>
                        <p className={`mt-3 text-xs ${s.muted}`}>Submitted {formatInventoryDate(request.created_at)}</p>
                      </article>
                    ))}
                    {requests.length === 0 && <p className={`py-12 text-center ${s.muted}`}>No inventory requests found.</p>}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden w-full overflow-x-auto lg:block">
                    <table className="w-full min-w-[1000px] table-fixed border-collapse">
                      <TableColGroup columns={REQUEST_COLUMNS} />
                      <thead>
                        <tr className={headRowClass}>
                          {REQUEST_COLUMNS.map(column => (
                            <th key={column.label} className={thClass(column.align)}>
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map(request => (
                          <tr key={request.id} className={bodyRowClass}>
                            <td className={tdClass('left', 'font-mono font-medium break-all')}>{request.id}</td>
                            <td className={tdClass('left', 'font-semibold')}>{request.creator_name || request.creator_id}</td>
                            <td className={tdClass('left', 'font-medium')}>
                              {request.request_type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}
                              <div className={`mt-0.5 text-xs font-normal ${s.muted}`}>{request.shoot_name || '—'}</div>
                            </td>
                            <td className={tdClass('left')}>
                              <RequestItems request={request} muted={s.muted} />
                            </td>
                            <td className={tdClass('left', `whitespace-nowrap ${s.muted}`)}>{formatInventoryDate(request.created_at)}</td>
                            <td className={tdClass('left')}><div className="space-y-1.5">{request.items.map(line => { const value = fulfillmentStatusFor(request.status, line); const tone = value === 'overdue' ? 'text-red-500' : value === 'issued' || value === 'returned' ? 'text-emerald-500' : value === 'pending_issue' ? 'text-amber-500' : ''; return <p key={line.request_item_id || line.inventory_model_id} className={`text-xs font-medium capitalize ${tone}`}>{value.replaceAll('_', ' ')}</p>; })}</div></td>
                            <td className={tdClass('center')}>
                              {request.status === 'pending' ? (
                                <InventoryActionMenu
                                  isDark={s.isDark}
                                  disabled={working}
                                  actions={[
                                    { label: 'Accept request', icon: <Check size={16} />, onSelect: () => { setSelectedRequest(request); setConfirmAction('accept'); } },
                                    { label: 'Reject request', icon: <X size={16} />, danger: true, onSelect: () => { setSelectedRequest(request); setConfirmAction('reject'); } },
                                  ]}
                                />
                              ) : request.status === 'accepted' && request.items.some(line => line.request_item_id && !line.issued_at) ? <InventoryActionMenu isDark={s.isDark} disabled={working} actions={[{ label: 'Issue model & record condition', icon: <Package size={16} />, onSelect: () => { const line = request.items.find(value => value.request_item_id && !value.issued_at); if (line) setIssueTarget({ request, item: line }); } }]} /> : <StatusBadge status={request.status} />}
                            </td>
                          </tr>
                        ))}
                        {requests.length === 0 && <EmptyRow columns={REQUEST_COLUMNS.length} text="No inventory requests found." muted={s.muted} />}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  {/* Mobile Items View */}
                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:hidden">
                    {visibleModelRows.map(item => (
                      <article key={`${item.inventory_item_id}-${item.inventory_model_id}`} className={`rounded-xl border p-4 ${s.isDark ? 'border-[#2A2A2A] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                        <div className="flex gap-3">
                          <InventoryImage src={item.image_url} alt={item.name} className="h-20 w-20 shrink-0 rounded-lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div><p className="font-bold text-sm">{item.name}</p><p className={`text-xs ${s.muted}`}>{item.model_name}</p></div>
                              <StatusBadge status={item.status} />
                            </div>
                            <p className={`mt-2 line-clamp-2 text-xs ${s.muted}`}>{item.models?.[0]?.description || 'No model description'}</p>
                          </div>
                        </div>
                        <div className={`my-3 border-t ${s.isDark ? 'border-[#2A2A2A]' : 'border-[#EAEAEA]'}`} />
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <StockValue label="Total" value={item.total_quantity} muted={s.muted} />
                          <StockValue label="Available" value={available(item)} muted={s.muted} />
                          <StockValue label="Requested" value={item.requested_quantity} muted={s.muted} />
                          <StockValue label="Assigned" value={item.assigned_quantity} muted={s.muted} />
                        </div>
                        <div className="mt-3 flex justify-end">
                          <InventoryActionMenu
                            isDark={s.isDark}
                            disabled={working}
                            actions={[
                              { label: 'View model details', icon: <Eye size={16} />, onSelect: () => setItemDetails(item) },
                              { label: 'Edit model', icon: <Pencil size={16} />, onSelect: () => openForm(parentItem(item), item.inventory_model_id) },
                              { label: item.status === 'active' ? 'Deactivate model' : 'Activate model', icon: <Power size={16} />, danger: item.status === 'active', onSelect: () => setStatusItem(item) },
                            ]}
                          />
                        </div>
                      </article>
                    ))}
                    {visibleModelRows.length === 0 && <p className={`py-12 text-center ${s.muted}`}>No inventory models found.</p>}
                  </div>

                  {/* Desktop Items Table */}
                  <div className="hidden w-full overflow-x-auto lg:block">
                    <table className="w-full min-w-[1000px] table-fixed border-collapse">
                      <TableColGroup columns={ITEM_COLUMNS} />
                      <thead>
                        <tr className={headRowClass}>
                          {ITEM_COLUMNS.map(column => (
                            <th key={column.label} className={thClass(column.align)}>
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleModelRows.map(item => (
                          <tr key={`${item.inventory_item_id}-${item.inventory_model_id}`} className={bodyRowClass}>
                            <td className={tdClass('left')}>
                              <div className="flex items-center gap-3">
                                <InventoryImage src={item.image_url} alt={item.name} className="h-12 w-12 shrink-0 rounded-lg" />
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-sm">{item.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className={tdClass('left', 'font-semibold')}>{item.model_name}</td>
                            <td className={tdClass('center', 'font-medium tabular-nums')}>{item.total_quantity}</td>
                            <td className={tdClass('center', 'font-bold text-emerald-500 tabular-nums')}>{available(item)}</td>
                            <td className={tdClass('center', 'font-medium tabular-nums')}>{item.requested_quantity}</td>
                            <td className={tdClass('center', 'font-medium tabular-nums')}>{item.assigned_quantity}</td>
                            <td className={tdClass('center')}>
                              <StatusBadge status={item.status} />
                            </td>
                            <td className={tdClass('right')}>
                              <InventoryActionMenu
                                isDark={s.isDark}
                                disabled={working}
                                actions={[
                                  { label: 'View model details', icon: <Eye size={16} />, onSelect: () => setItemDetails(item) },
                                  { label: 'Edit model', icon: <Pencil size={16} />, onSelect: () => openForm(parentItem(item), item.inventory_model_id) },
                                  { label: item.status === 'active' ? 'Deactivate model' : 'Activate model', icon: <Power size={16} />, danger: item.status === 'active', onSelect: () => setStatusItem(item) },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                        {visibleModelRows.length === 0 && <EmptyRow columns={ITEM_COLUMNS.length} text="No inventory models found." muted={s.muted} />}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          <div className={`flex flex-col items-center justify-between gap-4 border-t p-4 lg:flex-row lg:px-6 ${s.isDark ? 'border-[#333333]' : 'border-[#E5E5E5]'}`}>
            <span className={`hidden whitespace-nowrap text-xs font-medium lg:block ${s.muted}`}>
              Showing {(mode === 'requests' ? requests.length : filteredModelRows.length) ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, entryTotal)} of {entryTotal} entries
            </span>
            <div className="flex items-center gap-2">
              <InventoryButton
                variant="outline"
                className={`h-9 rounded-lg border px-4 shadow-none disabled:opacity-30 ${s.isDark ? 'border-[#333333] bg-[#202020] text-white/70' : 'border-[#E5E5E5] bg-white text-[#666]'}`}
                size="sm"
                disabled={busy || page === 1}
                onClick={() => setPage(value => value - 1)}
              >
                Previous
              </InventoryButton>
              <span className={`px-3 text-xs font-semibold ${s.muted}`}>
                Page {page} of {Math.max(1, Math.ceil(entryTotal / PAGE_SIZE))}
              </span>
              <InventoryButton
                variant="outline"
                className={`h-9 rounded-lg border px-4 shadow-none disabled:opacity-30 ${s.isDark ? 'border-[#333333] bg-[#202020] text-white/70' : 'border-[#E5E5E5] bg-white text-[#666]'}`}
                size="sm"
                disabled={busy || page * PAGE_SIZE >= entryTotal}
                onClick={() => setPage(value => value + 1)}
              >
                Next
              </InventoryButton>
            </div>
          </div>
        </section>
      </main>

      {/* Confirmation Dialogs */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={open => {
          if (!open) {
            setConfirmAction(null);
            setAdminNote('');
          }
        }}
      >
        <DialogContent className={`max-w-md rounded-2xl border p-6 ${s.surface}`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{confirmAction === 'accept' ? 'Accept Inventory Request?' : 'Reject Inventory Request?'}</DialogTitle>
          </DialogHeader>
          <p className={`text-sm ${s.muted}`}>
            {confirmAction === 'accept'
              ? 'Accepting assigns the requested quantity and updates available inventory stock.'
              : 'Rejecting releases the requested quantity back to available catalog stock.'}
          </p>
          {confirmAction === 'reject' && (
            <label className="block text-sm font-medium space-y-1.5">
              <span>Admin note <span className={s.muted}>(optional)</span></span>
              <textarea
                value={adminNote}
                onChange={event => setAdminNote(event.target.value)}
                placeholder="Add a note explaining the reason for the Creative Partner..."
                className={`min-h-24 w-full rounded-xl border p-3 text-sm ${s.field}`}
              />
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <InventoryButton variant="outline" className="rounded-xl px-4" onClick={() => { setConfirmAction(null); setAdminNote(''); }}>
              Cancel
            </InventoryButton>
            <InventoryButton variant="beige" className="rounded-xl px-5 font-bold text-black" disabled={working} onClick={() => void transitionRequest()}>
              {working ? 'Saving…' : 'Confirm'}
            </InventoryButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!issueTarget} onOpenChange={open => { if (!open) { setIssueTarget(null); setConditionFiles([]); } }}>
        <DialogContent className={`max-w-lg rounded-2xl border p-6 ${s.surface}`}>
          <DialogHeader><DialogTitle className="text-lg font-bold">Issue {issueTarget?.item.item_name_snapshot}</DialogTitle></DialogHeader>
          <p className={`text-sm ${s.muted}`}>Take condition photos at handover (up to 8). The issue time is recorded when you confirm.</p>
          <InventoryConditionImagePicker files={conditionFiles} onChange={setConditionFiles} disabled={working} label="Handover condition photos" />
          <div className="flex justify-end gap-2"><InventoryButton variant="outline" onClick={() => setIssueTarget(null)}>Cancel</InventoryButton><InventoryButton variant="beige" disabled={working || !conditionFiles.length} onClick={() => void issueRequest()}>{working ? 'Uploading and recording…' : 'Confirm Issue'}</InventoryButton></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statusItem} onOpenChange={open => !open && setStatusItem(null)}>
        <DialogContent className={`max-w-md rounded-2xl border p-6 ${s.surface}`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{statusItem?.status === 'active' ? 'Deactivate model?' : 'Activate model?'}</DialogTitle>
          </DialogHeader>
          <p className={`text-sm ${s.muted}`}>
            {statusItem?.status === 'active'
              ? `${statusItem?.name} — ${statusItem?.model_name} will be hidden from the CP catalog for new requests. Existing request records remain unaffected.`
              : `${statusItem?.name} — ${statusItem?.model_name} will become visible in the CP catalog for requests.`}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <InventoryButton variant="outline" className="rounded-xl px-4" onClick={() => setStatusItem(null)}>
              Cancel
            </InventoryButton>
            <InventoryButton variant="beige" className="rounded-xl px-5 font-bold text-black" disabled={working} onClick={() => void changeItemStatus()}>
              {working ? 'Saving…' : 'Confirm'}
            </InventoryButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemDetails} onOpenChange={open => !open && setItemDetails(null)}>
        <DialogContent className={`max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl border p-6 ${s.surface}`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Inventory Model Details</DialogTitle>
          </DialogHeader>
          {itemDetails && (
            <div className="mt-2 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-lg font-bold">{itemDetails.name}</h3></div>
                <StatusBadge status={itemDetails.status} />
              </div>
              <div className={`grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-4 ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                <StockValue label="Total Quantity" value={itemDetails.total_quantity} muted={s.muted} />
                <StockValue label="Available" value={available(itemDetails)} muted={s.muted} />
                <StockValue label="Requested" value={itemDetails.requested_quantity} muted={s.muted} />
                <StockValue label="Assigned" value={itemDetails.assigned_quantity} muted={s.muted} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {itemDetails.models?.map(model => <section key={model.id} className={`space-y-3 rounded-xl border p-4 ${s.isDark ? 'border-[#303030] bg-[#151515]' : 'border-[#EAEAEA] bg-white'}`}>
                  <div><p className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>Model</p><h4 className="font-bold">{model.name}</h4></div>
                  <p className={`text-xs ${s.muted}`}>{model.description || 'No model description'} </p>
                  <p className={`text-xs ${s.muted}`}>{currency(model.hourly_rental_rate, itemDetails.currency)} / hour · {currency(model.daily_rental_rate, itemDetails.currency)} / day</p>
                  <p className={`text-xs ${s.muted}`}>{model.total_quantity} units · {model.available_quantity} available · {model.requested_quantity} requested · {model.assigned_quantity} assigned</p>
                  <InventoryModelImageGallery images={model.images} alt={`${itemDetails.name} ${model.name}`} />
                </section>)}
              </div>
              <p className={`text-xs ${s.muted}`}>Inventory Item ID: {itemDetails.inventory_item_id || itemDetails.id}</p>
              <div className="flex justify-end gap-2">
                <InventoryButton variant="outline" onClick={() => setItemDetails(null)}>Close</InventoryButton>
                <InventoryButton variant="beige" className="font-bold text-black" onClick={() => {
                  const itemToEdit = itemDetails;
                  setItemDetails(null);
                  openForm(parentItem(itemToEdit), itemToEdit.inventory_model_id);
                }}>Edit Model</InventoryButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminInventoryItemForm open={showForm} item={selectedItem} modelId={editModelId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />
    </>
  );
}

type InventoryRowAction = { label: string; icon: React.ReactNode; onSelect: () => void; danger?: boolean };

function InventoryActionMenu({ actions, isDark, disabled = false }: { actions: InventoryRowAction[]; isDark: boolean; disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={event => event.stopPropagation()}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors disabled:opacity-35 ${isDark ? 'text-white hover:bg-white/10' : 'text-black/50 hover:bg-black/5 hover:text-black'}`}
        >
          <MoreVertical size={24} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        className={`z-[200] w-[190px] rounded-xl p-1.5 shadow-xl ${isDark ? 'border-[#3A3A3A] bg-[#171717]' : 'border-[#E5E5E5] bg-white'}`}
      >
        <div className="flex flex-col gap-0.5">
          {actions.map(action => (
            <button
              key={action.label}
              type="button"
              onClick={() => { setOpen(false); action.onSelect(); }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${action.danger ? 'text-red-500 hover:bg-red-500/10' : isDark ? 'text-white hover:bg-white/10' : 'text-[#222] hover:bg-[#F8F4EA]'}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EmptyRow({ columns, text, muted }: { columns: number; text: string; muted: string }) {
  return (
    <tr>
      <td colSpan={columns} className={`py-16 text-center ${muted}`}>
        {text}
      </td>
    </tr>
  );
}

function RequestItems({ request, muted }: { request: InventoryRequest; muted: string }) {
  return (
    <div className="space-y-1">
      {request.items.map(line => (
        <div key={line.inventory_item_id} className="text-sm font-medium">
          <p>{line.item_name_snapshot} <span className={`font-normal ${muted}`}>× {line.quantity}</span></p>
          {line.unit_ids && <p className={`mt-0.5 break-all text-xs font-normal ${muted}`}>Unit IDs: {line.unit_ids}</p>}
        </div>
      ))}
    </div>
  );
}

function StockValue({ label, value, muted }: { label: string; value: number | string; muted: string }) {
  return (
    <div>
      <p className={`text-[11px] ${muted}`}>{label}</p>
      <p className="mt-0.5 font-bold text-sm">{value}</p>
    </div>
  );
}
