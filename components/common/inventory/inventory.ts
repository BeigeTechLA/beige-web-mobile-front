export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type RequestType = 'personal' | 'shoot';
export type InventoryItem = { id: string; name: string; description?: string; image_url?: string; unit_price: number; currency?: string; total_quantity: number; requested_quantity: number; assigned_quantity: number; status: 'active' | 'inactive' };
export type RequestLine = { inventory_item_id: string; item_name_snapshot: string; item_image_snapshot?: string; unit_price_snapshot: number; quantity: number; line_total: number };
export type ShootOption = { id: string; name: string; date?: string; location?: string };
export type InventoryRequest = { id: string; creator_id: string; creator_name?: string; creator_image?: string; request_type: RequestType; shoot_id?: string | null; shoot_name?: string; shoot_date?: string; notes?: string; status: RequestStatus; rejection_reason?: string; items: RequestLine[]; total_items: number; total_quantity: number; total_amount: number; created_at: string; archived_at?: string | null };
export type ListResponse<T> = { data: T[]; total: number; page: number; limit: number };
export type ListParams = { page?: number; limit?: number; search?: string; status?: string; type?: string; sort?: string; date_from?: string; date_to?: string };
export type RequestPayload = { request_type: RequestType; shoot_id: string | null; notes: string; items: { inventory_item_id: string; quantity: number }[] };
export const available = (item: InventoryItem) => Math.max(0, item.total_quantity - item.requested_quantity - item.assigned_quantity);
export const currency = (value: number, code = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(Number(value) || 0);
export const requestTotals = (lines: RequestLine[]) => ({ total_items: lines.length, total_quantity: lines.reduce((n, x) => n + x.quantity, 0), total_amount: lines.reduce((n, x) => n + x.unit_price_snapshot * x.quantity, 0) });

// FRONTEND DEMO ONLY: localStorage-backed static data. Replace with authenticated real APIs for production.
const STORAGE_KEY = 'beige.inventory.static-demo.v1';
const CURRENT_CP = { id: 'cp-demo-001', name: 'Alex Morgan' };
const shoots: ShootOption[] = [
  { id: 'SH-2048', name: 'Downtown Fashion Campaign', date: '2026-10-18', location: 'Los Angeles' },
  { id: 'SH-2052', name: 'Sunset Product Shoot', date: '2026-10-22', location: 'Santa Monica' },
  { id: 'SH-2061', name: 'Studio Portrait Session', date: '2026-10-27', location: 'Hollywood' },
];
const picture = (symbol: string, color: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320"><rect width="480" height="320" rx="20" fill="${color}"/><circle cx="365" cy="74" r="112" fill="#ffffff" opacity=".10"/><text x="240" y="177" text-anchor="middle" font-size="96" font-family="Arial,sans-serif">${symbol}</text></svg>`)}`;
const seedItems: InventoryItem[] = [
  { id: 'INV-001', name: 'Sony A7 IV Camera', description: 'Full-frame mirrorless camera body', image_url: picture('📷','#293548'), unit_price: 2499, currency: 'USD', total_quantity: 12, requested_quantity: 0, assigned_quantity: 0, status: 'active' },
  { id: 'INV-002', name: 'Canon RF 24-70mm Lens', description: 'Professional versatile zoom lens', image_url: picture('🔍','#373343'), unit_price: 1899, currency: 'USD', total_quantity: 10, requested_quantity: 0, assigned_quantity: 0, status: 'active' },
  { id: 'INV-003', name: 'Aputure 300D Lighting Kit', description: 'LED light with softbox and stand', image_url: picture('💡','#45402f'), unit_price: 999, currency: 'USD', total_quantity: 15, requested_quantity: 0, assigned_quantity: 0, status: 'active' },
  { id: 'INV-004', name: 'DJI RS 3 Pro Gimbal', description: 'Professional camera stabilizer', image_url: picture('🎥','#304844'), unit_price: 869, currency: 'USD', total_quantity: 8, requested_quantity: 0, assigned_quantity: 0, status: 'active' },
  { id: 'INV-005', name: 'Manfrotto Tripod', description: 'Heavy-duty video and photo tripod', image_url: picture('📐','#3a3e51'), unit_price: 349, currency: 'USD', total_quantity: 20, requested_quantity: 0, assigned_quantity: 0, status: 'active' },
  { id: 'INV-006', name: 'Wireless Microphone Set', description: 'Dual-channel wireless audio kit', image_url: picture('🎤','#514238'), unit_price: 399, currency: 'USD', total_quantity: 10, requested_quantity: 0, assigned_quantity: 0, status: 'active' },
  { id: 'INV-007', name: 'Portable Monitor', description: 'On-camera external field monitor', image_url: picture('🖥️','#34505a'), unit_price: 449, currency: 'USD', total_quantity: 6, requested_quantity: 0, assigned_quantity: 0, status: 'inactive' },
  { id: 'INV-008', name: 'SanDisk 256GB SD Card', description: 'High speed UHS-II memory card', image_url: picture('💾','#5c3b3e'), unit_price: 129, currency: 'USD', total_quantity: 30, requested_quantity: 0, assigned_quantity: 0, status: 'active' },
];
type Store = { items: InventoryItem[]; requests: InventoryRequest[] };
const line = (id: string, qty: number): RequestLine => { const item = seedItems.find(x => x.id === id)!; return { inventory_item_id: id, item_name_snapshot: item.name, item_image_snapshot: item.image_url, unit_price_snapshot: item.unit_price, quantity: qty, line_total: item.unit_price * qty }; };
const makeRequest = (id: string, creator_id: string, creator_name: string, request_type: RequestType, shoot_id: string | null, status: RequestStatus, entries: [string,number][], date: string, notes = ''): InventoryRequest => {
  const lines = entries.map(([itemId, qty]) => line(itemId, qty));
  return { id, creator_id, creator_name, request_type, shoot_id, shoot_name: shoots.find(s => s.id === shoot_id)?.name, shoot_date: shoots.find(s => s.id === shoot_id)?.date, notes, status, items: lines, ...requestTotals(lines), created_at: date };
};
const initialState = (): Store => ({ items: seedItems.map(x => ({...x})), requests: [
  makeRequest('REQ-1001', CURRENT_CP.id, CURRENT_CP.name, 'shoot', 'SH-2048', 'pending', [['INV-001',2],['INV-003',3]], '2026-10-08T09:30:00.000Z', 'Camera and lighting for the campaign.'),
  makeRequest('REQ-1002', 'cp-demo-002', 'Jamie Rivera', 'personal', null, 'pending', [['INV-004',1],['INV-005',2]], '2026-10-07T12:15:00.000Z'),
  makeRequest('REQ-1003', CURRENT_CP.id, CURRENT_CP.name, 'personal', null, 'accepted', [['INV-006',2]], '2026-10-03T10:45:00.000Z'),
  makeRequest('REQ-1004', CURRENT_CP.id, CURRENT_CP.name, 'shoot', 'SH-2052', 'rejected', [['INV-002',1]], '2026-10-01T11:20:00.000Z'),
  makeRequest('REQ-1005', 'cp-demo-003', 'Taylor Brooks', 'shoot', 'SH-2061', 'cancelled', [['INV-008',4]], '2026-09-29T08:00:00.000Z'),
].map(x => x.id === 'REQ-1004' ? {...x, rejection_reason: 'Equipment unavailable for the requested shoot date.'} : x) });
let memory: Store | null = null;
const read = (): Store => {
  if (typeof window === 'undefined') return initialState();
  if (memory) return memory;
  try { const raw = window.localStorage.getItem(STORAGE_KEY); if (raw) { const parsed = JSON.parse(raw) as Store; if (Array.isArray(parsed.items) && Array.isArray(parsed.requests)) { memory = parsed; return parsed; } } } catch { /* storage may be disabled */ }
  memory = initialState(); return memory;
};
const save = (state: Store) => { memory = state; if (typeof window !== 'undefined') { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* keep session demo state */ } window.dispatchEvent(new Event('inventory-demo-updated')); } };
const withStock = (state: Store): InventoryItem[] => state.items.map(item => ({...item,
  requested_quantity: state.requests.filter(r => r.status === 'pending').flatMap(r => r.items).filter(l => l.inventory_item_id === item.id).reduce((sum,l) => sum + l.quantity, 0),
  assigned_quantity: state.requests.filter(r => r.status === 'accepted').flatMap(r => r.items).filter(l => l.inventory_item_id === item.id).reduce((sum,l) => sum + l.quantity, 0),
}));
const getItem = (id: string) => { const item = withStock(read()).find(x => x.id === id); if (!item) throw new Error('Inventory item not found'); return item; };
const getRequest = (id: string, own = false) => { const r = read().requests.find(x => x.id === id && (!own || x.creator_id === CURRENT_CP.id)); if (!r) throw new Error('Inventory request not found'); return structuredClone(r); };
const list = <T,>(rows: T[], params: ListParams): ListResponse<T> => { const page = Math.max(1, Number(params.page) || 1), limit = Math.max(1, Number(params.limit) || 10); return { data: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit }; };
const filterRequests = (rows: InventoryRequest[], params: ListParams) => rows.filter(r => (!params.search || `${r.id} ${r.creator_name} ${r.shoot_name}`.toLowerCase().includes(params.search.toLowerCase())) && (!params.status || params.status === 'all' || r.status === params.status) && (!params.type || params.type === 'all' || r.request_type === params.type) && (!params.date_from || r.created_at.slice(0,10) >= params.date_from) && (!params.date_to || r.created_at.slice(0,10) <= params.date_to)).sort((a,b) => b.created_at.localeCompare(a.created_at));
const filterItems = (rows: InventoryItem[], params: ListParams) => rows.filter(item => (!params.search || `${item.id} ${item.name}`.toLowerCase().includes(params.search.toLowerCase())) && (!params.status || params.status === 'all' || item.status === params.status)).sort((a,b) => a.name.localeCompare(b.name));
const checkPending = (id: string) => { const r = getRequest(id); if (r.status !== 'pending') throw new Error('Only pending requests can be changed'); return r; };
const uploadImage = (file: File): Promise<string> => new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Image could not be read')); reader.readAsDataURL(file); });
const validateLines = (payload: RequestPayload, previous?: InventoryRequest): RequestLine[] => {
  if (!['personal','shoot'].includes(payload.request_type)) throw new Error('Choose a request type');
  if (payload.request_type === 'shoot' && !shoots.some(s => s.id === payload.shoot_id)) throw new Error('Choose a valid assigned shoot');
  if (!payload.items.length) throw new Error('Choose at least one item');
  const ids = new Set<string>();
  return payload.items.map(entry => {
    if (ids.has(entry.inventory_item_id)) throw new Error('Duplicate item in request'); ids.add(entry.inventory_item_id);
    if (!Number.isSafeInteger(entry.quantity) || entry.quantity < 1) throw new Error('Invalid quantity');
    const item = getItem(entry.inventory_item_id);
    if (item.status !== 'active') throw new Error(`${item.name} is inactive`);
    const oldQty = previous?.items.find(x => x.inventory_item_id === item.id)?.quantity || 0;
    if (entry.quantity > available(item) + oldQty) throw new Error(`Not enough available stock for ${item.name}`);
    const snapshot = previous?.items.find(x => x.inventory_item_id === item.id);
    const price = snapshot?.unit_price_snapshot ?? item.unit_price;
    return { inventory_item_id: item.id, item_name_snapshot: snapshot?.item_name_snapshot ?? item.name, item_image_snapshot: snapshot?.item_image_snapshot ?? item.image_url, unit_price_snapshot: price, quantity: entry.quantity, line_total: price * entry.quantity };
  });
};
export const inventoryApi = {
  adminRequests: async (params: ListParams) => list(filterRequests(read().requests, params), params),
  adminRequest: async (id: string) => getRequest(id),
  approve: async (id: string) => { checkPending(id); const state = read(); state.requests = state.requests.map(r => r.id === id ? {...r, status:'accepted' as const} : r); save(state); },
  reject: async (id: string, rejection_reason: string) => { checkPending(id); if (!rejection_reason.trim()) throw new Error('Rejection reason is required'); const state = read(); state.requests = state.requests.map(r => r.id === id ? {...r, status:'rejected' as const, rejection_reason: rejection_reason.trim()} : r); save(state); },
  adminItems: async (params: ListParams) => list(filterItems(withStock(read()),params),params),
  item: async (id: string) => getItem(id),
  stock: async () => { const items = withStock(read()); return { total_items: items.length, total_quantity: items.reduce((n,x) => n+x.total_quantity,0), available_quantity: items.reduce((n,x) => n+available(x),0), requested_quantity: items.reduce((n,x) => n+x.requested_quantity,0), assigned_quantity: items.reduce((n,x) => n+x.assigned_quantity,0) }; },
  saveItem: async (values: Partial<InventoryItem> & { image?: File | null }, id?: string) => {
    const state = read(); const previous = id ? getItem(id) : undefined;
    const name = String(values.name ?? previous?.name ?? '').trim();
    const price = Number(values.unit_price ?? previous?.unit_price ?? 0), qty = Number(values.total_quantity ?? previous?.total_quantity ?? 0);
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isSafeInteger(qty) || qty < 0) throw new Error('Enter a valid name, price and stock quantity');
    if (previous && qty < previous.requested_quantity + previous.assigned_quantity) throw new Error('Stock cannot be below reserved + assigned quantities');
    if (values.image && (!values.image.type.startsWith('image/') || values.image.size > 5 * 1024 * 1024)) throw new Error('Please select an image under 5MB');
    const image_url = values.image ? await uploadImage(values.image) : previous?.image_url ?? picture('📦','#454545');
    const item: InventoryItem = {id: previous?.id ?? `INV-${Date.now()}`, name, description: values.description ?? previous?.description ?? '', unit_price: price, currency:previous?.currency ?? 'USD', total_quantity:qty, requested_quantity:previous?.requested_quantity ?? 0, assigned_quantity:previous?.assigned_quantity ?? 0, status:values.status ?? previous?.status ?? 'active', image_url};
    state.items = previous ? state.items.map(x => x.id === id ? item : x) : [...state.items,item]; save(state); return item;
  },
  setStatus: async (id: string, status: InventoryItem['status']) => { getItem(id); const state = read(); state.items = state.items.map(x => x.id === id ? {...x,status} : x); save(state); },
  deleteItem: async (id: string) => { getItem(id); const state = read(); if (state.requests.some(r => r.items.some(x => x.inventory_item_id === id))) { state.items = state.items.map(x => x.id === id ? {...x,status:'inactive'} : x); } else { state.items = state.items.filter(x => x.id !== id); } save(state); },
  catalog: async (params: ListParams) => list(filterItems(withStock(read()).filter(x => x.status === 'active'),params),params),
  shoots: async () => [...shoots],
  ownRequests: async (params: ListParams) => list(filterRequests(read().requests.filter(r => r.creator_id === CURRENT_CP.id && !r.archived_at),params),params),
  ownRequest: async (id: string) => getRequest(id,true),
  submit: async (payload: RequestPayload, id?: string) => {
    const previous = id ? getRequest(id,true) : undefined;
    if (previous && previous.status !== 'pending') throw new Error('Only pending requests can be edited');
    const lines = validateLines(payload,previous);
    const state = read(), shoot = payload.request_type === 'shoot' ? shoots.find(s => s.id === payload.shoot_id) : undefined;
    const request: InventoryRequest = { id: previous?.id ?? `REQ-${Date.now()}`, creator_id:CURRENT_CP.id, creator_name:CURRENT_CP.name, request_type:payload.request_type, shoot_id:shoot?.id ?? null, shoot_name:shoot?.name, shoot_date:shoot?.date, notes:payload.notes, status:'pending', items:lines, ...requestTotals(lines), created_at:previous?.created_at ?? new Date().toISOString() };
    state.requests = previous ? state.requests.map(r => r.id === id ? request : r) : [request,...state.requests]; save(state); return request;
  },
  cancel: async (id: string) => { const req = getRequest(id,true); if (req.status !== 'pending') throw new Error('Only pending requests can be cancelled'); const state = read(); state.requests = state.requests.map(r => r.id === id ? {...r,status:'cancelled' as const} : r); save(state); },
  archive: async (id: string) => { const req = getRequest(id,true); if (!['rejected','cancelled'].includes(req.status)) throw new Error('Only rejected or cancelled requests can be archived'); const state = read(); state.requests = state.requests.map(r => r.id === id ? {...r,archived_at:new Date().toISOString()} : r); save(state); },
};
