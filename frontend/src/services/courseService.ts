import { supabase } from './supabaseClient';

const isUuid = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const courseService = {
  async getStudentCourses(studentProfileId: string) {
    if (!studentProfileId || !isUuid(studentProfileId)) {
      return this.getAllCourses();
    }

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id, current_semester')
        .eq('profile_id', studentProfileId)
        .maybeSingle();

      if (!student) {
        return this.getAllCourses();
      }

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id, courses(*)')
        .eq('student_id', student.id);

      let enrolledCourses: any[] = [];
      if (enrollments && enrollments.length > 0) {
        enrolledCourses = enrollments.map((e: any) => e.courses).filter(Boolean);
      }

      let semCourses: any[] = [];
      if (student.current_semester) {
        const { data: matched } = await supabase
          .from('courses')
          .select('*')
          .eq('semester', student.current_semester);
        semCourses = matched || [];
      }

      const combinedMap: Record<string, any> = {};
      [...enrolledCourses, ...semCourses].forEach(c => {
        if (c && c.id) combinedMap[c.id] = c;
      });

      const resultList = Object.values(combinedMap);
      if (resultList.length > 0) return resultList;
    } catch (e) {}

    return this.getAllCourses();
  },

  async getFacultyCourses(facultyProfileId: string) {
    if (!facultyProfileId || !isUuid(facultyProfileId)) {
      return this.getAllCourses();
    }

    try {
      const { data: faculty } = await supabase
        .from('faculty')
        .select('id, profiles(full_name)')
        .eq('profile_id', facultyProfileId)
        .maybeSingle();

      if (!faculty) {
        return this.getAllCourses();
      }

      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('faculty_id', faculty.id);

      if (courses && courses.length > 0) return courses;
    } catch (e) {}

    return this.getAllCourses();
  },

  async getAllCourses() {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('code');
      if (!error && data && data.length > 0) return data;
    } catch (e) {}

    return [
      { id: 1, code: 'CS101', title: 'Data Structures & Algorithms', semester: 5, credits: 4, department: 'Computer Science' },
      { id: 2, code: 'CS102', title: 'Database Management Systems', semester: 5, credits: 4, department: 'Computer Science' },
      { id: 3, code: 'CS103', title: 'Operating Systems & Architecture', semester: 5, credits: 3, department: 'Computer Science' },
      { id: 4, code: 'CS104', title: 'Machine Learning & Artificial Intelligence', semester: 5, credits: 4, department: 'Artificial Intelligence' }
    ];
  },

  async getFacultyList() {
    const { data: facultyProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['faculty', 'admin', 'super_admin']);

    const { data: existingFaculty } = await supabase
      .from('faculty')
      .select('id, profile_id, employee_id');

    const facultyMap: Record<string, any> = {};
    (existingFaculty || []).forEach((f: any) => {
      facultyMap[f.profile_id] = f;
    });

    const resultList: any[] = [];

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
            .maybeSingle();
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
        return rawFac.map((f: any) => ({
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

  async createAdminCourse(payload: any) {
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
      .maybeSingle();


    if (error) {
      console.error('Core course creation error:', error);
      throw new Error(error.message || 'Failed to create course in database');
    }

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
          const enrollmentRows = studentsInSem.map((s: any) => ({
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

  async deleteCourse(courseId: string | number) {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) throw error;
  },

  async enrollCourse(studentProfileId: string, courseId: string | number) {
    if (!studentProfileId) throw new Error('Student profile ID is required');

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .maybeSingle();


    if (!student) throw new Error('Student profile record not found');

    const { data, error } = await supabase
      .from('course_enrollments')
      .upsert({ course_id: courseId, student_id: student.id })
      .select()
      .maybeSingle();


    if (error) throw error;
    return data;
  }
};
