import { supabase } from './supabaseClient';
import { AttendanceRecord } from '../types/database';

export const attendanceService = {
  async getStudentAttendance(studentProfileId: string): Promise<{
    overall_rate: number;
    subjects: Array<{
      subject_name: string;
      subject_code: string;
      total_classes: number;
      attended_classes: number;
      attendance_rate: number;
      status: string;
    }>;
  }> {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id;

    if (!studentId) {
      return {
        overall_rate: 0,
        subjects: []
      };
    }

    const { data: records } = await supabase
      .from('attendance')
      .select('*, courses(code, title)')
      .eq('student_id', studentId);

    if (!records || records.length === 0) {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('courses(code, title)')
        .eq('student_id', studentId);

      const subjects = (enrollments || []).map((e: any) => ({
        subject_name: e.courses?.title || 'Subject',
        subject_code: e.courses?.code || 'CS',
        total_classes: 0,
        attended_classes: 0,
        attendance_rate: 100,
        status: 'Safe'
      }));

      return {
        overall_rate: 100.0,
        subjects
      };
    }

    const subjectMap: Record<string, { code: string; title: string; total: number; attended: number }> = {};

    records.forEach((rec: any) => {
      const courseId = rec.course_id;
      const code = rec.courses?.code || 'CS';
      const title = rec.courses?.title || 'Subject';

      if (!subjectMap[courseId]) {
        subjectMap[courseId] = { code, title, total: 0, attended: 0 };
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
      const rate = sub.total > 0 ? parseFloat(((sub.attended / sub.total) * 100).toFixed(1)) : 100;
      return {
        subject_name: sub.title,
        subject_code: sub.code,
        total_classes: sub.total,
        attended_classes: sub.attended,
        attendance_rate: rate,
        status: rate >= 75 ? 'Safe' : 'Warning'
      };
    });

    const overallRate = totalClassesAll > 0 ? parseFloat(((totalAttendedAll / totalClassesAll) * 100).toFixed(1)) : 100;

    return {
      overall_rate: overallRate,
      subjects
    };
  },

  async markAttendance(records: Array<{ student_id: string; course_id: string; date: string; status: 'present' | 'absent' | 'late' | 'excused' }>): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance')
      .insert(records)
      .select();

    if (error) throw error;
    return data || [];
  }
};
