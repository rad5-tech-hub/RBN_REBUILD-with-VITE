import { useState, useEffect, useRef } from "react";
import { toast, Toaster } from "react-hot-toast";
import Sidebar from "../components/ui/sidebar"; // Adjust path if needed
import { useTheme } from "next-themes"; // For theme support
import { Outlet } from "react-router-dom";
interface ReferredUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  track: string;
  paymentStatus: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  agentId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  sharableLink: string;
  profileImage: string;
  isVerified: boolean;
  isActive: boolean;
  verificationToken: string | null;
  googleId: string | null;
  resetToken: string | null;
  resetTokenExpires: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardResponse {
  message: string;
  agent: Agent;
  stats: {
    totalEarnings: number;
    totalWithdrawals: number;
    totalReferrals: number;
    referredUsers: ReferredUser[];
    transactionCount: number;
    currentPage: number;
    totalPages: number;
    transactions: Transaction[];
  };
}

export interface ErrorResponse {
  message?: string;
  error?: string;
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  profileImage: string;
  agentName: string;
}

interface AgentDashboardProps {
  children?: React.ReactNode;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const { theme } = useTheme(); // For theme consistency

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      const controller = new AbortController();

      try {
        const apiBaseUrl = import.meta.env.VITE_BASE_URL 
        const baseUrl = window.location.host  

        
        if (!apiBaseUrl) {
          throw new Error("BASE_URL not defined in .env");
        }

        const token = localStorage.getItem("rbn_token");
        if (!token) {
          throw new Error("Please sign in to access the dashboard.");
        }

        const response = await fetch(`${apiBaseUrl}/agent/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorResult = (await response.json()) as ErrorResponse;
          throw new Error(
            errorResult.message || errorResult.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data: DashboardResponse = await response.json();
        const expectedReferralLink = `${baseUrl}/register/agent/${data.agent.sharableLink}`;

        const storedReferralLink = localStorage.getItem("rbn_referral_link");
        const storedSharableLink = localStorage.getItem("rbn_sharable_link");

        if (storedReferralLink && storedSharableLink !== data.agent.sharableLink) {
         
          toast.success("Referral link updated to match your account.");
          localStorage.setItem("rbn_referral_link", expectedReferralLink);
          localStorage.setItem("rbn_sharable_link", data.agent.sharableLink);
        } else if (!storedReferralLink && data.agent.sharableLink) {
          localStorage.setItem("rbn_referral_link", expectedReferralLink);
          localStorage.setItem("rbn_sharable_link", data.agent.sharableLink);
        }

        if (mounted.current) {
          setDashboardData(data);
          
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (mounted.current) {
          const errorMessage = err.message || "Failed to load dashboard data.";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }

      return () => {
        controller.abort();
      };
    };

    fetchDashboardData();
  }, []); 

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-poppins">
      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900",
          duration: 5000,
          style: { fontSize: "14px" },
        }}
      />
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          profileImage={dashboardData?.agent.profileImage || "/default-avatar.png"}
          agentName={dashboardData?.agent.fullName || "Agent"}
        />
        <div className="flex-1   transition-all duration-300 max-w-full overflow-x-hidden">
          
          {!loading && !error && <Outlet/>}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;