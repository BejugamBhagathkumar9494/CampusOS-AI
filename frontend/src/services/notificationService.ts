import { supabase } from './supabaseClient';
import { Notification } from '../types/database';

export const notificationService = {
  async getNotifications(recipientId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async createNotification(payload: {
    recipient_id: string;
    title: string;
    message: string;
    type?: string;
  }): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
