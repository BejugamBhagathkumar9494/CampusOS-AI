import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { hostelService } from '../../services/hostelService';
import { complaintService } from '../../services/complaintService';
import { supabase } from '../../services/supabaseClient';
import { AlertTriangle, Home, Calendar, Send } from 'lucide-react';

export default function HostelPage() {
  const { profile } = useAuth();
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);

  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'complaints' | 'leave'>('complaints');

  const fetchComplaints = async () => {
    try {
      const data = await complaintService.getComplaints(profile?.id);
      setComplaints(data);
    } catch {
      setComplaints([]);
    }
  };

  const fetchLeaves = async () => {
    try {
      const data = await hostelService.getLeaveRequests(profile?.id);
      setLeaveRequests(data);
    } catch {
      setLeaveRequests([]);
    }
  };

  const fetchRoomDetails = async () => {
    setLoadingRoom(true);
    try {
      if (!profile?.id) return;
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (student) {
        const { data: alloc } = await supabase
          .from('hostel_allocations')
          .select('*, rooms(*, hostels(*))')
          .eq('student_id', student.id)
          .single();

        if (alloc) {
          setRoomDetails(alloc);
        } else {
          setRoomDetails(null);
        }
      }
    } catch (err) {
      console.error('Error fetching room allocation:', err);
    } finally {
      setLoadingRoom(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchLeaves();
    fetchRoomDetails();
  }, [profile]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle || !complaintText || !profile?.id) return;
    setSubmitting(true);
    try {
      const roomNum = roomDetails?.rooms?.room_number || 'General';
      await complaintService.fileComplaint(
        profile.id,
        complaintTitle,
        `${complaintText} [Room ${roomNum}]`,
        'Hostel Maintenance',
        'medium'
      );
      setComplaintTitle('');
      setComplaintText('');
      await fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason || !leaveStart || !leaveEnd || !profile?.id) return;
    setSubmitting(true);
    try {
      const roomNum = roomDetails?.rooms?.room_number || 'Unallocated';
      await hostelService.applyLeave(profile.id, {
        reason: leaveReason,
        start_date: leaveStart,
        end_date: leaveEnd,
        room_number: roomNum
      });
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
      await fetchLeaves();
    } catch (err: any) {
      alert(err.message || 'Failed to apply leave.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </span>
          Hostel Hub & Maintenance Portal
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">File maintenance tickets, check room details, and submit leave requests.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Maintenance Tickets ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'leave' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hostel Leave Requests ({leaveRequests.length})
        </button>
      </div>

      {activeTab === 'complaints' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmitComplaint} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Submit Maintenance Request</h2>
            <input
              type="text"
              value={complaintTitle}
              onChange={(e) => setComplaintTitle(e.target.value)}
              placeholder="Complaint Subject (e.g. WiFi router power issue)"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              required
            />
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Detailed description of issue..."
              className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              required
            />
            <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> {submitting ? 'Submitting to database...' : 'Submit Maintenance Ticket'}
            </button>
          </form>

          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-600" /> Allotted Room Details
            </h2>
            {loadingRoom ? (
              <p className="text-xs text-slate-400 font-medium">Checking room allocation database...</p>
            ) : !roomDetails ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
                <p className="font-bold text-slate-700">No Active Room Allocation</p>
                <p>You have not been assigned to a hostel block/room for this academic term.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
                  <span className="text-slate-500">Room Number</span>
                  <span className="font-bold text-slate-900">{roomDetails.rooms?.room_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
                  <span className="text-slate-500">Block & Wing</span>
                  <span className="font-bold text-slate-900">{roomDetails.rooms?.hostels?.name || 'Main Hall'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
                  <span className="text-slate-500">Bed Allocation</span>
                  <span className="font-bold text-slate-900">Bed {roomDetails.bed_number || '1'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmitLeave} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Apply for Hostel Leave</h2>
            <input
              type="text"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Reason for leave (e.g. Weekend family visit)"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-indigo-500"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Start Date</label>
                <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">End Date</label>
                <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900" required />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors">
              {submitting ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </form>

          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Leave History ({leaveRequests.length})
            </h2>
            {leaveRequests.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium p-4 text-center">No leave applications filed yet.</p>
            ) : (
              leaveRequests.map((l) => (
                <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{l.reason}</p>
                    <p className="text-[11px] text-slate-400">{l.start_date} to {l.end_date}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Logged Maintenance Tickets ({complaints.length})</h2>
          {complaints.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium p-4 text-center">No active maintenance tickets submitted.</p>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id || c.title} className="p-4.5 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{c.description}</p>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">Status: {c.status}</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-extrabold border ${
                    c.priority === 'urgent' || c.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    Priority: {c.priority || 'medium'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
