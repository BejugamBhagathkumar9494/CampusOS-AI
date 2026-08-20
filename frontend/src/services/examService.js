import { supabase } from './supabaseClient.js';

export const examService = {
  async getExams() {
    const { data, error } = await supabase
      .from('examinations')
      .select('*, courses(code, title)')
      .order('exam_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createExam(payload) {
    const { data, error } = await supabase
      .from('examinations')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
