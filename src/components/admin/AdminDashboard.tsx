import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../ui/AdminSideBar";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  return (
    <>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <AdminSidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="flex-1 p-2 sm:p-4 lg:p-6 xl:ml-64 transition-all duration-300 max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
