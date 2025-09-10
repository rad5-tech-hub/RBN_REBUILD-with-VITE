"use client";
import { whatsappMessage } from "../../constants/whatsappMessage";
import { useNavigate } from "react-router-dom";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Switch } from "./switch";
import { Menu, LogOut, Users, Sun, Moon } from "lucide-react";
import { TbCurrencyNaira } from "react-icons/tb";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";
import Logo from "../../assets/images/rad5hub.png"
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  profileImage?: string;
  imagePreview?: string | null | undefined; // Preview for uploaded images, allowing null or undefined
  agentName?: string; // Agent's full name
}

export default function Sidebar({
  isOpen,
  toggleSidebar,
  profileImage = "/default-avatar.png",
  imagePreview,
  agentName = "Agent",
}: SidebarProps) {
  
  const navigate = useNavigate()
  const pathname = window.location.pathname;
  const { theme, setTheme } = useTheme();
  const [imageLoadError, setImageLoadError] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/agent-dashboard",
      icon: <Menu className="h-5 w-5" />,
    },
    {
      name: "Referrals",
      href: "/agent-dashboard/referrals",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Earnings/Withdrawals",
      href: "/agent-dashboard/earnings-and-withdrawals",
      icon: <TbCurrencyNaira className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/signin");
  };

  const handleContactUs = () => {
    const message = whatsappMessage(agentName)
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  // Handle image load error
  const handleImageError = () => {
    console.error(
      "Failed to load profile image:",
      imagePreview || profileImage
    );
    setImageLoadError(true);
  };

  useEffect(() => {
    setImageLoadError(false); // Reset error state when image changes
  }, [imagePreview, profileImage]);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col items-center p-4">
          <img src={Logo} alt="RAD5_Logo" width={100} height={100} />

          <Avatar className="h-12 w-12 mt-2">
            {!imageLoadError ? (
              <AvatarImage
                src={imagePreview || profileImage}
                alt={`${agentName}'s profile`}
                onError={handleImageError}
              />
            ) : null}
            <AvatarFallback>
              {agentName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <nav className="w-full mt-5">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center p-2 rounded-md transition-colors duration-200 ${
                      pathname === item.href
                        ? "bg-blue-500 text-white dark:bg-blue-600"
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
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-gray-700 dark:text-gray-200" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
                aria-label="Toggle theme between light and dark mode"
              />
              <Moon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 mb-2"
            onClick={handleContactUs}
          >
            <FaWhatsapp className="h-4 w-4 text-green-600" />
            Contact Us
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
