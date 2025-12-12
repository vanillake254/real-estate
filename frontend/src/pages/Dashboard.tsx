import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Icons } from '../components/Icons';

interface Wallet {
  available: string;
  investable: string;
  lockedPrincipal: string;
}

interface Earning {
  id: string;
  dayIndex: number;
  amount: string;
  status: 'PENDING' | 'STARTED' | 'COMPLETED';
  startedAt: string | null;
}

interface Investment {
  id: string;
  principal: string;
  totalEarned: string;
  status: string;
  package: {
    id: string;
    name: string;
    price: string;
    dailyReturn: string;
    durationDays: number;
  };
  earnings: Earning[];
}

// Progress Ring Component
function EarningsRing({ earning, onStart }: { earning: Earning; onStart: () => void }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (earning.status === 'STARTED') {
      const interval = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [earning.status]);

  const totalMs = 18 * 60 * 60 * 1000; // 18 hours
  const now = Date.now();
  const started = earning.startedAt ? new Date(earning.startedAt).getTime() : null;
  const elapsed = started ? now - started : 0;
  const progress = started ? Math.min(1, elapsed / totalMs) : 0;
  const isComplete = progress >= 1;

  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const remainingMs = started ? Math.max(0, totalMs - elapsed) : totalMs;
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const accruedAmount = (parseFloat(earning.amount) * progress).toFixed(2);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            filter="url(#glow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {earning.status === 'PENDING' ? (
            <button
              onClick={onStart}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105 active:scale-95"
            >
              <Icons.Play className="w-8 h-8 text-white ml-1" />
            </button>
          ) : isComplete ? (
            <div className="text-center">
              <Icons.Check className="w-10 h-10 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-400">KES {earning.amount}</p>
              <p className="text-xs text-slate-400">Completed</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                KES {accruedAmount}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-slate-500">remaining</p>
            </div>
          )}
        </div>
      </div>

      {/* Day indicator */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-white">Day {earning.dayIndex} of 30</p>
        <p className="text-xs text-slate-400">
          {earning.status === 'PENDING' && 'Tap to start earning'}
          {earning.status === 'STARTED' && !isComplete && 'Earning in progress...'}
          {isComplete && 'Ready to collect!'}
        </p>
      </div>
    </div>
  );
}

// Wallet Card Component
function WalletCard({ title, amount, icon, gradient, subtitle }: {
  title: string;
  amount: string;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 group hover:border-white/20 transition-all duration-300">
      {/* Background gradient blob */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className={`p-3 rounded-xl ${gradient} bg-opacity-20`}>
            {icon}
          </span>
          <Icons.TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-2xl lg:text-3xl font-bold text-white">
          KES {parseFloat(amount || '0').toLocaleString()}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Quick Action Button
function QuickAction({ to, icon, label, gradient }: {
  to: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group"
    >
      <span className={`p-3 rounded-xl ${gradient} group-hover:scale-110 transition-transform`}>
        {icon}
      </span>
      <span className="text-sm text-slate-300 font-medium">{label}</span>
    </Link>
  );
}

export function Dashboard() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setStartingEarning] = useState<string | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [walletRes, investmentsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/investments'),
      ]);
      setWallet(walletRes.data.wallet);
      // Normalize earnings status so CREDITED from backend is treated as COMPLETED in the UI
      const normalizedInvestments: Investment[] = investmentsRes.data.map((inv: any) => ({
        ...inv,
        earnings: inv.earnings.map((e: any) => ({
          ...e,
          status: e.status === 'CREDITED' ? 'COMPLETED' : e.status,
        })),
      }));
      setInvestments(normalizedInvestments);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartEarning = async (earningId: string) => {
    try {
      setStartingEarning(earningId);

      // Optimistically update local state so ring starts from full 18 hours
      setInvestments((prev) =>
        prev.map((inv) => ({
          ...inv,
          earnings: inv.earnings.map((e) =>
            e.id === earningId
              ? { ...e, status: 'STARTED', startedAt: new Date().toISOString() }
              : e,
          ),
        })),
      );

      await api.post('/investments/start', { earningId });
      await fetchData();
    } catch (e: any) {
      console.error('Failed to start earning:', e);
    } finally {
      setStartingEarning(null);
    }
  };

  // Determine selected investment for accrual ring
  const activeInvestments = investments.filter((inv) => inv.status === 'ACTIVE');

  // If no selection yet or selection no longer valid, choose a sensible default
  const defaultInvestment = activeInvestments.find((inv) =>
    inv.earnings.some((e) => e.status === 'PENDING' || e.status === 'STARTED'),
  ) || activeInvestments[0];

  const selectedInvestment =
    (selectedInvestmentId && activeInvestments.find((inv) => inv.id === selectedInvestmentId)) || defaultInvestment || null;

  // From the selected investment, prefer a STARTED earning, otherwise a PENDING one
  const activeEarning = selectedInvestment
    ? selectedInvestment.earnings.find((e) => e.status === 'STARTED') ||
      selectedInvestment.earnings.find((e) => e.status === 'PENDING') ||
      null
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Icons.Spinner className="w-12 h-12 text-emerald-400" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Icons.Alert className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Track your investments and earnings</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <Icons.Refresh className="w-5 h-5" />
        </button>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <WalletCard
          title="Withdrawable Balance"
          amount={wallet?.available || '0'}
          icon={<Icons.Wallet className="w-6 h-6 text-emerald-400" />}
          gradient="bg-emerald-500"
          subtitle="Earnings + Referral bonuses"
        />
        <WalletCard
          title="Investable Balance"
          amount={wallet?.investable || '0'}
          icon={<Icons.Money className="w-6 h-6 text-cyan-400" />}
          gradient="bg-cyan-500"
          subtitle="Ready to invest"
        />
        <WalletCard
          title="Locked Principal"
          amount={wallet?.lockedPrincipal || '0'}
          icon={<Icons.Package className="w-6 h-6 text-violet-400" />}
          gradient="bg-violet-500"
          subtitle="Active investments"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Ring Section */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Daily Earnings</h2>
              <p className="text-sm text-slate-400 mt-1">Start earning to collect your daily returns</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              18 Hour Cycle
            </span>
          </div>

          {/* Investment selector */}
          {activeInvestments.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-slate-400">Select which investment to accrue today</div>
              <select
                value={selectedInvestment?.id || ''}
                onChange={(e) => setSelectedInvestmentId(e.target.value || null)}
                className="w-full sm:w-64 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
              >
                {activeInvestments.map((inv) => (
                  <option key={inv.id} value={inv.id} className="bg-slate-900">
                    {inv.package.name} - KES {parseFloat(inv.principal).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeEarning && selectedInvestment ? (
            <div className="flex flex-col items-center py-4">
              <EarningsRing earning={activeEarning} onStart={() => handleStartEarning(activeEarning.id)} />
              <div className="mt-6 text-center">
                <p className="text-white font-medium">{selectedInvestment.package.name}</p>
                <p className="text-sm text-slate-400">
                  Daily Return: KES {selectedInvestment.package.dailyReturn}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Icons.TrendingUp className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Active Earnings</h3>
              <p className="text-slate-400 text-center max-w-xs mb-6">
                Invest in a package to start earning daily returns
              </p>
              <Link
                to="/investments"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
              >
                View Packages
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction
              to="/deposit"
              icon={<Icons.Download className="w-6 h-6 text-emerald-400" />}
              label="Deposit"
              gradient="bg-emerald-500/20"
            />
            <QuickAction
              to="/withdraw"
              icon={<Icons.Upload className="w-6 h-6 text-cyan-400" />}
              label="Withdraw"
              gradient="bg-cyan-500/20"
            />
            <QuickAction
              to="/investments"
              icon={<Icons.TrendingUp className="w-6 h-6 text-violet-400" />}
              label="Invest"
              gradient="bg-violet-500/20"
            />
            <QuickAction
              to="/referral"
              icon={<Icons.Gift className="w-6 h-6 text-pink-400" />}
              label="Refer"
              gradient="bg-pink-500/20"
            />
          </div>

          {/* Active Investments Summary */}
          {investments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Active Investments</h3>
              <div className="space-y-3">
                {investments.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-white truncate">{inv.package.name}</p>
                      <p className="text-xs text-slate-400">KES {inv.principal}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      inv.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
              {investments.length > 3 && (
                <Link
                  to="/investments"
                  className="block text-center text-sm text-emerald-400 hover:text-emerald-300 mt-4 font-medium"
                >
                  View all {investments.length} investments
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
