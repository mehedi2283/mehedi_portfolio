import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { LoadingProvider } from "./context/LoadingProvider";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AdminRedirectListener = () => {
  const navigate = useNavigate();
  useEffect(() => {
    let buffer = "";
    const handleKeyDown = (e: KeyboardEvent) => {
      buffer += e.key.toLowerCase();
      if (buffer.endsWith("admin")) {
        navigate("/admin");
        buffer = "";
      }
      if (buffer.length > 10) buffer = buffer.slice(-5);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
  return null;
};

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
const Dashboard = lazy(() => import("./components/Admin/Dashboard"));

const App = () => {
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('https://mehedi-portfolio-server-phi.vercel.app/api/settings');
        if (res.data && res.data.themeColor) {
          document.documentElement.style.setProperty('--accentColor', res.data.themeColor);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <BrowserRouter>
      <AdminRedirectListener />
      <Routes>
        <Route 
          path="/" 
          element={
            <LoadingProvider>
              <Suspense fallback={null}>
                <MainContainer>
                  <Suspense fallback={null}>
                    <CharacterModel />
                  </Suspense>
                </MainContainer>
              </Suspense>
            </LoadingProvider>
          } 
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <Dashboard />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
