import apiClient from "@/lib/apiClient";

export interface ExternalChatUser {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  source?: string;
  subtitle?: string | null;
  profileImage?: string | null;
}

export interface ExternalChatParticipantItem {
  id?: string | number | ExternalChatUser;
  name?: string;
  email?: string;
  decision?: string;
  added_at?: string;
  added_by?: string | number;
  role?: string;
  profileImage?: string | null;
}

export interface ExternalChatRoom {
  id?: string;
  _id?: string;
  chat_id?: string;
  name?: string;
  status?: "active" | "read_only" | "archived" | string;
  order_id?: string | number | { id?: string | number; name?: string };
  last_message?: {
    id?: string;
    message?: string;
    createdAt?: string;
    sent_by?: ExternalChatUser | string | number | null;
  } | null;
  client_id?: ExternalChatUser | string | number | null;
  client_snapshot?: ExternalChatUser | null;
  manager_ids?: ExternalChatParticipantItem[];
  cp_ids?: ExternalChatParticipantItem[];
  pm_id?: ExternalChatUser | string | number | null;
  production_ids?: ExternalChatParticipantItem[];
  unread_counts?: Record<string, number>;
  unread_count?: number;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExternalChatMessage {
  id?: string;
  _id?: string;
  message?: string;
  chat_room_id?: string;
  sent_by?: ExternalChatUser | string | number | null;
  status?: string;
  message_type?: "text" | "image" | "file" | "system" | string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  createdAt?: string;
  updatedAt?: string;
  is_deleted?: boolean;
  is_edited?: boolean;
  system_message?: {
    type?: string;
    actor_name?: string;
    target_names?: string[];
  } | null;
  reply_to?: ExternalChatMessage | string | null;
  reactions?: Array<{
    emoji?: string;
    user_id?: string | number;
    user_name?: string;
    created_at?: string;
  }>;
}

interface RoomListResponse {
  success?: boolean;
  data?: {
    results?: ExternalChatRoom[];
    rooms?: ExternalChatRoom[];
  };
  results?: ExternalChatRoom[];
}

interface RoomResponse {
  success?: boolean;
  data?: ExternalChatRoom | null;
  message?: string;
  created?: boolean;
  id?: string;
  _id?: string;
  chat_id?: string;
  name?: string;
  status?: string;
  order_id?: string | number | { id?: string | number; name?: string };
  external_order_ref?: string;
  client_id?: ExternalChatUser | string | number | null;
  client_snapshot?: ExternalChatUser | null;
  manager_ids?: ExternalChatParticipantItem[];
  cp_ids?: ExternalChatParticipantItem[];
  pm_id?: ExternalChatUser | string | number | null;
  production_ids?: ExternalChatParticipantItem[];
  unread_counts?: Record<string, number>;
  unread_count?: number;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface MessageListResponse {
  success?: boolean;
  data?: {
    results?: ExternalChatMessage[];
    messages?: ExternalChatMessage[];
  };
  results?: ExternalChatMessage[];
}

interface SendMessageResponse {
  success?: boolean;
  data?: ExternalChatMessage | null;
  message?: string;
}

interface MessageResponse {
  success?: boolean;
  data?: ExternalChatMessage | null;
  message?: string;
}

interface ParticipantResponse {
  success?: boolean;
  data?: {
    client?: ExternalChatUser | null;
    cps?: ExternalChatParticipantItem[];
    pm?: ExternalChatUser | null;
    production?: ExternalChatParticipantItem[];
    managers?: ExternalChatParticipantItem[];
  };
  client?: ExternalChatUser | null;
  cps?: ExternalChatParticipantItem[];
  pm?: ExternalChatUser | null;
  production?: ExternalChatParticipantItem[];
  managers?: ExternalChatParticipantItem[];
}

interface DirectoryResponse {
  success?: boolean;
  data?: {
    staff?: ExternalChatUser[];
    clients?: ExternalChatUser[];
    creativePartners?: ExternalChatUser[];
  };
}

export interface ExternalParticipantsPayload {
  client?: ExternalChatUser | null;
  cps?: ExternalChatParticipantItem[];
  pm?: ExternalChatUser | null;
  production?: ExternalChatParticipantItem[];
  managers?: ExternalChatParticipantItem[];
}

export const externalChatApi = {
  extractRoom(response: RoomResponse): ExternalChatRoom | null {
    if (response?.data) return response.data;
    if (response?.id || response?._id || response?.chat_id || response?.name) {
      return response as ExternalChatRoom;
    }
    return null;
  },

  async listRooms(params?: { page?: number; limit?: number; sortBy?: string; search?: string }) {
    const response = await apiClient.get<RoomListResponse>("external-chat/rooms", params);
    return response.data?.results || response.data?.rooms || response.results || [];
  },

  async getRoomByBooking(bookingId: string | number) {
    const response = await apiClient.get<RoomResponse>(`external-chat/room/${bookingId}`);
    return this.extractRoom(response);
  },

  async createRoom(bookingId: string | number, selectedCpIds: Array<string | number> = []) {
    const response = await apiClient.post<RoomResponse>("external-chat/room", {
      bookingId: String(bookingId),
      selectedCpIds: selectedCpIds.map((id) => String(id)),
    });
    return this.extractRoom(response);
  },

  async createConversation(payload: {
    roomType: "project" | "direct";
    bookingId?: string | number | null;
    roomName?: string;
    selectedCpIds?: Array<string | number>;
    participants?: ExternalChatUser[];
    client?: ExternalChatUser | null;
    externalRef?: string;
  }) {
    const response = await apiClient.post<RoomResponse>("external-chat/room", payload);
    return this.extractRoom(response);
  },

  async getMessages(roomId: string, params?: { page?: number; limit?: number; sortBy?: string }) {
    const response = await apiClient.get<MessageListResponse>(`external-chat/messages/${roomId}`, params);
    return response.data?.results || response.data?.messages || response.results || [];
  },

  async getParticipants(roomId: string) {
    const response = await apiClient.get<ParticipantResponse>(`external-chat/participants/${roomId}`);
    if (
      response &&
      ("client" in response || "cps" in response || "pm" in response || "production" in response || "managers" in response)
    ) {
      return {
        client: response.client || null,
        cps: response.cps || [],
        pm: response.pm || null,
        production: response.production || [],
        managers: response.managers || [],
      };
    }

    return response.data || {};
  },

  async getDirectory(search?: string) {
    const response = await apiClient.get<DirectoryResponse>("external-chat/directory", search ? { search } : undefined);
    return response.data || {};
  },

  async addParticipants(roomId: string, participants: ExternalChatUser[], role?: string) {
    const response = await apiClient.post<SendMessageResponse>(`external-chat/room/${roomId}/participants`, {
      role,
      participants,
    });
    return response.data || null;
  },

  async removeParticipant(roomId: string, userId: string, role: string) {
    const response = await apiClient.getInstance().delete(`external-chat/room/${roomId}/participants/${userId}`, {
      data: { role },
    });
    return response.data?.data || response.data || null;
  },

  async sendMessage(roomId: string, message: string, options?: { sender?: ExternalChatUser | null; replyTo?: string | null }) {
    const response = await apiClient.post<SendMessageResponse>(`external-chat/messages/${roomId}`, {
      message,
      sender: options?.sender,
      replyTo: options?.replyTo,
    });
    return response.data || null;
  },

  async editMessage(messageId: string, content: string, sender?: ExternalChatUser | null) {
    const response = await apiClient.post<MessageResponse>(`external-chat/messages/${messageId}/edit`, {
      content,
      sender,
    });
    return response.data || null;
  },

  async deleteMessage(messageId: string, sender?: ExternalChatUser | null) {
    const response = await apiClient.post<MessageResponse>(`external-chat/messages/${messageId}/delete`, {
      sender,
    });
    return response.data || null;
  },

  async reactToMessage(messageId: string, emoji: string, sender?: ExternalChatUser | null) {
    const response = await apiClient.post<MessageResponse>(`external-chat/messages/${messageId}/reaction`, {
      emoji,
      sender,
    });
    return response.data || null;
  },
};
