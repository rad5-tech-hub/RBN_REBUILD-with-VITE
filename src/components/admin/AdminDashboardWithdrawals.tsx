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
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { toast } from "react-hot-toast";
import { RiMenu2Line, RiSearchLine } from "react-icons/ri";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { Label } from "../ui/label";

import { Toaster } from "react-hot-toast";

interface Agent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface Withdrawal {
  id: string;
  agentId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  description: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  updatedAt: string;
  Agent: Agent;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const statusClasses = {
    approved: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        statusClasses[status as keyof typeof statusClasses]
      }`}
    >
      {status}
    </span>
  );
};

export default function AdminDashboardWithdrawals() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [agentUsers, setAgentUsers] = useState<User[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [fundData, setFundData] = useState<{
    agentId: string;
    amount: number;
  }>({ agentId: "", amount: 0 });
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("rbn_admin_token");
        if (!token) throw new Error("No authentication token found");

        const apiBaseUrl = import.meta.env.VITE_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/withdrawal/withdrawals`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        setWithdrawals(result.data || []);
      } catch (err: any) {
        console.error("Failed to fetch withdrawals:", err);
        toast.error(err.message || "Failed to load withdrawals");
        if (err.message.includes("token") || err.message.includes("401")) {
          navigate("/admin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawals();
  }, [navigate]);

  const fetchUsers = async (agentId: string) => {
    setIsFetchingUsers(true);
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/user/agent/${agentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setAgentUsers(result.users || []);
      setSelectedAgentId(agentId);
      toast.success(result.message || "Agent users loaded successfully!", {
        id: "agent-users-load",
        duration: 3000,
        position: "top-right",
      });
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
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

  const fundAgent = async () => {
    setIsFunding(true);
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        throw new Error("No authentication token found. Please sign in.");
      }

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/withdrawal/pay-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentId: fundData.agentId || selectedAgentId || "",
          amount: fundData.amount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("rbn_admin_token");
          navigate("/admin");
          throw new Error("Session expired. Please sign in again.");
        }
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      toast.success(
        `${
          result.message
        }. New balance: ₦${result.walletBalance.toLocaleString()}`,
        {
          id: "fund-agent-success",
          duration: 5000,
          position: "top-right",
        }
      );

      setFundData({ agentId: "", amount: 0 });
      setAgentUsers([]);
      setIsFundDialogOpen(false);
      // Refresh withdrawals to reflect updated status
      const fetchWithdrawals = async () => {
        const token = localStorage.getItem("rbn_admin_token");
        if (!token) throw new Error("No authentication token found");

        const apiBaseUrl = import.meta.env.VITE_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/withdrawal/withdrawals`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        setWithdrawals(result.data || []);
      };
      await fetchWithdrawals();
    } catch (err: any) {
      console.error("Funding error:", err);
      toast.error(err.message || "Failed to fund agent.", {
        id: "fund-agent-error",
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsFunding(false);
    }
  };

  const approveWithdrawal = async (withdrawalId: string) => {
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        toast.error("Authentication token missing. Please sign in again.");
        navigate("/admin");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(
        `${apiBaseUrl}/withdrawal/approve/${withdrawalId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({ action: "approve" }),
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to approve withdrawal: HTTP ${response.status}`
        );
      }

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === withdrawalId
            ? {
                ...w,
                status: result.withdrawal.status,
                updatedAt: result.withdrawal.updatedAt,
              }
            : w
        )
      );

      const approvedWithdrawal = withdrawals.find((w) => w.id === withdrawalId);
      if (approvedWithdrawal) {
        setFundData({
          agentId: approvedWithdrawal.agentId,
          amount: approvedWithdrawal.amount,
        });
        await fetchUsers(approvedWithdrawal.agentId);
        setIsFundDialogOpen(true);
      }

      toast.success(result.message || "Withdrawal approved successfully!", {
        id: "approve-withdrawal-success",
        duration: 5000,
        position: "top-right",
      });
    } catch (err: any) {
      console.error("Approval error:", err);
      const errorMessage = err.message.includes("<!DOCTYPE html>")
        ? "Server error: Invalid response format"
        : err.message || "Failed to approve withdrawal";

      toast.error(errorMessage, {
        id: "approve-withdrawal-error",
        duration: 5000,
        position: "top-right",
      });

      if (
        err.message.includes("401") ||
        err.message.includes("unauthorized") ||
        err.message.includes("token")
      ) {
        navigate("/admin");
      }
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      w.Agent.fullName.toLowerCase().includes(searchLower) ||
      w.Agent.email.toLowerCase().includes(searchLower) ||
      w.accountName.toLowerCase().includes(searchLower) ||
      w.accountNumber.includes(searchQuery) ||
      w.bankName.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const paginatedWithdrawals = filteredWithdrawals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log(paginatedWithdrawals);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <div className="text-gray-800 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 transition-all duration-300">
        <button
          className="lg:hidden mb-4 p-2 bg-gray-800 text-white rounded-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <RiMenu2Line className="h-6 w-6" />
        </button>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Withdrawal Requests
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>All Withdrawals</CardTitle>
              <div className="relative w-full md:w-auto md:min-w-[300px]">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by agent, bank, or account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Agent</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="min-w-[220px]">
                      Bank Details
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Request Date
                    </TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedWithdrawals.map((withdrawal) => {
                    
                    
                    
                    return (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {withdrawal.Agent.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {withdrawal.Agent.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {withdrawal.Agent.phoneNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          ₦{withdrawal.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="font-medium">
                              {withdrawal.bankName}
                            </div>
                            <div>{withdrawal.accountNumber}</div>
                            <div className="text-gray-600">
                              {withdrawal.accountName}
                            </div>
                            {withdrawal.description && (
                              <div className="text-gray-500 text-xs">
                                {withdrawal.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={withdrawal.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(withdrawal.createdAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => approveWithdrawal(withdrawal.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {paginatedWithdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} className="p-3 overflow-hidden">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {withdrawal.Agent.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {withdrawal.Agent.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {withdrawal.Agent.phoneNumber}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-bold whitespace-nowrap">
                          ₦{withdrawal.amount.toLocaleString()}
                        </div>
                        <div className="mt-1">
                          <StatusBadge status={withdrawal.status} />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-2">
                      <h4 className="font-medium text-sm mb-1">Bank Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="col-span-2">
                          <p className="font-semibold">Bank Name</p>
                          <p className="truncate">{withdrawal.bankName}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Account No.</p>
                          <p className="truncate">{withdrawal.accountNumber}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Account Name</p>
                          <p className="truncate">{withdrawal.accountName}</p>
                        </div>
                      </div>
                      {withdrawal.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          <span className="font-semibold">Note:</span>{" "}
                          {withdrawal.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 text-sm border-t pt-2">
                      <div className="text-sm">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(withdrawal.createdAt).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                      {withdrawal.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => approveWithdrawal(withdrawal.id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs w-full xs:w-auto"
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {paginatedWithdrawals.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400 py-4 text-center">
                No withdrawal requests found.
              </p>
            )}

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      size={""}
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
                        size={""}
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
                      size={""}
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

        <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Fund Agent Payment
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reminder: The agent is supposed to receive payment within 24
                hours of approval.
              </p>
              {isFetchingUsers ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loading users...
                </p>
              ) : (
                <>
                  <div className="grid gap-1 sm:gap-2">
                    <Label htmlFor="agentId" className="text-sm">
                      Agent ID (Optional)
                    </Label>
                    <Input
                      id="agentId"
                      value={fundData.agentId}
                      onChange={(e) =>
                        setFundData({ ...fundData, agentId: e.target.value })
                      }
                      placeholder="Enter Agent ID (optional)"
                      className="text-sm"
                      disabled
                    />
                  </div>
                  <div className="grid gap-1 sm:gap-2">
                    <Label htmlFor="amount" className="text-sm">
                      Amount (₦)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={fundData.amount || ""}
                      onChange={(e) =>
                        setFundData({
                          ...fundData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter amount"
                      min={0}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        fundAgent();
                      }}
                      disabled={isFunding || !fundData.amount}
                      className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isFunding ? "Funding..." : "Fund Now"}
                    </Button>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        className="w-full text-sm"
                        disabled={isFunding}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
