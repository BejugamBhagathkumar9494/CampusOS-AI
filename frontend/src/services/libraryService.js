import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const libraryService = {
  async getBooks(searchQuery) {
    let query = supabase.from('library_books').select('*').order('title');
    if (searchQuery && searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async issueBook(studentProfileId, bookId, dueDays = 14) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data: book } = await supabase
      .from('library_books')
      .select('title, copies_available')
      .eq('id', bookId)
      .single();

    if (!book || book.copies_available <= 0) {
      throw new Error('Book is currently unavailable for borrowing.');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const { data, error } = await supabase
      .from('issued_books')
      .insert([{
        book_id: bookId,
        student_id: studentId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('library_books')
      .update({ copies_available: book.copies_available - 1 })
      .eq('id', bookId);

    // Notify student
    try {
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Library Book Issued',
          `"${book.title}" has been issued to you. Due date: ${dueDate.toLocaleDateString()}.`,
          'info'
        );
      }
    } catch (nErr) {
      console.warn('Library issue notification error:', nErr);
    }

    return data;
  },

  async returnBook(issuedBookId) {
    const { data: issued } = await supabase
      .from('issued_books')
      .select('*, library_books(title, copies_available), students(profile_id)')
      .eq('id', issuedBookId)
      .single();

    if (!issued) throw new Error('Issued record not found.');

    const returnDateStr = new Date().toISOString().split('T')[0];
    const due = new Date(issued.due_date);
    const now = new Date();

    let fine = 0;
    if (now > due) {
      const diffTime = Math.abs(now - due);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 5; // $5 per day fine
    }

    const { data, error } = await supabase
      .from('issued_books')
      .update({
        return_date: returnDateStr,
        fine_amount: fine
      })
      .eq('id', issuedBookId)
      .select()
      .single();

    if (error) throw error;

    if (issued.library_books?.id) {
      const currentCopies = issued.library_books.copies_available || 0;
      await supabase
        .from('library_books')
        .update({ copies_available: currentCopies + 1 })
        .eq('id', issued.library_books.id);
    }

    // Notify student
    try {
      const studentProfileId = issued.students?.profile_id;
      if (studentProfileId) {
        await notificationService.notifyUser(
          studentProfileId,
          'Library Book Returned',
          `"${issued.library_books?.title || 'Book'}" has been returned. Fine accrued: $${fine}.`,
          fine > 0 ? 'warning' : 'success'
        );
      }
    } catch (nErr) {
      console.warn('Return notification error:', nErr);
    }

    return data;
  },

  async getIssuedBooks(studentProfileId) {
    let query = supabase
      .from('issued_books')
      .select('*, library_books(*), students(roll_number, profile_id, profiles(full_name))')
      .is('return_date', null);

    if (studentProfileId) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', studentProfileId)
        .single();

      if (student) {
        query = query.eq('student_id', student.id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    // Dynamically calculate live fine for overdue books
    return (data || []).map(b => {
      const due = new Date(b.due_date);
      const now = new Date();
      let liveFine = Number(b.fine_amount || 0);

      if (!b.return_date && now > due) {
        const diffTime = Math.abs(now - due);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        liveFine = diffDays * 5;
      }

      return {
        ...b,
        calculated_fine: liveFine
      };
    });
  }
};
