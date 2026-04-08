import apiClient from "@/lib/apiClient";

export interface MeetingParticipantRef {
  id?: string | number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  profile_picture?: string | null;
}

export interface MeetingParticipantResponse {
  user_id?: string | number | { _id?: string | number; id?: string | number } | null;
  user_email?: string | null;
  participant_ids?: Array<string | number>;
  response?: "accepted" | "declined" | "pending";
  responded_at?: string;
}

export interface MeetingOrderRef {
  id?: string | number;
  name?: string | null;
}

export interface MeetingItem {
  id?: string | number;
  meeting_status?: string;
  meeting_date_time?: string;
  meeting_end_time?: string;
  meeting_type?: string;
  meeting_title?: string;
  description?: string;
  meetLink?: string;
  duration?: number;
  order?: MeetingOrderRef | null;
  cps?: MeetingParticipantRef[];
  client?: MeetingParticipantRef | null;
  admin?: MeetingParticipantRef | null;
  participants?: MeetingParticipantRef[];
  created_by?: MeetingParticipantRef | null;
  participant_responses?: MeetingParticipantResponse[];
  change_request?: {
    requested_by?: string;
    request_type?: string;
    request_status?: string;
    request_date_time?: string;
  } | null;
}

export interface MeetingsListResponse {
  results: MeetingItem[];
  page?: number;
  limit?: number;
  totalPages?: number;
  totalResults?: number;
}

export interface CreateMeetingPayload {
  order_id: string | number;
  meeting_date_time: string;
  meeting_end_time?: string;
  meeting_status?: string;
  meeting_type?: "pre_production" | "post_production";
  meeting_title?: string;
  description?: string;
  meetLink?: string;
  client_id?: string | number;
  cp_ids?: Array<string | number>;
  admin_id?: string | number;
  created_by_id?: string | number;
  participants?: Array<string | number>;
  send_notification?: boolean;
}

export interface CreateEventPayload {
  userId?: string | number;
  summary: string;
  location?: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  orderId: string | number;
}

export interface CreateEventResponse {
  meetLink?: string;
  authUrl?: string;
  error?: string;
}

export interface MeetingParticipantsPayload {
  role: "cp" | "manager";
  user_ids: Array<string | number>;
}

export interface MeetingResponsePayload {
  response: "accepted" | "declined";
  notificationId?: string | number;
}

export interface MeetingChangeRequestPayload {
  requested_by: "client" | "cp" | "admin";
  requested_time: string;
}

const extractMeeting = (response: MeetingItem | { data?: MeetingItem | null } | null | undefined) => {
  if (!response) return null;
  if ("data" in response && response.data) return response.data;
  return response as MeetingItem;
};

export const meetingsApi = {
  async listAll(params?: Record<string, unknown>) {
    return apiClient.get<MeetingsListResponse>("external-meetings", params);
  },

  async listByUser(userId: string | number, params?: Record<string, unknown>) {
    return apiClient.get<MeetingsListResponse>(`external-meetings/user/${userId}`, params);
  },

  async getByOrderId(orderId: string | number, params?: Record<string, unknown>) {
    return apiClient.get<MeetingsListResponse>(`external-meetings/order/${orderId}`, params);
  },

  async createMeeting(payload: CreateMeetingPayload) {
    const response = await apiClient.post<MeetingItem>("external-meetings", payload);
    return extractMeeting(response);
  },

  async createEvent(payload: CreateEventPayload) {
    return apiClient.post<CreateEventResponse>("external-meetings/create-event", payload);
  },

  async getById(meetingId: string | number) {
    const response = await apiClient.get<MeetingItem>(`external-meetings/${meetingId}`);
    return extractMeeting(response);
  },

  async updateMeeting(meetingId: string | number, payload: Partial<CreateMeetingPayload>) {
    const response = await apiClient.patch<MeetingItem>(`external-meetings/${meetingId}`, payload);
    return extractMeeting(response);
  },

  async deleteMeeting(meetingId: string | number) {
    return apiClient.delete(`external-meetings/${meetingId}`);
  },

  async placeChangeRequest(meetingId: string | number, payload: MeetingChangeRequestPayload) {
    const response = await apiClient.post<MeetingItem>(`external-meetings/schedule/${meetingId}`, payload);
    return extractMeeting(response);
  },

  async updateChangeRequestStatus(meetingId: string | number, status: "approved" | "rejected") {
    const response = await apiClient.patch<MeetingItem>(`external-meetings/schedule/${meetingId}/${status}`);
    return extractMeeting(response);
  },

  async addParticipants(meetingId: string | number, payload: MeetingParticipantsPayload) {
    const response = await apiClient.post<MeetingItem>(`external-meetings/${meetingId}/participants`, payload);
    return extractMeeting(response);
  },

  async removeParticipant(
    meetingId: string | number,
    userId: string | number,
    role: "cp" | "admin" | "participant" | "client"
  ) {
    const response = await apiClient.getInstance().delete<MeetingItem>(
      `external-meetings/${meetingId}/participants/${userId}`,
      {
        data: { role },
      }
    );
    return extractMeeting(response.data);
  },

  async respondToInvitation(meetingId: string | number, payload: MeetingResponsePayload) {
    const response = await apiClient.patch<MeetingItem>(`external-meetings/${meetingId}/respond`, payload);
    return extractMeeting(response);
  },
};

export default meetingsApi;
