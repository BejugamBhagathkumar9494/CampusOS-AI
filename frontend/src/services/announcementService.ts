import { supabase } from './supabaseClient';

export const announcementService = {
  async getAnnouncements(role?: string) {
    let query = supabase
      .from('announcements')
      .select('*, author_profile:created_by(full_name, role)')
      .order('created_at', { ascending: false });

    if (role && role !== 'admin' && role !== 'super_admin') {
      query = query.or(`target_role.eq.all,target_role.eq.${role}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createAnnouncement(payload: any) {
    const { data, error } = await supabase
      .from('announcements')
      .insert([payload])
      .select()
      .maybeSingle();


    if (error) throw error;
    return data;
  }
};
