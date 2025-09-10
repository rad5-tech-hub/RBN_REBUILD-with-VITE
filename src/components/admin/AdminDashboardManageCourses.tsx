import { useState, useEffect } from "react";
import { useSidebar } from "./AdminSidebarContext";
import { useNavigate } from "react-router-dom";
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
import { Input } from "../ui/input";
import { RiSearchLine } from "react-icons/ri";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";

interface Course {
  id: string;
  courseName: string;
  price: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboardManageCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const {openSidebar} = useSidebar()
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        toast.error("Authentication token missing. Please sign in again.");
        navigate("/admin");
        return;
      }

      const apiBaseUrl =import.meta.env.VITE_BASE_URL
      const response = await fetch(`${apiBaseUrl}/course/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setCourses(result.courses || []);
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      toast.error(err.message || "Failed to load courses.");
      if (err.message.includes("401")) {
        navigate("/admin/signin");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setEditedName(course.courseName);
    setEditedPrice(course.price.toString());
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCourse) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("rbn_admin_token");
      if (!token) {
        toast.error("Authentication token missing. Please sign in again.");
        navigate("/admin");
        return;
      }

      const apiBaseUrl =import.meta.env.VITE_BASE_URL
      const response = await fetch(
        `${apiBaseUrl}/course/courses/${editingCourse.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            courseName: editedName,
            price: parseFloat(editedPrice),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setCourses(
        courses.map((c) =>
          c.id === editingCourse.id
            ? { ...c, courseName: editedName, price: parseFloat(editedPrice) }
            : c
        )
      );
      toast.success(result.message || "Course updated successfully!");
      setEditDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating course:", err);
      toast.error(err.message || "Failed to update course.");
      if (err.message.includes("401")) {
        navigate("/admin");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <div className="text-gray-800 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
     
      <div className="flex-1 transition-all duration-300">
        <button
          className="lg:hidden mb-4 p-2 bg-gray-800 text-white rounded-md"
          onClick={() => 
            openSidebar()
          }
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
          Manage Courses
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>All Courses</CardTitle>
              <div className="relative w-full md:w-auto md:min-w-[300px]">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by course name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Price (₦)</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.courseName}</TableCell>
                      <TableCell>{course.price.toLocaleString()}</TableCell>
                      <TableCell>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(course)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredCourses.length === 0 && (
                <p className="text-gray-600 dark:text-gray-400 py-4 text-center">
                  No courses found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Edit Course
              </DialogTitle>
            </DialogHeader>
            {editingCourse && (
              <div className="grid gap-4 py-2 sm:py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editCourseName" className="text-sm">
                    Course Name
                  </Label>
                  <Input
                    id="editCourseName"
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editPrice" className="text-sm">
                    Price (₦)
                  </Label>
                  <Input
                    id="editPrice"
                    type="number"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
