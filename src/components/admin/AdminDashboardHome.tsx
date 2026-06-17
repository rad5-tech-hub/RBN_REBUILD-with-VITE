import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiMenu2Line } from "react-icons/ri";
import { useSidebar } from "./AdminSidebarContext";
import { Users, CreditCard, TrendingUp, UserPlus, Clock, Activity } from "lucide-react";

interface DashboardStats {
  totalAgentEarnings: number;
  totalAgents: number;
  totalWithdrawals: number;
  totalUsers: number;
}

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditResponse {
  message: string;
  data: AuditEntry[];
}

const actionStyles: Record<string, { label: string; color: string; ring: string }> = {
  "ADMIN CREATED": { label: "Admin Created", color: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/30 dark:ring-violet-400/20" },
  "AGENT REGISTERED": { label: "Agent Registered", color: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500/30 dark:ring-indigo-400/20" },
  "USER REGISTERED": { label: "User Registered", color: "text-teal-600 dark:text-teal-400", ring: "ring-teal-500/30 dark:ring-teal-400/20" },
  "AGENT FUNDED": { label: "Agent Funded", color: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/30 dark:ring-amber-400/20" },
  "WITHDRAWAL": { label: "Withdrawal", color: "text-rose-600 dark:text-rose-400", ring: "ring-rose-500/30 dark:ring-rose-400/20" },
};

function resolveAction(action: string) {
  const key = action.toUpperCase();
  return actionStyles[key] || {
    label: action,
    color: "text-gray-600 dark:text-gray-400",
    ring: "ring-gray-500/30 dark:ring-gray-400/20",
  };
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const ms = now - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function parseDetails(details: string): Record<string, string> {
  try { return JSON.parse(details); } catch { return { info: details }; }
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const statCardTheme = [
  {
    key: "agents",
    label: "Total Agents",
    accent: "blue",
    accentClass: "text-blue-700 dark:text-blue-200",
    bgClass: "bg-blue-900 dark:bg-blue-950",
    borderClass: "border-blue-700 dark:border-blue-800",
    lineClass: "bg-blue-400",
    textClass: "text-white dark:text-white",
    labelClass: "text-blue-200 dark:text-blue-200",
    icon: Users,
    prefix: "",
  },
  {
    key: "users",
    label: "Total Users",
    accent: "blue",
    accentClass: "text-blue-700 dark:text-blue-200",
    bgClass: "bg-blue-800 dark:bg-blue-900",
    borderClass: "border-blue-600 dark:border-blue-700",
    lineClass: "bg-blue-400",
    textClass: "text-white dark:text-white",
    labelClass: "text-blue-200 dark:text-blue-200",
    icon: UserPlus,
    prefix: "",
  },
  {
    key: "earnings",
    label: "Total Earnings",
    accent: "blue",
    accentClass: "text-blue-700 dark:text-blue-200",
    bgClass: "bg-blue-700 dark:bg-blue-800",
    borderClass: "border-blue-500 dark:border-blue-600",
    lineClass: "bg-blue-400",
    textClass: "text-white dark:text-white",
    labelClass: "text-blue-200 dark:text-blue-200",
    icon: TrendingUp,
    prefix: "₦",
  },
  {
    key: "withdrawals",
    label: "Total Withdrawals",
    accent: "blue",
    accentClass: "text-blue-700 dark:text-blue-200",
    bgClass: "bg-blue-600 dark:bg-blue-700",
    borderClass: "border-blue-400 dark:border-blue-500",
    lineClass: "bg-blue-400",
    textClass: "text-white dark:text-white",
    labelClass: "text-blue-200 dark:text-blue-200",
    icon: CreditCard,
    prefix: "₦",
  },
] as const;

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const { openSidebar } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("rbn_admin_token");
        if (!token) throw new Error("No authentication token found. Please sign in.");

        const base = import.meta.env.VITE_BASE_URL;
        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [statsRes, auditRes] = await Promise.all([
          fetch(`${base}/admin/dashboard`, { method: "GET", headers }),
          fetch(`${base}/admin/audit-trail`, { method: "GET", headers }),
        ]);

        if (!statsRes.ok) {
          const err = await statsRes.json().catch(() => ({}));
          throw new Error(err.message || `Stats API error: ${statsRes.status}`);
        }

        const raw = await statsRes.json();
        const data: DashboardStats = raw.stats ?? raw;
        setStats({
          totalAgentEarnings: data.totalAgentEarnings ?? 0,
          totalAgents: data.totalAgents ?? 0,
          totalWithdrawals: data.totalWithdrawals ?? 0,
          totalUsers: data.totalUsers ?? 0,
        });

        if (auditRes.ok) {
          const auditData: AuditResponse = await auditRes.json();
          setAuditLog(auditData.data || []);
        }
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        if (err.message.includes("token")) navigate("/admin");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Loading dashboard</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const displayLog = auditLog.slice(0, 5);
  const periodLabel = todayStr();

  return (
    <div>
      <button
        className="lg:hidden mb-4 p-2 bg-gray-800 text-white rounded-lg"
        onClick={openSidebar}
        aria-label="Open sidebar"
      >
        <RiMenu2Line className="h-6 w-6" />
      </button>

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
          {greeting()}, Admin
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">{periodLabel}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(() => {
          const values: Record<string, number | string> = {
            agents: stats.totalAgents,
            users: stats.totalUsers,
            earnings: stats.totalAgentEarnings.toLocaleString(),
            withdrawals: stats.totalWithdrawals.toLocaleString(),
          };
          return statCardTheme.map((card) => {
            const val = values[card.key];
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className={`group relative rounded-2xl ${card.bgClass} border ${card.borderClass} p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-white/70 dark:bg-gray-800/70 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50 ${card.accentClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className={`text-4xl font-extrabold ${card.textClass} tabular-nums leading-none tracking-tight`}>
                  {card.prefix}{val}
                </p>
                <p className={`text-xs font-medium uppercase tracking-widest mt-2 ${card.labelClass}`}>
                  {card.label}
                </p>
                <div className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full ${card.lineClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            );
          });
        })()}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-gray-200/70 dark:border-gray-700/50 bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Recent Activity</h2>
          </div>
          {auditLog.length > 0 && (
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tabular-nums">
              {displayLog.length} of {auditLog.length}
            </span>
          )}
        </div>

        {displayLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4">
            <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-800/60 mb-3 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
              <Clock className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No recent activity</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Activity records will appear here as actions are performed</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {displayLog.map((entry) => {
              const style = resolveAction(entry.action);
              const details = parseDetails(entry.details);
              const summary = Object.values(details).join(", ");
              const time = relativeTime(entry.createdAt);
              const full = fullDate(entry.createdAt);

              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="w-full text-left px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${style.ring} shrink-0`} />
                    <div className="flex-1 min-w-0 flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <span className={`text-sm font-semibold ${style.color}`}>{style.label}</span>
                        {summary && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 truncate">{summary}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 font-medium" title={full}>
                        {time}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEntry(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200/60 dark:border-gray-700/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 uppercase tracking-wider">Activity Details</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className={`h-2.5 w-2.5 rounded-full ${resolveAction(selectedEntry.action).ring}`} />
                <span className={`text-sm font-bold ${resolveAction(selectedEntry.action).color}`}>
                  {resolveAction(selectedEntry.action).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(parseDetails(selectedEntry.details)).map(([key, val]) => (
                  <div key={key} className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">{val}</p>
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Entity</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedEntry.entityType}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Date & Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{fullDate(selectedEntry.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardHome;
