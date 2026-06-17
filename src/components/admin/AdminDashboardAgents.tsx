import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast, Toaster } from "react-hot-toast";
import { RiMenu2Line, RiSearchLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "./AdminSidebarContext";
import { Wallet, ArrowRight, ArrowLeft, Users, Calendar, Mail, Phone, ExternalLink } from "lucide-react";

interface Agent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
}

interface AllAgentsResponse {
  message: string;
  nextCursor?: string;
  agents: Agent[];
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

interface FundAgentResponse {
  message: string;
  commission?: number;
  walletBalance?: number;
  error?: string;
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

export default function AdminDashboardAgents() {
  const { openSidebar } = useSidebar();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const [fundData, setFundData] = useState<{
    userId: string;
    amountPaid: number;
    commissionRate: number;
  }>({ userId: "", amountPaid: 0, commissionRate: 0.1 });

  const [isFunding, setIsFunding] = useState(false);
  const [agentUsers, setAgentUsers] = useState<User[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [currentAgentWallet, setCurrentAgentWallet] = useState<AgentWallet | null>(null);

  const fetchAgents = async (cursor?: string) => {
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) throw new Error("No authentication token found. Please sign in.");

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = cursor
        ? `${apiBaseUrl}/agent/all-agents?cursor=${cursor}`
        : `${apiBaseUrl}/agent/all-agents`;

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

      const result: AllAgentsResponse = await response.json();
      setAgents(result.agents || []);
      setNextCursor(result.nextCursor ?? null);
      setHasMore(!!result.nextCursor);
    } catch (err: any) {
      toast.error(err.message || "Failed to load agents.", {
        id: "agents-error",
        duration: 5000,
        position: "top-right",
      });
      if (err.message.includes("token")) navigate("/admin");
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchAgents(currentCursor);
      setIsLoading(false);
    };
    load();
  }, [currentCursor]);

  const handleNext = async () => {
    if (!nextCursor) return;
    setIsNavigating(true);
    setPrevCursors((prev) => [...prev, currentCursor].filter(Boolean) as string[]);
    setCurrentCursor(nextCursor);
    setTimeout(() => setIsNavigating(false), 300);
  };

  const handlePrev = async () => {
    if (prevCursors.length === 0) return;
    setIsNavigating(true);
    const newStack = [...prevCursors];
    const prev = newStack.pop();
    setPrevCursors(newStack);
    setCurrentCursor(prev);
    setTimeout(() => setIsNavigating(false), 300);
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.phoneNumber && agent.phoneNumber.includes(searchQuery))
  );

  const fetchAgentUsers = async (agentId: string) => {
    setIsFetchingUsers(true);
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) throw new Error("No authentication token found.");
      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/user/agent/${agentId}`, {
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
      if (!token) throw new Error("No authentication token found.");
      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/wallet/agent/${agentId}`, {
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
      if (!token) throw new Error("No authentication token found. Please sign in.");
      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const cleanAmountPaid =
        typeof fundData.amountPaid === "number"
          ? fundData.amountPaid
          : parseFloat(String(fundData.amountPaid).replace(/[^0-9.]/g, ""));
      const payload = { ...fundData, amountPaid: cleanAmountPaid };
      const response = await fetch(`${apiBaseUrl}/wallet/mark-paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result: FundAgentResponse = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("rbn_admin_token");
          navigate("/admin");
          throw new Error("Session expired. Please sign in again.");
        }
        throw new Error(result.error || result.message || `HTTP ${response.status}`);
      }
      setFundData({ userId: "", amountPaid: 0, commissionRate: 0.1 });
      if (selectedAgentId) await fetchAgentUsers(selectedAgentId);
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="transition-all duration-300">
        <button
          className="lg:hidden mb-4 p-2 bg-gray-800 text-white rounded-lg"
          onClick={openSidebar}
          aria-label="Open sidebar"
        >
          <RiMenu2Line className="h-6 w-6" />
        </button>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Agent Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 font-medium">
                {agents.length} agent{agents.length !== 1 ? "s" : ""}
                {searchQuery && filteredAgents.length !== agents.length
                  ? ` \u00b7 ${filteredAgents.length} match${filteredAgents.length !== 1 ? "es" : ""}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="relative">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search agents by name, email or phone..."
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

        {filteredAgents.length > 0 ? (
          <div className="space-y-3">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className={`group relative rounded-2xl bg-white dark:bg-gray-900/40 border border-blue-200/60 dark:border-blue-800/40 p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${isNavigating ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(agent.id)} flex items-center justify-center shadow-sm`}>
                    <span className="text-sm font-bold text-white">{getInitials(agent.fullName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {agent.fullName}
                      </h3>
                      <span className="hidden sm:inline text-blue-300 dark:text-blue-400">&middot;</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-300">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(agent.createdAt)}
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{agent.email}</span>
                      </div>
                      {agent.phoneNumber && (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{agent.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenFundModal(agent)}
                      disabled={isFunding || isFetchingUsers}
                      className="text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <Wallet className="h-3.5 w-3.5 mr-1" />
                      Fund
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAgentWallet(agent.id)}
                      className="text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Txns
                    </Button>
                  </div>
                </div>
                <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-blue-100/60 dark:border-blue-800/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFundModal(agent)}
                    disabled={isFunding || isFetchingUsers}
                    className="flex-1 text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <Wallet className="h-3.5 w-3.5 mr-1" />
                    Fund
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAgentWallet(agent.id)}
                    className="flex-1 text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Transactions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/30 mb-4 ring-1 ring-blue-200/50 dark:ring-blue-800/40">
              <Users className="h-8 w-8 text-blue-400 dark:text-blue-500" />
            </div>
            {searchQuery ? (
              <>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-200">No agents match your search</p>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Try a different name, email or phone number</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-200">No agents found</p>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Agents will appear here once they register</p>
              </>
            )}
          </div>
        )}

        {(hasMore || prevCursors.length > 0) && filteredAgents.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-8 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={prevCursors.length === 0 || isNavigating}
              className="text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-300 font-bold px-3">
              {prevCursors.length + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasMore || isNavigating}
              className="text-xs border-blue-300/40 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}

        {isFundModalOpen && currentAgent && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-900 rounded-lg max-w-[90vw] sm:max-w-md w-full p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg text-white drop-shadow-sm">
                      Fund Agent: {currentAgent.fullName}
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
                            type="text"
                            value={fundData.amountPaid ? fundData.amountPaid.toLocaleString() : ''}
                            onChange={(e) => {
                              // Remove commas and non-numeric characters except decimal point
                              const cleanValue = e.target.value.replace(/[^0-9.]/g, '');
                              // Prevent multiple decimal points
                              const parts = cleanValue.split('.');
                              const formattedValue = parts.length > 2 
                                ? parts[0] + '.' + parts.slice(1).join('')
                                : cleanValue;
                              
                              const numericValue = parseFloat(formattedValue) || 0;
                              setFundData({
                                ...fundData,
                                amountPaid: numericValue,
                              });
                            }}
                            onKeyDown={(e) => {
                              // Allow: backspace, delete, tab, escape, enter, decimal point
                              if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
                                  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                  (e.keyCode === 65 && e.ctrlKey === true) ||
                                  (e.keyCode === 67 && e.ctrlKey === true) ||
                                  (e.keyCode === 86 && e.ctrlKey === true) ||
                                  (e.keyCode === 88 && e.ctrlKey === true) ||
                                  // Allow: home, end, left, right, down, up
                                  (e.keyCode >= 35 && e.keyCode <= 40)) {
                                return;
                              }
                              // Ensure that it is a number and stop the keypress
                              if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="Enter amount"
                            className="text-sm bg-gray-800/50 border-gray-600 text-white"
                          />
                        </div>
                        <div className="grid gap-1 sm:gap-2">
                          <Label
                            htmlFor="commissionRate"
                            className="text-sm drop-shadow-sm text-white"
                          >
                            Commission Rate (%)
                          </Label>
                          <Input
                            id="commissionRate"
                            type="text"
                            value={fundData.commissionRate ? (fundData.commissionRate * 100).toString() : ''}
                            onChange={(e) => {
                              // Remove non-numeric characters except decimal point
                              const cleanValue = e.target.value.replace(/[^0-9.]/g, '');
                              // Prevent multiple decimal points
                              const parts = cleanValue.split('.');
                              const formattedValue = parts.length > 2 
                                ? parts[0] + '.' + parts.slice(1).join('')
                                : cleanValue;
                              
                              const numericValue = parseFloat(formattedValue) || 0;
                              // Store as decimal (divide by 100)
                              setFundData({
                                ...fundData,
                                commissionRate: numericValue / 100,
                              });
                            }}
                            onKeyDown={(e) => {
                              // Allow: backspace, delete, tab, escape, enter, decimal point
                              if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
                                  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                  (e.keyCode === 65 && e.ctrlKey === true) ||
                                  (e.keyCode === 67 && e.ctrlKey === true) ||
                                  (e.keyCode === 86 && e.ctrlKey === true) ||
                                  (e.keyCode === 88 && e.ctrlKey === true) ||
                                  // Allow: home, end, left, right, down, up
                                  (e.keyCode >= 35 && e.keyCode <= 40)) {
                                return;
                              }
                              // Ensure that it is a number and stop the keypress
                              if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="e.g., 10"
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
                <div className="bg-gray-900 rounded-lg max-w-fit sm:max-w-2xl w-full p-4 sm:p-6">
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
                      <div className="overflow-x-auto  !scrollbar-hide scroll-hide">
                        <Table className="!text-white w-full">
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
