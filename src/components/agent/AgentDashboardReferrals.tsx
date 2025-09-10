"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Sidebar from "../ui/sidebar";
import ReferralLinkSection from "../referrals/ReferralLinkSection";
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
import { RiMenu2Line } from "react-icons/ri";
import {
  FaTwitter,
  FaWhatsapp,
  FaFacebook,
  FaLinkedin,
  FaTelegram,
  FaEnvelope,
  FaShareAlt,
} from "react-icons/fa";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Toaster } from "react-hot-toast";

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
  month: string;
  referrals: number;
  withdrawals: number;
  earnings: number;
}

interface DashboardResponse {
  agentId: string;
  message: string;
  agent: {
    fullName: string;
    profileImage: string;
    sharableLink: string;
  };
  stats: {
    totalEarnings: number;
    totalWithdrawals: number;
    totalReferrals: number;
    transactionCount: number;
    currentPage: number;
    totalPages: number;
    transactions: Transaction[];
    referredUsers: ReferredUser[];
  };
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

export default function AgentDashBoardReferrals() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      setLoading(true);
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
          const errorResult = result as ErrorResponse;
          throw new Error(
            errorResult.message ||
              errorResult.error ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data: DashboardResponse = result as DashboardResponse;

        if (mounted) {
          setDashboardData(data);
          toast.success(data.message || "Referrals data loaded successfully!", {
            duration: 3000,
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Referrals Error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong.";
        if (mounted) {
          toast.error(errorMessage, { duration: 5000 });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    // Log window size, card, and table dimensions for debugging
    const handleResize = () => {
      const cards = document.querySelectorAll(
        ".card"
      ) as NodeListOf<HTMLElement>;

      const table = document.querySelector("table") as HTMLElement | null;
      if (table) {
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dashboardData]);

  const handleShare = async (platform: string) => {
    const baseUrl = window.location.hostname;
    const referralLink = dashboardData?.agent.sharableLink
      ? `${baseUrl}/register-agent/${dashboardData.agent.sharableLink}`
      : "";
    const tagline =
      localStorage.getItem("userReferralTagline") ||
      "Join RBN and earn rewards!";
    const message = `${tagline} ${referralLink}`;
    let url = "";

    if (!referralLink) {
      toast.error("No referral link available.", { duration: 5000 });
      return;
    }

    switch (platform) {
      case "twitter":
        url = `https://x.com/intent/tweet?text=${encodeURIComponent(message)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
          referralLink
        )}&title=${encodeURIComponent(tagline)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(
          referralLink
        )}&text=${encodeURIComponent(tagline)}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(
          "Join RBN"
        )}&body=${encodeURIComponent(message)}`;
        break;
      case "native":
        if (navigator.share) {
          try {
            await navigator.share({
              title: "Join RBN",
              text: tagline,
              url: referralLink,
            });
            toast.success("Shared successfully!", { duration: 3000 });
            return;
          } catch (err) {
            console.error("Native share error:", err);
            toast.error("Failed to share.", { duration: 5000 });
          }
        } else {
          toast.error("Native sharing not supported.", { duration: 5000 });
          return;
        }
      default:
        return;
    }

    window.open(url, "_blank");
    toast.success(`Shared to ${platform}!`, { duration: 3000 });
  };

  const referredUsers = dashboardData?.stats.referredUsers || [];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 p-2 sm:p-4 md:p-6 lg:ml-64 max-w-full min-w-[300px] mx-auto transition-all duration-300">
        <button
          className="lg:hidden mb-2 p-2 bg-gray-800 text-white rounded-md min-w-10 min-h-10"
          onClick={() => {
            toast.error("Add context to handle sidebar")            
          }}
          aria-label="Toggle sidebar"
        >
          <RiMenu2Line className="h-6 w-6" />
        </button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-gray-100">
          Referrals
        </h1>
        {loading ? (
          <Card className="flex justify-center items-center p-4 sm:p-6 w-full box-sizing-border-box card">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm">
              Loading referrals data...
            </span>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="w-full max-w-full overflow-hidden box-sizing-border-box card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg md:text-xl">
                    Total Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {dashboardData?.stats.totalReferrals || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    Your unique referral ID:{" "}
                    {dashboardData?.agent.sharableLink ||
                      dashboardData?.agentId ||
                      "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card className="w-full max-w-full overflow-hidden box-sizing-border-box card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg md:text-xl">
                    Your Referral Link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReferralLinkSection
                    sharableLink={dashboardData?.agent.sharableLink}
                  />
                  <div className="mt-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center min-h-9 sm:min-h-10 text-sm sm:text-base transition-all duration-200"
                          aria-label="Share referral link"
                        >
                          <FaShareAlt className="mr-2 h-4 w-4" /> Share Link
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 sm:w-64 transition-all duration-200">
                        <div className="grid grid-cols-3 gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleShare("twitter")}
                            title="Share on X"
                            className="flex flex-col items-center min-h-10 sm:min-h-12 text-xs sm:text-sm"
                            aria-label="Share on X"
                          >
                            <FaTwitter className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                            <span className="text-xs mt-1">X</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleShare("whatsapp")}
                            title="Share on WhatsApp"
                            className="flex flex-col items-center min-h-10 sm:min-h-12 text-xs sm:text-sm"
                            aria-label="Share on WhatsApp"
                          >
                            <FaWhatsapp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                            <span className="text-xs mt-1">WhatsApp</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleShare("facebook")}
                            title="Share on Facebook"
                            className="flex flex-col items-center min-h-10 sm:min-h-12 text-xs sm:text-sm"
                            aria-label="Share on Facebook"
                          >
                            <FaFacebook className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            <span className="text-xs mt-1">Facebook</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleShare("linkedin")}
                            title="Share on LinkedIn"
                            className="flex flex-col items-center min-h-10 sm:min-h-12 text-xs sm:text-sm"
                            aria-label="Share on LinkedIn"
                          >
                            <FaLinkedin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" />
                            <span className="text-xs mt-1">LinkedIn</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleShare("telegram")}
                            title="Share on Telegram"
                            className="flex flex-col items-center min-h-10 sm:min-h-12 text-xs sm:text-sm"
                            aria-label="Share on Telegram"
                          >
                            <FaTelegram className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                            <span className="text-xs mt-1">Telegram</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleShare("email")}
                            title="Share via Email"
                            className="flex flex-col items-center min-h-10 sm:min-h-12 text-xs sm:text-sm"
                            aria-label="Share via Email"
                          >
                            <FaEnvelope className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                            <span className="text-xs mt-1">Email</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleShare("native")}
                            title="Share via Native App"
                            className="flex flex-col items-center min-h-10 sm:min-h-12 text-xs sm:text-sm"
                            aria-label="Share via Native App"
                          >
                            <FaShareAlt className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                            <span className="text-xs mt-1">Native</span>
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          For Instagram, copy the link and share manually.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="w-full max-w-full overflow-hidden box-sizing-border-box card">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg md:text-xl">
                  Referral Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referredUsers.length > 0 ? (
                  <>
                    <div className="hidden sm:block overflow-x-auto w-full touch-action-pan-x">
                      <Table className="w-full max-w-full">
                        <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 shadow-sm">
                          <TableRow>
                            <TableHead className="text-left text-sm px-2 sm:px-4 py-2 min-w-[50px] w-auto">
                              S/N
                            </TableHead>
                            <TableHead className="text-left text-sm px-2 sm:px-4 py-2 min-w-[80px] w-auto">
                              Name
                            </TableHead>
                            <TableHead className="text-left text-sm px-2 sm:px-4 py-2 min-w-[80px] w-auto">
                              Email
                            </TableHead>
                            <TableHead className="text-left text-sm px-2 sm:px-4 py-2 min-w-[80px] w-auto">
                              Phone
                            </TableHead>
                            <TableHead className="text-left text-sm px-2 sm:px-4 py-2 min-w-[60px] w-auto">
                              Track
                            </TableHead>
                            <TableHead className="text-left text-sm px-2 sm:px-4 py-2 min-w-[80px] w-auto">
                              Payment Status
                            </TableHead>
                            <TableHead className="text-left text-sm px-2 sm:px-4 py-2 min-w-[60px] w-auto">
                              Joined
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referredUsers.map((user, index) => (
                            <TableRow
                              key={user.id}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                            >
                              <TableCell className="text-sm px-2 sm:px-4 py-2 min-w-[50px]">
                                {index + 1}
                              </TableCell>
                              <TableCell className="text-sm px-2 sm:px-4 py-2 max-w-[80px] overflow-ellipsis whitespace-nowrap sm:truncate">
                                {user.fullName}
                              </TableCell>
                              <TableCell className="text-sm px-2 sm:px-4 py-2 max-w-[120px] overflow-ellipsis whitespace-nowrap sm:truncate">
                                {user.email}
                              </TableCell>
                              <TableCell className="text-sm px-2 sm:px-4 py-2 max-w-[80px] overflow-ellipsis whitespace-nowrap sm:truncate">
                                {user.phoneNumber}
                              </TableCell>
                              <TableCell className="text-sm px-2 sm:px-4 py-2 max-w-[60px] overflow-ellipsis whitespace-nowrap sm:truncate">
                                {user.track || "N/A"}
                              </TableCell>
                              <TableCell className="text-sm px-2 sm:px-4 py-2 max-w-[80px] overflow-ellipsis whitespace-nowrap sm:truncate">
                                {user.paymentStatus || "N/A"}
                              </TableCell>
                              <TableCell className="text-sm px-2 sm:px-4 py-2 max-w-[60px] overflow-ellipsis whitespace-nowrap sm:truncate">
                                {new Date(user.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="block sm:hidden space-y-4">
                      {referredUsers.map((user, index) => (
                        <Card key={user.id} className="p-4">
                          <div className="flex flex-col gap-2">
                            <p className="font-semibold text-sm">
                              S/N: {index + 1}
                            </p>
                            <p className="font-semibold text-sm">
                              Name: {user.fullName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              Email: {user.email}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Phone: {user.phoneNumber}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Track: {user.track || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Payment Status: {user.paymentStatus || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Joined:{" "}
                              {new Date(user.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    No referred users found.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        <Toaster position="top-right" />
      </div>
    </div>
  );
}
