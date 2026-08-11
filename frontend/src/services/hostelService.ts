import { supabase } from './supabaseClient';
import { Hostel, Room, HostelAllocation, HostelLeaveRequest } from '../types/database';

export const hostelService = {
  async getHostels(): Promise<Hostel[]> {
    const { data, error } = await supabase.from('hostels').select('*');
    if (error) throw error;
    return data || [];
  },

  async getRooms(hostelId?: string): Promise<Room[]> {
    let query = supabase.from('rooms').select('*, hostels(name, block_code)');
    if (hostelId) query = query.eq('hostel_id', hostelId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async allocateRoom(roomId: string, studentProfileId: string, bedNumber: string): Promise<HostelAllocation> {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('hostel_allocations')
      .upsert({ room_id: roomId, student_id: studentId, bed_number: bedNumber })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getLeaveRequests(studentProfileId?: string): Promise<HostelLeaveRequest[]> {
    let query = supabase
      .from('hostel_leave_requests')
      .select('*, students(roll_number, profiles(full_name, email))')
      .order('created_at', { ascending: false });

    if (studentProfileId) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', studentProfileId)
        .single();

      if (student) {
        query = query.eq('student_id', student.id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async applyLeave(studentProfileId: string, payload: {
    reason: string;
    start_date: string;
    end_date: string;
    room_number?: string;
  }): Promise<HostelLeaveRequest> {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('hostel_leave_requests')
      .insert([{
        student_id: studentId,
        reason: payload.reason,
        start_date: payload.start_date,
        end_date: payload.end_date,
        room_number: payload.room_number || '302-B',
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLeaveStatus(requestId: string, status: 'approved' | 'rejected', wardenProfileId: string): Promise<HostelLeaveRequest> {
    const { data, error } = await supabase
      .from('hostel_leave_requests')
      .update({ status, approved_by: wardenProfileId })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
