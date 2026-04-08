import apiClient from "@/lib/apiClient";

export interface OrderParticipantUser {
  _id?: string;
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  profile_picture?: string | null;
}

export interface OrderCpAssignment {
  id?: OrderParticipantUser | string | number;
  decision?: string;
}

export interface OrderItem {
  _id?: string;
  id?: string | number;
  order_name?: string;
  shoot_id?: string | number;
  order_status?: string;
  client_id?: OrderParticipantUser | string | number | null;
  cp_ids?: OrderCpAssignment[];
}

interface OrderListResponse {
  results?: OrderItem[];
  totalResults?: number;
  totalPages?: number;
}

const normalizeOrder = (order: OrderItem | null | undefined) => {
  if (!order) return null;
  return {
    ...order,
    id: order.id || order._id || null,
  };
};

export const ordersApi = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get<OrderListResponse>("orders", params);
    return (response?.results || []).map((item) => normalizeOrder(item)).filter(Boolean);
  },

  async getById(orderId: string | number) {
    const response = await apiClient.get<OrderItem>(`orders/${orderId}`, {
      populate: "cp_ids",
    });
    return normalizeOrder(response);
  },
};

export default ordersApi;
