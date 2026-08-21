import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const financeService = {
  async getStudentFeePayments(studentProfileId) {
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
    const totalDue = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      payments,
      outstanding_balance: totalDue,
      total_paid: totalPaid
    };
  },

  async generateInvoice(payload) {
    let studentId = payload.student_id;

    if (!studentId && payload.student_profile_id) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', payload.student_profile_id)
        .single();
      studentId = student?.id;
    }

    if (!studentId) {
      const { data: firstStudent } = await supabase.from('students').select('id').limit(1).single();
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
      .single();

    if (error) throw error;

    // Send notification to student
    try {
      const studentProfileId = data?.students?.profile_id;
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'New Fee Invoice Generated',
          `An invoice of ₹${data.amount} for "${data.term}" has been generated. Status: PENDING.`,
          'warning'
        );
      }
    } catch (nErr) {
      console.warn('Finance notification error:', nErr);
    }

    return data;
  },

  async markPaymentReceived(paymentId, transactionId) {
    const { data, error } = await supabase
      .from('fee_payments')
      .update({
        status: 'paid',
        payment_date: new Date().toISOString(),
        transaction_id: transactionId || `TXN-${Date.now().toString().slice(-6)}`
      })
      .eq('id', paymentId)
      .select('*, students(profile_id)')
      .single();

    if (error) throw error;

    // Send notification to student
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
