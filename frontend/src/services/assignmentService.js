import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const assignmentService = {
  async getAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(code, title)')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createAssignment(course_id, title, description, due_date, total_points = 100) {
    let finalCourseId = course_id;
    if (!finalCourseId) {
      const { data: firstCourse } = await supabase.from('courses').select('id').limit(1).single();
      finalCourseId = firstCourse?.id;
    }

    const payload = { course_id: finalCourseId, title, description, due_date };

    let { data, error } = await supabase
      .from('assignments')
      .insert([payload])
      .select('*, courses(code, title)')
      .single();

    if (error) {
      console.error('Assignment creation error:', error);
      throw new Error(error.message || 'Failed to post assignment in database');
    }

    if (data?.id && total_points) {
      try {
        await supabase
          .from('assignments')
          .update({ total_points: Number(total_points) })
          .eq('id', data.id);
      } catch (optErr) {
        // Silently skip if total_points column does not exist
      }
    }

    // Send broadcast notification to all students
    try {
      const courseLabel = data?.courses?.code ? ` [${data.courses.code}]` : '';
      await notificationService.notifyAllStudents(
        'New Assignment Posted',
        `New assignment "${title}"${courseLabel} has been published. Due: ${new Date(due_date).toLocaleDateString()}.`,
        'warning'
      );
    } catch (nErr) {
      console.warn('Assignment notification error:', nErr);
    }

    return data;
  },

  async submitAssignment(assignment_id, studentProfileId, file_url) {
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
        file_url: file_url || 'https://university.edu/submissions/file.pdf',
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
      .select('*, assignments(title, course_id), students(roll_number, profile_id, profiles(full_name, email))')
      .order('submitted_at', { ascending: false });

    if (assignment_id) {
      query = query.eq('assignment_id', assignment_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async gradeSubmission(submission_id, marks, feedback) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({ marks: Number(marks), feedback, status: 'graded' })
      .eq('id', submission_id)
      .select('*, students(profile_id), assignments(title)')
      .single();

    if (error) throw error;

    // Notify student
    try {
      const studentProfileId = data?.students?.profile_id;
      const assignTitle = data?.assignments?.title || 'Assignment';
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Assignment Graded',
          `Your submission for "${assignTitle}" has been graded: ${marks} points. Feedback: "${feedback || 'Good work'}"`,
          'success'
        );
      }
    } catch (nErr) {
      console.warn('Grade notification error:', nErr);
    }

    return data;
  }
};
