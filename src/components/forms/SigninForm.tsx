"use client";

import { useState } from "react";
import Logo from "../../assets/images/rad5hub.png"
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Eye, EyeOff } from "lucide-react";


export default function SigninForm() {
    const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "https://rbn.bookbank.com.ng/api/v1/agent/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        const errorMessage =
          data.message ||
          data.error ||
          `Login failed with status ${response.status}. Please check your credentials.`;
        throw new Error(errorMessage);
      }

      localStorage.setItem("rbn_token", data.token);
      toast.success(data.message || "Login successful!", {
        duration: 3000,
        position: "top-right",
      });
      setTimeout(() => {
        navigate("/agent-dashboard");
      }, 1000);
    } catch (err) {
      console.error("Login Error:", err);
      let errorMessage = "Something went wrong. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes("Failed to fetch")) {
          errorMessage =
            "Unable to connect to the server. Please check your network or try again later.";
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900">
      <Toaster />
      <form
        className="container px-4 sm:px-6 lg:px-16 mx-auto h-fit"
        onSubmit={handleSubmit}
      >
        <div className="grid lg:grid-cols-2 grid-cols-1 min-h-[500px] rounded-lg overflow-hidden shadow-xl">
          <div className="hidden lg:block bg-[url(/src/assets/images/signupbg03.jpg)] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute top-0 w-full h-full bg-gradient-to-r from-blue-800/45 to-blue-900/60"></div>
            <div className="absolute z-10 text-white p-6 space-y-0">
              <Link to="/" aria-label="RAD5 Brokers Network Home">
                <img
                  src={Logo}
                  alt="RAD5 Logo"
                  width={100}
                  height={100}
                />
              </Link>
              <h1 className="text-4xl font-bold">Welcome to RBN</h1>
              <p className="text-lg">
                Sign in to access your RBN ambassador dashboard and start
                earning commissions.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 lg:px-6 lg:py-8 py-4 px-4 flex flex-col justify-center">
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
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Enter your details to access your account
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
                  aria-label="Email"
                  disabled={loading}
                />
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
                    aria-label="Password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gray-400 text-gray-900 hover:bg-gray-300 dark:bg-gray-400 dark:hover:bg-gray-300 transform hover:scale-105 transition-transform mt-6"
                aria-label="Sign In"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                <div>
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Sign Up
                  </Link>
                </div>
                <div>
                  <Link
                    to="/forgot-password"
                    className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </CardFooter>
          </div>
        </div>
      </form>
    </div>
  );
}
