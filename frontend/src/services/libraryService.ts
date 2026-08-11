import { supabase } from './supabaseClient';
import { LibraryBook, IssuedBook } from '../types/database';

export const libraryService = {
  async getBooks(searchQuery?: string): Promise<LibraryBook[]> {
    let query = supabase.from('library_books').select('*').order('title');
    if (searchQuery && searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async issueBook(studentProfileId: string, bookId: string, dueDays: number = 14): Promise<IssuedBook> {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .single();

    const studentId = student?.id || studentProfileId;

    const { data: book } = await supabase
      .from('library_books')
      .select('copies_available')
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

    return data;
  },

  async getIssuedBooks(studentProfileId?: string): Promise<IssuedBook[]> {
    let query = supabase
      .from('issued_books')
      .select('*, library_books(*), students(roll_number, profiles(full_name))')
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
    return data || [];
  }
};
