import { supabase } from './supabaseClient';
import { EventItem, Club, EventRegistration, ClubMembership } from '../types/database';

export const eventService = {
  async getEvents(): Promise<EventItem[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createEvent(payload: {
    title: string;
    description?: string;
    event_date: string;
    location?: string;
    organizer_id?: string;
  }): Promise<EventItem> {
    const { data, error } = await supabase
      .from('events')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async registerEvent(studentProfileId: string, eventId: string): Promise<EventRegistration> {
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

  async getClubs(): Promise<Club[]> {
    const { data, error } = await supabase.from('clubs').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async joinClub(studentProfileId: string, clubId: string): Promise<ClubMembership> {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('club_memberships')
      .upsert({ club_id: clubId, student_id: studentId, role: 'member' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
