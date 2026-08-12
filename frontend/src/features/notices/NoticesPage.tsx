import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '../../types/database';
import { Bell, FileText, X } from 'lucide-react';

export default function NoticesPage() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCircular, setActiveCircular] = useState<Announcement | null>(null);

  useEffect(() => {
    setLoading(true);
    announcementService.getAnnouncements(profile?.role)
      .then((res) => setAnnouncements(res))
      .catch((err) => console.error('Error fetching announcements:', err))
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Bell className="w-5 h-5" />
          </span>
          Notice Board & Circulars
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Official administration announcements, holiday lists, and exam circulars.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        {loading ? (
          <p className="text-xs text-slate-400 font-medium p-4 text-center">Loading circulars from database...</p>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Active Circulars</p>
            <p className="text-xs text-slate-500">There are currently no administrative notices published for your role.</p>
          </div>
        ) : (
          announcements.map((n: any) => (
            <div key={n.id} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase">{n.target_role || 'All'}</span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{n.title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Published on {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today'}
                </p>
              </div>
              <button
                onClick={() => setActiveCircular(n)}
                className="text-xs font-bold text-indigo-600 hover:underline px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
              >
                Read Circular
              </button>
            </div>
          ))
        )}
      </div>

      {/* Circular Reader Modal */}
      {activeCircular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl relative">
            <button onClick={() => setActiveCircular(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeCircular.title}</h3>
                <p className="text-xs text-slate-500 font-mono">Target: {activeCircular.target_role || 'All'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto">
              {activeCircular.content || 'No detailed text attached to this circular.'}
            </div>

            <div className="pt-2">
              <button onClick={() => setActiveCircular(null)} className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors">
                Close Circular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
