import { supabase } from './supabaseClient.js';

export const complaintService = {
  async getComplaints(complainantId) {
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
    complainant_id,
    title,
    description,
    category = 'General',
    priority = 'medium'
  ) {
    const { data, error } = await supabase
      .from('complaints')
      .insert([{ complainant_id, title, description, category, priority, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateComplaintStatus(
    complaintId,
    status,
    assignedTo
  ) {
    const updateData = { status, updated_at: new Date().toISOString() };
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
