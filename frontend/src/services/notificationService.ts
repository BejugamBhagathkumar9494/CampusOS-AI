import { supabase } from './supabaseClient';
import { fetchWithAuth } from './api';

export interface NotificationItem {
  id: string | number;
  recipient_id: string;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
}

const isUuid = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const notificationService = {
  async getNotifications(recipientId?: string): Promise<NotificationItem[]> {
    if (recipientId && isUuid(recipientId)) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', recipientId)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (e) {}
    }

    try {
      const backendNotes = await fetchWithAuth('/notifications');
      if (Array.isArray(backendNotes) && backendNotes.length > 0) {
        return backendNotes.map((n: any) => ({
          id: n.id,
          recipient_id: String(n.user_id || recipientId || '1'),
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          is_read: !!n.is_read,
          created_at: n.created_at || new Date().toISOString()
        }));
      }
    } catch (apiErr) {}

    return [
      {
        id: 1,
        recipient_id: recipientId || '1',
        title: 'Welcome to CampusOS AI',
        message: 'Your unified university operating system is ready with AI copilot and course intelligence.',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      }
    ];
  },

  async markAsRead(notificationId?: string | number): Promise<void> {
    if (!notificationId) return;
    if (typeof notificationId === 'string' && isUuid(notificationId)) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      } catch (e) {}
    }

    try {
      await fetchWithAuth(`/notifications/${notificationId}/read`, { method: 'PUT' });
    } catch (e) {}
  },

  async createNotification(payload: Partial<NotificationItem>): Promise<NotificationItem | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select();

    if (error) {
      console.warn('Error creating notification:', error);
      return null;
    }
    return data?.[0] || null;
  },

  async notifyUser(recipientProfileId: string, title: string, message: string, type: string = 'info') {
    if (!recipientProfileId) return;
    return this.createNotification({
      recipient_id: recipientProfileId,
      title,
      message,
      type,
      is_read: false,
    });
  },

  async notifyRole(role: string, title: string, message: string, type: string = 'info') {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', role);

      if (!profiles || profiles.length === 0) return;

      const records = profiles.map((p: any) => ({
        recipient_id: p.id,
        title,
        message,
        type,
        is_read: false,
      }));

      await supabase.from('notifications').insert(records);
    } catch (err) {
      console.warn('Error broadcasting notification to role:', role, err);
    }
  },

  async notifyAllStudents(title: string, message: string, type: string = 'info') {
    return this.notifyRole('student', title, message, type);
  }
};
