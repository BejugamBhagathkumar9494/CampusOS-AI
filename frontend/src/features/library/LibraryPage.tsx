import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { libraryService } from '../../services/libraryService';
import { BookOpen, Search, CheckCircle, Plus, ShieldCheck, Clock, Check } from 'lucide-react';

export default function LibraryPage() {
  const { profile } = useAuth();
  const roleLower = (profile?.role || '').toLowerCase();
  const isAdmin = ['admin', 'super_admin', 'librarian', 'library'].includes(roleLower);

  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Student Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqAuthor, setReqAuthor] = useState('');
  const [reqCategory, setReqCategory] = useState('Book');
  const [reqIsbn, setReqIsbn] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // Admin Direct Add Book modal state
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCopies, setNewCopies] = useState(5);
  const [addingBook, setAddingBook] = useState(false);

  // Book requests roster
  const [requests, setRequests] = useState<any[]>([]);
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

  const handleIssue = async (bookId: any, title: string) => {
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    setSubmittingReq(true);
    try {
      await libraryService.requestBookOrPaper(profile?.id || '', {
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
    } catch (err: any) {
      alert(err.message || 'Failed to submit request.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleDirectAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAddingBook(true);
    try {
      await libraryService.addBookDirectly({
        title: newTitle,
        author: newAuthor,
        category: newCategory,
        isbn: newIsbn,
        copies_available: newCopies
      });

      setShowAddBookModal(false);
      setNewTitle('');
      setNewAuthor('');
      setNewIsbn('');
      setNewCopies(5);
      setMsg(`Successfully added "${newTitle}" directly into the library catalogue DB!`);
      setTimeout(() => setMsg(''), 5000);
      fetchBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to add book to catalogue.');
    } finally {
      setAddingBook(false);
    }
  };

  const handleApproveRequest = async (requestId: any, title: string) => {
    try {
      await libraryService.approveBookRequest(requestId, 3);
      setMsg(`Request for "${title}" approved and added to active library catalog DB!`);
      setTimeout(() => setMsg(''), 5000);
      fetchRequests();
      fetchBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to approve request.');
    }
  };

  const handleRejectRequest = async (requestId: any) => {
    try {
      await libraryService.rejectBookRequest(requestId);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#EAE3D8]">
              <BookOpen className="w-5 h-5" />
            </span>
            Library & Research Catalog
          </h1>
          <p className="text-sm text-[#5E6763] font-medium mt-1">Search reference books, research papers, and manage university requests.</p>
        </div>

        {/* Super Admin / Admin does NOT have request option; Admin directly adds books for users. Students can request books. */}
        {isAdmin ? (
          <button
            onClick={() => setShowAddBookModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-md shadow-[#C85A32]/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Book / Paper to Library
          </button>
        ) : (
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-md shadow-[#C85A32]/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Request Book / Paper
          </button>
        )}
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-[#F0F6F2] border border-[#5E8C71]/30 text-[#5E8C71] text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-[#5E8C71] shrink-0" />
          {msg}
        </div>
      )}

      {/* Admin Request Management Roster */}
      {isAdmin && (
        <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-[#1C211F] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C85A32]" /> Admin Library Control: Student Book & Paper Requests
              </h2>
              <p className="text-xs text-[#5E6763] mt-0.5">Approve student requests or add books directly to make them available for students to borrow.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FEF7ED] text-[#D9822B] border border-[#D9822B]/30 text-xs font-extrabold">
              {requests.filter(r => r.status === 'pending_approval').length} Pending Requests
            </span>
          </div>

          {loadingRequests ? (
            <p className="text-xs text-[#8E9893] font-medium p-4 text-center">Fetching student requests from database...</p>
          ) : requests.length === 0 ? (
            <p className="text-xs text-[#5E6763] font-medium p-4 text-center bg-[#FAF7F2] rounded-xl">No student book/paper requests recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#EAE3D8]">
              {requests.map((req) => (
                <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-[#FDF2ED] text-[#C85A32] font-mono border border-[#EAE3D8]">
                      {req.category || 'Book'}
                    </span>
                    <h3 className="text-sm font-bold text-[#1C211F] mt-1">{req.title} <span className="text-xs font-normal text-[#5E6763]">by {req.author}</span></h3>
                    <p className="text-xs text-[#5E6763] mt-0.5">{req.reason || 'Requested for academic research'}</p>
                    {req.profiles?.full_name && <p className="text-[11px] text-[#8E9893] font-medium mt-0.5">Requested by: {req.profiles.full_name} ({req.profiles.email})</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                      req.status === 'approved' ? 'bg-[#F0F6F2] text-[#5E8C71] border-[#5E8C71]/30' :
                      req.status === 'rejected' ? 'bg-[#FDF2ED] text-[#C85A32] border-[#C85A32]/30' :
                      'bg-[#FEF7ED] text-[#D9822B] border-[#D9822B]/30'
                    }`}>
                      {req.status === 'approved' ? 'Approved & Added' : req.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                    </span>

                    {req.status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => handleApproveRequest(req.id, req.title)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#5E8C71] hover:bg-[#4d735d] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Add to Library
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#F4EFEA] hover:bg-[#FDF2ED] text-[#1C211F] hover:text-[#C85A32] text-xs font-bold transition-all"
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
        <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C85A32]" /> My Submitted Book & Research Paper Requests ({requests.length})
          </h2>
          <div className="divide-y divide-[#EAE3D8]">
            {requests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#FDF2ED] text-[#C85A32] font-mono border border-[#EAE3D8]">
                    {req.category || 'Book'}
                  </span>
                  <h3 className="text-xs font-bold text-[#1C211F] mt-1">{req.title}</h3>
                  <p className="text-[11px] text-[#8E9893]">Author: {req.author}</p>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                  req.status === 'approved' ? 'bg-[#F0F6F2] text-[#5E8C71] border-[#5E8C71]/30' :
                  req.status === 'rejected' ? 'bg-[#FDF2ED] text-[#C85A32] border-[#C85A32]/30' :
                  'bg-[#FEF7ED] text-[#D9822B] border-[#D9822B]/30'
                }`}>
                  {req.status === 'approved' ? 'Approved & Added' : req.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Library Catalog View */}
      <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E9893] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
              placeholder="Search by book title, author, or category..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EAE3D8] text-xs sm:text-sm text-[#1C211F] bg-[#FAF7F2] focus:bg-white outline-none focus:border-[#C85A32]"
            />
          </div>
          <button onClick={fetchBooks} className="px-6 py-3 bg-[#C85A32] hover:bg-[#B44E27] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#C85A32]/20">
            Search Catalogue
          </button>
        </div>

        <div className="pt-2">
          {loading ? (
            <p className="text-xs text-[#8E9893] font-medium p-4 text-center">Querying library catalog...</p>
          ) : books.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#EAE3D8] space-y-2">
              <BookOpen className="w-8 h-8 text-[#8E9893] mx-auto" />
              <p className="text-sm font-bold text-[#1C211F]">No Books Found</p>
              <p className="text-xs text-[#5E6763]">No library records match your current search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {books.map((book) => (
                <div key={book.id} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] flex flex-col justify-between gap-3 hover:bg-[#F4EFEA] transition-all">
                  <div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-[#FDF2ED] text-[#C85A32] uppercase font-mono border border-[#EAE3D8]">
                      {book.category || 'General'}
                    </span>
                    <h3 className="text-base font-bold text-[#1C211F] mt-2">{book.title}</h3>
                    <p className="text-xs text-[#5E6763] font-medium">Author: {book.author}</p>
                    <p className="text-[11px] text-[#8E9893] font-mono mt-1">ISBN / Ref: {book.isbn || 'N/A'}</p>
                  </div>
                  <div className="pt-2 border-t border-[#EAE3D8] flex items-center justify-between">
                    <span className={`text-xs font-bold ${book.copies_available > 0 ? 'text-[#5E8C71]' : 'text-[#C85A32]'}`}>
                      {book.copies_available} Copies Available
                    </span>
                    <button
                      onClick={() => handleIssue(book.id, book.title)}
                      disabled={book.copies_available <= 0}
                      className="px-3.5 py-1.5 rounded-lg bg-[#C85A32] hover:bg-[#B44E27] text-white text-xs font-bold disabled:opacity-50 transition-all shadow-xs"
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

      {/* Student Request Modal */}
      {showRequestModal && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C211F]/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-[#EAE3D8] shadow-2xl relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-[#1C211F]">Request New Book or Research Paper</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-[#8E9893] hover:text-[#1C211F]">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C211F] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum Computing & Neural Networks"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C211F] block mb-1">Author / Researcher</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Doe"
                  value={reqAuthor}
                  onChange={(e) => setReqAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1C211F] block mb-1">Category</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-bold focus:outline-none focus:border-[#C85A32]"
                  >
                    <option value="Book">Textbook</option>
                    <option value="Research Paper">Research Paper</option>
                    <option value="Reference Manual">Reference Manual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C211F] block mb-1">ISBN / Link</label>
                  <input
                    type="text"
                    placeholder="e.g. 978-0123456789"
                    value={reqIsbn}
                    onChange={(e) => setReqIsbn(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C211F] block mb-1">Reason for Request</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this material is required for course or research..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-medium focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-[#F4EFEA] text-[#1C211F] font-bold text-xs hover:bg-[#EAE3D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="w-1/2 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-md shadow-[#C85A32]/20 disabled:opacity-50"
                >
                  {submittingReq ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Direct Add Book Modal */}
      {showAddBookModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C211F]/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-[#EAE3D8] shadow-2xl relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-[#1C211F]">Add Book or Paper to Library Catalogue</h3>
              <button onClick={() => setShowAddBookModal(false)} className="text-[#8E9893] hover:text-[#1C211F]">✕</button>
            </div>

            <form onSubmit={handleDirectAddBook} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C211F] block mb-1">Book / Paper Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Architecture 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C211F] block mb-1">Author / Publisher</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Andrew Tanenbaum"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1C211F] block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-bold focus:outline-none focus:border-[#C85A32]"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Research Paper">Research Paper</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Engineering">Engineering</option>
                    <option value="General">General Reference</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C211F] block mb-1">Copies Available</label>
                  <input
                    type="number"
                    min={1}
                    value={newCopies}
                    onChange={(e) => setNewCopies(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C211F] block mb-1">ISBN / Reference Code</label>
                <input
                  type="text"
                  placeholder="e.g. ISBN-978-0133591620"
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-[#F4EFEA] text-[#1C211F] font-bold text-xs hover:bg-[#EAE3D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingBook}
                  className="w-1/2 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-md shadow-[#C85A32]/20 disabled:opacity-50"
                >
                  {addingBook ? 'Publishing...' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
