'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Package, RotateCcw, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryItem, InventoryRequest, inventoryApi, available, currency, formatInventoryDate, ListParams } from '@/components/common/inventory/inventory';
import { InventoryButton, InventoryCard, InventoryImage, StatusBadge, useInventoryStyle } from '@/components/common/inventory/InventoryUI';
import InventoryRequestWizard from './InventoryRequestWizard';

type View = 'catalog' | 'requests';
type Align = 'left' | 'center' | 'right';
type Column = { label: string; align: Align; width: string };

const ALIGN_CLASS: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// Header and body cells share the same alignment + width so columns always line up.
const REQUEST_COLUMNS: Column[] = [
  { label: 'Request ID', align: 'left', width: '16%' },
  { label: 'Purpose / Shoot', align: 'left', width: '22%' },
  { label: 'Requested Inventory', align: 'left', width: '30%' },
  { label: 'Submitted Date', align: 'left', width: '16%' },
  { label: 'Status', align: 'center', width: '16%' },
];

const thClass = (align: Align) => `px-6 py-4 align-middle whitespace-nowrap font-semibold ${ALIGN_CLASS[align]}`;
const tdClass = (align: Align, extra = '') => `px-6 py-4 align-middle text-sm ${ALIGN_CLASS[align]} ${extra}`.trim();

export default function CreatorInventory() {
  const s = useInventoryStyle();
  const [view, setView] = useState<View>('catalog');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [requestItem, setRequestItem] = useState<InventoryItem | null>(null);
  const [wizard, setWizard] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [requestsBusy, setRequestsBusy] = useState(false);

  const loadCatalog = useCallback(async () => {
    setCatalogBusy(true);
    try {
      const result = await inventoryApi.catalog({ page: 1, limit: 100 });
      setCatalog((result.data || []).filter(item => item.status === 'active' && available(item) > 0));
    } catch {
      toast.error('Unable to load inventory items. Please try again.');
    } finally {
      setCatalogBusy(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsBusy(true);
    try {
      const params: ListParams = { page, limit: PAGE_SIZE };
      const result = await inventoryApi.ownRequests(params);
      setRequests(result.data || []);
      setTotalRequests(result.total || 0);
    } catch {
      toast.error('Unable to load inventory requests. Please try again.');
    } finally {
      setRequestsBusy(false);
    }
  }, [page]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (view === 'requests') void loadRequests();
  }, [view, loadRequests]);

  const panelClass = `rounded-2xl border p-5 lg:p-6 transition-all duration-200 ${
    s.isDark ? 'border-[#262626] bg-[#121212]' : 'border-[#EAEAEA] bg-white shadow-xs'
  }`;

  return (
    <main className="space-y-6 p-4 lg:px-10 lg:py-9">
      {/* Header Section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${s.isDark ? 'text-[#E8D1AB]' : 'text-[#8A6D3B]'}`}>
            Creative Partner
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className={`mt-1 max-w-2xl text-sm ${s.muted}`}>
            Browse available equipment and request what you need for personal use or an assigned shoot.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InventoryButton
            variant="outline"
            className={`h-10 rounded-lg border px-4 font-medium transition-colors ${
              s.isDark ? 'border-[#333333] bg-[#202020] text-white/70 hover:text-white' : 'border-[#E5E5E5] bg-white text-[#666666] hover:text-black'
            }`}
            onClick={() => {
              if (view === 'catalog') void loadCatalog();
              else {
                inventoryApi.invalidateRequests('creator');
                void loadRequests();
              }
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Refresh
          </InventoryButton>
          <InventoryButton
            variant="beige"
            className="h-10 rounded-lg px-5 font-semibold text-black shadow-none hover:bg-[#E5D5B8]/90"
            onClick={() => {
              setRequestItem(null);
              setWizard(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" /> New Request
          </InventoryButton>
        </div>
      </header>

      {/* Tabs */}
      <div className={`flex border-b ${s.isDark ? 'border-[#333333]' : 'border-[#E5E5E5]'}`}>
        {(
          [
            { id: 'catalog', label: 'Browse Inventory', icon: Package },
            { id: 'requests', label: `My Requests${totalRequests ? ` (${totalRequests})` : ''}`, icon: FileText },
          ] as const
        ).map(tab => {
          const Icon = tab.icon;
          const isActive = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-[#E8D1AB] text-[#E8D1AB]'
                  : `border-transparent ${s.muted} hover:text-current`
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#E8D1AB]' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {view === 'catalog' ? (
        <section className="space-y-6">
          <div className={panelClass}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Available Equipment Catalog</h2>
                <p className={`mt-0.5 text-sm ${s.muted}`}>Click on any item to view specifications and add it to your request.</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.isDark ? 'bg-[#202020] text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                {catalog.length} Items Available
              </span>
            </div>
          </div>

          {catalogBusy ? (
            <div className={`${panelClass} py-20 text-center`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent text-[#E8D1AB] mb-3"></div>
              <p className={s.muted}>Loading available inventory catalog…</p>
            </div>
          ) : catalog.length === 0 ? (
            <div className={`${panelClass} flex flex-col items-center py-20 text-center`}>
              <div className={`p-4 rounded-2xl ${s.isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'} mb-3`}>
                <Package size={36} className={s.muted} />
              </div>
              <p className="text-base font-semibold">No available items found</p>
              <p className={`mt-1 max-w-sm text-sm ${s.muted}`}>Currently all inventory items are assigned or out of stock. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalog.map(item => (
                <InventoryCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className={`overflow-hidden rounded-2xl border ${s.isDark ? 'border-[#333333] bg-[#111111]' : 'border-[#E5E5E5] bg-white'}`}>
          <div className="p-5 lg:p-6 border-b border-current/10">
            <h2 className="text-lg font-semibold">My Inventory Requests</h2>
            <p className={`mt-0.5 text-sm ${s.muted}`}>Track approval status and details for your submitted equipment requests.</p>
          </div>

          {requestsBusy ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent text-[#E8D1AB] mb-3"></div>
              <p className={s.muted}>Loading your requests…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className={`p-4 rounded-2xl ${s.isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'} mb-3`}>
                <Package size={36} className={s.muted} />
              </div>
              <p className="text-base font-semibold">No requests submitted yet</p>
              <p className={`mt-1 max-w-sm text-sm ${s.muted}`}>When you request items for shoots or personal use, your request history will appear here.</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="space-y-4 p-4 lg:hidden">
                {requests.map(request => (
                  <article
                    key={request.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRequest(request)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedRequest(request);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors ${s.isDark ? 'border-[#2A2A2A] bg-[#161616] hover:bg-white/[0.04]' : 'border-[#EAEAEA] bg-[#FAFAFA] hover:bg-black/[0.025]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {request.id}
                        </span>
                        <p className="mt-2 text-sm font-bold">
                          {request.request_type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}
                        </p>
                        {request.shoot_name && <p className={`text-xs ${s.muted}`}>{request.shoot_name}</p>}
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className={`my-3 border-t ${s.isDark ? 'border-[#2A2A2A]' : 'border-[#EAEAEA]'}`} />
                    <RequestItemSummary request={request} muted={s.muted} />

                    <div className={`mt-3 pt-3 border-t text-xs flex items-center justify-between ${s.isDark ? 'border-[#2A2A2A]' : 'border-[#EAEAEA]'} ${s.muted}`}>
                      <span>Submitted {formatInventoryDate(request.created_at)}</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden w-full overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] table-fixed border-collapse">
                  <colgroup>
                    {REQUEST_COLUMNS.map(column => (
                      <col key={column.label} style={{ width: column.width }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className={`text-sm font-medium border-b ${s.isDark ? 'bg-[#101010] text-[#E8D1AB] border-b-[#3D3D3D]' : 'bg-[#FFFCF6] text-black border-b-[#E5E5E5]'}`}>
                      {REQUEST_COLUMNS.map(column => (
                        <th key={column.label} className={thClass(column.align)}>
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(request => (
                      <tr
                        key={request.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRequest(request)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedRequest(request);
                          }
                        }}
                        className={`cursor-pointer border-t transition-colors ${
                          s.isDark ? 'border-[#222] hover:bg-white/[0.02]' : 'border-[#EAEAEA] hover:bg-black/[0.015]'
                        }`}
                      >
                        <td className={tdClass('left', 'font-mono font-medium break-all')}>
                          {request.id}
                        </td>
                        <td className={tdClass('left', 'font-medium')}>
                          {request.request_type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}
                          <div className={`mt-0.5 text-xs font-normal ${s.muted}`}>{request.shoot_name || '—'}</div>
                        </td>
                        <td className={tdClass('left')}>
                          <RequestItemSummary request={request} muted={s.muted} />
                        </td>
                        <td className={tdClass('left', `whitespace-nowrap ${s.muted}`)}>
                          {formatInventoryDate(request.created_at)}
                        </td>
                        <td className={tdClass('center')}>
                          <StatusBadge status={request.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`flex flex-col items-center justify-between gap-4 border-t p-4 lg:flex-row lg:px-6 ${s.isDark ? 'border-[#333333]' : 'border-[#E5E5E5]'}`}>
                <span className={`hidden whitespace-nowrap text-xs font-medium lg:block ${s.muted}`}>
                  Showing {requests.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalRequests)} of {totalRequests} entries
                </span>
                <div className="flex items-center gap-2">
                  <InventoryButton
                    variant="outline"
                    className={`h-9 rounded-lg border px-4 shadow-none disabled:opacity-30 ${s.isDark ? 'border-[#333333] bg-[#202020] text-white/70' : 'border-[#E5E5E5] bg-white text-[#666]'}`}
                    size="sm"
                    disabled={requestsBusy || page === 1}
                    onClick={() => setPage(v => v - 1)}
                  >
                    Previous
                  </InventoryButton>
                  <span className={`px-3 text-xs font-semibold ${s.muted}`}>
                    Page {page} of {Math.max(1, Math.ceil(totalRequests / PAGE_SIZE))}
                  </span>
                  <InventoryButton
                    variant="outline"
                    className={`h-9 rounded-lg border px-4 shadow-none disabled:opacity-30 ${s.isDark ? 'border-[#333333] bg-[#202020] text-white/70' : 'border-[#E5E5E5] bg-white text-[#666]'}`}
                    size="sm"
                    disabled={requestsBusy || page * PAGE_SIZE >= totalRequests}
                    onClick={() => setPage(v => v + 1)}
                  >
                    Next
                  </InventoryButton>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
        <DialogContent className={`max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border p-6 ${s.surface}`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Inventory Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-6 sm:grid-cols-2 mt-2">
              <InventoryImage src={selectedItem.image_url} alt={selectedItem.name} className="h-60 w-full sm:h-full rounded-xl" />
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                  <p className={`text-sm leading-relaxed ${s.muted}`}>{selectedItem.description || 'No description provided.'}</p>
                  
                  <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-xl border ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                    <div>
                      <p className={`text-xs ${s.muted}`}>Price / Unit</p>
                      <p className="text-base font-bold mt-0.5">{currency(selectedItem.unit_price, selectedItem.currency)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${s.muted}`}>Available Stock</p>
                      <p className="text-base font-bold text-emerald-500 mt-0.5">{available(selectedItem)} units</p>
                    </div>
                  </div>
                </div>

                <InventoryButton
                  variant="beige"
                  className="h-12 w-full rounded-xl font-bold text-black shadow-xs hover:opacity-90"
                  onClick={() => {
                    setRequestItem(selectedItem);
                    setSelectedItem(null);
                    setWizard(true);
                  }}
                >
                  Request This Item
                </InventoryButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedRequest} onOpenChange={open => !open && setSelectedRequest(null)}>
        <DialogContent className={`max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border p-6 ${s.surface}`}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center justify-between gap-3 text-xl font-bold">
              Request Details {selectedRequest && <StatusBadge status={selectedRequest.status} />}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="mt-2 space-y-5">
              <div className={`grid grid-cols-2 gap-4 rounded-xl border p-4 text-sm ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                <div><p className={`text-xs ${s.muted}`}>Request ID</p><p className="mt-1 font-semibold">{selectedRequest.id}</p></div>
                <div><p className={`text-xs ${s.muted}`}>Purpose</p><p className="mt-1 font-semibold">{selectedRequest.request_type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}</p></div>
                {selectedRequest.shoot_name && <div><p className={`text-xs ${s.muted}`}>Assigned Shoot</p><p className="mt-1 font-semibold">{selectedRequest.shoot_name}</p></div>}
                <div><p className={`text-xs ${s.muted}`}>Submitted</p><p className="mt-1 font-semibold">{formatInventoryDate(selectedRequest.created_at)}</p></div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Requested Inventory</h3>
                {selectedRequest.items.map(line => (
                  <div key={line.inventory_item_id} className={`flex items-center gap-3 rounded-xl border p-3 ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-white'}`}>
                    <InventoryImage src={line.item_image_snapshot} alt={line.item_name_snapshot} className="h-14 w-14 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{line.item_name_snapshot}</p>
                      <p className={`mt-1 text-xs ${s.muted}`}>Quantity: {line.quantity} · {currency(line.unit_price_snapshot)} / unit</p>
                    </div>
                    <p className="text-sm font-bold">{currency(line.line_total)}</p>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-3 text-sm font-semibold">
                  <span>Total quantity: {selectedRequest.total_quantity}</span>
                  <span>{currency(selectedRequest.total_amount)}</span>
                </div>
              </div>

              {selectedRequest.admin_note && (
                <div className={`rounded-xl border p-4 ${s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                  <p className={`text-xs ${s.muted}`}>Admin Note</p>
                  <p className="mt-1 text-sm">{selectedRequest.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InventoryRequestWizard
        open={wizard}
        initialItem={requestItem}
        onClose={() => {
          setWizard(false);
          setRequestItem(null);
        }}
        onSubmitted={() => {
          setWizard(false);
          setView('requests');
          void loadCatalog();
          if (view === 'requests') void loadRequests();
        }}
        catalog={catalog}
      />
    </main>
  );
}

function RequestItemSummary({ request, muted }: { request: InventoryRequest; muted: string }) {
  return (
    <div className="space-y-1">
      {request.items.map(item => (
        <p key={item.inventory_item_id} className="text-sm font-medium">
          {item.item_name_snapshot} <span className={`font-normal ${muted}`}>× {item.quantity}</span>
        </p>
      ))}
    </div>
  );
}
