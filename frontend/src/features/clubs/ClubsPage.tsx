import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { eventService } from '../../services/eventService';
import { supabase } from '../../services/supabaseClient';
import { Users, Plus, Trash2, Sparkles, X, UserCheck, Eye } from 'lucide-react';

export default function ClubsPage() {
  const { profile } = useAuth();
  
  // Allow club creation and management for super_admin, admin, administrator, faculty, or default
  const roleLower = (profile?.role || '').toLowerCase();
  const isAdmin = !profile?.role || ['admin', 'super_admin', 'administrator', 'faculty'].includes(roleLower);

  const [clubs, setClubs] = useState<any[]>([]);
  const [joinedClubIds, setJoinedClubIds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '', category: 'Technical' });
  const [submitting, setSubmitting] = useState(false);

  // Member viewing modal state
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [activeClubName, setActiveClubName] = useState('');
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

    let channel: any;
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

  const handleJoin = async (clubId: any, name: string) => {
    try {
      await eventService.joinClub(profile?.id || '', clubId);
      setJoinedClubIds(prev => [...prev, clubId]);
      alert(`Membership request for "${name}" successfully recorded!`);
      fetchClubsData();
    } catch (err: any) {
      alert(err.message || 'Failed to join club.');
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      alert(err.message || 'Failed to create club.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClub = async (clubId: any, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the university system?`)) return;
    try {
      await eventService.deleteClub(clubId);
      setClubs(prev => prev.filter(c => c.id !== clubId));
      fetchClubsData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete club.');
    }
  };

  const handleOpenMembersModal = async (clubId: any, clubName: string) => {
    setActiveClubName(clubName);
    setMembersModalOpen(true);
    setLoadingMembers(true);
    try {
      const data = await eventService.getClubMemberships(clubId);
      setClubMembers(data || []);
    } catch (e) {
      console.error('Error fetching members:', e);
    } finally {
      setLoadingMembers(false);
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

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenMembersModal(club.id, club.name)}
                      className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-purple-100"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Members & Applicants
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleJoin(club.id, club.name)}
                      disabled={isJoined}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isJoined ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join Society'}
                    </button>

                    <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <Users className="w-3.5 h-3.5 text-purple-600" /> {club.members_count || club.member_count || 12} Members
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Club Modal */}
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

      {/* View Registered Members Modal */}
      {membersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-5 border border-slate-100 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button onClick={() => setMembersModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" /> {activeClubName} - Registered Roster
              </h3>
              <p className="text-xs text-slate-500 mt-1">Student details, roll numbers, and participation status from Supabase.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {loadingMembers ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">Fetching registered students...</div>
              ) : clubMembers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">No registered students found for this club.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {clubMembers.map((m, idx) => {
                    const prof = m.students?.profiles || {};
                    const roll = m.students?.roll_number || `STU00${idx + 1}`;
                    const name = prof.full_name || 'Student Member';
                    const email = prof.email || 'student@campus.edu';
                    const dept = prof.department || 'Computer Science';

                    return (
                      <div key={m.id || idx} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{email} • Roll: {roll}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {m.role || 'Member'}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{dept}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setMembersModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
