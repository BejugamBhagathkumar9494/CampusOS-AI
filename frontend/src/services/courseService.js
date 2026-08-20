import { supabase } from './supabaseClient.js';

export const courseService = {
  async getStudentCourses(studentProfileId) {
    const { data: student } = await supabase
      .from('students')
      .select('id, current_semester')
      .eq('profile_id', studentProfileId)
      .single();

    if (!student) {
      const { data: courses } = await supabase.from('courses').select('*').order('code');
      return courses || [];
    }

    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, courses(*)')
      .eq('student_id', student.id);

    let enrolledCourses = [];
    if (enrollments && enrollments.length > 0) {
      enrolledCourses = enrollments.map((e) => e.courses).filter(Boolean);
    }

    let semCourses = [];
    if (student.current_semester) {
      const { data: matched } = await supabase
        .from('courses')
        .select('*')
        .eq('semester', student.current_semester);
      semCourses = matched || [];
    }

    const combinedMap = {};
    [...enrolledCourses, ...semCourses].forEach(c => {
      if (c && c.id) combinedMap[c.id] = c;
    });

    const resultList = Object.values(combinedMap);
    if (resultList.length > 0) return resultList;

    const { data: allCourses } = await supabase.from('courses').select('*').order('code');
    return allCourses || [];
  },

  async getFacultyCourses(facultyProfileId) {
    const { data: faculty } = await supabase
      .from('faculty')
      .select('id, profiles(full_name)')
      .eq('profile_id', facultyProfileId)
      .single();

    if (!faculty) {
      const { data: courses } = await supabase.from('courses').select('*').order('code');
      return courses || [];
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('faculty_id', faculty.id);

    if (courses && courses.length > 0) return courses;

    const { data: allCourses } = await supabase.from('courses').select('*').order('code');
    return allCourses || [];
  },

  async getAllCourses() {
    const { data, error } = await supabase.from('courses').select('*').order('code');
    if (error) throw error;
    return data || [];
  },

  async getFacultyList() {
    const { data, error } = await supabase
      .from('faculty')
      .select('id, employee_id, profiles(id, full_name, email, department)');
    
    if (error || !data) return [];
    return data.map(f => ({
      faculty_id: f.id,
      profile_id: f.profiles?.id,
      full_name: f.profiles?.full_name || 'Faculty Member',
      email: f.profiles?.email || '',
      department: f.profiles?.department || 'Academic'
    }));
  },

  async createAdminCourse(payload) {
    const coursePayload = {
      code: payload.code.toUpperCase(),
      title: payload.title,
      credits: Number(payload.credits) || 4,
      semester: Number(payload.semester) || 1,
      faculty_id: payload.faculty_id || null,
      instructor_name: payload.instructor_name || 'Faculty Member'
    };

    const { data, error } = await supabase
      .from('courses')
      .insert([coursePayload])
      .select()
      .single();

    if (error) throw error;

    const { data: studentsInSem } = await supabase
      .from('students')
      .select('id')
      .eq('current_semester', coursePayload.semester);

    if (studentsInSem && studentsInSem.length > 0) {
      const enrollmentRows = studentsInSem.map(s => ({
        course_id: data.id,
        student_id: s.id
      }));
      await supabase.from('course_enrollments').upsert(enrollmentRows);
    }

    return data;
  },

  async deleteCourse(courseId) {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) throw error;
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
