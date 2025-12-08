import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Icons } from '../components/Icons';

interface Deposit {
  id: string;
  amount: string;
  phoneNumber: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Package {
  id: string;
  name: string;
  price: string;
  dailyReturn: string;
  durationDays: number;
  isActive: boolean;
}

const DEPOSIT_NUMBER = import.meta.env.VITE_DEPOSIT_NUMBER || '0788807422';

export function Deposit() {
  const [searchParams] = useSearchParams();
  const preselectedPackageId = searchParams.get('package');

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      setPackagesLoading(true);
      const res = await api.get('/investments/packages');
      const activePackages = res.data.filter((p: Package) => p.isActive);
      setPackages(activePackages);

      // If there's a preselected package from URL, select it
      if (preselectedPackageId) {
        const exists = activePackages.find((p: Package) => p.id === preselectedPackageId);
        if (exists) {
          setSelectedPackageId(preselectedPackageId);
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch packages:', e);
    } finally {
      setPackagesLoading(false);
    }
  }, [preselectedPackageId]);

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/deposits');
      setDeposits(res.data);
    } catch (e: any) {
      console.error('Failed to fetch deposits:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchDeposits();
  }, [fetchPackages, fetchDeposits]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(DEPOSIT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  const amount = selectedPackage ? parseFloat(selectedPackage.price) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPackageId || !phoneNumber || !message) {
      setError('Please select a package and fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.post('/deposits', {
        amount,
        phoneNumber,
        message,
      });
      setSuccess(true);
      setSelectedPackageId('');
      setPhoneNumber('');
      setMessage('');
      await fetchDeposits();
      setTimeout(() => setSuccess(false), 5000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-amber-500/20 text-amber-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Deposit Funds</h1>
        <p className="text-slate-400 mt-1">Select an investment package and deposit via M-Pesa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deposit Form */}
        <div className="space-y-6">
          {/* M-Pesa Instructions Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Icons.Phone className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Send via M-Pesa</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Send your deposit to the following M-Pesa number, then paste the confirmation message below.
                </p>

                {/* M-Pesa Number */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/10">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">M-Pesa Number</p>
                    <p className="text-2xl font-bold text-emerald-400 tracking-wider">{DEPOSIT_NUMBER}</p>
                  </div>
                  <button
                    onClick={handleCopyNumber}
                    className={`p-3 rounded-xl transition-all ${
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {copied ? <Icons.Check className="w-5 h-5" /> : <Icons.Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How to Deposit</h3>
            <div className="space-y-4">
              {[
                { step: 1, text: 'Select an investment package below' },
                { step: 2, text: 'Go to M-Pesa and select "Send Money"' },
                { step: 3, text: `Enter the number: ${DEPOSIT_NUMBER}` },
                { step: 4, text: 'Enter the exact amount shown for your selected package' },
                { step: 5, text: 'Complete the transaction and wait for SMS' },
                { step: 6, text: 'Paste the M-Pesa confirmation message and submit' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-slate-300 text-sm pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleSubmit} className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 space-y-5">
            <h3 className="text-lg font-semibold text-white">Submit Deposit</h3>

            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Icons.Success className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Deposit submitted successfully! Admin will review and approve it shortly.</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
                <Icons.Alert className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Package Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Investment Package
              </label>
              {packagesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Icons.Spinner className="w-6 h-6 text-emerald-400" />
                </div>
              ) : (
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-slate-800">-- Select a package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id} className="bg-slate-800">
                      {pkg.name} - KES {parseFloat(pkg.price).toLocaleString()} (Daily: KES {parseFloat(pkg.dailyReturn).toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Package Details */}
            {selectedPackage && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">{selectedPackage.name}</h4>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                    {selectedPackage.durationDays} Days
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Amount to Send</p>
                    <p className="text-2xl font-bold text-white">KES {parseFloat(selectedPackage.price).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Daily Return</p>
                    <p className="text-lg font-semibold text-emerald-400">KES {parseFloat(selectedPackage.dailyReturn).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Return</p>
                    <p className="text-lg font-semibold text-cyan-400">
                      KES {(parseFloat(selectedPackage.dailyReturn) * selectedPackage.durationDays).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">ROI</p>
                    <p className="text-lg font-semibold text-violet-400">
                      {((parseFloat(selectedPackage.dailyReturn) * selectedPackage.durationDays / parseFloat(selectedPackage.price)) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 0712345678"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">M-Pesa Confirmation Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste the entire M-Pesa confirmation SMS here..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Example: "QK7A2BXYZ Confirmed. Ksh1,000.00 sent to John Doe..."
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedPackageId}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Icons.Spinner className="w-5 h-5" />
                  Submitting...
                </>
              ) : (
                <>
                  <Icons.Check className="w-5 h-5" />
                  Submit Deposit {selectedPackage && `(KES ${parseFloat(selectedPackage.price).toLocaleString()})`}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Deposit History */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Deposit History</h3>
            <button
              onClick={fetchDeposits}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Icons.Refresh className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.Spinner className="w-8 h-8 text-emerald-400" />
            </div>
          ) : deposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Icons.Download className="w-8 h-8 text-slate-600" />
              </div>
              <h4 className="text-white font-medium mb-1">No deposits yet</h4>
              <p className="text-slate-400 text-sm text-center">
                Your deposit history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-white">
                      KES {parseFloat(deposit.amount).toLocaleString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                      {deposit.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone</span>
                      <span className="text-slate-300">{deposit.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date</span>
                      <span className="text-slate-300">
                        {new Date(deposit.createdAt).toLocaleDateString()} {new Date(deposit.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {deposit.message && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-slate-500 line-clamp-2">{deposit.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Deposit;
