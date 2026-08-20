import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { libraryService } from '../../services/libraryService.js';
import { BookOpen, Search, CheckCircle } from 'lucide-react';

export default function LibraryPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
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

  const handleIssue = async (bookId, title) => {
    if (!profile?.id) return;
    try {
      await libraryService.issueBook(profile.id, bookId);
      setMsg(`Book "${title}" issued successfully!`);
      setTimeout(() => setMsg(''), 4000);
      fetchBooks();
    } catch (err) {
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

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
              placeholder="Search by book title, author, or category..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500"
            />
          </div>
          <button onClick={fetchBooks} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
            Search Catalogue
          </button>
        </div>

        <div className="pt-2">
          {loading ? (
            <p className="text-xs text-slate-400 font-medium p-4 text-center">Querying library catalog...</p>
          ) : books.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Books Found</p>
              <p className="text-xs text-slate-500">No library records match your current search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {books.map((book) => (
                <div key={book.id} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between gap-3 hover:bg-slate-50 transition-all">
                  <div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 uppercase font-mono">
                      {book.category || 'General'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{book.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Author: {book.author}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">ISBN: {book.isbn || 'N/A'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-xs font-bold ${book.copies_available > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {book.copies_available} Copies Available
                    </span>
                    <button
                      onClick={() => handleIssue(book.id, book.title)}
                      disabled={book.copies_available <= 0}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 transition-all shadow-xs"
                    >
                      Borrow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
