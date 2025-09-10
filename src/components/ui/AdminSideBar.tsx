
import { Link } from "react-router-dom";
import Logo from "../../assets/images/rad5hub.png"
import { Switch } from "./switch";
import {
  Menu,
  LogOut,
  Users,
  CreditCard,
  
  Moon,
  Sun,
  UserPlus,
  Book,
} from "lucide-react";

import { useTheme } from "next-themes";

import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function AdminSidebar({
  isOpen,
  toggleSidebar,
}: AdminSidebarProps) {
  const pathname = window.location.pathname
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <Menu className="h-5 w-5" />,
    },
    {
      name: "Manage Agent",
      href: "/admin/agents",
      icon: <Menu className="h-5 w-5" />,
    },
    {
      name: "Manage Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Create Admin",
      href: "/admin/create-admin",
      icon: <UserPlus className="h-5 w-5" />,
    },
    {
      name: "Withdrawals",
      href: "/admin/withdrawals",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "Create Course",
      href: "/admin/create-course",
      icon: <Book className="h-5 w-5" />,
    },
    {
      name: "Manage Courses",
      href: "/admin/manage-courses",
      icon: <Book className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    
    navigate("/admin")
  };

  if (!mounted) return null; // Prevent SSR render of theme-dependent components

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col items-center p-4 border-b dark:border-gray-700">
          <img
            src={Logo}
            alt="RAD5_Logo"
            width={100}
            // height={100}
            // className="w-auto h-auto"
          />
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
            Admin Dashboard
          </h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center p-2 rounded-md transition-colors duration-200 ${
                    pathname === item.href
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-4 p-4 w-full">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                  }
                />
                <Moon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
              </div>
            </div>
          </div>
          <Link
            to="/admin"
            className="w-full flex items-center justify-center gap-2 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:bg-white dark:text-black"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
