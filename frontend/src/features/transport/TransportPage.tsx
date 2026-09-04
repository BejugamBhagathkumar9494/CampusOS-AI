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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <Bus className="w-5 h-5" />
          </span>
          Transport & Bus Tracking
        </h1>
        <p className="text-sm text-[#5E6763] font-medium mt-1">Track campus shuttles, live ETAs, driver contacts, and peak occupancy predictions.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[#1C211F] flex items-center gap-2">
          <Bus className="w-5 h-5 text-[#C85A32]" /> Active Campus Bus Routes ({routes.length})
        </h2>
        {loading ? (
          <p className="text-xs text-[#8E9893] font-medium p-4 text-center">Loading bus routes from backend...</p>
        ) : routes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#EAE3D8] space-y-2">
            <Bus className="w-8 h-8 text-[#8E9893] mx-auto" />
            <p className="text-sm font-bold text-[#1C211F]">No Bus Routes Configured</p>
            <p className="text-xs text-[#5E6763]">No active shuttle routes are currently operating on campus.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((bus) => (
              <div key={bus.id || bus.route} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-[#1C211F]">{bus.route}</h3>
                  <p className="text-xs text-[#5E6763] font-medium mt-0.5">
                    Vehicle: <span className="font-mono text-[#C85A32] font-bold">{bus.bus_number}</span>
                    {bus.driver_name && ` • Driver: ${bus.driver_name}`}
                  </p>
                  <p className="text-xs text-[#8E9893] font-medium mt-1">
                    Live ETA: <span className="text-[#5E8C71] font-extrabold">{bus.eta || 'Scheduled'}</span>
                  </p>
                </div>
                {bus.demand && (
                  <span className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold border ${
                    bus.demand === 'High' ? 'bg-[#FDF2ED] text-[#C85A32] border-[#C85A32]/30' : 'bg-[#F0F6F2] text-[#5E8C71] border-[#5E8C71]/30'
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
