import { supabase } from './supabaseClient';
import { Examination } from '../types/database';

export const examService = {
  async getExams(): Promise<Examination[]> {
    const { data, error } = await supabase
      .from('examinations')
      .select('*, courses(code, title)')
      .order('exam_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createExam(payload: {
    course_id: string;
    exam_name: string;
    exam_date: string;
    location?: string;
    total_marks?: number;
    semester?: number;
  }): Promise<Examination> {
    const { data, error } = await supabase
      .from('examinations')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
