

import { useState, useEffect } from "react";
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
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "react-hot-toast";
import { RiMenu2Line, RiWallet3Line, RiSearchLine } from "react-icons/ri";

import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "./AdminSidebarContext";

interface Agent {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Transaction {
  id: string;
  agentId: string;
  type: "credit" | "debit";
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  Agent: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
}

interface AgentWallet {
  agent: { id: string; name: string; email: string };
  wallet: { balance: number };
  transactions: Transaction[];
  message?: string;
}

interface AgentUsersResponse {
  message: string;
  agent: { id: string; fullName: string; email: string };
  users: User[];
}

interface DashboardData {
  stats: { agents: Agent[] };
  message: string;
}



interface FundAgentResponse {
  message: string;
  commission?: number;
  walletBalance?: number;
  error?: string;
}

export default function AdminDashboardAgents() {
   const {openSidebar } = useSidebar()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [fundData, setFundData] = useState<{
    userId: string;
    amountPaid: number;
    commissionRate: number;
  }>({ userId: "", amountPaid: 0, commissionRate: 0.1 });
  
  const [isFunding, setIsFunding] = useState<boolean>(false);
  const [agentUsers, setAgentUsers] = useState<User[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState<boolean>(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState<boolean>(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] =
    useState<boolean>(false);
  const [currentAgentWallet, setCurrentAgentWallet] =
    useState<AgentWallet | null>(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("rbn_admin_token");
        if (!token) {
          throw new Error("No authentication token found. Please sign in.");
        }

        const apiBaseUrl = import.meta.env.VITE_BASE_URL;

        const dashboardEndpoint = `${apiBaseUrl}/admin/dashboard`;
        const dashboardResponse = await fetch(dashboardEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!dashboardResponse.ok) {
          const error = await dashboardResponse.json();
          throw new Error(error.message || `HTTP ${dashboardResponse.status}`);
        }

        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult);

        const allTxEndpoint = `${apiBaseUrl}/wallet/all-transactions`;
        const allTxResponse = await fetch(allTxEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!allTxResponse.ok) {
          const error = await allTxResponse.json();
          throw new Error(error.message || `HTTP ${allTxResponse.status}`);
        }

        
        
      } catch (err: any) {
        toast.error(err.message || "Failed to load agent data.", {
          id: "dashboard-error",
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

    fetchData();
  }, [navigate]);

  const fetchAgentUsers = async (agentId: string) => {
    setIsFetchingUsers(true);
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = `${apiBaseUrl}/user/agent/${agentId}`;
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

      const result: AgentUsersResponse = await response.json();
      setAgentUsers(result.users || []);
      setSelectedAgentId(agentId);
    } catch (err: any) {
      toast.error(err.message || "Failed to load agent users.", {
        id: "agent-users-error",
        duration: 5000,
        position: "top-right",
      });
      setAgentUsers([]);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleOpenFundModal = async (agent: Agent) => {
    await fetchAgentUsers(agent.id);
    setCurrentAgent(agent);
    setFundData({ ...fundData, userId: "" });
    setIsFundModalOpen(true);
  };

  const handleCloseFundModal = () => {
    setIsFundModalOpen(false);
    setCurrentAgent(null);
  };

  const fetchAgentWallet = async (agentId: string) => {
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = `${apiBaseUrl}/wallet/agent/${agentId}`;
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

      const result: AgentWallet = await response.json();
      
      setCurrentAgentWallet(result);
      setIsTransactionModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load agent wallet.", {
        id: "agent-wallet-error",
        duration: 5000,
        position: "top-right",
      });
    }
  };

  const handleFundAgent = async () => {
    setIsFunding(true);
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        throw new Error("No authentication token found. Please sign in.");
      }

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = `${apiBaseUrl}/wallet/mark-paid`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fundData),
      });

      const result: FundAgentResponse = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("rbn_admin_token");
          navigate("/admin");
          throw new Error("Session expired. Please sign in again.");
        }
        throw new Error(
          result.error || result.message || `HTTP ${response.status}`
        );
      }
      setFundData({ userId: "", amountPaid: 0, commissionRate: 0.1 });
      if (selectedAgentId) {
        await fetchAgentUsers(selectedAgentId);
      }
      setTimeout(() => {
        handleCloseFundModal();
        setIsFunding(false);
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to fund user.", {
        id: "fund-agent-error",
        duration: 5000,
        position: "top-right",
      });
      setIsFunding(false);
    }
  };


  if (isLoading || !dashboardData) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <div className="text-gray-800 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  const filteredAgents = dashboardData.stats.agents.filter(
    (agent) =>
      agent.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const paginatedAgents = filteredAgents.slice(
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Agent Management
        </h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Agents</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search agents by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  aria-label="Search agents"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedAgents.length > 0 ? (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead className="w-48">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAgents.map((agent) => {
                       
                        return (
                          <TableRow key={agent.id}>
                            <TableCell>{agent.fullname}</TableCell>
                            <TableCell className="truncate">
                              {agent.email}
                            </TableCell>
                            <TableCell>{agent.phoneNumber}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenFundModal(agent)}
                                  className="text-xs"
                                  disabled={isFunding || isFetchingUsers}
                                >
                                  <RiWallet3Line className="mr-1 h-3 w-3" />
                                  Fund
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    fetchAgentWallet(agent.id);
                                  }}
                                  className="text-xs"
                                >
                                  Transactions
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="block sm:hidden space-y-4">
                  {paginatedAgents.map((agent) => {
                    
                    return (
                      <Card key={agent.id} className="p-4">
                        <div className="flex flex-col gap-2">
                          <p className="font-semibold text-sm">
                            Name: {agent.fullname}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            Email: {agent.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Phone: {agent.phoneNumber}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenFundModal(agent)}
                            className="text-xs"
                            disabled={isFunding || isFetchingUsers}
                          >
                            <RiWallet3Line className="mr-1 h-3 w-3" />
                            Fund
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              fetchAgentWallet(agent.id);
                            }}
                            className="text-xs"
                          >
                            Transactions
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No agents found.
              </p>
            )}
            {isFundModalOpen && currentAgent && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-900 rounded-lg max-w-[90vw] sm:max-w-md w-full p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg text-white drop-shadow-sm">
                      Fund Agent: {currentAgent.fullname}
                    </h2>
                    <button
                      onClick={handleCloseFundModal}
                      className="text-gray-400 hover:text-white"
                      aria-label="Close modal"
                    >
                      <svg
                        className="h-6 w-6"
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
                    </button>
                  </div>
                  <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
                    {isFetchingUsers ? (
                      <p className="text-sm text-gray-300 py-4 drop-shadow-sm">
                        Loading users...
                      </p>
                    ) : agentUsers.length > 0 ? (
                      <div className="grid gap-3 sm:gap-4">
                        <div className="grid gap-1 sm:gap-2">
                          <Label
                            htmlFor="userId"
                            className="text-sm drop-shadow-sm text-white"
                          >
                            Select User
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setFundData({
                                ...fundData,
                                userId: value,
                              })
                            }
                            value={fundData.userId}
                          >
                            <SelectTrigger className="text-sm bg-gray-800/50 border-gray-600 text-white">
                              <SelectValue placeholder="Choose a user" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-white border-gray-600">
                              {agentUsers.map((user) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id}
                                  className="text-sm focus:bg-gray-700"
                                >
                                  {user.fullName} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1 sm:gap-2">
                          <Label
                            htmlFor="amountPaid"
                            className="text-sm drop-shadow-sm text-white"
                          >
                            Amount Paid (₦)
                          </Label>
                          <Input
                            id="amountPaid"
                            type="number"
                            value={fundData.amountPaid || ""}
                            onChange={(e) =>
                              setFundData({
                                ...fundData,
                                amountPaid: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Enter amount"
                            min={0}
                            className="text-sm bg-gray-800/50 border-gray-600 text-white"
                          />
                        </div>
                        <div className="grid gap-1 sm:gap-2">
                          <Label
                            htmlFor="commissionRate"
                            className="text-sm drop-shadow-sm text-white"
                          >
                            Commission Rate
                          </Label>
                          <Input
                            id="commissionRate"
                            type="number"
                            step="0.01"
                            value={fundData.commissionRate || ""}
                            onChange={(e) =>
                              setFundData({
                                ...fundData,
                                commissionRate:
                                  parseFloat(e.target.value) || 0.1,
                              })
                            }
                            placeholder="e.g., 0.1"
                            min={0}
                            max={1}
                            className="text-sm bg-gray-800/50 border-gray-600 text-white"
                          />
                        </div>
                        <Button
                          onClick={handleFundAgent}
                          disabled={
                            isFunding ||
                            !fundData.userId ||
                            !fundData.amountPaid
                          }
                          className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isFunding ? "Funding..." : "Confirm Funding"}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 py-4 drop-shadow-sm">
                        No users found under this agent. Please register users
                        to enable funding.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {isTransactionModalOpen && currentAgentWallet && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-900 rounded-lg max-w-[90vw] sm:max-w-2xl w-full p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg text-white drop-shadow-sm">
                      {currentAgentWallet.agent.name}’s Transactions
                    </h2>
                    <button
                      onClick={() => setIsTransactionModalOpen(false)}
                      className="text-gray-400 hover:text-white"
                      aria-label="Close modal"
                    >
                      <svg
                        className="h-6 w-6"
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
                    </button>
                  </div>
                  <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
                    <p className="text-sm text-gray-300 mb-2">
                      Wallet Balance: ₦
                      {currentAgentWallet.wallet.balance.toLocaleString()}
                    </p>
                    {currentAgentWallet.transactions.length > 0 ? (
                      <div className="overflow-x-auto  scrollbar-hide">
                        <Table className="!text-white">
                          <TableHeader>
                            <TableRow className="!text-white">
                              <TableHead className="!text-white">Amount</TableHead>
                              <TableHead className="!text-white">Type</TableHead>
                              <TableHead className="!text-white">Date</TableHead>
                              <TableHead className="!text-white">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentAgentWallet.transactions.map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell>
                                  ₦{tx.amount.toLocaleString()}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {tx.type}
                                </TableCell>
                                <TableCell>
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{tx.description || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300">
                        No transactions found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
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
