import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RiMenu2Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "./AdminSidebarContext";
import { Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface AgentData {
  id: string;
  isVerified: boolean;
  isActive: boolean;
  fullName: string;
  email: string;
  phoneNumber: string;
  sharableLink: string;
  createdAt: string;
  updatedAt: string;
}

interface RegisterAgentResponse {
  message: string;
  data: {
    agentData: AgentData;
    referralLink: string;
  };
}

export default function AdminDashboardRegisterAgent() {
  const { openSidebar } = useSidebar();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RegisterAgentResponse["data"] | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) throw new Error("No authentication token found. Please sign in.");

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = `${apiBaseUrl}/agent/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const res: RegisterAgentResponse = await response.json();
      setResult(res.data);
      toast.success(res.message || "Agent registered successfully!", {
        duration: 4000,
        position: "top-right",
      });
      setFormData({ fullName: "", email: "", phoneNumber: "", password: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to register agent.", {
        duration: 5000,
        position: "top-right",
      });
      if (err.message.includes("token")) navigate("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy", { position: "top-right" });
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            Register Agent
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 font-medium">
            Create a new agent account on the platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900/40 border border-blue-200/60 dark:border-blue-800/40 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Full Name
                </label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="w-full h-12 rounded-xl bg-white dark:bg-gray-900/80 border border-blue-200/60 dark:border-blue-800/40 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                  className="w-full h-12 rounded-xl bg-white dark:bg-gray-900/80 border border-blue-200/60 dark:border-blue-800/40 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Phone Number
                </label>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                  className="w-full h-12 rounded-xl bg-white dark:bg-gray-900/80 border border-blue-200/60 dark:border-blue-800/40 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Password
                </label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                  className="w-full h-12 rounded-xl bg-white dark:bg-gray-900/80 border border-blue-200/60 dark:border-blue-800/40 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-200"
              >
                {isLoading ? "Registering..." : "Register Agent"}
              </Button>
            </form>
          </div>

          {result && (
            <div className="rounded-2xl bg-white dark:bg-gray-900/40 border border-green-200/60 dark:border-green-800/40 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/30">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Agent Registered</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-300 font-medium">{result.agentData.fullName}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800/40 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">ID</p>
                      <p className="font-medium text-gray-700 dark:text-gray-200 truncate">{result.agentData.id.slice(0, 12)}...</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${result.agentData.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {result.agentData.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Email</p>
                      <p className="font-medium text-gray-700 dark:text-gray-200 truncate">{result.agentData.email}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Phone</p>
                      <p className="font-medium text-gray-700 dark:text-gray-200">{result.agentData.phoneNumber}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Sharable Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-gray-50 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800/40 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 truncate">
                      {result.agentData.sharableLink}
                    </code>
                    <button
                      onClick={() => copyToClipboard(result.agentData.sharableLink)}
                      className="shrink-0 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Copy sharable link"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Referral Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-gray-50 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800/40 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 truncate">
                      {result.referralLink}
                    </code>
                    <button
                      onClick={() => copyToClipboard(result.referralLink)}
                      className="shrink-0 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Copy referral link"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <a
                  href={result.referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open referral page
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: "bg-gray-800 text-white",
          duration: 5000,
          style: { fontSize: "14px" },
        }}
      />
    </div>
  );
}
