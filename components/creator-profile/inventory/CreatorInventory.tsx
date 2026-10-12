'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, RotateCcw, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { InventoryItem, InventoryRequest, inventoryApi, formatInventoryDate, fulfillmentStatusFor, ListParams } from '@/components/common/inventory/inventory';
import CreatorInventoryDialogs from '@/components/creator-profile/inventory/CreatorInventoryDialogs';
import { InventoryButton, InventoryGroupCard, StatusBadge, useInventoryStyle } from '@/components/common/inventory/InventoryUI';
import { inventoryHttpApi } from '@/lib/api';
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
  { label: 'Request ID', align: 'left', width: '14%' },
  { label: 'Purpose / Shoot', align: 'left', width: '20%' },
  { label: 'Requested Inventory', align: 'left', width: '24%' },
  { label: 'Submitted Date', align: 'left', width: '14%' },
  { label: 'Fulfillment Status', align: 'left', width: '14%' },
  { label: 'Request Status', align: 'center', width: '14%' },
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
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; description?: string; models: InventoryItem[] } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [requestItem, setRequestItem] = useState<InventoryItem | null>(null);
  const [wizard, setWizard] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [requestsBusy, setRequestsBusy] = useState(false);
  const [returnTarget, setReturnTarget] = useState<InventoryRequest['items'][number] | null>(null);
  const [returnFiles, setReturnFiles] = useState<File[]>([]);
  const [returnBusy, setReturnBusy] = useState(false);

  const submitReturn = async () => {
    if (!selectedRequest || !returnTarget || !returnFiles.length) return toast.error('Add return condition photos first.');
    setReturnBusy(true);
    try {
      const uploaded = await inventoryHttpApi.uploadInventoryConditionImages('creator', returnFiles);
      const paths = (uploaded?.data || []).map((image: { file_path: string }) => image.file_path);
      await inventoryHttpApi.returnCreatorInventoryItem(selectedRequest.id, returnTarget.request_item_id || '', paths);
      toast.success('Equipment return recorded'); setReturnTarget(null); setReturnFiles([]);
      inventoryApi.invalidateRequests('creator');
      const refreshed = await inventoryApi.ownRequest(selectedRequest.id);
      setSelectedRequest(refreshed); void loadRequests(); void loadCatalog();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to record equipment return.'); }
    finally { setReturnBusy(false); }
  };

  const openRequestDetails = async (request: InventoryRequest) => {
    setSelectedRequest(request);
    inventoryApi.invalidateRequests('creator');
    try { setSelectedRequest(await inventoryApi.ownRequest(request.id)); }
    catch { toast.error('Could not refresh request handover status.'); }
  };

  const catalogGroups = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>();
    catalog.forEach(model => {
      const key = model.inventory_item_id || model.inventory_name || model.id;
      groups.set(key, [...(groups.get(key) || []), model]);
    });
    return Array.from(groups.entries()).map(([id, models]) => ({ id, name: models[0].inventory_name || models[0].name, models }));
  }, [catalog]);

  const loadCatalog = useCallback(async () => {
    setCatalogBusy(true);
    try {
      const result = await inventoryApi.catalog({ page: 1, limit: 100 });
      setCatalog((result.data || []).filter(item => item.status === 'active'));
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
                <p className={`mt-0.5 text-sm ${s.muted}`}>Select an equipment item to view its models and available stock.</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.isDark ? 'bg-[#202020] text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
              {catalogGroups.length} Equipment Items · {catalog.length} Models
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalogGroups.map(group => <InventoryGroupCard key={group.id} name={group.name} description={group.description} models={group.models} onClick={() => setSelectedGroup(group)} />)}
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
                    onClick={() => void openRequestDetails(request)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void openRequestDetails(request);
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
                    <div
                      className={`mt-3 border-t pt-3 ${
                        s.isDark ? 'border-[#2A2A2A]' : 'border-[#EAEAEA]'
                      }`}
                    >
                      <p className={`mb-2 text-xs font-semibold ${s.muted}`}>
                        Fulfillment Status
                      </p>
                      <div className="space-y-1.5">
                        {request.items.map(line => {
                          const value = fulfillmentStatusFor(request.status, line);
                          const tone =
                            value === 'overdue'
                              ? 'text-red-500'
                              : value === 'issued' || value === 'returned'
                                ? 'text-emerald-500'
                                : value === 'pending_issue'
                                  ? 'text-amber-500'
                                  : '';

                          return (
                            <p
                              key={line.request_item_id || line.inventory_model_id}
                              className={`text-xs font-medium capitalize ${tone}`}
                            >
                              {value.replaceAll('_', ' ')}
                            </p>
                          );
                        })}
                      </div>
                    </div>

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
                        onClick={() => void openRequestDetails(request)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                          void openRequestDetails(request);
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
                        <td className={tdClass('left')}>
                          <div className="space-y-1.5">
                            {request.items.map(line => {
                              const value = fulfillmentStatusFor(request.status, line);
                              const tone =
                                value === 'overdue'
                                  ? 'text-red-500'
                                  : value === 'issued' || value === 'returned'
                                    ? 'text-emerald-500'
                                    : value === 'pending_issue'
                                      ? 'text-amber-500'
                                      : '';

                              return (
                                <p
                                  key={line.request_item_id || line.inventory_model_id}
                                  className={`text-xs font-medium capitalize ${tone}`}
                                >
                                  {value.replaceAll('_', ' ')}
                                </p>
                              );
                            })}
                          </div>
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

      <CreatorInventoryDialogs
        selectedGroup={selectedGroup}
        onCloseGroup={() => setSelectedGroup(null)}
        onRequestModel={model => { setRequestItem(model); setSelectedGroup(null); setWizard(true); }}
        selectedRequest={selectedRequest}
        onCloseRequest={() => setSelectedRequest(null)}
        onBeginReturn={line => { setReturnTarget(line); setReturnFiles([]); }}
        returnTarget={returnTarget}
        returnFiles={returnFiles}
        setReturnFiles={setReturnFiles}
        returnBusy={returnBusy}
        onCancelReturn={() => { setReturnTarget(null); setReturnFiles([]); }}
        onSubmitReturn={() => void submitReturn()}
      />
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
