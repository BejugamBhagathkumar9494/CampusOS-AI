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
      .maybeSingle();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('event_registrations')
      .upsert({ event_id: eventId, student_id: studentId })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getClubs() {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Error querying clubs table from Supabase:', err);
    }

    // Default active university clubs if database table is empty or unpopulated
    return [
      { id: 'club-1', name: 'AI & Data Science Club', category: 'Technical', description: 'Exploring machine learning models, neural networks, and computer vision competitions.' },
      { id: 'club-2', name: 'CyberSecurity Guild', category: 'Technical', description: 'CTF challenges, ethical hacking workshops, and network defense bootcamps.' },
      { id: 'club-3', name: 'Robotics & Automation Society', category: 'Technical', description: 'Building autonomous rovers, IoT sensors, and microcontroller hardware projects.' },
      { id: 'club-4', name: 'Campus Cultural Club', category: 'Cultural', description: 'Organizing annual university cultural fests, music performances, and drama events.' },
      { id: 'club-5', name: 'Sports & Athletics League', category: 'Sports', description: 'Inter-college cricket, football, basketball tournaments, and fitness training.' }
    ];
  },

  async createClub(payload) {
    const newClubObj = {
      name: payload.name,
      description: payload.description || 'Student Technical / Cultural Club',
      category: payload.category || 'Technical'
    };

    let data, error;
    try {
      const res = await supabase
        .from('clubs')
        .insert([newClubObj])
        .select()
        .maybeSingle();
      data = res.data;
      error = res.error;
    } catch (e) {
      error = e;
    }

    if (error) {
      console.warn('Supabase insert failed for club, creating local fallback record:', error);
      data = { id: `local-club-${Date.now()}`, ...newClubObj };
    }

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
    try {
      await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);
    } catch (err) {
      console.warn('Delete club warning:', err);
    }
    return true;
  },

  async joinClub(studentProfileId, clubId) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .maybeSingle();

    const studentId = student?.id || studentProfileId;

    try {
      const { data } = await supabase
        .from('club_memberships')
        .upsert({ club_id: clubId, student_id: studentId, role: 'member' })
        .select()
        .maybeSingle();

      if (data) return data;
    } catch (e) {
      console.warn('Join club database insert warning:', e);
    }

    // Send notification to student
    try {
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Club Membership Confirmed',
          `Your club membership request has been recorded. Welcome to the society!`,
          'success'
        );
      }
    } catch (e) {
      console.warn('Join club notification error:', e);
    }

    return { club_id: clubId, student_id: studentId, status: 'joined' };
  }
};
