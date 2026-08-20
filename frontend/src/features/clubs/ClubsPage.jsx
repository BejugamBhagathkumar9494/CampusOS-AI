import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { eventService } from '../../services/eventService.js';
import { Users } from 'lucide-react';

export default function ClubsPage() {
  const { profile } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    eventService.getClubs()
      .then((res) => setClubs(res))
      .catch((err) => console.error('Error fetching clubs:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (clubId, name) => {
    if (!profile?.id) return;
    try {
      await eventService.joinClub(profile.id, clubId);
      alert(`Joined ${name} membership recorded successfully!`);
    } catch {
      alert('Failed to join club.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Users className="w-5 h-5" />
          </span>
          Student Clubs & Societies
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Explore active student societies, enrollments, and executive committee leads.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading student clubs from database...</div>
      ) : clubs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Student Clubs Found</p>
          <p className="text-xs text-slate-500">There are currently no active clubs registered on the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{club.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{club.description || 'Student Society'} • {club.category || 'General'}</p>
              <button
                onClick={() => handleJoin(club.id, club.name)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Join Club
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
