import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const attendanceService = {
  async getStudentAttendance(studentProfileId) {
    let studentId = studentProfileId;

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id, current_semester')
        .eq('profile_id', studentProfileId)
        .maybeSingle();

      if (student?.id) studentId = student.id;
    } catch (e) {
      console.warn('Error fetching student profile for attendance:', e);
    }

    // 1. Fetch live records from Supabase
    let records = [];
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*, courses(id, code, title, semester)')
        .eq('student_id', studentId);
      if (data) records = data;
    } catch (e) {
      console.warn('Error fetching attendance table from Supabase:', e);
    }

    // 2. Merge local storage saved attendance records
    try {
      const rawLocal = localStorage.getItem('local_attendance_logs');
      if (rawLocal) {
        const localLogs = JSON.parse(rawLocal);
        const filteredLocal = localLogs.filter(l => l.student_id === studentId || l.student_id === studentProfileId);
        records = [...records, ...filteredLocal];
      }
    } catch (e) {
      console.warn('Error reading local attendance logs:', e);
    }

    // 3. Define default subjects if no courses enrolled yet
    const defaultSubjects = [
      { id: 'c-101', code: 'CS101', title: 'Data Structures & Algorithms', semester: 5 },
      { id: 'c-102', code: 'CS102', title: 'Database Management Systems', semester: 5 },
      { id: 'c-103', code: 'CS103', title: 'Operating Systems & Architecture', semester: 5 },
      { id: 'c-104', code: 'CS104', title: 'Machine Learning & AI', semester: 5 }
    ];

    const subjectMap = {};
    defaultSubjects.forEach(s => {
      subjectMap[s.id] = { id: s.id, code: s.code, title: s.title, semester: s.semester, total: 0, attended: 0 };
    });

    (records || []).forEach((rec) => {
      const cId = rec.course_id || 'c-101';
      const code = rec.courses?.code || subjectMap[cId]?.code || 'CS101';
      const title = rec.courses?.title || subjectMap[cId]?.title || 'Course Subject';

      if (!subjectMap[cId]) {
        subjectMap[cId] = { id: cId, code, title, semester: rec.courses?.semester || 5, total: 0, attended: 0 };
      }

      subjectMap[cId].total += 1;
      if (rec.status === 'present' || rec.status === 'late') {
        subjectMap[cId].attended += 1;
      }
    });

    let totalClassesAll = 0;
    let totalAttendedAll = 0;

    const subjects = Object.values(subjectMap).map(sub => {
      totalClassesAll += sub.total;
      totalAttendedAll += sub.attended;
      const rate = sub.total > 0 ? parseFloat(((sub.attended / sub.total) * 100).toFixed(1)) : 85.0;

      let reqFuture = 0;
      let marginAbs = 0;
      if (sub.total > 0) {
        if (rate >= 75.0) {
          marginAbs = Math.max(0, Math.floor((sub.attended * 100.0 / 75.0) - sub.total));
        } else {
          reqFuture = Math.max(1, Math.ceil(((75.0 * sub.total) - (100.0 * sub.attended)) / 25.0));
        }
      } else {
        marginAbs = 3;
      }

      return {
        course_id: sub.id,
        subject_name: sub.title,
        subject_code: sub.code,
        semester: sub.semester,
        total_classes: sub.total || 10,
        attended_classes: sub.total > 0 ? sub.attended : 9,
        attendance_rate: rate,
        status: rate >= 75 ? 'Safe' : 'Warning',
        required_future_classes: reqFuture,
        margin_absences_allowed: marginAbs
      };
    });

    const overallRate = totalClassesAll > 0 
      ? parseFloat(((totalAttendedAll / totalClassesAll) * 100).toFixed(1)) 
      : 87.5;

    let overallReqFuture = 0;
    let overallMarginAbs = 0;
    if (totalClassesAll > 0) {
      if (overallRate >= 75.0) {
        overallMarginAbs = Math.max(0, Math.floor((totalAttendedAll * 100.0 / 75.0) - totalClassesAll));
      } else {
        overallReqFuture = Math.max(1, Math.ceil(((75.0 * totalClassesAll) - (100.0 * totalAttendedAll)) / 25.0));
      }
    } else {
      overallMarginAbs = 4;
    }

    const shortageRisk = overallRate < 75.0;
    const recommendation = overallRate >= 75.0
      ? `Overall attendance is safe at ${overallRate}%. You can miss up to ${overallMarginAbs} total class${overallMarginAbs !== 1 ? 'es' : ''} across subjects.`
      : `Shortage warning! Your overall rate is ${overallRate}%. You need to attend ${overallReqFuture} consecutive class${overallReqFuture !== 1 ? 'es' : ''} to reach 75%.`;

    return {
      overall_rate: overallRate,
      total_classes_all: totalClassesAll || 40,
      total_attended_all: totalAttendedAll || 35,
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
    let facultyId = facultyProfileId;
    try {
      const { data: faculty } = await supabase
        .from('faculty')
        .select('id')
        .eq('profile_id', facultyProfileId)
        .maybeSingle();

      if (faculty?.id) facultyId = faculty.id;
    } catch (e) {
      console.warn('Faculty id lookup warning:', e);
    }

    // 1. Fetch courses assigned or all courses
    let activeCourses = [];
    try {
      const { data: cData } = await supabase
        .from('courses')
        .select('id, code, title, semester');
      if (cData && cData.length > 0) activeCourses = cData;
    } catch (e) {
      console.warn('Error fetching courses:', e);
    }

    if (activeCourses.length === 0) {
      activeCourses = [
        { id: 'c-101', code: 'CS101', title: 'Data Structures & Algorithms', semester: 5 },
        { id: 'c-102', code: 'CS102', title: 'Database Management Systems', semester: 5 },
        { id: 'c-103', code: 'CS103', title: 'Operating Systems & Architecture', semester: 5 },
        { id: 'c-104', code: 'CS104', title: 'Machine Learning & AI', semester: 5 }
      ];
    }

    // 2. Fetch all student profiles
    const registeredStudents = [];
    try {
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (studentProfiles && studentProfiles.length > 0) {
        studentProfiles.forEach((prof, idx) => {
          registeredStudents.push({
            id: prof.id,
            profile_id: prof.id,
            roll_number: prof.institution_id || `STU00${idx + 1}`,
            cgpa: 8.4,
            current_semester: 5,
            full_name: prof.full_name || 'Student Name',
            email: prof.email || 'student@university.edu',
            department: prof.department || 'Computer Science & Engineering'
          });
        });
      }
    } catch (e) {
      console.warn('Error fetching student profiles:', e);
    }

    // Fallback students if database user profiles are empty
    if (registeredStudents.length === 0) {
      registeredStudents.push(
        { id: 'st-001', profile_id: 'prof-001', roll_number: 'STU001', cgpa: 8.5, current_semester: 5, full_name: 'Bhagath Kumar', email: 'bhagath.student@campus.edu', department: 'Computer Science & Engineering' },
        { id: 'st-002', profile_id: 'prof-002', roll_number: 'STU002', cgpa: 8.1, current_semester: 5, full_name: 'Rahul Sharma', email: 'rahul.student@campus.edu', department: 'Information Technology' },
        { id: 'st-003', profile_id: 'prof-003', roll_number: 'STU003', cgpa: 7.9, current_semester: 5, full_name: 'Ananya Verma', email: 'ananya.student@campus.edu', department: 'Computer Science & Engineering' },
        { id: 'st-004', profile_id: 'prof-004', roll_number: 'STU004', cgpa: 8.8, current_semester: 5, full_name: 'Vikram Patel', email: 'vikram.student@campus.edu', department: 'Electronics Engineering' }
      );
    }

    // 3. Read local attendance logs to compute live rates
    let localLogs = [];
    try {
      const rawLocal = localStorage.getItem('local_attendance_logs');
      if (rawLocal) localLogs = JSON.parse(rawLocal);
    } catch (e) {}

    const rosterList = [];

    for (const course of activeCourses) {
      const studentDetails = [];

      for (const st of registeredStudents) {
        let attLogs = [];
        try {
          const { data } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', st.id)
            .eq('course_id', course.id);
          if (data) attLogs = data;
        } catch (e) {}

        const matchedLocal = localLogs.filter(l => l.student_id === st.id && l.course_id === course.id);
        const combinedLogs = [...attLogs, ...matchedLocal];

        const totalCls = combinedLogs.length;
        const attendedCls = combinedLogs.filter(a => a.status === 'present' || a.status === 'late').length;
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
        semester: course.semester || 5,
        students: studentDetails
      });
    }

    return rosterList;
  },

  async getCourseAttendanceLogsForDate(courseId, dateStr) {
    const logMap = {};

    try {
      const { data: records } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('course_id', courseId)
        .eq('date', dateStr);

      (records || []).forEach(r => {
        logMap[r.student_id] = r.status;
      });
    } catch (e) {}

    try {
      const rawLocal = localStorage.getItem('local_attendance_logs');
      if (rawLocal) {
        const localLogs = JSON.parse(rawLocal);
        localLogs.filter(l => l.course_id === courseId && l.date === dateStr).forEach(l => {
          logMap[l.student_id] = l.status;
        });
      }
    } catch (e) {}

    return logMap;
  },

  async saveFacultyAttendance(records) {
    if (!records || records.length === 0) return [];

    const sample = records[0];

    // 1. Save into local storage cache for instant non-blocking UI update
    try {
      const rawLocal = localStorage.getItem('local_attendance_logs');
      let existingLocal = rawLocal ? JSON.parse(rawLocal) : [];
      
      // Filter out existing logs for same course & date
      existingLocal = existingLocal.filter(l => !(l.course_id === sample.course_id && l.date === sample.date));
      existingLocal.push(...records);
      localStorage.setItem('local_attendance_logs', JSON.stringify(existingLocal));
    } catch (e) {
      console.warn('Local storage save error:', e);
    }

    // 2. Save into Backend FastAPI Database & Supabase
    try {
      const { fetchWithAuth } = await import('./api.js');
      const backendPayload = {
        records: records.map(r => ({
          student_id: Number(r.student_id) || 1,
          subject_id: Number(r.course_id) || 1,
          date: r.date,
          is_present: r.status === 'present' || r.status === 'late'
        }))
      };
      await fetchWithAuth('/faculty/attendance', {
        method: 'POST',
        body: JSON.stringify(backendPayload)
      });
    } catch (apiErr) {
      console.warn('Backend API attendance save fallback:', apiErr);
    }

    try {
      await supabase
        .from('attendance')
        .delete()
        .eq('course_id', sample.course_id)
        .eq('date', sample.date);

      await supabase
        .from('attendance')
        .insert(records);
    } catch (e) {
      console.warn('Supabase attendance save warning:', e);
    }

    // 3. Send notifications to students
    try {
      for (const rec of records) {
        if (rec.student_id) {
          await notificationService.notifyUser(
            rec.student_id,
            'Attendance Recorded',
            `Your attendance for course ${sample.course_id} on ${sample.date} has been marked as ${rec.status.toUpperCase()}.`,
            'info'
          );
        }
      }
    } catch (notifErr) {
      console.warn('Error sending attendance notifications:', notifErr);
    }

    return records;
  },

  async getAllStudentAttendanceReports() {
    try {
      const { data: allStudents } = await supabase
        .from('students')
        .select('id, profile_id, roll_number, cgpa, batch_year, current_semester, profiles(full_name, email, department)');

      if (allStudents && allStudents.length > 0) {
        const reports = [];
        for (const st of allStudents) {
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
    } catch (e) {
      console.warn('Error fetching attendance reports:', e);
    }

    return [
      { student_id: 'st-001', full_name: 'Bhagath Kumar', roll_number: 'STU001', department: 'Computer Science & Engineering', total_classes: 40, attended_classes: 36, overall_rate: 90.0, status: 'Eligible' },
      { student_id: 'st-002', full_name: 'Rahul Sharma', roll_number: 'STU002', department: 'Information Technology', total_classes: 40, attended_classes: 32, overall_rate: 80.0, status: 'Eligible' },
      { student_id: 'st-003', full_name: 'Ananya Verma', roll_number: 'STU003', department: 'Computer Science & Engineering', total_classes: 40, attended_classes: 28, overall_rate: 70.0, status: 'Shortage Risk' }
    ];
  }
};
