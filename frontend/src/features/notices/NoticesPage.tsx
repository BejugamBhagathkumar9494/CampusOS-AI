import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { announcementService } from '../../services/announcementService';
import { Bell, FileText, X } from 'lucide-react';

export default function NoticesPage() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCircular, setActiveCircular] = useState<any>(null);

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FEF7ED] text-[#D9822B] border border-[#EAE3D8]">
            <Bell className="w-5 h-5" />
          </span>
          Notice Board & Circulars
        </h1>
        <p className="text-sm text-[#5E6763] font-medium mt-1">Official administration announcements, holiday lists, and exam circulars.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
        {loading ? (
          <p className="text-xs text-[#8E9893] font-medium p-4 text-center">Loading circulars from database...</p>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#EAE3D8] space-y-2">
            <Bell className="w-8 h-8 text-[#8E9893] mx-auto" />
            <p className="text-sm font-bold text-[#1C211F]">No Active Circulars</p>
            <p className="text-xs text-[#5E6763]">There are currently no administrative notices published for your role.</p>
          </div>
        ) : (
          announcements.map((n) => (
            <div key={n.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-[#C85A32] bg-[#FDF2ED] px-2.5 py-0.5 rounded-md border border-[#EAE3D8] uppercase">{n.target_role || 'All'}</span>
                <h3 className="text-sm font-bold text-[#1C211F] mt-1">{n.title}</h3>
                <p className="text-xs text-[#8E9893] font-medium mt-0.5">
                  Published on {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today'}
                </p>
              </div>
              <button
                onClick={() => setActiveCircular(n)}
                className="text-xs font-bold text-[#C85A32] hover:underline px-3 py-1.5 rounded-xl bg-white border border-[#EAE3D8] shadow-2xs"
              >
                Read Circular
              </button>
            </div>
          ))
        )}
      </div>

      {activeCircular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C211F]/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-[#EAE3D8] shadow-2xl relative">
            <button onClick={() => setActiveCircular(null)} className="absolute top-4 right-4 text-[#8E9893] hover:text-[#1C211F] p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FEF7ED] text-[#D9822B] border border-[#EAE3D8]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C211F]">{activeCircular.title}</h3>
                <p className="text-xs text-[#5E6763] font-mono">Target Audience: {activeCircular.target_role || 'All Roles'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs text-[#2D3330] leading-relaxed max-h-60 overflow-y-auto">
              {activeCircular.content || activeCircular.message || 'No additional text content provided in this official notice.'}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveCircular(null)} className="px-5 py-2 rounded-xl bg-[#C85A32] text-white font-bold text-xs hover:bg-[#B44E27] transition-colors">
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
