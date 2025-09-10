import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPageClient from "./components/LandingPageClient";
import { ThemeProvider } from "next-themes";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

function App() {
  return (
    <>
    <ThemeProvider attribute={"class"} defaultTheme="system" enableSystem>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPageClient />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </>
  );
}

export default App;
