import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Icons } from '../components/Icons';

interface Package {
  id: string;
  name: string;
  price: string;
  dailyReturn: string;
  durationDays: number;
  isActive: boolean;
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
  createdAt: string;
  package: Package;
  earnings: Earning[];
}

interface Wallet {
  available: string;
  investable: string;
  lockedPrincipal: string;
}

function PackageCard({ pkg, onDeposit, investableBalance }: {
  pkg: Package;
  onDeposit: () => void;
  investableBalance: number;
}) {
  const price = parseFloat(pkg.price);
  const dailyReturn = parseFloat(pkg.dailyReturn);
  const totalReturn = dailyReturn * pkg.durationDays;
  const roi = ((totalReturn / price) * 100).toFixed(0);
  const canAfford = investableBalance >= price;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group">
      {/* Popular badge for mid-tier packages */}
      {price >= 3000 && price <= 10000 && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg">
          Popular
        </div>
      )}

      {/* Background gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6">
        {/* Package Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2 pr-20">{pkg.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">KES {price.toLocaleString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-slate-400 text-sm">Daily Return</span>
            <span className="text-emerald-400 font-semibold">KES {dailyReturn.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-slate-400 text-sm">Duration</span>
            <span className="text-white font-medium">{pkg.durationDays} Days</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-slate-400 text-sm">Total Return</span>
            <span className="text-cyan-400 font-semibold">KES {totalReturn.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-400 text-sm">ROI</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
              {roi}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {canAfford ? (
          <button
            onClick={onDeposit}
            className="w-full py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            <Icons.TrendingUp className="w-5 h-5" />
            Buy Package
          </button>
        ) : (
          <button
            onClick={onDeposit}
            className="w-full py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
          >
            <Icons.Download className="w-5 h-5" />
            Deposit to Invest
          </button>
        )}

        {!canAfford && (
          <p className="text-center text-xs text-slate-500 mt-2">
            Need KES {(price - investableBalance).toLocaleString()} more
          </p>
        )}
      </div>
    </div>
  );
}

function InvestmentCard({ investment, onStartEarning, isStarting }: {
  investment: Investment;
  onStartEarning: (earningId: string) => void;
  isStarting: string | null;
}) {
  const completedDays = investment.earnings.filter((e) => e.status === 'COMPLETED').length;
  const totalDays = investment.package.durationDays;
  const progress = (completedDays / totalDays) * 100;

  const activeEarning = investment.earnings.find((e) => e.status === 'STARTED');
  const pendingEarning = !activeEarning
    ? investment.earnings.find((e) => e.status === 'PENDING')
    : undefined;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">{investment.package.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            investment.status === 'ACTIVE'
              ? 'bg-emerald-500/20 text-emerald-400'
              : investment.status === 'COMPLETED'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-slate-500/20 text-slate-400'
          }`}>
            {investment.status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Day {completedDays} of {totalDays}</span>
          <span>{progress.toFixed(0)}% Complete</span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Principal</p>
          <p className="text-lg font-semibold text-white">KES {parseFloat(investment.principal).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Total Earned</p>
          <p className="text-lg font-semibold text-emerald-400">KES {parseFloat(investment.totalEarned).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Daily Return</p>
          <p className="text-sm font-medium text-white">KES {parseFloat(investment.package.dailyReturn).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Started</p>
          <p className="text-sm font-medium text-white">
            {new Date(investment.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Action */}
      {investment.status === 'ACTIVE' && (pendingEarning || activeEarning) && (
        <div className="p-5 pt-0">
          {pendingEarning && (
            <button
              onClick={() => onStartEarning(pendingEarning.id)}
              disabled={isStarting === pendingEarning.id}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {isStarting === pendingEarning.id ? (
                <>
                  <Icons.Spinner className="w-5 h-5" />
                  Starting...
                </>
              ) : (
                <>
                  <Icons.Play className="w-5 h-5" />
                  Start Day {pendingEarning.dayIndex} Earning
                </>
              )}
            </button>
          )}
          {activeEarning && !pendingEarning && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Icons.Clock className="w-5 h-5" />
              <span className="font-medium">Day {activeEarning.dayIndex} in progress...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Investments() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingEarning, setStartingEarning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'packages' | 'investments'>('packages');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [packagesRes, investmentsRes, walletRes] = await Promise.all([
        api.get('/investments/packages'),
        api.get('/investments'),
        api.get('/wallet'),
      ]);
      setPackages(packagesRes.data.filter((p: Package) => p.isActive));
      const normalizedInvestments: Investment[] = investmentsRes.data.map((inv: any) => ({
        ...inv,
        earnings: inv.earnings.map((e: any) => ({
          ...e,
          status: e.status === 'CREDITED' ? 'COMPLETED' : e.status,
        })),
      }));
      setInvestments(normalizedInvestments);
      setWallet(walletRes.data.wallet);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeposit = (packageId: string) => {
    // Navigate to deposit page with the selected package
    navigate(`/deposit?package=${packageId}`);
  };

  const handleStartEarning = async (earningId: string) => {
    try {
      setStartingEarning(earningId);
      await api.post('/investments/start', { earningId });
      await fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to start earning');
    } finally {
      setStartingEarning(null);
    }
  };

  const investableBalance = parseFloat(wallet?.investable || '0');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Icons.Spinner className="w-12 h-12 text-emerald-400" />
          <p className="text-slate-400">Loading investments...</p>
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Investments</h1>
          <p className="text-slate-400 mt-1">Choose a package and start earning daily returns</p>
        </div>

        {/* Balance Card */}
        <div className="flex items-center gap-4 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
          <div className="p-2.5 rounded-lg bg-emerald-500/20">
            <Icons.Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Investable Balance</p>
            <p className="text-xl font-bold text-white">KES {investableBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'packages'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'investments'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          My Investments ({investments.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onDeposit={() => handleDeposit(pkg.id)}
              investableBalance={investableBalance}
            />
          ))}
        </div>
      ) : (
        <>
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Icons.Package className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No investments yet</h3>
              <p className="text-slate-400 text-center max-w-md mb-6">
                Start investing in our packages to earn daily returns. Your investments will appear here.
              </p>
              <button
                onClick={() => setActiveTab('packages')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
              >
                Browse Packages
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {investments.map((investment) => (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  onStartEarning={handleStartEarning}
                  isStarting={startingEarning}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Investments;
