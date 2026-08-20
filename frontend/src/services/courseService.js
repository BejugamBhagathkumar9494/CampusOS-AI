import { supabase } from './supabaseClient.js';

export const courseService = {
  async getStudentCourses(studentProfileId) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    if (!student) {
      const { data: courses } = await supabase.from('courses').select('*');
      return courses || [];
    }

    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, courses(*)')
      .eq('student_id', student.id);

    if (enrollments && enrollments.length > 0) {
      return enrollments.map((e) => e.courses).filter(Boolean);
    }

    const { data: allCourses } = await supabase.from('courses').select('*');
    return allCourses || [];
  },

  async getFacultyCourses(facultyProfileId) {
    const { data: faculty } = await supabase
      .from('faculty')
      .select('id')
      .eq('profile_id', facultyProfileId)
      .single();

    if (!faculty) {
      const { data: courses } = await supabase.from('courses').select('*');
      return courses || [];
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('faculty_id', faculty.id);

    if (courses && courses.length > 0) return courses;

    const { data: allCourses } = await supabase.from('courses').select('*');
    return allCourses || [];
  },

  async getAllCourses() {
    const { data, error } = await supabase.from('courses').select('*').order('code');
    if (error) throw error;
    return data || [];
  },

  async enrollCourse(studentProfileId, courseId) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    if (!student) throw new Error('Student profile record not found');

    const { data, error } = await supabase
      .from('course_enrollments')
      .upsert({ course_id: courseId, student_id: student.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
