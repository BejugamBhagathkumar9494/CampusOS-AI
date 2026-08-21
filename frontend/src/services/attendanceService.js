import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const attendanceService = {
  async getStudentAttendance(studentProfileId) {
    const { data: student } = await supabase
      .from('students')
      .select('id, current_semester')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id;

    if (!studentId) {
      return {
        overall_rate: 0,
        total_classes_all: 0,
        total_attended_all: 0,
        subjects: [],
        prediction: {
          predicted_attendance: 100,
          historical_avg: 100,
          trend: 'Stable',
          trend_slope: 0,
          shortage_risk: false,
          recommendation: 'No enrolled subjects found.',
          required_future_classes: 0,
          margin_absences_allowed: 0
        }
      };
    }

    const { data: records } = await supabase
      .from('attendance')
      .select('*, courses(id, code, title, semester)')
      .eq('student_id', studentId);

    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, courses(id, code, title, semester)')
      .eq('student_id', studentId);

    let semCourses = [];
    if (student?.current_semester) {
      const { data: matched } = await supabase
        .from('courses')
        .select('id, code, title, semester')
        .eq('semester', student.current_semester);
      semCourses = matched || [];
    }

    const subjectMap = {};

    (enrollments || []).forEach((e) => {
      const cId = e.courses?.id || e.course_id;
      if (cId) {
        subjectMap[cId] = {
          id: cId,
          code: e.courses?.code || 'SUB',
          title: e.courses?.title || 'Course Subject',
          semester: e.courses?.semester || 1,
          total: 0,
          attended: 0
        };
      }
    });

    (semCourses || []).forEach((c) => {
      if (c.id && !subjectMap[c.id]) {
        subjectMap[c.id] = {
          id: c.id,
          code: c.code || 'SUB',
          title: c.title || 'Course Subject',
          semester: c.semester || 1,
          total: 0,
          attended: 0
        };
      }
    });

    (records || []).forEach((rec) => {
      const courseId = rec.course_id;
      const code = rec.courses?.code || subjectMap[courseId]?.code || 'SUB';
      const title = rec.courses?.title || subjectMap[courseId]?.title || 'Course Subject';

      if (!subjectMap[courseId]) {
        subjectMap[courseId] = { id: courseId, code, title, semester: rec.courses?.semester || 1, total: 0, attended: 0 };
      }
      subjectMap[courseId].total += 1;
      if (rec.status === 'present' || rec.status === 'late') {
        subjectMap[courseId].attended += 1;
      }
    });

    let totalClassesAll = 0;
    let totalAttendedAll = 0;

    const subjects = Object.values(subjectMap).map(sub => {
      totalClassesAll += sub.total;
      totalAttendedAll += sub.attended;
      const rate = sub.total > 0 ? parseFloat(((sub.attended / sub.total) * 100).toFixed(1)) : 100.0;

      let reqFuture = 0;
      let marginAbs = 0;
      if (sub.total > 0) {
        if (rate >= 75.0) {
          marginAbs = Math.max(0, Math.floor((sub.attended * 100.0 / 75.0) - sub.total));
        } else {
          reqFuture = Math.max(1, Math.ceil(((75.0 * sub.total) - (100.0 * sub.attended)) / 25.0));
        }
      }

      return {
        course_id: sub.id,
        subject_name: sub.title,
        subject_code: sub.code,
        semester: sub.semester,
        total_classes: sub.total,
        attended_classes: sub.attended,
        attendance_rate: rate,
        status: rate >= 75 ? 'Safe' : 'Warning',
        required_future_classes: reqFuture,
        margin_absences_allowed: marginAbs
      };
    });

    const overallRate = totalClassesAll > 0 ? parseFloat(((totalAttendedAll / totalClassesAll) * 100).toFixed(1)) : 100.0;

    let overallReqFuture = 0;
    let overallMarginAbs = 0;
    if (totalClassesAll > 0) {
      if (overallRate >= 75.0) {
        overallMarginAbs = Math.max(0, Math.floor((totalAttendedAll * 100.0 / 75.0) - totalClassesAll));
      } else {
        overallReqFuture = Math.max(1, Math.ceil(((75.0 * totalClassesAll) - (100.0 * totalAttendedAll)) / 25.0));
      }
    }

    const shortageRisk = overallRate < 75.0 || subjects.some(s => s.status === 'Warning');
    const recommendation = overallRate >= 75.0
      ? `Overall attendance is safe at ${overallRate}%. You can miss up to ${overallMarginAbs} total class${overallMarginAbs !== 1 ? 'es' : ''} across subjects.`
      : `Shortage warning! Your overall rate is ${overallRate}%. You need to attend ${overallReqFuture} consecutive class${overallReqFuture !== 1 ? 'es' : ''} to reach 75%.`;

    return {
      overall_rate: overallRate,
      total_classes_all: totalClassesAll,
      total_attended_all: totalAttendedAll,
      subjects,
      prediction: {
        predicted_attendance: overallRate,
        historical_avg: overallRate,
        trend: 'Stable',
        trend_slope: 0,
        shortage_risk: shortageRisk,
        recommendation,
        required_future_classes: overallReqFuture,
        margin_absences_allowed: overallMarginAbs
      }
    };
  },

  async getFacultyCoursesWithStudents(facultyProfileId) {
    const { data: faculty } = await supabase
      .from('faculty')
      .select('id')
      .eq('profile_id', facultyProfileId)
      .maybeSingle();

    const facultyId = faculty?.id;

    let coursesQuery = supabase.from('courses').select('id, code, title, semester');
    if (facultyId) {
      coursesQuery = coursesQuery.eq('faculty_id', facultyId);
    }
    const { data: courses } = await coursesQuery;
    const activeCourses = (courses && courses.length > 0) ? courses : (await supabase.from('courses').select('id, code, title, semester')).data || [];

    // Fetch all profiles with role = student
    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student');

    // Fetch existing students rows
    const { data: existingStudents } = await supabase
      .from('students')
      .select('*');

    const studentMap = {};
    (existingStudents || []).forEach(s => {
      studentMap[s.profile_id] = s;
    });

    const registeredStudents = [];

    for (const prof of studentProfiles || []) {
      let stRecord = studentMap[prof.id];
      if (!stRecord) {
        // Auto-create student row if missing
        try {
          const { data: newSt } = await supabase
            .from('students')
            .insert([{
              profile_id: prof.id,
              roll_number: prof.institution_id || `STU-${prof.id.slice(0, 6).toUpperCase()}`,
              batch_year: 2026,
              cgpa: 8.0,
              semester: 5
            }])
            .select()
            .single();

          if (newSt) stRecord = newSt;
        } catch (e) {
          console.warn('Auto-create student row error:', e);
        }
      }

      registeredStudents.push({
        id: stRecord?.id || prof.id,
        profile_id: prof.id,
        roll_number: stRecord?.roll_number || prof.institution_id || `STU-${prof.id.slice(0, 6).toUpperCase()}`,
        cgpa: stRecord?.cgpa || 8.0,
        current_semester: stRecord?.semester || 5,
        full_name: prof.full_name || 'Student Name',
        email: prof.email || 'student@university.edu',
        department: prof.department || 'Computer Science & Engineering'
      });
    }

    const rosterList = [];

    for (const course of activeCourses) {
      const studentDetails = [];

      for (const st of registeredStudents) {
        const { data: attLogs } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', st.id)
          .eq('course_id', course.id);

        const totalCls = attLogs?.length || 0;
        const attendedCls = attLogs?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
        const rate = totalCls > 0 ? parseFloat(((attendedCls / totalCls) * 100).toFixed(1)) : 100.0;

        studentDetails.push({
          student_id: st.id,
          profile_id: st.profile_id,
          full_name: st.full_name,
          roll_number: st.roll_number,
          email: st.email,
          department: st.department,
          semester: st.current_semester,
          cgpa: st.cgpa,
          course_total_classes: totalCls,
          course_attended_classes: attendedCls,
          course_attendance_rate: rate
        });
      }

      rosterList.push({
        course_id: course.id,
        code: course.code,
        title: course.title,
        semester: course.semester || 1,
        students: studentDetails
      });
    }

    return rosterList;
  },

  async getCourseAttendanceLogsForDate(courseId, dateStr) {
    const { data: records } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('course_id', courseId)
      .eq('date', dateStr);

    const logMap = {};
    (records || []).forEach(r => {
      logMap[r.student_id] = r.status;
    });
    return logMap;
  },

  async saveFacultyAttendance(records) {
    if (!records || records.length === 0) return [];

    const sample = records[0];
    await supabase
      .from('attendance')
      .delete()
      .eq('course_id', sample.course_id)
      .eq('date', sample.date);

    const { data, error } = await supabase
      .from('attendance')
      .insert(records)
      .select();

    if (error) throw error;

    // Send notifications to students whose attendance was logged
    try {
      const { data: course } = await supabase.from('courses').select('code, title').eq('id', sample.course_id).single();
      const courseLabel = course ? `${course.code}` : 'your course';

      for (const rec of records) {
        const { data: student } = await supabase.from('students').select('profile_id').eq('id', rec.student_id).single();
        if (student?.profile_id) {
          await notificationService.notifyUser(
            student.profile_id,
            'Attendance Updated',
            `Attendance for ${courseLabel} on ${sample.date} was logged as ${rec.status.toUpperCase()}.`,
            'info'
          );
        }
      }
    } catch (notifErr) {
      console.warn('Error sending attendance notifications:', notifErr);
    }

    return data || [];
  },

  async getAllStudentAttendanceReports() {
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, profile_id, roll_number, cgpa, batch_year, current_semester, profiles(full_name, email, department)');

    const reports = [];
    for (const st of allStudents || []) {
      const profile = Array.isArray(st.profiles) ? st.profiles[0] : st.profiles;
      const { data: attLogs } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', st.id);

      const total = attLogs?.length || 0;
      const attended = attLogs?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
      const rate = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : 100.0;

      reports.push({
        student_id: st.id,
        profile_id: st.profile_id,
        full_name: profile?.full_name || 'Student',
        roll_number: st.roll_number || 'STU-001',
        department: profile?.department || 'Computer Science',
        total_classes: total,
        attended_classes: attended,
        overall_rate: rate,
        status: rate >= 75 ? 'Eligible' : 'Shortage Risk'
      });
    }
    return reports;
  }
};
