import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { eventService } from '../../services/eventService';
import { Calendar } from 'lucide-react';

export default function EventsPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getEvents();
      setEvents(res);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: any, title: string) => {
    if (!profile?.id) return;
    try {
      await eventService.registerEvent(profile.id, eventId);
      alert(`Successfully registered for ${title}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to register for event.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#EAE3D8]">
            <Calendar className="w-5 h-5" />
          </span>
          Campus Events & Hackathons
        </h1>
        <p className="text-sm text-[#5E6763] font-medium mt-1">Register for technical fests, guest lectures, AI hackathons, and sports tournaments.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#8E9893] font-medium">Loading events from database...</div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#EAE3D8] space-y-2">
          <Calendar className="w-8 h-8 text-[#8E9893] mx-auto" />
          <p className="text-sm font-bold text-[#1C211F]">No Events Scheduled</p>
          <p className="text-xs text-[#5E6763]">There are currently no active campus events open for registration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#C85A32] bg-[#FDF2ED] px-2.5 py-0.5 rounded-md border border-[#EAE3D8]">
                    {new Date(ev.event_date).toLocaleDateString()}
                  </span>
                  <span className="text-[11px] font-extrabold text-[#8E9893] font-mono">{ev.location || 'Auditorium'}</span>
                </div>
                <h3 className="text-lg font-bold text-[#1C211F]">{ev.title}</h3>
                <p className="text-xs text-[#5E6763] font-medium">{ev.description}</p>
              </div>

              <button
                onClick={() => handleRegister(ev.id, ev.title)}
                className="w-full py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white text-xs font-bold transition-all shadow-xs"
              >
                Register Event Pass
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
