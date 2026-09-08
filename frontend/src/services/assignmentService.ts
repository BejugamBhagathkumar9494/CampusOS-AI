import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { fetchWithAuth } from './api';

export const assignmentService = {
  async getAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(code, title)')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createAssignment(course_id: string | number, title: string, description: string, due_date: string, total_points: number = 100) {
    let finalCourseId = course_id;
    if (!finalCourseId) {
      const { data: firstCourse } = await supabase.from('courses').select('id').limit(1).maybeSingle();
      finalCourseId = firstCourse?.id;
    }

    const payload = { course_id: finalCourseId, title, description, due_date };

    let { data, error } = await supabase
      .from('assignments')
      .insert([payload])
      .select('*, courses(code, title)')
      .maybeSingle();

    if (error) {
      console.warn('Supabase createAssignment error, falling back to local storage:', error);
      const newAssignment = {
        id: `local_assign_${Date.now()}`,
        course_id: finalCourseId,
        title,
        description,
        due_date,
        total_points,
        created_at: new Date().toISOString()
      };
      
      try {
        const existing = JSON.parse(localStorage.getItem('campusos_local_assignments') || '[]');
        existing.push(newAssignment);
        localStorage.setItem('campusos_local_assignments', JSON.stringify(existing));
      } catch (e) {}

      return newAssignment;
    }
    return data;
  },

  async getAssignmentsForFaculty(facultyProfileId: string) {
    try {
      const { data: faculty } = await supabase
        .from('faculty')
        .select('id')
        .eq('profile_id', facultyProfileId)
        .maybeSingle();

      const facultyId = faculty?.id;

      let { data, error } = await supabase
        .from('assignments')
        .select('*, courses!inner(id, code, title, faculty_id)')
        .eq('courses.faculty_id', facultyId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Error fetching faculty assignments via relational join:', e);
    }

    try {
      const { data } = await supabase
        .from('assignments')
        .select('*, courses(id, code, title)')
        .order('created_at', { ascending: false });

      const localList = JSON.parse(localStorage.getItem('campusos_local_assignments') || '[]');
      const combined = [...(data || []), ...localList];
      return combined;
    } catch (e) {
      return [];
    }
  },

  async submitAssignment(assignment_id: string | number, student_id: string | number, file_url?: string) {
    const payload = {
      assignment_id,
      student_id,
      file_url: file_url || 'https://campusos.edu/submissions/demo-doc.pdf',
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    };

    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getSubmissionsForAssignment(assignment_id: string | number) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*, students(id, roll_number, profiles(full_name, email))')
      .eq('assignment_id', assignment_id);

    if (error) throw error;
    return data || [];
  },

  async getMySubmissions(studentProfileId: string) {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', studentProfileId)
        .maybeSingle();

      const studentId = student?.id || studentProfileId;

      const { data } = await supabase
        .from('assignment_submissions')
        .select('*, assignments(title, due_date, courses(code, title))')
        .eq('student_id', studentId);

      if (data && data.length > 0) return data;
    } catch (e) {}

    try {
      const apiSubs = await fetchWithAuth('/academic-ext/assignments/my-submissions');
      if (apiSubs) return apiSubs;
    } catch (e) {}

    return [];
  },

  async gradeSubmission(submission_id: string | number, marks: number, feedback: string, studentProfileId: string | null = null, assignmentTitle: string = 'Assignment') {
    try {
      await fetchWithAuth(`/academic-ext/assignments/submissions/${submission_id}/grade`, {
        method: 'POST',
        body: JSON.stringify({ marks_obtained: Number(marks), feedback })
      });
    } catch (apiErr) {
      console.warn('Backend API grade error:', apiErr);
    }

    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({ marks: Number(marks), feedback, status: 'graded' })
        .eq('id', submission_id)
        .select('*, students(profile_id), assignments(title)')
        .maybeSingle();

      if (!error && data) {
        const targetProfileId = studentProfileId || data.students?.profile_id;
        const title = data.assignments?.title || assignmentTitle;

        if (targetProfileId) {
          await notificationService.notifyUser(
            targetProfileId,
            'Assignment Evaluated',
            `Your submission for "${title}" has been evaluated by faculty. Score: ${marks} marks. Feedback: "${feedback}".`,
            'info'
          );
        }
        return data;
      }
    } catch (e) {
      console.warn('Grade submission Supabase warning:', e);
    }

    return { id: submission_id, marks, feedback, status: 'graded' };
  }
};
