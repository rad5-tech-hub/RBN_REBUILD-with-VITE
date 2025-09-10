import { useState } from "react";
import { useSidebar } from "./AdminSidebarContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";

export default function AdminDashboardCreateCourse() {
  const {openSidebar} = useSidebar()
  const [courseName, setCourseName] = useState("");
  const [price, setPrice] = useState("");
  const [duration,setDuration] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        toast.error("Authentication token missing. Please sign in again.");
        navigate("/admin");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_BASE_URL
      const response = await fetch(`${apiBaseUrl}/course/create-course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          courseName,
          courseDuration:duration,
          price: parseFloat(price),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Course created successfully!");
      setCourseName("");
      setPrice("");
      setDuration("")
    } catch (err: any) {
      
      toast.error(err.message || "Failed to create course.");
      if (err.message.includes("401")) {
        navigate("/admin/signin");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
   

      <div className="flex-1  transition-all duration-300">
        <button
          className="lg:hidden mb-4 p-2 bg-gray-800 text-white rounded-md"
          onClick={() => openSidebar()}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Create New Course
        </h1>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2 mt-4">
                <Label htmlFor="courseName" className="text-sm">
                  Course Name
                </Label>
                <Input
                  id="courseName"
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Enter course name"
                  required
                  className="text-sm"
                />
              </div>
              <div className="grid gap-2 mt-6">
                <Label htmlFor="price" className="text-sm">
                  Price (₦)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  required
                  className="text-sm"
                />
              </div>
              <div className="grid gap-2 mt-6">
                <Label htmlFor="price" className="text-sm">
                  Course Duration
                </Label>
                <Input
                  id="duration"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Enter duration (eg. 6 months)"
                 
                  required
                  className="text-sm"
                />
              </div>

              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {isLoading ? "Creating..." : "Create Course"}
              </Button>
            </form>
          </CardContent>
        </Card>
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
