import { supabase } from './supabaseClient.js';

export const auditLogService = {
  async logAction(actorUserId, action, entity, entityId, metadata) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        actor_user_id: actorUserId,
        action,
        entity,
        entity_id: entityId,
        metadata: metadata || {}
      }])
      .select()
      .single();

    if (error) {
      console.warn('Failed to record audit log entry:', error);
    }
    return data;
  },

  async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
