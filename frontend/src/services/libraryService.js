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

  async addBookDirectly(payload) {
    // 1. Call Backend API
    try {
      const { fetchWithAuth } = await import('./api.js');
      await fetchWithAuth('/library/books', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          author: payload.author || 'Academic Author',
          category: payload.category || 'General',
          isbn: payload.isbn || 'N/A',
          copies_available: Number(payload.copies_available) || 3
        })
      });
    } catch (apiErr) {
      console.warn('Backend API add book fallback:', apiErr);
    }

    // 2. Insert/Update in Supabase for frontend instant sync
    try {
      await supabase.from('library_books').insert([{
        title: payload.title,
        author: payload.author || 'Academic Author',
        category: payload.category || 'General',
        isbn: payload.isbn || 'N/A',
        copies_available: Number(payload.copies_available) || 3
      }]);
    } catch (sErr) {}

    return true;
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
  },

  async requestBookOrPaper(studentProfileId, payload) {
    // 1. Persist to local storage cache for instant UI feedback
    const newReq = {
      id: `req-${Date.now()}`,
      student_profile_id: studentProfileId,
      title: payload.title,
      author: payload.author || 'Academic Author',
      category: payload.category || 'Book',
      isbn_or_link: payload.isbn_or_link || '',
      reason: payload.reason || '',
      status: 'pending_approval',
      created_at: new Date().toISOString()
    };

    try {
      const rawLocal = localStorage.getItem('local_book_requests');
      const existing = rawLocal ? JSON.parse(rawLocal) : [];
      existing.unshift(newReq);
      localStorage.setItem('local_book_requests', JSON.stringify(existing));
    } catch (e) {}

    try {
      const { fetchWithAuth } = await import('./api.js');
      await fetchWithAuth('/library/request', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          author: payload.author,
          category: payload.category,
          isbn_or_link: payload.isbn_or_link,
          reason: payload.reason
        })
      });
    } catch (apiErr) {
      console.warn('Backend API request fallback:', apiErr);
    }

    try {
      await supabase.from('book_requests').insert([{
        student_profile_id: studentProfileId,
        title: payload.title,
        author: payload.author,
        category: payload.category,
        isbn_or_link: payload.isbn_or_link,
        reason: payload.reason,
        status: 'pending_approval'
      }]);
    } catch (e) {}

    return newReq;
  },

  async getBookRequests(studentProfileId = null) {
    let requests = [];

    // Read from Supabase
    try {
      let query = supabase.from('book_requests').select('*, profiles(full_name, email, institution_id)').order('created_at', { ascending: false });
      if (studentProfileId) {
        query = query.eq('student_profile_id', studentProfileId);
      }
      const { data } = await query;
      if (data) requests = data;
    } catch (e) {}

    // Merge local requests
    try {
      const rawLocal = localStorage.getItem('local_book_requests');
      if (rawLocal) {
        const localList = JSON.parse(rawLocal);
        const filtered = studentProfileId ? localList.filter(l => l.student_profile_id === studentProfileId) : localList;
        requests = [...filtered, ...requests];
      }
    } catch (e) {}

    return requests;
  },

  async approveBookRequest(requestId, copiesAvailable = 3) {
    let reqObj = null;

    // Update local storage
    try {
      const rawLocal = localStorage.getItem('local_book_requests');
      if (rawLocal) {
        const localList = JSON.parse(rawLocal);
        const match = localList.find(r => r.id === requestId);
        if (match) {
          match.status = 'approved';
          reqObj = match;
          localStorage.setItem('local_book_requests', JSON.stringify(localList));
        }
      }
    } catch (e) {}

    // Update Supabase
    try {
      const { data } = await supabase
        .from('book_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
        .select()
        .single();
      if (data) reqObj = data;
    } catch (e) {}

    // Insert approved item into active library catalog
    if (reqObj) {
      try {
        await supabase.from('library_books').insert([{
          title: reqObj.title,
          author: reqObj.author || 'Academic Author',
          category: reqObj.category || 'General',
          isbn: reqObj.isbn_or_link || 'N/A',
          copies_available: copiesAvailable
        }]);
      } catch (e) {}

      // Notify requesting student
      try {
        if (reqObj.student_profile_id) {
          await notificationService.notifyUser(
            reqObj.student_profile_id,
            'Library Book Request Approved',
            `Your requested book/paper "${reqObj.title}" has been APPROVED by Admin and added to the library catalogue!`,
            'success'
          );
        }
      } catch (nErr) {}
    }

    return true;
  },

  async rejectBookRequest(requestId) {
    try {
      const rawLocal = localStorage.getItem('local_book_requests');
      if (rawLocal) {
        const localList = JSON.parse(rawLocal);
        const match = localList.find(r => r.id === requestId);
        if (match) {
          match.status = 'rejected';
          localStorage.setItem('local_book_requests', JSON.stringify(localList));
        }
      }
    } catch (e) {}

    try {
      await supabase.from('book_requests').update({ status: 'rejected' }).eq('id', requestId);
    } catch (e) {}

    return true;
  }
};
