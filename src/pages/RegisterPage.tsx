import { useState, type FormEvent, useCallback, useEffect } from "react";
import { type Course } from "../components/LandingPageClient";
import Logo from "..//assets/images/rad5hub.png";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { Link } from "react-router-dom";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  track: string;
}

interface RegistrationResponse {
  message: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    track: string;
    agentId?: string;
    updatedAt: string;
    createdAt: string;
  };
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmittedSuccessfully, setFormSubmittedSuccessfully] =
    useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    track: "",
  });
  const [loading, setLoading] = useState(false);
  const [phoneErrors, setPhoneErrors] = useState<string[]>([]);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(true);
  // const [formSubmitted, setFormSubmitted] = useState(false);

  const validateEmail = useCallback((email: string) => {
    const errors: string[] = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address.");
    }
    return errors;
  }, []);

  const validatePhoneNumber = useCallback((phone: string) => {
    const cleanedPhone = phone.replace(/\D/g, "");
    const errors: string[] = [];
    if (!/^\d{11}$/.test(cleanedPhone)) {
      errors.push("Phone number must be 11 digits (e.g., 08123456789).");
    }
    return errors;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      const cleanedValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
      setPhoneErrors(validatePhoneNumber(cleanedValue));
    } else if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setEmailErrors(validateEmail(value));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowRight",
      "ArrowLeft",
      "Tab",
    ];
    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, track: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required.");
      return false;
    }
    const emailValidation = validateEmail(formData.email);
    if (emailValidation.length > 0) {
      toast.error("Please fix email errors.");
      setEmailErrors(emailValidation);
      return false;
    }
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (phoneValidation.length > 0) {
      toast.error("Please fix phone number errors.");
      setPhoneErrors(phoneValidation);
      return false;
    }
    if (!formData.track) {
      toast.error("Please select a track.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // setFormSubmitted(true);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_BASE_URL;
      const endpoint = `${apiBaseUrl}/user/register/${id}`;
      console.log("Submitting registration to:", endpoint);

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

      const successResult = result as RegistrationResponse;

      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        track: "",
      });
      toast.success(successResult.message || "Registration successful!", {
        duration: 3000,
        position: "top-right",
      });
      setFormSubmittedSuccessfully(true);
    } catch (err: any) {
      console.error("Registration Error:", err);
      toast.error(err.message || "Failed to register. Please try again.", {
        duration: 5000,
        position: "top-right",
      });
      setFormSubmittedSuccessfully(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/course/courses`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setCourses(result.courses || []);
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        toast.error(err.message || "Failed to load courses.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 relative">
      <Toaster position="top-right" />

      {/* Success Modal */}
      {formSubmittedSuccessfully &&
        (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-100 via-white to-green-200 dark:from-green-900 dark:via-gray-800 dark:to-green-900 p-6 rounded-xl shadow-2xl max-w-md w-full text-center space-y-4">
              <h2 className="text-3xl font-bold text-green-800 dark:text-green-200">
                Congratulations!
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You've successfully registered with RAD5 Brokers Network! Expect
                updates regarding your journey via your email or phone . Feel free to visit us
                at <strong>No.7 Factory Rd, 3rd Floor</strong> for more
                assistance.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Explore more at{" "}
                <a
                  href={`${import.meta.env.VITE_ACADEMY_WEBSITE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  https://rad5.com.ng/
                </a>
              </p>
              <Button
                // onClick={() => navigate(`${import.meta.env.VITE_ACADEMY_WEBSITE}`)}
                className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 mt-4 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <a href={`${import.meta.env.VITE_ACADEMY_WEBSITE}`}>Ok</a>
              </Button>
            </div>
          </div>
        )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 h-screen">
          <div className="w-[95%] max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-xl h-fit overflow-auto lg:p-6 p-2">
            <div className="relative">
              <img
                src={Logo}
                alt="RAD5 Tech Hub Logo"
                width={150}
                height={150}
                className="mx-auto"
              />
              <CardHeader className="pt-4 text-center">
                <CardTitle className="lg:text-4xl text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Welcome to RAD5 Tech Hub Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                  RAD5 Tech Hub offers cutting-edge tech programs designed to
                  empower you with skills in today's digital world. Whether
                  you're interested in <strong>Frontend Web Development</strong>
                  , <strong>Data Analytics</strong>,{" "}
                  <strong>UI/UX Design</strong>,{" "}
                  <strong>Digital Marketing</strong>,{" "}
                  <strong>Social Media Management</strong>, or more, our courses
                  are tailored to help you succeed. Each program varies in
                  duration (2-6 months) and provides hands-on training.
                </p>
                {/* <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                  <li>
                    <strong>Frontend Web Development</strong>: 6 months - Build
                    responsive websites.
                  </li>
                  <li>
                    <strong>Data Analytics</strong>: 4 months - Master data
                    insights.
                  </li>
                  <li>
                    <strong>UI/UX Design</strong>: 4 months - Create
                    user-friendly designs.
                  </li>
                  <li>
                    <strong>Digital Marketing</strong>: 4 months - Boost online
                    presence.
                  </li>
                  <li>
                    <strong>Social Media Management</strong>: 2 months - Manage
                    social platforms.
                  </li>
                </ul> */}
                <div className="text-center">
                  <Button
                    onClick={() => setShowInfoModal(false)}
                    className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 mt-6 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    OK, Proceed to Register
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      {!showInfoModal && (
        <form
          className="container px-4 sm:px-6 lg:px-8 mx-auto h-fit"
          onSubmit={handleSubmit}
          onKeyDown={handleFormKeyDown}
        >
          <div className="grid lg:grid-cols-2 grid-cols-1 min-h-[600px] rounded-lg overflow-hidden shadow-xl">
            <div className="hidden lg:block bg-[url(/src/assets/images/signupbg03.jpg)] bg-cover bg-center bg-no-repeat relative">
              <div className="absolute top-0 w-full h-full bg-gradient-to-r from-blue-900/45 to-blue-800/60"></div>
              <div className="absolute z-10 text-white p-6 space-y-4">
                <Link to="/" aria-label="RAD5 Brokers Network Home">
                  <img src={Logo} alt="RAD5 Logo" width={100} height={100} />
                </Link>
                <h1 className="text-4xl font-bold">
                  Join RAD5 Brokers Network
                </h1>
                <p className="text-sm max-w-xs">
                  Register to connect with elite tech programs and earn
                  commissions by referring students.
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
                  Register
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Create an account to join RAD5 Brokers Network
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-gray-700 dark:text-gray-200"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    disabled={loading}
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
                    htmlFor="phoneNumber"
                    className="text-gray-700 dark:text-gray-200"
                  >
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number (e.g., 08123456789)"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    onKeyDown={handlePhoneKeyDown}
                    pattern="[0-9]*"
                    required
                    className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    disabled={loading}
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
                    htmlFor="track"
                    className="text-gray-700 dark:text-gray-200"
                  >
                    Program Track
                  </Label>
                  <Select
                    value={formData.track}
                    onValueChange={handleSelectChange}
                    disabled={loading}
                  >
                    <SelectTrigger
                      disabled={isLoading}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                    >
                      <SelectValue placeholder="Select a track" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => {
                        return (
                          <>
                            <SelectItem value={`${course.courseName}`}>
                              {course.courseName}
                            </SelectItem>
                          </>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-gray-400 text-gray-900 hover:bg-gray-300 dark:bg-gray-400 dark:hover:bg-gray-300 transform hover:scale-103 transition-transform mt-6"
                  disabled={
                    loading ||
                    phoneErrors.length > 0 ||
                    emailErrors.length > 0 ||
                    !formData.fullName ||
                    !formData.email ||
                    !formData.phoneNumber ||
                    !formData.track
                  }
                  aria-label="Register"
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
                  {loading ? "Registering..." : "Register"}
                </Button>
              </CardFooter>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
