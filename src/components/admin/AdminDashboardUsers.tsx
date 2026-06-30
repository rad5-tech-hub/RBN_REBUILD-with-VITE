import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { RiMenu2Line, RiSearchLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "./AdminSidebarContext";
import { Users, Calendar, Mail, Phone, BookOpen, UserCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  track?: string;
  paymentStatus?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
  Agent?: {
    id: string;
    fullName: string;
  };
}

interface AllUsersResponse {
  message: string;
  users: User[];
}

const avatarGradients = [
  "from-blue-600 to-blue-800",
  "from-blue-700 to-blue-900",
  "from-blue-500 to-blue-700",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarGradient(id: string): string {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarGradients[sum % avatarGradients.length];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  paid: {
    label: "Paid",
    classes: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/40",
  },
  unpaid: {
    label: "Unpaid",
    classes: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40",
  },
};

function resolvePaymentStatus(status?: string) {
  if (!status) return { label: "N/A", classes: "bg-gray-100 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700/40" };
  const key = status.toLowerCase();
  return statusConfig[key] || {
    label: status,
    classes: "bg-gray-100 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700/40",
  };
}

export default function AdminDashboardUsers() {
  const { openSidebar } = useSidebar();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) throw new Error("No authentication token found. Please sign in.");

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = `${apiBaseUrl}/user/all-users`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const result: AllUsersResponse = await response.json();
      setUsers(result.users || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users.", {
        id: "users-error",
        duration: 5000,
        position: "top-right",
      });
      if (err.message.includes("token")) navigate("/admin");
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchUsers();
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchQuery))
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <button
          className="lg:hidden mb-4 p-2 bg-gray-800 text-white rounded-lg"
          onClick={openSidebar}
          aria-label="Open sidebar"
        >
          <RiMenu2Line className="h-6 w-6" />
        </button>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                User Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 font-medium">
                {users.length} user{users.length !== 1 ? "s" : ""}
                {searchQuery && filteredUsers.length !== users.length
                  ? ` \u00b7 ${filteredUsers.length} match${filteredUsers.length !== 1 ? "es" : ""}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mb-4">
          <div className="relative">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-white dark:bg-gray-900/80 border border-blue-200/60 dark:border-blue-800/40 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Showing {displayUsers.length} of {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </p>
            {displayUsers.map((user) => {
              const status = resolvePaymentStatus(user.paymentStatus);
              return (
                <div
                  key={user.id}
                  className="group relative rounded-2xl bg-white dark:bg-gray-900/40 border border-blue-200/60 dark:border-blue-800/40 p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(user.id)} flex items-center justify-center shadow-sm`}>
                      <span className="text-sm font-bold text-white">{getInitials(user.fullName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {user.fullName}
                        </h3>
                        <span className="hidden sm:inline text-blue-300 dark:text-blue-400">&middot;</span>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-300">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {user.track && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                            <BookOpen className="h-3 w-3" />
                            {user.track.trim()}
                          </div>
                        )}
                        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${status.classes}`}>
                          <UserCheck className="h-3 w-3" />
                          {status.label}
                        </div>
                      </div>
                      {user.Agent && (
                        <div className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                          Referred by <span className="text-blue-600 dark:text-blue-400">{user.Agent.fullName.trim()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-center gap-3 pt-4 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-gray-500 dark:text-gray-300 font-bold px-3">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/30 mb-4 ring-1 ring-blue-200/50 dark:ring-blue-800/40">
            <Users className="h-8 w-8 text-blue-400 dark:text-blue-500" />
          </div>
          {searchQuery ? (
            <>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-200">No users match your search</p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Try a different name, email or phone number</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-200">No users found</p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Users will appear here once they register</p>
            </>
          )}
        </div>
      )}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: "bg-gray-800 text-white",
          duration: 5000,
          style: {
            fontSize: "14px",
          },
        }}
      />
    </div>
  );
}
