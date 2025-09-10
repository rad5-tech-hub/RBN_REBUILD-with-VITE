  

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { RiMenu2Line, RiSearchLine } from "react-icons/ri";
import { toast } from "react-hot-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Toaster } from "react-hot-toast";
import { useSidebar } from "./AdminSidebarContext";

interface User {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  track?: string;
  paymentStatus?: string;
  referredBy?: string;
}

interface Agent {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  Users: User[];
}

interface DashboardData {
  stats: {
    users: User[];
    agents: Agent[];
    totalAgentEarnings: number;
    totalAgents: number;
    totalWithdrawals: number;
    totalUsers: number;
  };
  message: string;
}

export default function AdminDashboardUsers() {
  
  const {openSidebar} = useSidebar()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("rbn_admin_token");
        if (!token) {
          throw new Error("No authentication token found. Please sign in.");
        }

        const apiBaseUrl =import.meta.env.VITE_BASE_URL
        const endpoint = `${apiBaseUrl}/admin/dashboard`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        // Enrich users with referral and payment data from agents
        const enrichedUsers = result.stats.users.map((user: User) => {
          const agent = result.stats.agents.find((agent: Agent) =>
            agent.Users.some((u: User) => u.id === user.id)
          );
          let paymentStatus = "N/A";
          let referredBy = "N/A";

          if (agent) {
            const referredUser = agent.Users.find(
              (u: User) => u.id === user.id
            );
            if (referredUser) {
              paymentStatus = referredUser.paymentStatus || "N/A";
              referredBy = agent.fullname || "N/A";
            }
          }

          return {
            ...user,
            paymentStatus,
            referredBy,
          };
        });
        setDashboardData({
          ...result,
          stats: { ...result.stats, users: enrichedUsers },
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to load user data.", {
          duration: 5000,
          position: "top-right",
        });
        if (err.message.includes("token")) {
          navigate("/admin/signin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);
  if (isLoading || !dashboardData) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <div className="text-gray-800 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  const filteredUsers = dashboardData.stats.users.filter(
    (user) =>
      user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
     
      <div className="flex-1 transition-all duration-300">
        <button
          className="lg:hidden mb-4 p-2 bg-gray-800 text-white rounded-md"
          onClick={() => {
            openSidebar()
          }}
          aria-label="Open sidebar"
        >
          <RiMenu2Line className="h-6 w-6" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          User Management
        </h1>
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Users</CardTitle>
              <div className="relative w-full md:w-auto md:min-w-[300px]">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                  aria-label="Search users"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedUsers.length > 0 ? (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="whitespace-nowrap">
                          Phone Number
                        </TableHead>
                        <TableHead>Track</TableHead>
                        <TableHead>Referred By</TableHead>
                        <TableHead>Payment Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.fullname}
                          </TableCell>
                          <TableCell className="truncate max-w-[150px] md:max-w-[250px]">
                            {user.email}
                          </TableCell>
                          <TableCell>{user.phoneNumber || "N/A"}</TableCell>
                          <TableCell>{user.track || "N/A"}</TableCell>
                          <TableCell>{user.referredBy}</TableCell>
                          <TableCell
                            className={`font-medium ${
                              user.paymentStatus === "paid"
                                ? "text-green-600"
                                : user.paymentStatus === "unpaid"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {user.paymentStatus || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="block sm:hidden space-y-4">
                  {paginatedUsers.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex flex-col gap-2">
                        <p className="font-semibold text-sm">
                          Name: {user.fullname}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          Email: {user.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Phone: {user.phoneNumber || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Track: {user.track || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Referred By: {user.referredBy}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            user.paymentStatus === "paid"
                              ? "text-green-600"
                              : user.paymentStatus === "unpaid"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          Payment Status: {user.paymentStatus || "N/A"}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 py-4 text-center">
                No users found matching your search.
              </p>
            )}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                    size={"default"}
                      href="#"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                      size={"default"}
                        href="#"
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                    size={"default"}
                      href="#"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>
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
