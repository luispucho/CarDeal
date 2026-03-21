import apiClient from './client';
import type { InboxThread, Message, SendMessageRequest } from '../types';

export const messagesApi = {
  getInbox: () =>
    apiClient.get<InboxThread[]>('/messages').then((r) => r.data),

  getThread: (otherUserId: string, carId?: number) =>
    apiClient
      .get<Message[]>(`/messages/thread`, {
        params: { otherUserId, carId },
      })
      .then((r) => r.data),

  send: (data: SendMessageRequest) =>
    apiClient.post<Message>('/messages', data).then((r) => r.data),

  markAsRead: (id: number) =>
    apiClient.put(`/messages/${id}/read`).then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<number>('/messages/unread-count').then((r) => r.data),
};
