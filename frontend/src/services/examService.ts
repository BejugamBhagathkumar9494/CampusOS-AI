import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export const examService = {
  async getExams() {
    const { data, error } = await supabase
      .from('examinations')
      .select('*, courses(code, title)')
      .order('exam_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createExam(payload: any) {
    let courseId = payload.course_id;
    if (!courseId) {
      const { data: firstCourse } = await supabase.from('courses').select('id').limit(1).single();
      courseId = firstCourse?.id;
    }

    const minimalRecord = {
      course_id: courseId,
      exam_name: payload.exam_name || 'End-Semester Examination',
      exam_date: payload.exam_date || new Date(Date.now() + 86400000 * 5).toISOString(),
      location: payload.location || 'Hall A - Main Auditorium'
    };

    let { data, error } = await supabase
      .from('examinations')
      .insert([minimalRecord])
      .select('*, courses(code, title)')
      .single();

    if (error) {
      console.error('Exam schedule creation error:', error);
      throw new Error(error.message || 'Failed to schedule exam in database');
    }

    if (data?.id) {
      try {
        await supabase
          .from('examinations')
          .update({
            total_marks: payload.total_marks ? Number(payload.total_marks) : 100,
            semester: payload.semester ? Number(payload.semester) : 5
          })
          .eq('id', data.id);
      } catch (optErr) {
        // Silently skip if optional columns do not exist
      }
    }

    try {
      const courseLabel = data?.courses?.code || 'Subject';
      await notificationService.notifyAllStudents(
        'Exam Schedule Published',
        `New exam scheduled for ${courseLabel} (${data.exam_name}) on ${new Date(data.exam_date).toLocaleDateString()} at ${data.location}.`,
        'warning'
      );
    } catch (nErr) {
      console.warn('Exam notification error:', nErr);
    }

    return data;
  },

  async deleteExam(examId: string | number) {
    const { error } = await supabase
      .from('examinations')
      .delete()
      .eq('id', examId);

    if (error) throw error;
    return true;
  }
};
