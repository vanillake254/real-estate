import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Icons } from '../components/Icons';

interface Payout {
  id: string;
  amount: string;
  phoneNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Wallet {
  available: string;
  investable: string;
  lockedPrincipal: string;
}

export function Withdraw() {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggested quick amounts (multiples of 100)
  const allowedAmounts = Array.from({ length: 10 }, (_, i) => (i + 1) * 100);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [walletRes, payoutsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/payouts'),
      ]);
      setWallet(walletRes.data.wallet);
      setPayouts(payoutsRes.data);
    } catch (e: any) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableBalance = parseFloat(wallet?.available || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawAmount = parseFloat(amount);

    if (!amount || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }

    if (isNaN(withdrawAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawAmount < 100) {
      setError('Minimum withdrawal amount is KES 100');
      return;
    }

    if (withdrawAmount % 100 !== 0) {
      setError('Amount must be a multiple of KES 100 (e.g., 100, 200, 300, ...).');
      return;
    }

    if (withdrawAmount > availableBalance) {
      setError('Insufficient balance. You can only withdraw your available earnings.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.post('/payouts', {
        amount: withdrawAmount,
        phoneNumber,
      });
      setSuccess(true);
      setAmount('');
      setPhoneNumber('');
      await fetchData();
      setTimeout(() => setSuccess(false), 5000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMaxAmount = () => {
    const maxAllowed = Math.floor(availableBalance / 100) * 100;
    if (maxAllowed >= 100) {
      setAmount(maxAllowed.toString());
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Icons.Check className="w-4 h-4" />;
      case 'REJECTED':
        return <Icons.Close className="w-4 h-4" />;
      default:
        return <Icons.Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Withdraw Funds</h1>
        <p className="text-slate-400 mt-1">Request a withdrawal to your M-Pesa number</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Withdraw Form Section */}
        <div className="space-y-6">
          {/* Available Balance Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Icons.Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-1">Available for Withdrawal</p>
                <p className="text-3xl font-bold text-white">
                  KES {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  This includes your earnings and referral bonuses
                </p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Icons.Info className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Important Information</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>You can only withdraw your available earnings and referral bonuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Your principal investment amount remains locked until the package completes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Withdrawals are processed within 24 hours after admin approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Funds will be sent directly to your M-Pesa number</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Withdrawal Form */}
          <form onSubmit={handleSubmit} className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 space-y-5">
            <h3 className="text-lg font-semibold text-white">Request Withdrawal</h3>

            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Icons.Success className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Withdrawal request submitted! Admin will process it within 24 hours.</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
                <Icons.Alert className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount (KES)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full px-4 py-3 pr-20 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  min="100"
                  max={availableBalance}
                  required
                />
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                You can only withdraw in multiples of KES 100. Maximum per request is limited by your available balance
                (current max: KES {Math.floor(availableBalance / 100) * 100}).
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {allowedAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value.toString())}
                    disabled={value > availableBalance}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      value > availableBalance
                        ? 'border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    KES {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">M-Pesa Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 0712345678"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter the M-Pesa number where you want to receive the funds
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || availableBalance <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Icons.Spinner className="w-5 h-5" />
                  Processing...
                </>
              ) : (
                <>
                  <Icons.Upload className="w-5 h-5" />
                  Request Withdrawal
                </>
              )}
            </button>

            {availableBalance <= 0 && (
              <p className="text-center text-sm text-amber-400">
                You don't have any funds available for withdrawal
              </p>
            )}
          </form>
        </div>

        {/* Withdrawal History */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Withdrawal History</h3>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Icons.Refresh className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.Spinner className="w-8 h-8 text-emerald-400" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Icons.Upload className="w-8 h-8 text-slate-600" />
              </div>
              <h4 className="text-white font-medium mb-1">No withdrawals yet</h4>
              <p className="text-slate-400 text-sm text-center">
                Your withdrawal history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(payout.status)}`}>
                        {getStatusIcon(payout.status)}
                      </div>
                      <span className="text-xl font-bold text-white">
                        KES {parseFloat(payout.amount).toLocaleString()}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">To Number</span>
                      <span className="text-slate-300">{payout.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date</span>
                      <span className="text-slate-300">
                        {new Date(payout.createdAt).toLocaleDateString()} {new Date(payout.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {payout.status === 'PENDING' && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-amber-400 flex items-center gap-2">
                        <Icons.Clock className="w-3 h-3" />
                        Awaiting admin approval
                      </p>
                    </div>
                  )}
                  {payout.status === 'APPROVED' && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-emerald-400 flex items-center gap-2">
                        <Icons.Check className="w-3 h-3" />
                        Funds sent to your M-Pesa
                      </p>
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

export default Withdraw;
