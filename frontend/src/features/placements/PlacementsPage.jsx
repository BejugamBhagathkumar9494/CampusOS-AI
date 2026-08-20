import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { predictPlacementReadiness, getPlacementAnalytics, reviewResume } from '../../services/api.js';
import { placementService } from '../../services/placementService.js';
import { supabase } from '../../services/supabaseClient.js';
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

  const [prediction, setPrediction] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [resumeText, setResumeText] = useState('');
  const [resumeResult, setResumeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluatingResume, setEvaluatingResume] = useState(false);

  const [applyMsg, setApplyMsg] = useState('');

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
      } catch (e) {
        console.error('Error fetching student CGPA:', e);
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
    } catch (err) {
      console.error('Error fetching placement data:', err);
    }
  };

  useEffect(() => {
    fetchPlacementData();
    getPlacementAnalytics().then(setAnalytics).catch(() => {});
  }, []);

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

  const handleApplyDrive = async (driveId) => {
    if (!profile?.id) return;
    try {
      await placementService.applyDrive(profile.id, driveId);
      setApplyMsg('Application for recruitment drive recorded successfully!');
      setTimeout(() => setApplyMsg(''), 4000);
      fetchPlacementData();
    } catch (err) {
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Placements & Recruitment Drives</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Check drive eligibility, apply for active recruiters, and predict readiness scores.</p>
        </div>
        {analytics && (
          <div className="flex gap-3">
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
          </div>
        )}
      </div>

      {applyMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in">
          {applyMsg}
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
    </div>
  );
}
