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
    // 1. Fetch profiles where role = 'faculty', 'admin', or 'super_admin'
    const { data: facultyProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['faculty', 'admin', 'super_admin']);

    // 2. Fetch existing faculty records
    const { data: existingFaculty } = await supabase
      .from('faculty')
      .select('id, profile_id, employee_id');

    const facultyMap = {};
    (existingFaculty || []).forEach(f => {
      facultyMap[f.profile_id] = f;
    });

    const resultList = [];

    for (const prof of facultyProfiles || []) {
      let facRecord = facultyMap[prof.id];
      if (!facRecord && prof.role === 'faculty') {
        try {
          const { data: newFac } = await supabase
            .from('faculty')
            .insert([{
              profile_id: prof.id,
              employee_id: prof.institution_id || `FAC-${prof.id.slice(0, 6).toUpperCase()}`
            }])
            .select()
            .single();
          if (newFac) facRecord = newFac;
        } catch (e) {
          console.warn('Auto-create faculty row warning:', e);
        }
      }

      resultList.push({
        faculty_id: facRecord?.id || prof.id,
        profile_id: prof.id,
        full_name: prof.full_name || prof.email || 'Faculty Member',
        email: prof.email || '',
        department: prof.department || 'Computer Science & Engineering'
      });
    }

    if (resultList.length === 0) {
      const { data: rawFac } = await supabase
        .from('faculty')
        .select('id, employee_id, profiles(id, full_name, email, department)');
      if (rawFac && rawFac.length > 0) {
        return rawFac.map(f => ({
          faculty_id: f.id,
          profile_id: f.profiles?.id,
          full_name: f.profiles?.full_name || 'Faculty Member',
          email: f.profiles?.email || '',
          department: f.profiles?.department || 'Academic'
        }));
      }
    }

    return resultList;
  },

  async createAdminCourse(payload) {
    const minimalPayload = {
      code: payload.code.toUpperCase(),
      title: payload.title,
      credits: Number(payload.credits) || 4,
      faculty_id: payload.faculty_id || null
    };

    let { data, error } = await supabase
      .from('courses')
      .insert([minimalPayload])
      .select()
      .single();

    if (error) {
      console.error('Core course creation error:', error);
      throw new Error(error.message || 'Failed to create course in database');
    }

    // Try setting optional fields if columns exist in database schema
    if (data?.id) {
      try {
        await supabase
          .from('courses')
          .update({
            semester: Number(payload.semester) || 1,
            instructor_name: payload.instructor_name || 'Faculty Member'
          })
          .eq('id', data.id);
      } catch (optErr) {
        // Silently skip if optional columns do not exist
      }
    }

    if (payload.semester && data?.id) {
      try {
        const { data: studentsInSem } = await supabase
          .from('students')
          .select('id')
          .eq('current_semester', Number(payload.semester));

        if (studentsInSem && studentsInSem.length > 0) {
          const enrollmentRows = studentsInSem.map(s => ({
            course_id: data.id,
            student_id: s.id
          }));
          await supabase.from('course_enrollments').upsert(enrollmentRows);
        }
      } catch (semErr) {
        console.warn('Auto course enrollment warning:', semErr);
      }
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
