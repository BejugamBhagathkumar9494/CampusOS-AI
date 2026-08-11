import { supabase } from './supabaseClient';
import { Complaint } from '../types/database';

export const complaintService = {
  async getComplaints(complainantId?: string): Promise<Complaint[]> {
    let query = supabase
      .from('complaints')
      .select('*, complainant:complainant_id(full_name, email, role)')
      .order('created_at', { ascending: false });

    if (complainantId) {
      query = query.eq('complainant_id', complainantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async fileComplaint(
    complainant_id: string,
    title: string,
    description: string,
    category: string = 'General',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<Complaint> {
    const { data, error } = await supabase
      .from('complaints')
      .insert([{ complainant_id, title, description, category, priority, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateComplaintStatus(
    complaintId: string,
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected',
    assignedTo?: string
  ): Promise<Complaint> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (assignedTo) updateData.assigned_to = assignedTo;

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
