import { supabase } from './supabaseClient';
import { Assignment, AssignmentSubmission } from '../types/database';

export const assignmentService = {
  async getAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(code, title)')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createAssignment(
    course_id: string,
    title: string,
    description: string,
    due_date: string,
    total_points: number = 100
  ): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .insert([{ course_id, title, description, due_date, total_points }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async submitAssignment(
    assignment_id: string,
    studentProfileId: string,
    file_url: string
  ): Promise<AssignmentSubmission> {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert({
        assignment_id,
        student_id: studentId,
        file_url,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissions(assignment_id?: string): Promise<AssignmentSubmission[]> {
    let query = supabase
      .from('assignment_submissions')
      .select('*, assignments(title, course_id), students(roll_number, profiles(full_name, email))')
      .order('submitted_at', { ascending: false });

    if (assignment_id) {
      query = query.eq('assignment_id', assignment_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async gradeSubmission(
    submission_id: string,
    marks: number,
    feedback: string
  ): Promise<AssignmentSubmission> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({ marks, feedback, status: 'graded' })
      .eq('id', submission_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
