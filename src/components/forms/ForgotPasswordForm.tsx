import Logo from "../../assets/images/rad5hub.png"
import { useState } from "react";

import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
        const root = import.meta.env.VITE_BASE_URL

      const response = await fetch(
        `${root}/agent/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      console.log("Response status:", response.status, response.statusText);

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        const errorMessage =
          data.message ||
          data.error ||
          `Request failed with status ${response.status}. Please check your email.`;
        throw new Error(errorMessage);
      }

      setIsModalOpen(true);
      toast.success(data.message || "Password reset link sent!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      console.error("Error:", err);
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

  const handleEmailRedirect = () => {
    const emailDomain = email.split("@")[1];
    const emailProviders = {
      "gmail.com": "https://mail.google.com",
      "yahoo.com": "https://mail.yahoo.com",
      "outlook.com": "https://outlook.live.com",
      "hotmail.com": "https://outlook.live.com",
    };
    const redirectUrl =
      emailProviders[emailDomain as keyof typeof emailProviders] ||
      "https://mail.google.com";
    window.open(redirectUrl, "_blank");
    setIsModalOpen(false);
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
                Reset your password to regain access to your RBN ambassador
                dashboard.
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
                Forgot Password
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Enter your email to receive a password reset link
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
                  value={email}
                  onChange={handleInputChange}
                  required
                  className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  aria-label="Email"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gray-400 text-gray-900 hover:bg-gray-300 dark:bg-gray-400 dark:hover:bg-gray-300 transform hover:scale-105 transition-transform mt-6"
                aria-label="Reset Password"
                disabled={loading}
              >
                {loading ? "Sending..." : "Reset Password"}
              </Button>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                Remember your password?{" "}
                <Link
                  to="/signin"
                  className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </div>
        </div>
      </form>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Password Reset Link Sent</DialogTitle>
            <DialogDescription>
              A password reset link has been sent to{" "}
              <span
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={handleEmailRedirect}
              >
                {email}
              </span>
              . Please check your email to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleEmailRedirect}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              Go to Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
