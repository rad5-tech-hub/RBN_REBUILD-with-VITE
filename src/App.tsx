import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPageClient from "./components/LandingPageClient";
import { ThemeProvider } from "next-themes";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AgentDashboard from "./pages/AgentDashboard";
function App() {
  return (
    <>
      <ThemeProvider attribute={"class"} defaultTheme="system" enableSystem>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPageClient />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Admin Dashbaord  */}
            <Route
              path="/agent-dashboard"
              element={
                <ProtectedRoute>
                  <AgentDashboard>
                    hello
                  </AgentDashboard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
}

export default App;
