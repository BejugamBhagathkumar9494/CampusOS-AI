import { supabase } from './supabaseClient';
import { Announcement } from '../types/database';

export const announcementService = {
  async getAnnouncements(role?: string): Promise<Announcement[]> {
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

  async createAnnouncement(payload: {
    title: string;
    content: string;
    created_by?: string;
    target_role?: string;
    department_id?: string;
    course_id?: string;
  }): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
