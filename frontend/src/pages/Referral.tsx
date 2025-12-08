import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Icons } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

interface Referral {
  id: string;
  referredUser: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
  };
  investmentId?: string | null;
  rewardAmount: string;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: string;
}

export function Referral() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, totalEarnings: '0' });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = user?.referralCode || 'N/A';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      if (res.data.referrals) {
        setReferrals(res.data.referrals);
        setStats({
          totalReferrals: res.data.referrals.length,
          totalEarnings: res.data.referralEarnings || '0',
        });
      }
    } catch (e: any) {
      console.error('Failed to fetch referrals:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join REAL ESTATE Investment Platform',
          text: `Join me on REAL ESTATE and start earning daily returns! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
      } catch (e) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Referral Program</h1>
        <p className="text-slate-400 mt-1">Invite friends and earn 10% of their investments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/20">
              <Icons.Users className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Referrals</p>
              <p className="text-3xl font-bold text-white">{stats.totalReferrals}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Icons.Money className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Earnings</p>
              <p className="text-3xl font-bold text-white">
                KES {parseFloat(stats.totalEarnings).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referral Code Section */}
        <div className="space-y-6">
          {/* How it Works */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Gift className="w-5 h-5 text-pink-400" />
              How It Works
            </h3>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Share Your Code',
                  description: 'Share your unique referral code or link with friends and family',
                },
                {
                  step: 2,
                  title: 'They Sign Up',
                  description: 'Your friends register using your referral code',
                },
                {
                  step: 3,
                  title: 'They Invest',
                  description: 'When they make an investment in any package',
                },
                {
                  step: 4,
                  title: 'You Earn',
                  description: 'You automatically receive 10% of their investment amount',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/10 border border-pink-500/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Referral Code</h3>

            {/* Code Display */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/10 mb-4">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">Referral Code</p>
                <p className="text-2xl font-bold text-pink-400 tracking-wider font-mono">{referralCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className={`p-3 rounded-xl transition-all ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {copied ? <Icons.Check className="w-5 h-5" /> : <Icons.Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Link Display */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/10 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-1">Referral Link</p>
                <p className="text-sm text-slate-300 truncate">{referralLink}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {copiedLink ? <Icons.Check className="w-5 h-5" /> : <Icons.Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:from-pink-600 hover:to-violet-600 transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
            >
              <Icons.Gift className="w-5 h-5" />
              Share & Invite Friends
            </button>
          </div>

          {/* Reward Info */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Icons.TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">10% Commission</h3>
                <p className="text-sm text-slate-400">
                  For every investment your referrals make, you automatically earn 10% as a bonus.
                  The more friends you invite, the more you earn. There's no limit!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Your Referrals</h3>
            <button
              onClick={fetchReferrals}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Icons.Refresh className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.Spinner className="w-8 h-8 text-pink-400" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center mb-4">
                <Icons.Users className="w-10 h-10 text-pink-400/50" />
              </div>
              <h4 className="text-white font-medium mb-2">No referrals yet</h4>
              <p className="text-slate-400 text-sm text-center max-w-xs">
                Start sharing your referral code to invite friends and earn 10% commission on their investments!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold">
                      {referral.referredUser.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {referral.referredUser.username}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {referral.referredUser.email} · {referral.referredUser.phoneNumber}
                      </p>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <div>
                        <p className="text-slate-400">Joined</p>
                        <p className="text-slate-300">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full font-medium ${
                          referral.investmentId || parseFloat(referral.rewardAmount || '0') > 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {referral.investmentId || parseFloat(referral.rewardAmount || '0') > 0
                          ? 'Invested'
                          : 'Not Invested Yet'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {referrals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-center text-sm text-slate-400">
                You have invited <span className="text-pink-400 font-semibold">{referrals.length}</span> {referrals.length === 1 ? 'person' : 'people'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Referral;
