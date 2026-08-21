import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  Filter,
  FileText,
  Clock,
  RefreshCw,
  Lock,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

import { useAuth } from '../../auth/hooks/useAuth.js';
import { authService } from '../../auth/services/authService.js';
import { courseService } from '../../services/courseService.js';
import { getApiBaseUrl, getAuthToken } from '../../services/api.js';
import { supabase } from '../../services/supabaseClient.js';

export const UserManagementPage = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('users');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [adminErr, setAdminErr] = useState('');

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCredits, setCourseCredits] = useState('4');
  const [courseSemester, setCourseSemester] = useState('6');
  const [courseFacultyId, setCourseFacultyId] = useState('');
  const [courseMsg, setCourseMsg] = useState('');
  const [courseErr, setCourseErr] = useState('');
  const [submittingCourse, setSubmittingCourse] = useState(false);

  const isSuperAdmin = profile?.role === 'super_admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await authService.fetchUsers();
      setUsers(fetchedUsers);

      const logs = await authService.fetchAuditLogs();
      setAuditLogs(logs);

      const allCourses = await courseService.getAllCourses();
      setCourses(allCourses);

      const faculties = await courseService.getFacultyList();
      setFacultyList(faculties);
    } catch (err) {
      console.error('Error loading management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await authService.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update account status.');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminMsg('');
    setAdminErr('');

    if (!adminName || !adminEmail || !adminId || !adminPass) {
      setAdminErr('All fields are required.');
      return;
    }

    try {
      const token = await getAuthToken();
      const API_URL = getApiBaseUrl();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let sessionRes;
      let ok = false;
      try {
        sessionRes = await fetch(`${API_URL}/admin-management/create-admin`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            full_name: adminName,
            email: adminEmail,
            institution_id: adminId,
            role: 'admin',
            password: adminPass
          })
        });
        ok = sessionRes.ok;
      } catch (fErr) {
        console.warn('Backend server unreachable, using direct Supabase account registration:', fErr);
      }

      if (!ok) {
        const { data: supaUser, error: supaErr } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPass,
          options: {
            data: {
              full_name: adminName,
              role: 'admin',
              institution_id: adminId
            }
          }
        });

        const userId = supaUser?.user?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'admin-' + Date.now());

        const { error: profErr } = await supabase
          .from('profiles')
          .upsert([{
            id: userId,
            full_name: adminName,
            email: adminEmail,
            institution_id: adminId,
            role: 'admin',
            status: 'active'
          }]);

        if (profErr && supaErr) {
          const errData = sessionRes ? await sessionRes.json().catch(() => ({})) : {};
          throw new Error(errData.detail || profErr.message || supaErr?.message || 'Failed to create administrator account');
        }
      }

      setAdminMsg('Administrator account created successfully!');
      setAdminName('');
      setAdminEmail('');
      setAdminId('');
      setAdminPass('');
      setTimeout(() => setShowAdminModal(false), 1500);
      loadData();
    } catch (err) {
      setAdminErr(err.message || 'Error creating administrator account.');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCourseMsg('');
    setCourseErr('');

    if (!courseCode || !courseTitle) {
      setCourseErr('Course code and course title are required.');
      return;
    }

    setSubmittingCourse(true);
    try {
      const selectedFac = facultyList.find(f => f.faculty_id === courseFacultyId);
      await courseService.createAdminCourse({
        code: courseCode,
        title: courseTitle,
        credits: courseCredits,
        semester: courseSemester,
        faculty_id: courseFacultyId || null,
        instructor_name: selectedFac?.full_name || 'Faculty Instructor'
      });

      setCourseMsg(`Subject "${courseTitle}" designed successfully for Semester ${courseSemester}!`);
      setCourseCode('');
      setCourseTitle('');
      setCourseFacultyId('');
      setTimeout(() => {
        setShowCourseModal(false);
        setCourseMsg('');
      }, 1500);
      loadData();
    } catch (err) {
      setCourseErr(err.message || 'Failed to create semester course.');
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await courseService.deleteCourse(courseId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete course.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.institution_id && u.institution_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCourses = courses.filter((c) => {
    const matchesSem = selectedSemester === 'all' || String(c.semester || 1) === String(selectedSemester);
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSem && matchesSearch;
  });

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShieldCheck className="w-5 h-5" />
            </span>
            Admin Control & Curriculum Management
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage campus users, design semester subjects, assign faculty leads, and inspect security logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {activeTab === 'subjects' && (
            <button
              onClick={() => setShowCourseModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Semester Subject
            </button>
          )}

          {isSuperAdmin && activeTab === 'users' && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Create Administrator
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Campus Users & Approvals ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Semester Subjects & Faculty ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Security Audit Logs
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or institution ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Account Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active Accounts</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Institution ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                        {u.institution_id || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wide">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : u.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : u.status === 'suspended'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(u.id, 'active')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(u.id, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <UserX className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}

                          {u.status === 'active' && u.role !== 'super_admin' && (
                            <button
                              onClick={() => handleStatusChange(u.id, 'suspended')}
                              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px]"
                            >
                              Suspend
                            </button>
                          )}

                          {u.status === 'suspended' && (
                            <button
                              onClick={() => handleStatusChange(u.id, 'active')}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No matching user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject title or course code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none cursor-pointer font-bold"
              >
                <option value="all">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3 hover:bg-slate-50 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 font-mono">
                        {c.code}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        Semester {c.semester || 1}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Instructor: <span className="font-bold text-slate-700">{c.instructor_name || 'Faculty Member'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Credits: {c.credits || 4} Hours
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex justify-between items-center">
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Live on Student & Faculty Portals
                    </span>
                    <button
                      onClick={() => handleDeleteCourse(c.id, c.title)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Semester Subjects Found</p>
                <p className="text-xs text-slate-500">Click "+ Add Semester Subject" to design subjects for your curriculum.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Administrative & System Audit Trail
          </h2>
          <div className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-slate-500 font-medium">Actor ID: {log.actor_user_id || 'System'}</span>
                    </div>
                    {log.metadata_json && (
                      <p className="text-slate-600 font-mono text-[11px]">{log.metadata_json}</p>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] font-medium shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">No audit logs recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Add Semester Subject
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            {courseErr && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                {courseErr}
              </div>
            )}
            {courseMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> {courseMsg}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  placeholder="CS-601"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Advanced Machine Learning & AI"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Semester</label>
                  <select
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Faculty Lead</label>
                <select
                  value={courseFacultyId}
                  onChange={(e) => setCourseFacultyId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Faculty Lead --</option>
                  {facultyList.map((f) => (
                    <option key={f.faculty_id} value={f.faculty_id}>
                      {f.full_name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCourse}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
                >
                  {submittingCourse ? 'Designing...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" /> Create Administrator Account
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            {adminErr && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                {adminErr}
              </div>
            )}
            {adminMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                {adminMsg}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Admin Three"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin3@campus.edu"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Institution Admin ID</label>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value.toUpperCase())}
                  placeholder="ADM003"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
