import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { predictPlacementReadiness, getPlacementAnalytics, reviewResume } from '../../services/api';
import { placementService } from '../../services/placementService';
import { supabase } from '../../services/supabaseClient';
import { Award, Briefcase, FileText } from 'lucide-react';

export default function PlacementsPage() {
  const { profile } = useAuth();
  const [cgpa, setCgpa] = useState('8.00');
  const [branch, setBranch] = useState('CSE');
  const [tier, setTier] = useState('Tier 1');
  const [codingScore, setCodingScore] = useState('75');
  const [mockScore, setMockScore] = useState('75');
  const [internships, setInternships] = useState('0');
  const [skills, setSkills] = useState('Python, SQL, React');

  const [prediction, setPrediction] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [resumeText, setResumeText] = useState('');
  const [resumeResult, setResumeResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [evaluatingResume, setEvaluatingResume] = useState(false);

  const [applyMsg, setApplyMsg] = useState('');

  const isOfficer = ['placement_officer', 'admin', 'super_admin'].includes((profile?.role || '').toLowerCase());

  // Officer drive creation modal state
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [newDrive, setNewDrive] = useState({ company_name: '', job_title: '', package_ctc: '12.0', min_cgpa: '6.0' });
  const [creatingDrive, setCreatingDrive] = useState(false);

  // Applicant management state
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<any>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Student application status state
  const [myApplications, setMyApplications] = useState<any[]>([]);

  useEffect(() => {
    async function loadStudentProfileDetails() {
      if (!profile?.id) return;
      try {
        const { data: student } = await supabase
          .from('students')
          .select('cgpa')
          .eq('profile_id', profile.id)
          .single();

        if (student?.cgpa) {
          setCgpa(String(student.cgpa));
        }

        const myApps = await placementService.getStudentApplications(profile.id);
        setMyApplications(myApps || []);
        if (myApps && myApps.length > 0) console.log('Loaded student placement applications:', myApps.length);
      } catch (e) {
        console.error('Error fetching student CGPA/apps:', e);
      }
    }
    loadStudentProfileDetails();
  }, [profile]);

  const fetchPlacementData = async () => {
    try {
      const cList = await placementService.getCompanies();
      setCompanies(cList);
      const dList = await placementService.getPlacementDrives();
      setDrives(dList);
      if (dList.length > 0 && !selectedDriveId) {
        setSelectedDriveId(dList[0].id);
      }
    } catch (err) {
      console.error('Error fetching placement data:', err);
    }
  };

  const fetchDriveApplicants = async (driveId: any) => {
    if (!driveId) return;
    setLoadingApplicants(true);
    try {
      const appList = await placementService.getDriveApplicants(driveId);
      setApplicants(appList || []);
    } catch (err: any) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchPlacementData();
    getPlacementAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedDriveId && isOfficer) {
      fetchDriveApplicants(selectedDriveId);
    }
  }, [selectedDriveId, isOfficer]);

  const handleCreateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrive.company_name.trim()) return;
    setCreatingDrive(true);
    try {
      await placementService.createPlacementDrive(newDrive);
      setShowDriveModal(false);
      setNewDrive({ company_name: '', job_title: '', package_ctc: '12.0', min_cgpa: '6.0' });
      fetchPlacementData();
      alert(`Placement drive for ${newDrive.company_name} created successfully in DB!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create placement drive');
    } finally {
      setCreatingDrive(false);
    }
  };

  const handleStatusChange = async (applicationId: any, newStatus: string) => {
    try {
      await placementService.updateApplicationStatus(applicationId, newStatus);
      setApplicants(prev => prev.map(a => a.application_id === applicationId ? { ...a, status: newStatus } : a));
      alert(`Student application status updated to '${newStatus.toUpperCase()}' in DB!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update application status.');
    }
  };

  const calculateReadiness = async () => {
    setLoading(true);
    try {
      const res = await predictPlacementReadiness({
        cgpa: Number(cgpa),
        branch,
        college_tier: tier,
        coding_platform_score: Number(codingScore),
        mock_interview_score: Number(mockScore),
        internships_count: Number(internships),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      setPrediction(res);
    } catch (err) {
      console.error('Readiness calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeReview = async () => {
    if (!resumeText) return;
    setEvaluatingResume(true);
    try {
      const res = await reviewResume(resumeText);
      setResumeResult(res);
    } catch (err) {
      console.error('Resume review error:', err);
    } finally {
      setEvaluatingResume(false);
    }
  };

  const handleApplyDrive = async (driveId: any) => {
    if (!profile?.id) return;
    try {
      await placementService.applyDrive(profile.id, driveId);
      setApplyMsg('Application for recruitment drive recorded successfully!');
      setTimeout(() => setApplyMsg(''), 4000);
      fetchPlacementData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit placement application.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-7 rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#E0E7FF] border border-indigo-100/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 text-indigo-600 text-xs font-extrabold mb-2 border border-white/80 shadow-2xs">
            <Award className="w-3.5 h-3.5" /> 100,000+ Placement Dataset ML Model
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Placements & Recruitment Drives
            {myApplications.length > 0 && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                {myApplications.length} Applied
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Check drive eligibility, apply for active recruiters, and predict readiness scores.</p>
        </div>
        {analytics && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-center px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dataset Total</span>
              <div className="text-base font-extrabold text-slate-900">{analytics.total_records?.toLocaleString()}</div>
            </div>
            <div className="text-center px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Placement Rate</span>
              <div className="text-base font-extrabold text-emerald-600">{analytics.placement_rate}%</div>
            </div>
            <div className="text-center px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Salary</span>
              <div className="text-base font-extrabold text-indigo-600">{analytics.avg_salary_lpa} LPA</div>
            </div>
            {isOfficer && (
              <button
                onClick={() => setShowDriveModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95"
              >
                + Create Recruitment Drive
              </button>
            )}
          </div>
        )}
      </div>

      {applyMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in">
          {applyMsg}
        </div>
      )}

      {/* Placement Officer Drive Applicants Roster */}
      {isOfficer && drives.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" /> Placement Officer: Drive Applications & Decisions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Select a drive to manage student applications and issue Shortlists/Offers directly into DB.</p>
            </div>

            <select
              value={selectedDriveId || ''}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
            >
              {drives.map(d => (
                <option key={d.id} value={d.id}>
                  {d.companies?.name || 'Drive'} - {d.job_title}
                </option>
              ))}
            </select>
          </div>

          {loadingApplicants ? (
            <p className="text-xs text-slate-400 font-medium p-4 text-center">Loading applicant roster from database...</p>
          ) : applicants.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium p-4 text-center bg-slate-50 rounded-xl">No student applications recorded for this drive yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {applicants.map((app) => (
                <div key={app.application_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{app.full_name} <span className="text-slate-400 font-normal">({app.roll_number})</span></p>
                    <p className="text-[11px] text-slate-500 font-medium">{app.email} • CGPA: {app.cgpa} • Dept: {app.department}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                      app.status === 'offered' || app.status === 'placed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      app.status === 'shortlisted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      app.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {app.status}
                    </span>

                    <button
                      onClick={() => handleStatusChange(app.application_id, 'shortlisted')}
                      className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold hover:bg-amber-100"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.application_id, 'offered')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 shadow-2xs"
                    >
                      Offer / Place Student
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.application_id, 'rejected')}
                      className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-rose-50 hover:text-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" /> Active Recruitment Drives ({drives.length})
        </h2>
        {drives.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium p-4 text-center">No active recruitment drives listed currently.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drives.map((d) => (
              <div key={d.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">{d.companies?.name || 'Company'}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{d.job_title}</h3>
                    {d.package_ctc && (
                      <p className="text-xs text-slate-500 font-medium">Package: <span className="font-bold text-emerald-600">{d.package_ctc} LPA</span></p>
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    ACTIVE
                  </span>
                </div>
                {d.min_cgpa && <p className="text-xs text-slate-500 font-mono">Min CGPA: {d.min_cgpa}</p>}
                <button
                  onClick={() => handleApplyDrive(d.id)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Apply for Drive
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" /> ML Readiness & Salary Calculator
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CGPA (0 - 10)</label>
              <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} type="number" step="0.01" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Branch</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500">
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="MECH">MECH</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">College Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500">
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Tier 3">Tier 3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Coding Score (0-100)</label>
              <input value={codingScore} onChange={(e) => setCodingScore(e.target.value)} type="number" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mock Interview Score</label>
              <input value={mockScore} onChange={(e) => setMockScore(e.target.value)} type="number" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Internships Count</label>
              <input value={internships} onChange={(e) => setInternships(e.target.value)} type="number" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Skills (comma separated)</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, SQL, React, System Design" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
          </div>

          <button onClick={calculateReadiness} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-3 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/20">
            {loading ? 'Predicting with ML...' : 'Calculate Placement Readiness & Expected Salary'}
          </button>

          {prediction && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Readiness</span>
                  <div className="text-base font-extrabold text-slate-900">{prediction.readiness_rating} ({prediction.readiness_score}%)</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Expected Salary</span>
                  <div className="text-xl font-extrabold text-emerald-600">{prediction.expected_salary_lpa} LPA</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> AI Resume Reviewer
            </h2>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume text here (e.g. 'Built web app using Python, FastAPI, React, SQL...')"
              className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
            />
            <button onClick={handleResumeReview} disabled={evaluatingResume || !resumeText} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold text-white transition-all shadow-xs">
              {evaluatingResume ? 'Analyzing Resume...' : 'Analyze Resume Score & Skill Gaps'}
            </button>

            {resumeResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Score</span>
                  <span className="text-base font-extrabold text-indigo-600">{resumeResult.score}/100</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{resumeResult.feedback}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" /> Active Campus Recruiters ({companies.length})
            </h2>
            {companies.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium p-4 text-center">No recruiting companies listed.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {companies.map((comp) => (
                  <div key={comp.id || comp.name} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{comp.name}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">{comp.industry || 'Tech'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Drive Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900">Create Recruitment Drive</h3>
              <button onClick={() => setShowDriveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateDriveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microsoft"
                  value={newDrive.company_name}
                  onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  value={newDrive.job_title}
                  onChange={(e) => setNewDrive({ ...newDrive, job_title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Package (CTC LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDrive.package_ctc}
                    onChange={(e) => setNewDrive({ ...newDrive, package_ctc: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Min CGPA Required</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDrive.min_cgpa}
                    onChange={(e) => setNewDrive({ ...newDrive, min_cgpa: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDrive}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {creatingDrive ? 'Creating...' : 'Create Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
