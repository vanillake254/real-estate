import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import "./index.css";

// ============ API Setup ============
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("admin_refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/auth/refresh`,
            { refreshToken },
          );
          const { accessToken, refreshToken: newRefreshToken } = res.data;
          localStorage.setItem("admin_token", accessToken);
          if (newRefreshToken) {
            localStorage.setItem("admin_refresh_token", newRefreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_refresh_token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem("admin_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// ============ Auth Context ============
interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get("/users/me");
        if (
          res.data.user?.role?.name === "ADMIN" ||
          res.data.user?.role?.name === "SUPER_ADMIN"
        ) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem("admin_token");
        }
      } catch {
        localStorage.removeItem("admin_token");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, isAuthenticated: !!user, isLoading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============ Icons ============
const Icons = {
  Dashboard: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  Download: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  ),
  Upload: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  ),
  Users: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  Package: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  Logout: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  Menu: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  Spinner: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={`${className} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ),
  Refresh: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  Building: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  TrendingUp: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  Money: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Plus: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ),
  Edit: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  ),
  Trash: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  Eye: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  Search: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
};

// ============ Login Page ============
function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", form);

      // Fetch full user data with role
      localStorage.setItem("admin_token", res.data.accessToken);
      localStorage.setItem("admin_refresh_token", res.data.refreshToken);
      const userRes = await api.get("/users/me");

      if (
        userRes.data.user?.role?.name === "ADMIN" ||
        userRes.data.user?.role?.name === "SUPER_ADMIN"
      ) {
        setUser(userRes.data.user);
        navigate("/dashboard");
      } else {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_refresh_token");
        setError("Access denied. Admin privileges required.");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 mb-4">
            <Icons.Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-2">REAL ESTATE Investment Platform</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                value={form.identifier}
                onChange={(e) =>
                  setForm({ ...form, identifier: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter username or email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Icons.Spinner className="w-5 h-5" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============ Sidebar ============
function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Icons.Dashboard },
    { path: "/deposits", label: "Deposits", icon: Icons.Download },
    { path: "/withdrawals", label: "Withdrawals", icon: Icons.Upload },
    { path: "/packages", label: "Packages", icon: Icons.Package },
    { path: "/users", label: "Users", icon: Icons.Users },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border-r border-white/10 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Icons.Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Admin Panel
                </h1>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Real Estate
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <p className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Management
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
                      ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`p-2 rounded-lg transition-colors ${isActive ? "bg-indigo-500/20" : "bg-white/5 group-hover:bg-white/10"}`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 bg-slate-900/50">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-sm">
                  {user?.username || "Admin"}
                </p>
                <p className="text-xs text-indigo-400 truncate">
                  {user?.role?.name || "ADMIN"}
                </p>
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

// ============ Layout ============
function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-72 min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white p-2 -ml-2 rounded-lg hover:bg-white/10"
            >
              <Icons.Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.username?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 relative">{children}</main>
      </div>
    </div>
  );
}

// ============ Dashboard ============
function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalDeposits: "0",
    totalWithdrawals: "0",
    activeInvestments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [users, deposits, withdrawals] = await Promise.all([
        api.get("/users"),
        api.get("/deposits/admin/all"),
        api.get("/payouts/admin/all"),
      ]);

      const pendingDeposits = deposits.data.filter(
        (d: any) => d.status === "PENDING",
      ).length;
      const pendingWithdrawals = withdrawals.data.filter(
        (w: any) => w.status === "PENDING",
      ).length;
      const totalDeposits = deposits.data
        .filter((d: any) => d.status === "APPROVED")
        .reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);
      const totalWithdrawals = withdrawals.data
        .filter((w: any) => w.status === "APPROVED")
        .reduce((sum: number, w: any) => sum + parseFloat(w.amount), 0);

      setStats({
        totalUsers: users.data.length,
        pendingDeposits,
        pendingWithdrawals,
        totalDeposits: totalDeposits.toString(),
        totalWithdrawals: totalWithdrawals.toString(),
        activeInvestments: 0,
      });
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Icons.Users,
      color: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/25",
    },
    {
      title: "Pending Deposits",
      value: stats.pendingDeposits,
      icon: Icons.Download,
      color: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/25",
    },
    {
      title: "Pending Withdrawals",
      value: stats.pendingWithdrawals,
      icon: Icons.Upload,
      color: "from-rose-500 to-pink-500",
      shadow: "shadow-rose-500/25",
    },
    {
      title: "Total Deposits",
      value: `KES ${parseFloat(stats.totalDeposits).toLocaleString()}`,
      icon: Icons.TrendingUp,
      color: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/25",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icons.Spinner className="w-10 h-10 text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Overview of platform activity</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <Icons.Refresh className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6"
          >
            <div
              className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${card.color} rounded-full blur-3xl opacity-20`}
            />
            <div className="relative">
              <div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} ${card.shadow} mb-4`}
              >
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-slate-400">{card.title}</p>
              <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          to="/deposits"
          className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Manage Deposits
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Review and approve deposit requests
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
              <Icons.Download className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          {stats.pendingDeposits > 0 && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium inline-block">
              {stats.pendingDeposits} pending
            </div>
          )}
        </Link>

        <Link
          to="/withdrawals"
          className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Manage Withdrawals
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Process withdrawal requests
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
              <Icons.Upload className="w-6 h-6 text-rose-400" />
            </div>
          </div>
          {stats.pendingWithdrawals > 0 && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-rose-500/20 text-rose-400 text-sm font-medium inline-block">
              {stats.pendingWithdrawals} pending
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

// ============ Deposits Page ============
function Deposits() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/deposits/admin/all");
      setDeposits(res.data);
    } catch (e) {
      console.error("Failed to fetch deposits:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleAction = async (id: string, approve: boolean) => {
    try {
      setProcessing(id);
      if (approve) await api.post(`/deposits/admin/${id}/approve`);
      else await api.post(`/deposits/admin/${id}/reject`);
      await fetchDeposits();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Action failed");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-500/20 text-amber-400",
      APPROVED: "bg-emerald-500/20 text-emerald-400",
      REJECTED: "bg-red-500/20 text-red-400",
    };
    return styles[status] || "bg-slate-500/20 text-slate-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Deposits
          </h1>
          <p className="text-slate-400 mt-1">Manage user deposit requests</p>
        </div>
        <button
          onClick={fetchDeposits}
          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <Icons.Refresh className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Icons.Spinner className="w-10 h-10 text-indigo-400" />
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-12">
          <Icons.Download className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No deposits found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white">
                      KES {parseFloat(d.amount).toLocaleString()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(d.status)}`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <p className="text-slate-300">{d.user?.email || "Unknown"}</p>
                  <p className="text-sm text-slate-400">
                    Phone: {d.phoneNumber}
                  </p>
                  <p className="text-sm text-slate-400">
                    Date: {new Date(d.createdAt).toLocaleString()}
                  </p>
                  {d.message && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-800/50 text-sm text-slate-300 max-w-xl">
                      <p className="text-xs text-slate-500 mb-1">
                        M-Pesa Message:
                      </p>
                      {d.message}
                    </div>
                  )}
                </div>
                {d.status === "PENDING" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(d.id, true)}
                      disabled={processing === d.id}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing === d.id ? (
                        <Icons.Spinner className="w-4 h-4" />
                      ) : (
                        <Icons.Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(d.id, false)}
                      disabled={processing === d.id}
                      className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Icons.X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Withdrawals Page ============
function Withdrawals() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/payouts/admin/all");
      setPayouts(res.data);
    } catch (e) {
      console.error("Failed to fetch payouts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleAction = async (id: string, approve: boolean) => {
    try {
      setProcessing(id);
      if (approve) await api.post(`/payouts/admin/${id}/approve`);
      else await api.post(`/payouts/admin/${id}/reject`);
      await fetchPayouts();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Action failed");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-500/20 text-amber-400",
      APPROVED: "bg-emerald-500/20 text-emerald-400",
      REJECTED: "bg-red-500/20 text-red-400",
    };
    return styles[status] || "bg-slate-500/20 text-slate-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Withdrawals
          </h1>
          <p className="text-slate-400 mt-1">Process withdrawal requests</p>
        </div>
        <button
          onClick={fetchPayouts}
          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <Icons.Refresh className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Icons.Spinner className="w-10 h-10 text-indigo-400" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-12">
          <Icons.Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No withdrawal requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white">
                      KES {parseFloat(p.amount).toLocaleString()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-300">{p.user?.email || "Unknown"}</p>
                  <p className="text-sm text-slate-400">
                    Send to:{" "}
                    <span className="text-emerald-400 font-medium">
                      {p.phoneNumber}
                    </span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Date: {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                {p.status === "PENDING" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(p.id, true)}
                      disabled={processing === p.id}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing === p.id ? (
                        <Icons.Spinner className="w-4 h-4" />
                      ) : (
                        <Icons.Check className="w-4 h-4" />
                      )}
                      Approve & Send
                    </button>
                    <button
                      onClick={() => handleAction(p.id, false)}
                      disabled={processing === p.id}
                      className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Icons.X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Packages Page ============
function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    price: "",
    dailyReturn: "",
    durationDays: "30",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    dailyReturn: "",
    durationDays: "30",
  });

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (e) {
      console.error("Failed to fetch packages:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post("/packages", {
        name: form.name,
        price: parseFloat(form.price),
        dailyReturn: parseFloat(form.dailyReturn),
        durationDays: parseInt(form.durationDays),
        isActive: true,
      });
      setForm({ name: "", price: "", dailyReturn: "", durationDays: "30" });
      await fetchPackages();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to add package");
    } finally {
      setSaving(false);
    }
  };

  const togglePackage = async (id: string, isActive: boolean) => {
    try {
      const pkg = packages.find((p) => p.id === id);
      await api.put(`/packages/${id}`, { ...pkg, isActive });
      await fetchPackages();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to update package");
    }
  };

  const startEditing = (pkg: any) => {
    setEditingId(pkg.id);
    setEditForm({
      name: pkg.name,
      price: pkg.price.toString(),
      dailyReturn: pkg.dailyReturn.toString(),
      durationDays: pkg.durationDays.toString(),
    });
  };

  const handleUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/packages/${id}`, {
        name: editForm.name,
        price: parseFloat(editForm.price),
        dailyReturn: parseFloat(editForm.dailyReturn),
        durationDays: parseInt(editForm.durationDays),
        isActive: packages.find((p) => p.id === id)?.isActive ?? true,
      });
      setEditingId(null);
      await fetchPackages();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to update package");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Packages</h1>
        <p className="text-slate-400 mt-1">Manage investment packages</p>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Add New Package
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Price (KES)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Daily Return
            </label>
            <input
              type="number"
              value={form.dailyReturn}
              onChange={(e) =>
                setForm({ ...form, dailyReturn: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              value={form.durationDays}
              onChange={(e) =>
                setForm({ ...form, durationDays: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:from-indigo-600 hover:to-violet-600 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <Icons.Spinner className="w-4 h-4" />
          ) : (
            <Icons.Plus className="w-4 h-4" />
          )}
          Add Package
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Icons.Spinner className="w-10 h-10 text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border p-5 ${pkg.isActive ? "border-white/10" : "border-red-500/30 opacity-60"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{pkg.name}</h3>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${pkg.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                >
                  {pkg.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {editingId === pkg.id ? (
                <form onSubmit={(e) => handleUpdate(e, pkg.id)} className="space-y-3 text-sm">
                  <div>
                    <label className="block text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Price</span>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-32 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-right text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Daily Return</span>
                      <input
                        type="number"
                        value={editForm.dailyReturn}
                        onChange={(e) => setEditForm({ ...editForm, dailyReturn: e.target.value })}
                        className="w-32 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-right text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Duration (days)</span>
                      <input
                        type="number"
                        value={editForm.durationDays}
                        onChange={(e) => setEditForm({ ...editForm, durationDays: e.target.value })}
                        className="w-24 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-right text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price</span>
                      <span className="text-white font-medium">
                        KES {parseFloat(pkg.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Return</span>
                      <span className="text-emerald-400 font-medium">
                        KES {parseFloat(pkg.dailyReturn).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="text-white">{pkg.durationDays} days</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startEditing(pkg)}
                      className="flex-1 py-2 rounded-xl bg-white/5 text-slate-200 text-sm font-medium hover:bg-white/10 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => togglePackage(pkg.id, !pkg.isActive)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${pkg.isActive ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"}`}
                    >
                      {pkg.isActive ? "Disable" : "Enable"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Users Page ============
function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<
    Record<string, { avail: string; invest: string }>
  >({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [resetProcessing, setResetProcessing] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleResetPassword = async (userId: string) => {
    try {
      setResetProcessing(userId);
      await api.post(`/users/${userId}/reset-password`);
      await fetchUsers();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetProcessing(null);
    }
  };

  const handleAdjust = async (userId: string) => {
    const adj = adjustments[userId] || { avail: "0", invest: "0" };
    try {
      setProcessing(userId);
      await api.post(`/users/${userId}/adjust`, {
        deltaAvailable: parseFloat(adj.avail) || 0,
        deltaInvestable: parseFloat(adj.invest) || 0,
      });
      setAdjustments((prev) => ({
        ...prev,
        [userId]: { avail: "", invest: "" },
      }));
      await fetchUsers();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to adjust balance");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Users</h1>
          <p className="text-slate-400 mt-1">
            Manage user accounts and balances
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <Icons.Refresh className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Icons.Spinner className="w-10 h-10 text-indigo-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
                      {u.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{u.username}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm mt-3">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20">
                      <span className="text-slate-400">Available:</span>{" "}
                      <span className="text-emerald-400 font-medium">
                        KES{" "}
                        {parseFloat(
                          u.wallet?.available || "0",
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-cyan-500/20">
                      <span className="text-slate-400">Investable:</span>{" "}
                      <span className="text-cyan-400 font-medium">
                        KES{" "}
                        {parseFloat(
                          u.wallet?.investable || "0",
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <p>
                      Password reset requested:{" "}
                      {u.passwordResetRequestedAt
                        ? new Date(u.passwordResetRequestedAt).toLocaleString()
                        : "No"}
                    </p>
                    {u.mustChangePassword && (
                      <p className="text-amber-400">User must change password on next login</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="± Available"
                    value={adjustments[u.id]?.avail || ""}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        [u.id]: { ...prev[u.id], avail: e.target.value },
                      }))
                    }
                    className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="± Investable"
                    value={adjustments[u.id]?.invest || ""}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        [u.id]: { ...prev[u.id], invest: e.target.value },
                      }))
                    }
                    className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleAdjust(u.id)}
                    disabled={processing === u.id}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium hover:from-indigo-600 hover:to-violet-600 transition-all disabled:opacity-50"
                  >
                    {processing === u.id ? (
                      <Icons.Spinner className="w-4 h-4" />
                    ) : (
                      "Adjust"
                    )}
                  </button>
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    disabled={resetProcessing === u.id}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all disabled:opacity-50"
                  >
                    {resetProcessing === u.id ? "Resetting..." : "Reset PW to 00000000"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Protected Route ============
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Icons.Spinner className="w-10 h-10 text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

// ============ App ============
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deposits"
            element={
              <ProtectedRoute>
                <Deposits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/withdrawals"
            element={
              <ProtectedRoute>
                <Withdrawals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <Packages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
