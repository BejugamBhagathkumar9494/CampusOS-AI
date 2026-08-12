import { useState, useEffect } from 'react';
import { getTransportRoutes } from '../../services/api';
import { Bus } from 'lucide-react';

export default function TransportPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransportRoutes()
      .then((data) => setRoutes(data.routes || []))
      .catch((err) => console.error('Error fetching transport routes:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Bus className="w-5 h-5" />
          </span>
          Transport & Bus Tracking
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Track campus shuttles, live ETAs, driver contacts, and peak occupancy predictions.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bus className="w-5 h-5 text-indigo-600" /> Active Campus Bus Routes ({routes.length})
        </h2>
        {loading ? (
          <p className="text-xs text-slate-400 font-medium p-4 text-center">Loading bus routes from backend...</p>
        ) : routes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Bus className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Bus Routes Configured</p>
            <p className="text-xs text-slate-500">No active shuttle routes are currently operating on campus.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((bus) => (
              <div key={bus.id || bus.route} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{bus.route}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Vehicle: <span className="font-mono text-indigo-600 font-bold">{bus.bus_number}</span>
                    {bus.driver_name && ` • Driver: ${bus.driver_name}`}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Live ETA: <span className="text-emerald-600 font-extrabold">{bus.eta || 'Scheduled'}</span>
                  </p>
                </div>
                {bus.demand && (
                  <span className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold border ${
                    bus.demand === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    Peak Occupancy: {bus.demand}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
