"use client";

import { useState } from "react";
import Logo from "../../assets/images/rad5hub.png";
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
import { Input } from "..//ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Eye, EyeOff, Copy } from "lucide-react";

interface SignUpResponse {
  message: string;
  data: {
    agentData: {
      id: string;
      fullName: string;
      sharableLink: string;
      profileImage: string;
    };
    referralLink?: string;
  };
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

export default function SignupForm() {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "", // Phone number
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [phoneErrors, setPhoneErrors] = useState<string[]>([]);
  const [suggestedPassword, setSuggestedPassword] = useState<string>("");

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8)
      errors.push("Password must be at least 8 characters long.");
    if (!/[A-Z]/.test(password))
      errors.push("Password must contain at least one uppercase letter.");
    if (!/[a-z]/.test(password))
      errors.push("Password must contain at least one lowercase letter.");
    if (!/[0-9]/.test(password))
      errors.push("Password must contain at least one number.");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      errors.push("Password must contain at least one special character.");
    return errors;
  };

  const validatePhoneNumber = (phone: string) => {
    const cleanedPhone = phone.replace(/\D/g, "");
    const errors: string[] = [];
    if (cleanedPhone.length < 11 || cleanedPhone.length > 15) {
      errors.push("Phone number must be 11 to 15 digits long.");
    }
    return errors;
  };

  // const generatePassword = () => {
  //   const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  //   const lower = "abcdefghijklmnopqrstuvwxyz";
  //   const numbers = "0123456789";
  //   const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  //   const allChars = upper + lower + numbers + symbols;
  //   let password = "";
  //   password += upper[Math.floor(Math.random() * upper.length)];
  //   password += lower[Math.floor(Math.random() * lower.length)];
  //   password += numbers[Math.floor(Math.random() * numbers.length)];
  //   password += symbols[Math.floor(Math.random() * symbols.length)];
  //   for (let i = 4; i < 12; i++) {
  //     password += allChars[Math.floor(Math.random() * allChars.length)];
  //   }
  //   password = password
  //     .split("")
  //     .sort(() => Math.random() - 0.5)
  //     .join("");
  //   setSuggestedPassword(password);
  // };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file (e.g., JPG, PNG).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "lastName") {
      const cleanedValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
      setPhoneErrors(validatePhoneNumber(cleanedValue));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "password") {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];
    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(suggestedPassword);
    toast.success("Password copied to clipboard!");
    setFormData((prev) => ({
      ...prev,
      password: suggestedPassword,
      confirmPassword: suggestedPassword,
    }));
    setPasswordErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImage) {
      toast.error("Profile image is required.");
      return;
    }
    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation.length > 0) {
      toast.error("Please fix password errors before submitting.");
      setPasswordErrors(passwordValidation);
      return;
    }
    const phoneValidation = validatePhoneNumber(formData.lastName);
    if (phoneValidation.length > 0) {
      toast.error("Please fix phone number errors before submitting.");
      setPhoneErrors(phoneValidation);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    data.append("fullName", formData.firstName);
    data.append("phoneNumber", formData.lastName);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("profileImage", profileImage);

    try {
      const apiBaseUrl = import.meta.env.VITE_BASE_URL;

      if (!apiBaseUrl) {
        throw new Error("No base api defined in .env");
      }

      const response = await fetch(`${apiBaseUrl}/agent/register`, {
        method: "POST",
        body: data,
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

      const successResult = result as SignUpResponse;

      const referralLink = successResult.data.referralLink!;
      console.log("Saving referral link:", referralLink);
      localStorage.setItem("rbn_referral_link", referralLink);
      

      setRegisteredEmail(formData.email);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setProfileImage(null);
      setImagePreview(null);
      setSuggestedPassword("");
      setShowModal(true);
      toast.success(successResult.message || "Agent registered successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err: any) {
      console.error("SignUp Error:", err);
      toast.error(err.message || "An error occurred during registration.", {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" min-h-fit flex overflow-hidden items-center justify-center bg-blue-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      {showModal && (
        <div className="fixed container px-[5vw] mx-auto inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your account has been created successfully! Please check your
              email ({registeredEmail}) to verify your account before logging
              in.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 text-gray-900 hover:bg-gray-300 dark:bg-gray-400 dark:hover:bg-gray-300"
              >
                Close
              </Button>
              <Link to="/signin">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      <form
        className="container px-4 sm:px-6 lg:px-8 mx-auto h-fit"
        onSubmit={handleSubmit}
      >
        <div className="grid lg:grid-cols-2 grid-cols-1 min-h-[600px] rounded-lg overflow-hidden shadow-xl">
          <div className="hidden lg:block bg-[url(/src/assets/images/signupbg03.jpg)] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute top-0 w-full h-full bg-gradient-to-r from-blue-900/45 to-blue-800/60"></div>
            <div className="absolute z-10 text-white p-6 space-y-4">
              <Link to="/" aria-label="RAD5 Brokers Network Home">
                <img src={Logo} alt="RAD5 Logo" width={100} height={100} />
              </Link>
              <h1 className="text-4xl font-bold">Welcome to RBN</h1>
              <p className="text-sm max-w-xs">
                Join RAD5 Brokers Network to refer students to elite tech
                programs and earn commissions.
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
                <img src={Logo} alt="RAD5 Logo" width={80} height={80} />
              </Link>
              <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Sign Up
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Create a new account to become an agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label
                  htmlFor="profileImage"
                  className="text-gray-700 dark:text-gray-200"
                >
                  Profile Image
                </Label>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={imagePreview || "/default-avatar.png"}
                      alt="Profile Preview"
                    />
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                  <Input
                    id="profileImage"
                    name="profileImage"
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleImageChange}
                    className="cursor-pointer text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-gray-700 dark:text-gray-200"
                >
                  Full Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  aria-label="Full Name"
                />
              </div>
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
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-gray-700 dark:text-gray-200"
                >
                  Phone Number
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onKeyDown={handlePhoneKeyDown}
                  pattern="[0-9]*"
                  required
                  className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  aria-label="Phone Number"
                />
                {phoneErrors.length > 0 && (
                  <ul className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {phoneErrors.map((error, index) => (
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
                <div className="mt-2">
                  {/* <Button
                    type="button"
                    onClick={generatePassword}
                    className="text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Generate Strong Password
                  </Button> */}
                  {suggestedPassword && (
                    <div className="flex items-center mt-2">
                      <p className="text-gray-600 dark:text-gray-300 text-sm mr-2">
                        Suggested: {suggestedPassword}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                        aria-label="Copy suggested password"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-gray-700 dark:text-gray-200"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    aria-label="Confirm Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
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
                className="w-full bg-gray-400 text-gray-900 hover:bg-gray-300 dark:bg-gray-400 dark:hover:bg-gray-300 transform hover:scale-103 transition-transform mt-6"
                aria-label="Sign Up"
                disabled={
                  isLoading ||
                  passwordErrors.length > 0 ||
                  phoneErrors.length > 0
                }
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 24 24"
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
                {isLoading ? "Signing Up..." : "Sign Up"}
              </Button>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                Already have an account?{" "}
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
    </div>
  );
}
