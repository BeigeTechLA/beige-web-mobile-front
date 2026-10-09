import { inventoryHttpApi } from '@/lib/api';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';
export type RequestType = 'personal' | 'shoot';

export type InventoryItem = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  unit_price: number;
  currency?: string;
  total_quantity: number;
  requested_quantity: number;
  assigned_quantity: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
};

export type RequestLine = {
  inventory_item_id: string;
  item_name_snapshot: string;
  item_image_snapshot?: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
};

export type ShootOption = { id: string; name: string; date?: string; location?: string };

export type InventoryRequest = {
  id: string;
  creator_id: string;
  creator_name?: string;
  request_type: RequestType;
  shoot_id?: string | null;
  shoot_name?: string;
  shoot_date?: string;
  status: RequestStatus;
  admin_id?: number;
  admin_note?: string;
  items: RequestLine[];
  total_items: number;
  total_quantity: number;
  total_amount: number;
  created_at: string;
};

export type ListResponse<T> = { data: T[]; total: number; page: number; limit: number };
export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  sort?: string;
  date_from?: string;
  date_to?: string;
};
export type RequestPayload = {
  request_type: RequestType;
  shoot_id: string | null;
  items: { inventory_item_id: string; quantity: number }[];
};

type ApiRow = Record<string, unknown>;

const numberValue = (value: unknown, fallback = 0) => {
  const valueAsNumber = Number(value);
  return Number.isFinite(valueAsNumber) ? valueAsNumber : fallback;
};

const stringValue = (value: unknown, fallback = '') => value == null ? fallback : String(value);

const normalizeItem = (row: ApiRow): InventoryItem => ({
  id: stringValue(row.id),
  name: stringValue(row.name),
  description: stringValue(row.description),
  image_url: stringValue(row.image_url) || undefined,
  unit_price: numberValue(row.price ?? row.unit_price),
  currency: stringValue(row.currency, 'USD') || 'USD',
  total_quantity: numberValue(row.total_quantity),
  requested_quantity: numberValue(row.requested_quantity),
  assigned_quantity: numberValue(row.assigned_quantity),
  status: Number(row.is_active ?? (row.status === 'active' ? 1 : 0)) === 1 ? 'active' : 'inactive',
  created_at: stringValue(row.created_at) || undefined,
  updated_at: stringValue(row.updated_at) || undefined,
});

const normalizeRequestLine = (row: ApiRow): RequestLine => {
  const quantity = numberValue(row.quantity);
  const unitPrice = numberValue(row.unit_price ?? row.unit_price_snapshot);
  return {
    inventory_item_id: stringValue(row.inventory_item_id),
    item_name_snapshot: stringValue(row.item_name_snapshot ?? row.item_name, 'Inventory item'),
    item_image_snapshot: stringValue(row.item_image_snapshot ?? row.image_url) || undefined,
    unit_price_snapshot: unitPrice,
    quantity,
    line_total: numberValue(row.line_total, unitPrice * quantity),
  };
};

const groupRequests = (rows: ApiRow[]): InventoryRequest[] => {
  const requests = new Map<string, InventoryRequest>();

  for (const row of rows) {
    const id = stringValue(row.id);
    if (!id) continue;
    let request = requests.get(id);
    if (!request) {
      const firstName = stringValue(row.first_name);
      const lastName = stringValue(row.last_name);
      const creatorName = stringValue(row.creator_name, `${firstName} ${lastName}`.trim());
      request = {
        id,
        creator_id: stringValue(row.cp_id ?? row.creator_id),
        creator_name: creatorName || undefined,
        request_type: row.purpose === 'shoot' || row.request_type === 'shoot' ? 'shoot' : 'personal',
        shoot_id: row.shoot_id == null ? null : stringValue(row.shoot_id),
        shoot_name: stringValue(row.shoot_name) || undefined,
        shoot_date: stringValue(row.shoot_date ?? row.event_date) || undefined,
        status: row.status === 'accepted' || row.status === 'rejected' ? row.status : 'pending',
        admin_id: row.admin_id == null ? undefined : numberValue(row.admin_id),
        admin_note: stringValue(row.admin_note) || undefined,
        items: [],
        total_items: 0,
        total_quantity: 0,
        total_amount: 0,
        created_at: stringValue(row.created_at),
      };
      requests.set(id, request);
    }

    if (row.inventory_item_id != null) request.items.push(normalizeRequestLine(row));
  }

  return [...requests.values()].map(request => ({
    ...request,
    total_items: request.items.length,
    total_quantity: request.items.reduce((total, item) => total + item.quantity, 0),
    total_amount: request.items.reduce((total, item) => total + item.line_total, 0),
  })).sort((a, b) => b.created_at.localeCompare(a.created_at));
};

const asRows = (value: unknown): ApiRow[] => Array.isArray(value) ? value as ApiRow[] : [];
const listResult = <T,>(rows: T[], params: ListParams = {}): ListResponse<T> => {
  const page = Math.max(1, numberValue(params.page, 1));
  const limit = Math.max(1, numberValue(params.limit, 10));
  return { data: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
};

export const available = (item: InventoryItem) => Math.max(0, item.total_quantity - item.requested_quantity - item.assigned_quantity);
export const currency = (value: number, code = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(Number(value) || 0);
export const formatInventoryDate = (value?: string | null) => {
  if (!value) return '—';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).formatToParts(date);
  const day = parts.find(part => part.type === 'day')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const year = parts.find(part => part.type === 'year')?.value;
  return day && month && year ? `${day} ${month}, ${year}` : '—';
};
export const requestTotals = (lines: RequestLine[]) => ({
  total_items: lines.length,
  total_quantity: lines.reduce((total, item) => total + item.quantity, 0),
  total_amount: lines.reduce((total, item) => total + item.unit_price_snapshot * item.quantity, 0),
});

const REQUEST_CACHE_TTL_MS = 20_000;
const requestCache = new Map<string, { expiresAt: number; rows: InventoryRequest[] }>();
const requestInFlight = new Map<string, Promise<InventoryRequest[]>>();

const requestCacheKey = (role: 'admin' | 'creator', status?: string) => `${role}:${role === 'admin' && status && status !== 'all' ? status : 'all'}`;

const getGroupedRequests = async (role: 'admin' | 'creator', status?: string) => {
  const key = requestCacheKey(role, status);
  const cached = requestCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;
  const pending = requestInFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const response = role === 'admin'
      ? await inventoryHttpApi.listAdminRequests(status)
      : await inventoryHttpApi.listCreatorRequests();
    const rows = groupRequests(asRows(response?.data));
    requestCache.set(key, { rows, expiresAt: Date.now() + REQUEST_CACHE_TTL_MS });
    return rows;
  })();
  requestInFlight.set(key, request);
  try {
    return await request;
  } finally {
    requestInFlight.delete(key);
  }
};

const invalidateRequestCache = (role?: 'admin' | 'creator') => {
  for (const key of requestCache.keys()) {
    if (!role || key.startsWith(`${role}:`)) requestCache.delete(key);
  }
  for (const key of requestInFlight.keys()) {
    if (!role || key.startsWith(`${role}:`)) requestInFlight.delete(key);
  }
};

const getAdminItemsWithStock = async (params: ListParams) => {
  const response = await inventoryHttpApi.listAdminItems({
    search: params.search,
    status: params.status || 'all',
    page: params.page || 1,
    limit: params.limit || 20,
  });
  const rows = asRows(response?.data);
  const requestRows = await getGroupedRequests('admin');
  const stockByItem = new Map<string, { requested: number; assigned: number }>();

  requestRows.forEach(request => request.items.forEach(line => {
    const stock = stockByItem.get(line.inventory_item_id) || { requested: 0, assigned: 0 };
    if (request.status === 'pending') stock.requested += line.quantity;
    if (request.status === 'accepted') stock.assigned += line.quantity;
    stockByItem.set(line.inventory_item_id, stock);
  }));

  const pagination = response?.pagination || {};
  const page = numberValue(pagination.page, numberValue(params.page, 1));
  const limit = numberValue(pagination.limit, numberValue(params.limit, 20));
  const total = numberValue(pagination.total, rows.length);
  return {
    data: rows.map(row => {
      const item = normalizeItem(row);
      const stock = stockByItem.get(item.id) || { requested: 0, assigned: 0 };
      return { ...item, requested_quantity: stock.requested, assigned_quantity: stock.assigned };
    }),
    total,
    page,
    limit,
  };
};

export const inventoryApi = {
  adminRequests: async (params: ListParams = {}) => {
    const rows = await getGroupedRequests('admin', params.status);
    const filtered = rows.filter(request =>
      (!params.search || `${request.id} ${request.creator_name || ''} ${request.shoot_name || ''}`.toLowerCase().includes(params.search.toLowerCase())) &&
      (!params.type || params.type === 'all' || request.request_type === params.type)
    );
    return listResult(filtered, params);
  },
  adminRequest: async (id: string) => {
    const rows = await getGroupedRequests('admin');
    const request = rows.find(row => row.id === id);
    if (!request) throw new Error('Inventory request not found');
    return request;
  },
  approve: async (id: string) => {
    const result = await inventoryHttpApi.reviewAdminRequest(id, 'accepted');
    invalidateRequestCache();
    return result;
  },
  reject: async (id: string, admin_note = '') => {
    const result = await inventoryHttpApi.reviewAdminRequest(id, 'rejected', admin_note);
    invalidateRequestCache();
    return result;
  },
  invalidateRequests: (role?: 'admin' | 'creator') => invalidateRequestCache(role),
  adminItems: getAdminItemsWithStock,
  item: async (id: string) => {
    const response = await inventoryHttpApi.getAdminItem(id);
    return normalizeItem(response?.data || {});
  },
  stock: async () => {
    const result = await getAdminItemsWithStock({ page: 1, limit: 100 });
    return result.data.reduce((stock, item) => ({
      total_items: stock.total_items + 1,
      total_quantity: stock.total_quantity + item.total_quantity,
      available_quantity: stock.available_quantity + available(item),
      requested_quantity: stock.requested_quantity + item.requested_quantity,
      assigned_quantity: stock.assigned_quantity + item.assigned_quantity,
    }), { total_items: 0, total_quantity: 0, available_quantity: 0, requested_quantity: 0, assigned_quantity: 0 });
  },
  saveItem: async (values: Partial<InventoryItem> & { image?: File | null; removeImage?: boolean }, id?: string) => {
    const itemName = String(values.name || '').trim();
    const itemPrice = Number(values.unit_price);
    const itemQuantity = Number(values.total_quantity);
    if (!itemName || !Number.isFinite(itemPrice) || itemPrice <= 0 || !Number.isSafeInteger(itemQuantity) || itemQuantity <= 0) {
      throw new Error('Item name, price greater than 0, and a whole-number quantity greater than 0 are required.');
    }
    const payload = {
      name: values.name,
      description: values.description,
      price: values.unit_price,
      total_quantity: values.total_quantity,
    };
    let response: ApiRow;

    if (id) {
      response = await inventoryHttpApi.updateAdminItem(id, payload);
      if (values.image) await inventoryHttpApi.uploadAdminItemImage(id, values.image);
      else if (values.removeImage) await inventoryHttpApi.deleteAdminItemImage(id);
      await inventoryHttpApi.updateAdminItemStatus(id, values.status === 'active' ? 1 : 0);
      const refreshed = await inventoryHttpApi.getAdminItem(id);
      return normalizeItem(refreshed?.data || response?.data || {});
    }

    const form = new FormData();
    form.append('name', String(values.name || ''));
    form.append('description', String(values.description || ''));
    form.append('price', String(values.unit_price ?? 0));
    form.append('total_quantity', String(values.total_quantity ?? 0));
    if (values.image) form.append('image', values.image);
    response = await inventoryHttpApi.createAdminItem(form);
    const created = response?.data || {};
    if (values.status === 'inactive' && created.id != null) await inventoryHttpApi.updateAdminItemStatus(String(created.id), 0);
    return normalizeItem(created);
  },
  setStatus: async (id: string, status: InventoryItem['status']) => inventoryHttpApi.updateAdminItemStatus(id, status === 'active' ? 1 : 0),
  catalog: async (params: ListParams = {}) => {
    const response = await inventoryHttpApi.listCreatorItems();
    let rows = asRows(response?.data).map(normalizeItem).filter(item => item.status === 'active');
    if (params.search) {
      const query = params.search.toLowerCase();
      rows = rows.filter(item => `${item.name} ${item.description || ''}`.toLowerCase().includes(query));
    }
    return listResult(rows, params);
  },
  shoots: async () => {
    const response = await inventoryHttpApi.listAssignedShoots();
    return asRows(response?.data).map(row => ({
      id: stringValue(row.id),
      name: stringValue(row.project_name ?? row.name),
      date: stringValue(row.event_date ?? row.date) || undefined,
    }));
  },
  ownRequests: async (params: ListParams = {}) => listResult(await getGroupedRequests('creator'), params),
  ownRequest: async (id: string) => {
    const rows = await getGroupedRequests('creator');
    const request = rows.find(row => row.id === id);
    if (!request) throw new Error('Inventory request not found');
    return request;
  },
  submit: async (payload: RequestPayload, id?: string) => {
    if (id) throw new Error('Editing a submitted request is not supported by the backend.');
    const result = await inventoryHttpApi.submitCreatorRequest({
      purpose: payload.request_type,
      shoot_id: payload.shoot_id ? Number(payload.shoot_id) : null,
      items: payload.items.map(item => ({ inventory_item_id: Number(item.inventory_item_id), quantity: item.quantity })),
    });
    invalidateRequestCache();
    return result;
  },
};
