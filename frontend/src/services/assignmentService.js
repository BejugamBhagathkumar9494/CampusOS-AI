import { supabase } from './supabaseClient.js';

export const assignmentService = {
  async getAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(code, title)')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createAssignment(
    course_id,
    title,
    description,
    due_date,
    total_points = 100
  ) {
    const { data, error } = await supabase
      .from('assignments')
      .insert([{ course_id, title, description, due_date, total_points }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async submitAssignment(
    assignment_id,
    studentProfileId,
    file_url
  ) {
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

  async getSubmissions(assignment_id) {
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
    submission_id,
    marks,
    feedback
  ) {
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
