import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const hostelService = {
  async getHostels() {
    const { data, error } = await supabase.from('hostels').select('*');
    if (error) throw error;
    return data || [];
  },

  async getRooms(hostelId) {
    let query = supabase.from('rooms').select('*, hostels(name, block_code)');
    if (hostelId) query = query.eq('hostel_id', hostelId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async allocateRoom(roomId, studentProfileId, bedNumber) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('hostel_allocations')
      .upsert({ room_id: roomId, student_id: studentId, bed_number: bedNumber })
      .select('*, rooms(*, hostels(*))')
      .single();

    if (error) throw error;

    // Send notification to student
    try {
      if (studentProfileId) {
        const roomNo = data?.rooms?.room_number || 'Room';
        const hostelName = data?.rooms?.hostels?.name || 'Hostel Block';
        await notificationService.notifyUser(
          studentProfileId,
          'Hostel Room Allocated',
          `You have been allocated ${roomNo} (Bed ${bedNumber}) in ${hostelName}.`,
          'success'
        );
      }
    } catch (nErr) {
      console.warn('Room allocation notification error:', nErr);
    }

    return data;
  },

  async getLeaveRequests(studentProfileId) {
    let query = supabase
      .from('hostel_leave_requests')
      .select('*, students(roll_number, profile_id, profiles(full_name, email))')
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

  async applyLeave(studentProfileId, payload) {
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

    // Send notification to Hostel Wardens
    try {
      await notificationService.notifyRole(
        'hostel_warden',
        'New Hostel Leave Request',
        `A student has requested leave from ${payload.start_date} to ${payload.end_date}. Reason: "${payload.reason}".`,
        'warning'
      );
    } catch (nErr) {
      console.warn('Leave request notification error:', nErr);
    }

    return data;
  },

  async updateLeaveStatus(requestId, status, wardenProfileId) {
    const { data, error } = await supabase
      .from('hostel_leave_requests')
      .update({ status, approved_by: wardenProfileId })
      .eq('id', requestId)
      .select('*, students(profile_id)')
      .single();

    if (error) throw error;

    // Send notification to student
    try {
      const studentProfileId = data?.students?.profile_id;
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Hostel Leave Request Status',
          `Your hostel leave request has been ${status.toUpperCase()}.`,
          status === 'approved' ? 'success' : 'info'
        );
      }
    } catch (nErr) {
      console.warn('Leave status notification error:', nErr);
    }

    return data;
  },

  async createHostelNotice(title, content, wardenProfileId) {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        title: title || 'Hostel Announcement',
        content: content || 'Important notice regarding hostel timings.',
        created_by: wardenProfileId,
        target_role: 'student'
      }])
      .select()
      .single();

    if (error) throw error;

    // Broadcast to students
    try {
      await notificationService.notifyAllStudents(
        `Hostel Notice: ${title}`,
        content,
        'info'
      );
    } catch (nErr) {
      console.warn('Hostel notice notification error:', nErr);
    }

    return data;
  },

  async getHostelNotices() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
