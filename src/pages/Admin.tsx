import { useState, type FormEvent } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import Logo from "../assets/images/rad5hub.png"
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";

interface FormData {
  email: string;
  password: string;
}

interface AdminSignInResponse {
  message: string;
  token: string;
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validateEmail = (email: string) => {
    const errors: string[] = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address.");
    }
    return errors;
  };

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (!password.trim()) {
      errors.push("Password is required.");
    }
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setEmailErrors(validateEmail(value));
    } else if (name === "password") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setPasswordErrors(validatePassword(value));
    }
  };

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(formData.email);
    if (emailValidation.length > 0) {
      toast.error("Please fix email errors.");
      setEmailErrors(emailValidation);
      return false;
    }
    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation.length > 0) {
      toast.error("Please fix password errors.");
      setPasswordErrors(passwordValidation);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_BASE_URL
      const endpoint = `${apiBaseUrl}/admin/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        
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

      const successResult = result as AdminSignInResponse;
      localStorage.setItem("rbn_admin_token", successResult.token);

      // Show success toast
      toast.success(
        successResult.message || "Sign in successful! Redirecting...",
        {
          duration: 2000,
          position: "top-right",
        }
      );

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in. Please try again.", {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      <form
        className="container px-4 sm:px-6 lg:px-8 mx-auto h-fit"
        onSubmit={handleSubmit}
      >
        <div className="grid lg:grid-cols-2 grid-cols-1 min-h-[600px] rounded-lg overflow-hidden shadow-xl">
          <div className="hidden lg:block bg-[url(/src/assets/images/signupbg03.jpg)] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute top-0 w-full h-full bg-gradient-to-r from-blue-900/45 to-blue-800/60"></div>
            <div className="absolute z-10 text-white p-6 space-y-4">
              <Link to="/" aria-label="RAD5 Brokers Network Home">
                <img
                  src={Logo}
                  alt="RAD5 Logo"
                  width={100}
                  height={100}
                />
              </Link>
              <h1 className="text-4xl font-bold">
                Welcome to RAD5 Brokers Network
              </h1>
              <p className="text-sm max-w-xs">
                Sign in as an admin to manage the RAD5 Brokers Network platform.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 lg:px-6 lg:py-8 py-4 px-4 flex flex-col">
            <CardHeader className="space-y-2">
              <Link
                to="/"
                className="lg:hidden"
                aria-label="RAD5 Brokers Network Home"
              >
                <img
                  src={Logo}
                  alt="RAD5 Logo"
                  width={80}
                  height={80}
                />
              </Link>
              <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Admin Sign In
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Sign in to your admin account for RAD5 Brokers Network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-700 dark:text-gray-200"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  disabled={loading}
                  aria-label="Email"
                />
                {emailErrors.length > 0 && (
                  <ul className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {emailErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-gray-700 dark:text-gray-200"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    disabled={loading}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.length > 0 && (
                  <ul className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {passwordErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gray-400 text-gray-900 hover:bg-gray-300 dark:bg-gray-400 dark:hover:bg-gray-300 transform hover:scale-103 transition-transform mt-6"
                disabled={
                  loading || emailErrors.length > 0 || passwordErrors.length > 0
                }
                aria-label="Sign In"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              {/* <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                Don't have an admin account?{" "}
                <Link
                  href="/admin/signup"
                  className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Sign Up
                </Link>
              </div> */}
            </CardFooter>
          </div>
        </div>
      </form>
    </div>
  );
}
