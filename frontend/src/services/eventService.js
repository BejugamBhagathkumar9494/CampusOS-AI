import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const eventService = {
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createEvent(payload) {
    const { data, error } = await supabase
      .from('events')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async registerEvent(studentProfileId, eventId) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('event_registrations')
      .upsert({ event_id: eventId, student_id: studentId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getClubs() {
    const { data, error } = await supabase.from('clubs').select('*, club_memberships(count)').order('name');
    if (error) throw error;
    return data || [];
  },

  async createClub(payload) {
    const { data, error } = await supabase
      .from('clubs')
      .insert([{
        name: payload.name,
        description: payload.description || 'Student Technical / Cultural Club',
        category: payload.category || 'Technical'
      }])
      .select()
      .single();

    if (error) throw error;

    // Send broadcast notification to students
    try {
      await notificationService.notifyAllStudents(
        'New Club Formed',
        `A new student society "${data.name}" (${data.category}) has been established. Join now!`,
        'success'
      );
    } catch (e) {
      console.warn('Club notification error:', e);
    }

    return data;
  },

  async deleteClub(clubId) {
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);

    if (error) throw error;
    return true;
  },

  async joinClub(studentProfileId, clubId) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('club_memberships')
      .upsert({ club_id: clubId, student_id: studentId, role: 'member' })
      .select('*, clubs(name)')
      .single();

    if (error) throw error;

    // Send notification to student
    try {
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Club Membership Confirmed',
          `You have joined "${data?.clubs?.name || 'Club'}". Welcome to the society!`,
          'success'
        );
      }
    } catch (e) {
      console.warn('Join club notification error:', e);
    }

    return data;
  }
};
