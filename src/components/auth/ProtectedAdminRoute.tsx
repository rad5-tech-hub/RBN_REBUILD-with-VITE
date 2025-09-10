import  { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Make sure this is correctly imported

// Helper function to check authentication
const isAuthenticated = () => {
  const token = localStorage.getItem("rbn_admin_token");
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token); 

    // Check if token has expired
    if (exp! < Date.now() / 1000) {
      localStorage.removeItem("rbn_admin_token"); 
      return false;
    }
    return true; // Token is valid and not expired
  } catch (e) {
    return false; // In case of an error, return false
  }
};

// The PrivateRoute component
const ProtectedAdminRoute = ({ children }:any) => {
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/"); 
    }
  }, [navigate]);

  // If authenticated, render the children (the protected component)
  return isAuthenticated() ? children : null;
};

export default ProtectedAdminRoute;
