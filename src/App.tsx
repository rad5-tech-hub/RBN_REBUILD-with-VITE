import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPageClient from "./components/LandingPageClient";


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPageClient />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
