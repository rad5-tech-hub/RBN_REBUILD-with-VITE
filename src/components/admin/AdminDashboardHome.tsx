import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CreditCard, Users } from "lucide-react";
import { TbCurrencyNaira } from "react-icons/tb";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../loader/Loader";

interface DashboardData {
  stats: {
    totalAgentEarnings: number;
    totalAgents: number;
    totalWithdrawals: number;
    totalUsers: number;
    agents: {
      id: string;
      fullname: string;
      email: string;
    }[];
    users: {
      id: string;
      fullname: string;
      email: string;
    }[];
  };
  message: string;
}

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  date: string;
  details?: string;
}

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("rbn_admin_token");
        if (!token) {
          throw new Error("No authentication token found. Please sign in.");
        }

        const apiBaseUrl = import.meta.env.VITE_BASE_URL;
        const endpoint = `${apiBaseUrl}/admin/dashboard`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error(
            `Invalid response format: Expected JSON, received ${
              contentType || "unknown"
            }`
          );
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        setDashboardData(result);
        toast.success(result.message || "Dashboard data loaded successfully!", {
          duration: 3000,
          position: "top-right",
        });
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        toast.error(err.message || "Failed to load dashboard data.", {
          duration: 5000,
          position: "top-right",
        });
        if (err.message.includes("token")) {
          navigate("/admin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const generateActivityLog = (data: DashboardData): ActivityLog[] => {
    const logs: ActivityLog[] = [];
    data.stats.agents.forEach((agent, index) => {
      logs.push({
        id: agent.id,
        action: "Agent registered",
        user: agent.email,
        date: new Date().toISOString().split("T")[0],
        details: `Fullname: ${agent.fullname}`,
      });
    });
    data.stats.users.forEach((user, index) => {
      logs.push({
        id: user.id,
        action: "User registered",
        user: user.email,
        date: new Date().toISOString().split("T")[0],
        details: `Fullname: ${user.fullname}`,
      });
    });
    return logs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  };

  let activityLog: any[] = [];

  if (isLoading) {
    return (
      <p className="text-center py-10 text-gray-600 dark:text-gray-300">
        {/* <Loader/> */}
        Loading..
      </p>
    );
  }

  if (!dashboardData) {
    return (
      <p className="text-center py-10 text-red-500">
        No dashboard data available.
      </p>
    );
  } else {
    activityLog = generateActivityLog(dashboardData as DashboardData).slice(
      0,
      3
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-gray-100">
        Admin Dashboard
      </h1>
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[80px] sm:min-h-[100px]">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 sm:h-6 w-5 sm:w-6 text-blue-500" />
                <CardTitle className="text-sm sm:text-lg">
                  Total Agents
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-2 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                {dashboardData!.stats.totalAgents}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[80px] sm:min-h-[100px]">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 sm:h-6 w-5 sm:w-6 text-green-500" />
                <CardTitle className="text-sm sm:text-lg">
                  Total Users
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-2 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                {dashboardData!.stats.totalUsers}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[80px] sm:min-h-[100px]">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TbCurrencyNaira className="h-5 sm:h-6 w-5 sm:w-6 text-yellow-500" />
                <CardTitle className="text-sm sm:text-lg">
                  Total Earnings
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-2 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                ₦{dashboardData!.stats.totalAgentEarnings.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[80px] sm:min-h-[100px]">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 sm:h-6 w-5 sm:w-6 text-red-500" />
                <CardTitle className="text-sm sm:text-lg">
                  Total Withdrawals
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-2 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                ₦{dashboardData!.stats.totalWithdrawals.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLog.map((log) => (
                    <Dialog key={log.id}>
                      <DialogTrigger asChild>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>{log.date}</TableCell>
                        </TableRow>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Activity Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <p>
                            <strong>Action:</strong> {log.action}
                          </p>
                          <p>
                            <strong>User:</strong> {log.user}
                          </p>
                          <p>
                            <strong>Date:</strong> {log.date}
                          </p>
                          <p>
                            <strong>Details:</strong> {log.details || "-"}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
