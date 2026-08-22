import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { libraryService } from '../../services/libraryService.js';
import { BookOpen, Search, CheckCircle, Plus, ShieldCheck, Clock, FileText, Check, X } from 'lucide-react';

export default function LibraryPage() {
  const { profile } = useAuth();
  const roleLower = (profile?.role || '').toLowerCase();
  const isAdmin = ['admin', 'super_admin', 'librarian', 'library'].includes(roleLower);

  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Request modal state for students
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqAuthor, setReqAuthor] = useState('');
  const [reqCategory, setReqCategory] = useState('Book');
  const [reqIsbn, setReqIsbn] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // Book requests roster
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

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

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const studentId = isAdmin ? null : profile?.id;
      const res = await libraryService.getBookRequests(studentId);
      setRequests(res || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchRequests();
  }, [profile]);

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

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    setSubmittingReq(true);
    try {
      await libraryService.requestBookOrPaper(profile?.id, {
        title: reqTitle,
        author: reqAuthor,
        category: reqCategory,
        isbn_or_link: reqIsbn,
        reason: reqReason
      });

      setShowRequestModal(false);
      setReqTitle('');
      setReqAuthor('');
      setReqIsbn('');
      setReqReason('');
      setMsg(`Request for "${reqTitle}" submitted successfully for Admin approval!`);
      setTimeout(() => setMsg(''), 5000);
      fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to submit request.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleApproveRequest = async (requestId, title) => {
    try {
      await libraryService.approveBookRequest(requestId, 3);
      setMsg(`Request for "${title}" approved and added to active library catalog DB!`);
      setTimeout(() => setMsg(''), 5000);
      fetchRequests();
      fetchBooks();
    } catch (err) {
      alert(err.message || 'Failed to approve request.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await libraryService.rejectBookRequest(requestId);
      fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to reject request.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </span>
            Library & Research Catalog
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Search reference books, research papers, and manage university requests.</p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Request Book / Paper
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {msg}
        </div>
      )}

      {/* Admin Request Management Roster */}
      {isAdmin && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Admin Library Management: Student Book & Paper Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Approve student requests to automatically add new books and papers to the library catalog.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold">
              {requests.filter(r => r.status === 'pending_approval').length} Pending Requests
            </span>
          </div>

          {loadingRequests ? (
            <p className="text-xs text-slate-400 font-medium p-4 text-center">Fetching student requests from database...</p>
          ) : requests.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium p-4 text-center bg-slate-50 rounded-xl">No student book/paper requests recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => (
                <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-mono">
                      {req.category || 'Book'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{req.title} <span className="text-xs font-normal text-slate-500">by {req.author}</span></h3>
                    <p className="text-xs text-slate-500 mt-0.5">{req.reason || 'Requested for academic research'}</p>
                    {req.profiles?.full_name && <p className="text-[11px] text-slate-400 font-medium mt-0.5">Requested by: {req.profiles.full_name} ({req.profiles.email})</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {req.status === 'approved' ? 'Approved & Added' : req.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                    </span>

                    {req.status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => handleApproveRequest(req.id, req.title)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Add to Library
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student View: My Submitted Requests */}
      {!isAdmin && requests.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> My Submitted Book & Research Paper Requests ({requests.length})
          </h2>
          <div className="divide-y divide-slate-100">
            {requests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-mono">
                    {req.category || 'Book'}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 mt-1">{req.title}</h3>
                  <p className="text-[11px] text-slate-400">Author: {req.author}</p>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {req.status === 'approved' ? 'Approved & Added' : req.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                </span>
              </div>
            ))}
          </div>
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
                    <p className="text-[11px] text-slate-400 font-mono mt-1">ISBN / Ref: {book.isbn || 'N/A'}</p>
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

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900">Request New Book or Research Paper</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum Computing & Neural Networks"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Author / Researcher</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Doe"
                  value={reqAuthor}
                  onChange={(e) => setReqAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="Book">Textbook</option>
                    <option value="Research Paper">Research Paper</option>
                    <option value="Reference Manual">Reference Manual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ISBN / Link</label>
                  <input
                    type="text"
                    placeholder="e.g. 978-0123456789"
                    value={reqIsbn}
                    onChange={(e) => setReqIsbn(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Request</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this material is required for course or research..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {submittingReq ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
