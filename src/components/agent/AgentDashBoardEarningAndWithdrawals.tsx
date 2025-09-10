import { useSidebar } from "./AgentSidebarContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, ArrowUpRight, Clock } from "lucide-react";
import Sidebar from "../ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { RiMenu2Line } from "react-icons/ri";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status?: string;
  bankName?: string;
}

interface Withdrawal {
  id: string;
  agentId: string;
  amount: number;
  description: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardResponse {
  message: string;
  agent: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    sharableLink: string;
    profileImage: string;
  };
  stats: {
    totalEarnings: number;
    totalWithdrawals: number;
    totalReferrals: number;
    transactionCount: number;
    currentPage: number;
    totalPages: number;
    transactions: Transaction[];
  };
}

interface WithdrawalResponse {
  message: string;
  withdrawal: Withdrawal;
}

interface WithdrawalHistoryResponse {
  message: string;
  data: Withdrawal[];
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

// List of common Nigerian banks
const nigerianBanks = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Wema Bank",
  "Zenith Bank",
  "Others",
];

// Withdrawal form schema
const withdrawalSchema = (agentFullName: string) =>
  z.object({
    amount: z
      .number()
      .min(1000, "Amount must be at least ₦1,000")
      .max(1000000, "Amount cannot exceed ₦1,000,000"),
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z
      .string()
      .length(10, "Account number must be 10 digits")
      .regex(/^\d{10}$/, "Account number must be numeric"),
    accountName: z
      .string()
      .min(1, "Account name is required")
      .refine(
        (value) => {
          if (!agentFullName) return true; // Skip validation if agentFullName is not yet available
          const agentNameParts = agentFullName.toLowerCase().split(" ");
          const inputNameParts = value.toLowerCase().split(" ");
          return agentNameParts.some((part) =>
            inputNameParts.some((inputPart) => inputPart.includes(part))
          );
        },
        {
          message: `Account name must be related to your registered name (${
            agentFullName || "your name"
          })`,
        }
      ),
  });

type WithdrawalFormValues = z.infer<ReturnType<typeof withdrawalSchema>>;

// Utility function to format credit description
const formatCreditDescription = (description: string, type: string) => {
  if (type !== "Credit" || description.length <= 50) {
    return description;
  }
  // Check if it's a commission description and treat it as a single block
  if (description.toLowerCase().startsWith("commission")) {
    return description; // Return as-is for commission
  }
  // For other long credits, split by spaces or commas
  const parts = description.split(/[\s,]+/).filter((part) => part.length > 0);
  return parts.join(" ");
};

export default function EarningsAndWithdrawals() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {openSidebar} = useSidebar()
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [withdrawalHistory, setWithdrawalHistory] = useState<
    Withdrawal[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isOtherBank, setIsOtherBank] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [itemsPerPage] = useState(5); // Number of items per page

  // Form setup with dynamic schema based on agent's fullName
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(
      withdrawalSchema(dashboardData?.agent.fullName || "")
    ),
    defaultValues: {
      amount: 0,
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  // Update form schema when dashboardData changes
  useEffect(() => {
    form.reset({
      amount: 0,
      bankName: "",
      accountNumber: "",
      accountName: "",
    });
    form.clearErrors();
    form.trigger(); // Re-validate with new schema
  }, [dashboardData?.agent.fullName, form]);

  // Fetch dashboard data
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_BASE_URL;
        const token = localStorage.getItem("rbn_token");
        if (!token) {
          throw new Error("No authentication token found. Please sign in.");
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
            errorResult.message ||
              errorResult.error ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data: DashboardResponse = await response.json();
        

        if (mounted) {
          setDashboardData(data);
          toast.success(data.message || "Dashboard data loaded!", {
            duration: 3000,
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Dashboard Error:", err);
        toast.error(err.message || "Failed to load dashboard data.", {
          duration: 5000,
        });
      }
    };

    fetchDashboardData();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Fetch withdrawal history
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchWithdrawalHistory = async () => {
      try {
        const apiBaseUrl = `${import.meta.env.VITE_BASE_URL}`
        const token = localStorage.getItem("rbn_token");
        const agentId =
          dashboardData?.agent.id ||
          (typeof window !== "undefined"
            ? localStorage.getItem("userId")
            : null);
        if (!token) {
          throw new Error("No authentication token found. Please sign in.");
        }
        if (!agentId) {
          throw new Error(
            "No agent ID found. Please ensure you are logged in."
          );
        }

       
        const response = await fetch(
          `${apiBaseUrl}/withdrawal/withdrawals/${agentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

       
        if (!response.ok) {
          const errorResult = (await response.json()) as ErrorResponse;
          throw new Error(
            errorResult.message ||
              errorResult.error ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data: WithdrawalHistoryResponse = await response.json();

        if (mounted) {
          setWithdrawalHistory(data.data || []);
          toast.success(data.message || "Withdrawal history loaded!", {
            duration: 3000,
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Withdrawal History Error:", err);
        if (mounted) {
          setWithdrawalHistory([]);
          toast.error(err.message || "Failed to load withdrawal history.", {
            duration: 5000,
          });
        }
      }
    };

    if (dashboardData?.agent.id || localStorage.getItem("userId")) {
      fetchWithdrawalHistory();
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [dashboardData]);

  // Set loading state after both API calls
  useEffect(() => {
    if (dashboardData !== null && withdrawalHistory !== null) {
      setLoading(false);
    }
  }, [dashboardData, withdrawalHistory]);

  // Debug layout dimensions
  useEffect(() => {
    const handleResize = () => {
      const cards = document.querySelectorAll(
        ".card"
      ) as NodeListOf<HTMLElement>;

      const tables = document.querySelectorAll(
        "table"
      ) as NodeListOf<HTMLElement>;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dashboardData, withdrawalHistory]);

  // Handle withdrawal form submission
  const handleSubmit = async (values: WithdrawalFormValues) => {
    setSubmitting(true);
    try {
      const apiBaseUrl = `${import.meta.env.VITE_BASE_URL}`
      const token = localStorage.getItem("rbn_token");
      if (!token) {
        throw new Error("No authentication token found. Please sign in.");
      }

      if (dashboardData && values.amount > dashboardData.stats.totalEarnings) {
        throw new Error("Withdrawal amount exceeds available earnings.");
      }

      const description = `Withdrawal request for ₦${values.amount}`;
  

      const response = await fetch(`${apiBaseUrl}/withdrawal/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          description,
        }),
      });

    
      if (!response.ok) {
        const errorResult = (await response.json()) as ErrorResponse;
        throw new Error(
          errorResult.message ||
            errorResult.error ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: WithdrawalResponse = await response.json();

      toast.success(data.message || "Withdrawal request submitted!", {
        duration: 3000,
      });
      form.reset();
      setIsOtherBank(false);
      setWithdrawalHistory((prev) =>
        prev ? [...prev, data.withdrawal] : [data.withdrawal]
      );
      setIsWithdrawalModalOpen(false); // Close withdrawal modal
      setIsNotificationOpen(true); // Open success notification modal
    } catch (err: any) {
      console.error("Withdrawal Error:", err);
      toast.error(err.message || "Failed to submit withdrawal request.", {
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate pending withdrawals
  const pendingWithdrawals = withdrawalHistory
    ? withdrawalHistory
        .filter((w) => w.status === "pending")
        .reduce((sum, w) => sum + w.amount, 0)
    : 0;

  // Calculate balance
  const balance =
    (dashboardData?.stats.totalEarnings || 0) -
    (dashboardData?.stats.totalWithdrawals || 0) -
    pendingWithdrawals;

  // Merge transactions and withdrawals
  const allTransactions: Transaction[] = [
    ...(dashboardData?.stats.transactions || []).map((t) => ({
      ...t,
      status: "Completed",
      bankName: "N/A",
      type: "Credit",
    })),
    ...(withdrawalHistory || []).map((w) => ({
      id: w.id,
      type: "Withdrawal",
      amount: w.amount,
      description: w.description,
      createdAt: w.createdAt,
      status: w.status,
      bankName: w.bankName,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = allTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Color mappings for status and type
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-blue-600 dark:text-blue-400";
      case "completed":
      case "approved":
        return "text-green-600 dark:text-green-400";
      case "rejected":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "withdrawal":
        return "text-orange-600 dark:text-orange-400";
      case "credit":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 p-2 sm:p-4 md:p-6 lg:ml-64 max-w-full min-w-[300px] mx-auto transition-all duration-300"
      >
        {/* Success Notification Modal */}
        <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Withdrawal Request Submitted
              </DialogTitle>
            </DialogHeader>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Your withdrawal request has been successfully submitted.</p>
              <p>
                Payment will be processed within 24 hours of admin approval.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsNotificationOpen(false)}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdrawal Form Modal */}
        <Dialog
          open={isWithdrawalModalOpen}
          onOpenChange={setIsWithdrawalModalOpen}
        >
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Request Withdrawal
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          className="text-sm h-9 sm:h-10"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank</FormLabel>
                      <FormControl>
                        <div>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setIsOtherBank(value === "Others");
                            }}
                            value={field.value}
                          >
                            <SelectTrigger className="text-sm h-9 sm:h-10">
                              <SelectValue placeholder="Select a bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {nigerianBanks.map((bank) => (
                                <SelectItem key={bank} value={bank}>
                                  {bank}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isOtherBank && (
                            <Input
                              placeholder="Enter other bank name"
                              className="text-sm h-9 sm:h-10 mt-2"
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10-digit account number"
                          className="text-sm h-9 sm:h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`e.g., ${
                            dashboardData?.agent.fullName || "Your name"
                          }`}
                          className="text-sm h-9 sm:h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md"
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      "Submit Withdrawal"
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <button
          className="lg:hidden mb-2 p-2 bg-gray-800 text-white rounded-md min-w-10 min-h-10"
          onClick={() => openSidebar()}
          aria-label="Toggle sidebar"
        >
          <RiMenu2Line className="h-6 w-6" />
        </button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-gray-100">
          Earnings & Withdrawals
        </h1>
        {loading ? (
          <Card className="flex justify-center items-center p-4 sm:p-6 w-full card">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm">
              Loading financial data...
            </span>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Earnings Card */}
              <Card className="w-full overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                    ₦{dashboardData?.stats.totalEarnings.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              {/* Total Withdrawals Card */}
              <Card className="w-full overflow-hidden bg-gradient-to-br from-red-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                    Total Withdrawals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                    ₦
                    {dashboardData?.stats.totalWithdrawals.toLocaleString() ||
                      0}
                  </p>
                </CardContent>
              </Card>

              {/* Pending Withdrawals Card */}
              <Card className="w-full overflow-hidden bg-gradient-to-br from-yellow-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                    Pending Withdrawals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    ₦{pendingWithdrawals.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              {/* Balance Card with Withdraw Button */}
              <Card className="w-full overflow-hidden bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                    Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                    ₦{balance.toLocaleString()}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-2"
                  >
                    <Button
                      onClick={() => setIsWithdrawalModalOpen(true)}
                      className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md flex items-center"
                      disabled={balance <= 0}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="w-full max-w-full overflow-hidden bg-white dark:bg-gray-900 shadow-md rounded-md card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allTransactions.length > 0 ? (
                  <div className="overflow-x-auto w-full">
                    <Table className="w-full max-w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left text-sm px-4 py-2 w-[120px]">
                            Date
                          </TableHead>
                          <TableHead className="text-left text-sm px-4 py-2 w-[150px]">
                            Description
                          </TableHead>
                          <TableHead className="text-left text-sm px-4 py-2 w-[100px] hidden md:table-cell">
                            Bank
                          </TableHead>
                          <TableHead className="text-left text-sm px-4 py-2 w-[100px]">
                            Amount
                          </TableHead>
                          <TableHead className="text-left text-sm px-4 py-2 w-[80px] hidden md:table-cell">
                            Type
                          </TableHead>
                          <TableHead className="text-left text-sm px-4 py-2 w-[100px] hidden md:table-cell">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentTransactions.map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <TableCell className="text-sm px-4 py-2 whitespace-nowrap">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-sm px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis line-clamp-2">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="text-sm px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
                              {transaction.bankName || "N/A"}
                            </TableCell>
                            <TableCell className="text-sm px-4 py-2 whitespace-nowrap">
                              ₦{transaction.amount.toLocaleString()}
                            </TableCell>
                            <TableCell
                              className={`text-sm px-4 py-2 whitespace-nowrap hidden md:table-cell ${getTypeColor(
                                transaction.type
                              )}`}
                              aria-label={`Type: ${transaction.type}`}
                            >
                              {transaction.type}
                            </TableCell>
                            <TableCell
                              className={`text-sm px-4 py-2 whitespace-nowrap hidden md:table-cell ${getStatusColor(
                                transaction.status
                              )}`}
                              aria-label={`Status: ${transaction.status}`}
                            >
                              <span className="capitalize">
                                {transaction.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                    {/* Transaction Details Modal */}
                    <Dialog
                      open={!!selectedTransaction}
                      onOpenChange={(open) => {
                        if (!open) setSelectedTransaction(null);
                      }}
                    >
                      <DialogContent className="max-w-[90vw] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">
                            Transaction Details
                          </DialogTitle>
                        </DialogHeader>
                        {selectedTransaction && (
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Description:</strong>{" "}
                              {selectedTransaction.type === "Credit" ? (
                                selectedTransaction.description
                                  .toLowerCase()
                                  .startsWith("commission") ? (
                                  <span>{selectedTransaction.description}</span>
                                ) : (
                                  <ul className="list-disc pl-4">
                                    {formatCreditDescription(
                                      selectedTransaction.description,
                                      selectedTransaction.type
                                    )
                                      .split(/[\s,]+/)
                                      .filter((part) => part.length > 0)
                                      .map((part, index) => (
                                        <li key={index}>{part}</li>
                                      ))}
                                  </ul>
                                )
                              ) : (
                                selectedTransaction.description
                              )}
                            </p>
                            <p>
                              <strong>Amount:</strong> ₦
                              {selectedTransaction.amount.toLocaleString()}
                            </p>
                            <p>
                              <strong>Type:</strong>{" "}
                              <span
                                className={getTypeColor(
                                  selectedTransaction.type
                                )}
                              >
                                {selectedTransaction.type}
                              </span>
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              <span
                                className={`capitalize ${getStatusColor(
                                  selectedTransaction.status
                                )}`}
                              >
                                {selectedTransaction.status}
                              </span>
                            </p>
                            <p>
                              <strong>Bank:</strong>{" "}
                              {selectedTransaction.bankName || "N/A"}
                            </p>
                            <p>
                              <strong>Date:</strong>{" "}
                              {new Date(
                                selectedTransaction.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    No transaction history found.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
