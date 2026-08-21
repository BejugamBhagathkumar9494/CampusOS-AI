import { supabase } from './supabaseClient.js';

export const notificationService = {
  async getNotifications(recipientId) {
    if (!recipientId) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  },

  async markAsRead(notificationId) {
    if (!notificationId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) console.warn('Error marking notification as read:', error);
  },

  async createNotification(payload) {
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

  async notifyUser(recipientProfileId, title, message, type = 'info') {
    if (!recipientProfileId) return;
    return this.createNotification({
      recipient_id: recipientProfileId,
      title,
      message,
      type,
      is_read: false,
    });
  },

  async notifyRole(role, title, message, type = 'info') {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', role);

      if (!profiles || profiles.length === 0) return;

      const records = profiles.map((p) => ({
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

  async notifyAllStudents(title, message, type = 'info') {
    return this.notifyRole('student', title, message, type);
  }
};
