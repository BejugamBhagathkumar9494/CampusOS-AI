import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { eventService } from '../../services/eventService.js';
import { supabase } from '../../services/supabaseClient.js';
import { Users, Plus, Trash2, Check, Sparkles, X, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function ClubsPage() {
  const { profile } = useAuth();
  
  // Allow club creation for super_admin, admin, administrator, faculty, or default
  const roleLower = (profile?.role || '').toLowerCase();
  const isAdmin = !profile?.role || ['admin', 'super_admin', 'administrator', 'faculty'].includes(roleLower);

  const [clubs, setClubs] = useState([]);
  const [joinedClubIds, setJoinedClubIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '', category: 'Technical' });
  const [submitting, setSubmitting] = useState(false);

  async function fetchClubsData() {
    try {
      setLoading(true);
      const res = await eventService.getClubs();
      setClubs(res || []);

      if (profile?.id) {
        try {
          const { data: myMemberships } = await supabase
            .from('club_memberships')
            .select('club_id')
            .eq('student_id', profile.id);

          if (myMemberships) {
            setJoinedClubIds(myMemberships.map(m => m.club_id));
          }
        } catch (mErr) {
          console.warn('Membership query warning:', mErr);
        }
      }
    } catch (err) {
      console.error('Error fetching clubs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClubsData();

    let channel;
    try {
      channel = supabase
        .channel('public:clubs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, () => {
          fetchClubsData();
        })
        .subscribe();
    } catch (e) {
      console.warn('Channel sub warning:', e);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleJoin = async (clubId, name) => {
    try {
      await eventService.joinClub(profile?.id, clubId);
      setJoinedClubIds(prev => [...prev, clubId]);
      alert(`Membership request for "${name}" successfully recorded!`);
      fetchClubsData();
    } catch (err) {
      alert(err.message || 'Failed to join club.');
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClub.name.trim()) return;

    try {
      setSubmitting(true);
      const created = await eventService.createClub(newClub);
      setShowAddModal(false);
      setNewClub({ name: '', description: '', category: 'Technical' });
      setClubs(prev => [created, ...prev]);
      alert(`Student club "${created.name}" created successfully!`);
      fetchClubsData();
    } catch (err) {
      alert(err.message || 'Failed to create club.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClub = async (clubId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the university system?`)) return;
    try {
      await eventService.deleteClub(clubId);
      setClubs(prev => prev.filter(c => c.id !== clubId));
      fetchClubsData();
    } catch (err) {
      alert(err.message || 'Failed to delete club.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="w-5 h-5" />
            </span>
            Student Clubs & Societies
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Explore active student societies, manage memberships, and participate in campus activities live.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create New Club
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-medium">Loading student clubs from database...</div>
      ) : clubs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-base font-bold text-slate-700">No Student Clubs Found</p>
          <p className="text-xs text-slate-500">Click "Create New Club" above to form the first student society.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {clubs.map((club) => {
            const isJoined = joinedClubIds.includes(club.id);

            return (
              <div key={club.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between relative group hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100">
                      <Users className="w-5 h-5" />
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteClub(club.id, club.name)}
                        title="Delete Club"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                      {club.category || 'Technical'} Society
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{club.name}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                      {club.description || 'Official university student society.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active Society
                  </span>

                  <button
                    onClick={() => handleJoin(club.id, club.name)}
                    disabled={isJoined}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                      isJoined
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Joined
                      </>
                    ) : (
                      'Participate / Join'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" /> Add New Student Club
              </h3>
              <p className="text-xs text-slate-500 mt-1">Register a new official university club in Supabase.</p>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Club Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Data Science Society"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newClub.category}
                  onChange={(e) => setNewClub({ ...newClub, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Social Service">Social Service</option>
                  <option value="Literary">Literary</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe club activities and objectives..."
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
