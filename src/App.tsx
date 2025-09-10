import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPageClient from "./components/LandingPageClient";
import { ThemeProvider } from "next-themes";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AgentDashboard from "./pages/AgentDashboard";
import AgentDashboardHome from "./components/agent/AgentDashboardHome";
import AgentDashBoardReferrals from "./components/agent/AgentDashboardReferrals";
import AgentDashBoardEarningAndWithdrawals from "./components/agent/AgentDashBoardEarningAndWithdrawals";
import Admin from "./pages/Admin";
import ForgotPasswordForm from "./components/forms/ForgotPasswordForm";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminDashboardHome from "./components/admin/AdminDashboardHome";
import AdminDashboardAgents from "./components/admin/AdminDashboardAgents";
import AdminDashboardUsers from "./components/admin/AdminDashboardUsers";
import AdminDashboardCreateAdmin from "./components/admin/AdminDashboardCreateAdmin";
import AdminDashboardWithdrawals from "./components/admin/AdminDashboardWithdrawals";
import AdminDashboardCreateCourse from "./components/admin/AdminDashboardCreateCourse";
import AdminDashboardManageCourses from "./components/admin/AdminDashboardManageCourses";
import { AdminSidebarProvider } from "./components/admin/AdminSidebarContext";
import { AgentSidebarProvider } from "./components/agent/AgentSidebarContext";
import RegisterPage from "./pages/RegisterPage";
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPageClient />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/register/agent/:id" element={ <RegisterPage />}/>

          {/* Agent Dashboard route */}
          <Route
            path="/agent-dashboard"
            element={
              <ProtectedRoute>
                <AgentSidebarProvider>

                <AgentDashboard />
                </AgentSidebarProvider>
              </ProtectedRoute>
            }
          >
            {/* index = /agent-dashboard */}
            <Route index element={<AgentDashboardHome />} />

            <Route
              path="referrals"
              element={
                <>
                  <AgentDashBoardReferrals />
                </>
              }
            />

            <Route
              path="earnings-and-withdrawals"
              element={
                <>
                  <AgentDashBoardEarningAndWithdrawals />
                </>
              }
            />
          </Route>

          {/* Admin Dashboard Route  */}
          <Route path="/admin" element={<Admin />} />

          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminSidebarProvider>

                <AdminDashboard />
                </AdminSidebarProvider>
              </ProtectedAdminRoute>
            }
          >
            <Route
              path="dashboard"
              element={
                <>
                  <AdminDashboardHome />
                </>
              }
            />

            <Route
              path="agents"
              element={
                <>
                  <AdminDashboardAgents />
                </>
              }
            />

            <Route
              path="users"
              element={
                <>
                  <AdminDashboardUsers />
                </>
              }
            />

            
            <Route
              path="create-admin"
              element={
                <>
                  <AdminDashboardCreateAdmin />
                </>
              }
            />

             <Route
              path="withdrawals"
              element={
                <>
                  <AdminDashboardWithdrawals />
                </>
              }
            />

             <Route
              path="create-course"
              element={
                <>
                  <AdminDashboardCreateCourse />
                </>
              }
            />

             <Route
              path="manage-courses"
              element={
                <>
                  <AdminDashboardManageCourses />
                </>
              }
            />

            


          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
