import { useState, useEffect } from 'react';
import { getAdminAnalytics } from '../../services/api';
import { Sparkles } from 'lucide-react';

export default function AIInsightsPage() {
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics()
      .then(setAdminStats)
      .catch((err) => console.error('Analytics error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sparkles className="w-5 h-5" />
          </span>
          Campus AI Analytics & Predictions
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Predictive dashboards based on university operational logs and student dataset records.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-medium">Computing analytics from database...</div>
      ) : adminStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Analyzed Student Records</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{adminStats.total_analyzed_students?.toLocaleString() || '0'}</div>
          </div>
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Placement Rate Forecast</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{adminStats.placement_rate_forecast || '0'}%</div>
          </div>
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hostel Occupancy Prediction</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{adminStats.hostel_occupancy_prediction || '0'}%</div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
          Unable to retrieve campus analytics at this time.
        </div>
      )}
    </div>
  );
}
