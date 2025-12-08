import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icons } from "./Icons";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: Icons.Dashboard },
  { path: "/investments", label: "Investments", icon: Icons.TrendingUp },
  { path: "/deposit", label: "Deposit", icon: Icons.Download },
  { path: "/withdraw", label: "Withdraw", icon: Icons.Upload },
  { path: "/referral", label: "Referrals", icon: Icons.Gift },
  { path: "/profile", label: "Settings", icon: Icons.Settings },
];

function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border-r border-white/10 z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-white/10">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                <Icons.Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  REAL ESTATE
                </h1>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Investment Platform
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <p className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Menu
            </p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`p-2 rounded-lg transition-colors ${isActive ? "bg-emerald-500/20" : "bg-white/5 group-hover:bg-white/10"}`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10 bg-slate-900/50">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/25">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-sm">
                  {user?.username || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium group"
            >
              <span className="p-2 rounded-lg bg-white/5 group-hover:bg-red-500/20 transition-colors">
                <Icons.Logout className="w-5 h-5" />
              </span>
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Icons.Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Icons.Building className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white">REAL ESTATE</h1>
            </div>
            <button
              onClick={handleSettingsClick}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-30 bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Welcome back, {user?.username || "User"}
              </h2>
              <p className="text-sm text-slate-400">
                Manage your investments and earnings
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSettingsClick}
                className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                title="Settings"
              >
                <Icons.Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleSettingsClick}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/25">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 relative">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
