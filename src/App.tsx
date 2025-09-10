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

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPageClient />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<Admin/>} />


          {/* Agent Dashboard route */}
          <Route
            path="/agent-dashboard"
            element={
              <ProtectedRoute>
                <AgentDashboard />
              </ProtectedRoute>
            }
          >
            {/* index = /agent-dashboard */}
            <Route index element={<AgentDashboardHome />} />

            
            <Route
              path="referrals"
              element={
                <>
                  <AgentDashBoardReferrals/>
                </>
              }
            />

            <Route
              path="earnings-and-withdrawals"
              element={
                <>
                  <AgentDashBoardEarningAndWithdrawals/>
                </>
              }
            />
           
          </Route>


          <Route path="/register/agent"/>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
