import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast, Toaster } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { RiMenu2Line } from "react-icons/ri";
import { useSidebar } from "../admin/AdminSidebarContext";

interface CreateAdminResponse {
  message: string;
  admin: {
    id: string;
    fullName: string;
    email: string;
    password: string;
    role: string;
    updatedAt: string;
    createdAt: string;
  };
}

export default function CreateAdmin() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { openSidebar } = useSidebar();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    if (field === "password") setShowPassword((prev) => !prev);
    else setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.", {
        duration: 5000,
        position: "top-right",
      });
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) throw new Error("No authentication token found. Please sign in.");

      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = `${apiBaseUrl}/admin/create`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result: CreateAdminResponse = await response.json();

      toast.success(result.message || "Admin created successfully!", {
        duration: 3000,
        position: "top-right",
      });
      setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create admin.", {
        duration: 5000,
        position: "top-right",
      });
      if (err.message.includes("token")) navigate("/admin");
    } finally {
      setIsLoading(false);
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
            Create New Admin
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 font-medium">
            Add a new administrator to the platform
          </p>
        </div>

        <div className="max-w-lg mx-auto">
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
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-white dark:bg-gray-900/80 border border-blue-200/60 dark:border-blue-800/40 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-white dark:bg-gray-900/80 border border-blue-200/60 dark:border-blue-800/40 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-200"
              >
                {isLoading ? "Creating..." : "Create Admin"}
              </Button>
            </form>
          </div>
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
