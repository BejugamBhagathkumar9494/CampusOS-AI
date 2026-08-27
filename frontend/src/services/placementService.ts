import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export const placementService = {
  async getCompanies() {
    const { data, error } = await supabase.from('companies').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async getPlacementDrives() {
    const { data, error } = await supabase
      .from('placements')
      .select('*, companies(*), placement_applications(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPlacementDrive(payload: any) {
    let companyId = payload.company_id;

    if (!companyId && payload.company_name) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', payload.company_name)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newComp } = await supabase
          .from('companies')
          .insert([{ name: payload.company_name, location: payload.location || 'Bengaluru', industry: 'Technology' }])
          .select()
          .single();
        companyId = newComp?.id;
      }
    }

    const driveRecord = {
      company_id: companyId,
      job_title: payload.job_title || 'Software Engineer',
      package_ctc: payload.package_ctc ? Number(payload.package_ctc) : 12.0,
      min_cgpa: payload.min_cgpa ? Number(payload.min_cgpa) : 6.0,
      drive_date: payload.drive_date || new Date(Date.now() + 86400000 * 7).toISOString(),
      status: 'active'
    };

    const { data, error } = await supabase
      .from('placements')
      .insert([driveRecord])
      .select('*, companies(*)')
      .single();

    if (error) throw error;

    try {
      const companyName = data?.companies?.name || 'Recruiter';
      await notificationService.notifyAllStudents(
        'New Placement Drive Created',
        `Drive for ${data.job_title} at ${companyName} (${data.package_ctc} LPA) is now open! Min CGPA: ${data.min_cgpa}.`,
        'success'
      );
    } catch (nErr) {
      console.warn('Failed to broadcast drive notification:', nErr);
    }

    return data;
  },

  async updatePlacementDrive(driveId: string | number, payload: any) {
    const { data, error } = await supabase
      .from('placements')
      .update(payload)
      .eq('id', driveId)
      .select('*, companies(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deletePlacementDrive(driveId: string | number) {
    const { error } = await supabase
      .from('placements')
      .delete()
      .eq('id', driveId);

    if (error) throw error;
    return true;
  },

  async getEligibleDrivesForStudent(studentProfileId: string) {
    const { data: student } = await supabase
      .from('students')
      .select('id, cgpa, batch_year, current_semester')
      .eq('profile_id', studentProfileId)
      .single();

    const studentCgpa = Number(student?.cgpa || 8.0);
    const { data: drives } = await supabase
      .from('placements')
      .select('*, companies(*), placement_applications(id, student_id, status)')
      .order('created_at', { ascending: false });

    if (!drives) return [];

    return drives.map((d: any) => {
      const minCgpa = Number(d.min_cgpa || 6.0);
      const isEligible = studentCgpa >= minCgpa;
      const myApp = (d.placement_applications || []).find((app: any) => student && app.student_id === student.id);

      return {
        ...d,
        is_eligible: isEligible,
        application_status: myApp ? myApp.status : null,
        applied: !!myApp
      };
    });
  },

  async applyDrive(studentProfileId: string, placementId: string | number) {
    const { data: student } = await supabase
      .from('students')
      .select('id, cgpa')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id;
    if (!studentId) throw new Error('Student profile record not found.');

    const { data: drive } = await supabase
      .from('placements')
      .select('min_cgpa, job_title, companies(name)')
      .eq('id', placementId)
      .single();

    if (drive && student && Number(student.cgpa) < Number(drive.min_cgpa)) {
      throw new Error(`Ineligible: Your CGPA (${student.cgpa}) is below required minimum (${drive.min_cgpa}).`);
    }

    const { data, error } = await supabase
      .from('placement_applications')
      .upsert({ placement_id: placementId, student_id: studentId, status: 'applied', applied_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    try {
      const compName = (drive as any)?.companies?.name || 'Company';
      await notificationService.notifyUser(
        studentProfileId,
        'Application Submitted',
        `Successfully applied for ${drive?.job_title || 'Position'} at ${compName}. Status: APPLIED.`,
        'info'
      );
    } catch (nErr) {
      console.warn('Notification error:', nErr);
    }

    return data;
  },

  async getStudentApplications(studentProfileId: string) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    if (!student) return [];

    const { data, error } = await supabase
      .from('placement_applications')
      .select('*, drive:placements(*, companies(*))')
      .eq('student_id', student.id);

    if (error) throw error;
    return data || [];
  },

  async getDriveApplicants(placementId: string | number) {
    const { data: apps, error } = await supabase
      .from('placement_applications')
      .select('*, students(id, profile_id, roll_number, cgpa, batch_year, profiles(full_name, email, department))')
      .eq('placement_id', placementId);

    if (error) throw error;

    return (apps || []).map((a: any) => {
      const st = a.students;
      const prof = Array.isArray(st?.profiles) ? st.profiles[0] : st?.profiles;
      return {
        application_id: a.id,
        placement_id: a.placement_id,
        student_id: a.student_id,
        student_profile_id: st?.profile_id,
        full_name: prof?.full_name || 'Applicant',
        email: prof?.email || 'student@university.edu',
        roll_number: st?.roll_number || 'STU-001',
        department: prof?.department || 'Computer Science',
        cgpa: st?.cgpa || 8.0,
        status: a.status,
        applied_at: a.applied_at
      };
    });
  },

  async updateApplicationStatus(applicationId: string | number, newStatus: string) {
    const { data, error } = await supabase
      .from('placement_applications')
      .update({ status: newStatus })
      .eq('id', applicationId)
      .select('*, students(profile_id), placements(job_title, companies(name))')
      .single();

    if (error) throw error;

    try {
      const studentProfileId = data?.students?.profile_id;
      const compName = data?.placements?.companies?.name || 'Recruiter';
      const jobTitle = data?.placements?.job_title || 'Drive';
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Placement Application Update',
          `Your application for ${jobTitle} at ${compName} has been updated to: ${newStatus.toUpperCase()}.`,
          newStatus === 'shortlisted' || newStatus === 'offered' ? 'success' : 'info'
        );
      }
    } catch (nErr) {
      console.warn('Status notification error:', nErr);
    }

    return data;
  }
};
