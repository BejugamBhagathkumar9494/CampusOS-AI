import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { libraryService } from '../../services/libraryService';
import { LibraryBook } from '../../types/database';
import { BookOpen, Search, CheckCircle } from 'lucide-react';

export default function LibraryPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await libraryService.getBooks(query);
      setBooks(res);
    } catch (err) {
      console.error('Library fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleIssue = async (bookId: string, title: string) => {
    if (!profile?.id) return;
    try {
      await libraryService.issueBook(profile.id, bookId);
      setMsg(`Book "${title}" issued successfully!`);
      setTimeout(() => setMsg(''), 4000);
      fetchBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to issue book.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <BookOpen className="w-5 h-5" />
          </span>
          Library & Vector Search
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Search reference books, research papers, and available university copies.</p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {msg}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
            placeholder="Search titles, authors, or subjects (e.g. 'Algorithms', 'Networks')..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-xs transition-all"
          />
        </div>
        <button onClick={fetchBooks} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl text-sm text-white font-bold transition-all shadow-md shadow-indigo-500/20">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Available Library Catalog ({books.length})</h2>
        {loading ? (
          <p className="text-xs text-slate-400 font-medium p-4 text-center">Searching catalog...</p>
        ) : books.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Books Found</p>
            <p className="text-xs text-slate-500">No matching library records found for your search query.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <div key={book.id || book.isbn} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{book.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Author: {book.author} • Category: {book.category || 'CS'}</p>
                  {book.isbn && <p className="text-[11px] text-slate-400 font-mono mt-1">ISBN: {book.isbn}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold border ${
                    book.copies_available > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {book.copies_available > 0 ? `${book.copies_available} Available` : 'All Issued'}
                  </span>
                  {book.copies_available > 0 && (
                    <button onClick={() => handleIssue(book.id, book.title)} className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors">
                      Borrow Book
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
