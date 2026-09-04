import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export const financeService = {
  async getStudentFeePayments(studentProfileId?: string) {
    let studentId = studentProfileId;

    if (studentProfileId) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', studentProfileId)
        .maybeSingle();

      if (student?.id) {
        studentId = student.id;
      }
    }

    let query = supabase
      .from('fee_payments')
      .select('*, students(roll_number, profile_id, profiles(full_name, email))')
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const payments = data || [];
    const totalDue = payments.filter((p: any) => p.status === 'pending' || p.status === 'overdue').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    const totalPaid = payments.filter((p: any) => p.status === 'paid').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

    return {
      payments,
      outstanding_balance: totalDue,
      total_paid: totalPaid
    };
  },

  async generateInvoice(payload: any) {
    let studentId = payload.student_id;

    if (!studentId && payload.student_profile_id) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', payload.student_profile_id)
        .maybeSingle();
      studentId = student?.id;
    }

    if (!studentId) {
      const { data: firstStudent } = await supabase.from('students').select('id').limit(1).maybeSingle();
      studentId = firstStudent?.id;
    }

    const record = {
      student_id: studentId,
      amount: Number(payload.amount || 25000),
      term: payload.term || 'Fall Semester 2026',
      status: 'pending',
      transaction_id: `INV-${Date.now().toString().slice(-6)}`
    };

    const { data, error } = await supabase
      .from('fee_payments')
      .insert([record])
      .select('*, students(profile_id)')
      .maybeSingle();

    if (error) throw error;

    try {
      const studentProfileId = data?.students?.profile_id;
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'New Fee Invoice Generated',
          `An invoice of ₹${data?.amount || 25000} for "${data?.term || 'Fall Semester'}" has been generated. Status: PENDING.`,
          'warning'
        );
      }
    } catch (nErr) {
      console.warn('Finance notification error:', nErr);
    }

    return data;
  },

  async markPaymentReceived(paymentId: string | number, transactionId?: string) {
    const { data, error } = await supabase
      .from('fee_payments')
      .update({
        status: 'paid',
        payment_date: new Date().toISOString(),
        transaction_id: transactionId || `TXN-${Date.now().toString().slice(-6)}`
      })
      .eq('id', paymentId)
      .select('*, students(profile_id)')
      .maybeSingle();


    if (error) throw error;

    try {
      const studentProfileId = data?.students?.profile_id;
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Fee Payment Received',
          `Payment of ₹${data.amount} for "${data.term}" has been marked as RECEIVED (Paid).`,
          'success'
        );
      }
    } catch (nErr) {
      console.warn('Payment received notification error:', nErr);
    }

    return data;
  }
};
