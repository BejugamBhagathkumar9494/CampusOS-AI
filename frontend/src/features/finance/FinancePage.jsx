import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { getFeeDetails, getScholarships, fetchWithAuth } from '../../services/api.js';
import { Landmark, CreditCard, X, CheckCircle } from 'lucide-react';

export default function FinancePage() {
  const { profile } = useAuth();
  const [feeInfo, setFeeInfo] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  const [checkoutModal, setCheckoutModal] = useState(false);
  const [processingPay, setProcessingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const studentId = profile?.id || '1';
      const fees = await getFeeDetails(studentId);
      setFeeInfo(fees);
      const sch = await getScholarships(studentId);
      setScholarships(sch.recommendations || []);
    } catch (err) {
      console.error('Error loading finance details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [profile]);

  const handleProcessPayment = async () => {
    setProcessingPay(true);
    try {
      const res = await fetchWithAuth('/finance/transaction', {
        method: 'POST',
        body: JSON.stringify({
          amount: feeInfo?.dues || 0,
          student_id: profile?.id || '1'
        })
      });
      setPaySuccessMsg(`Payment completed! Transaction ID: ${res.transaction_id || 'TX_SUCCESS'}`);
      setCheckoutModal(false);
      setTimeout(() => setPaySuccessMsg(''), 5000);
      fetchFinanceData();
    } catch (err) {
      alert(err.message || 'Failed to complete transaction.');
    } finally {
      setProcessingPay(false);
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Landmark className="w-5 h-5" />
          </span>
          Finance & Fees
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Check dues, inspect structural breakdown, and review AI scholarship matching.</p>
      </div>

      {paySuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {paySuccessMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Fee Dues</span>
          {loading ? (
            <p className="text-xs text-slate-400 font-medium">Loading fee status...</p>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-slate-900">
                ${feeInfo?.dues !== undefined ? Number(feeInfo.dues).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </p>
              {feeInfo?.due_date && (
                <p className="text-xs text-slate-500 font-medium">Due Date: <span className="text-rose-600 font-bold">{feeInfo.due_date}</span></p>
              )}
              {feeInfo?.dues > 0 && (
                <button
                  onClick={() => setCheckoutModal(true)}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-xs text-white font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Pay Dues Online
                </button>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-600" /> AI Scholarship Matches ({scholarships.length})
          </h2>
          {scholarships.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium p-4 text-center">No active scholarship recommendations found.</p>
          ) : (
            <div className="space-y-3">
              {scholarships.map((sch) => (
                <div key={sch.id || sch.title} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sch.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Criteria: {sch.criteria} • Eligibility: <span className="text-emerald-600 font-extrabold">{sch.eligibility_match}% Match</span></p>
                  </div>
                  <span className="text-base font-extrabold text-emerald-600 font-mono">${sch.amount_usd}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl relative">
            <button onClick={() => setCheckoutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Campus Fee Gateway</h3>
                <p className="text-xs text-slate-500">Secure University Online Settlement</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Account Student ID</span>
                <span className="font-mono text-indigo-600">{profile?.institution_id || profile?.id?.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Total Amount Dues</span>
                <span className="text-emerald-600">${Number(feeInfo?.dues || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setCheckoutModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={processingPay}
                className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                {processingPay ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
