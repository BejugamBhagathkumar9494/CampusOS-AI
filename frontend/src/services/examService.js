import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

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
    let courseId = payload.course_id;
    if (!courseId) {
      const { data: firstCourse } = await supabase.from('courses').select('id').limit(1).single();
      courseId = firstCourse?.id;
    }

    const record = {
      course_id: courseId,
      exam_name: payload.exam_name || 'End-Semester Examination',
      exam_date: payload.exam_date || new Date(Date.now() + 86400000 * 5).toISOString(),
      location: payload.location || 'Hall A - Main Auditorium',
      total_marks: payload.total_marks ? Number(payload.total_marks) : 100,
      semester: payload.semester ? Number(payload.semester) : 5
    };

    const { data, error } = await supabase
      .from('examinations')
      .insert([record])
      .select('*, courses(code, title)')
      .single();

    if (error) throw error;

    // Broadcast notification to all students
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

  async deleteExam(examId) {
    const { error } = await supabase
      .from('examinations')
      .delete()
      .eq('id', examId);

    if (error) throw error;
    return true;
  }
};
