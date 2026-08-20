import { supabase } from './supabaseClient.js';

export const placementService = {
  async getCompanies() {
    const { data, error } = await supabase.from('companies').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async getPlacementDrives() {
    const { data, error } = await supabase
      .from('placements')
      .select('*, companies(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPlacementDrive(payload) {
    const { data, error } = await supabase
      .from('placements')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async applyDrive(studentProfileId, placementId) {
    const { data: student } = await supabase
      .from('students')
      .select('id, cgpa')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data: drive } = await supabase
      .from('placements')
      .select('min_cgpa')
      .eq('id', placementId)
      .single();

    if (drive && student && Number(student.cgpa) < Number(drive.min_cgpa)) {
      throw new Error(`Ineligible: Your CGPA (${student.cgpa}) is below required minimum CGPA (${drive.min_cgpa}).`);
    }

    const { data, error } = await supabase
      .from('placement_applications')
      .upsert({ placement_id: placementId, student_id: studentId, status: 'applied' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStudentApplications(studentProfileId) {
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
  }
};
