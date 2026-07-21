import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Explore from "@/pages/Explore";
import CreateBond from "@/pages/CreateBond";
import BondDashboard from "@/pages/BondDashboard";
import ProofSubmission from "@/pages/ProofSubmission";
import ReleaseScreen from "@/pages/ReleaseScreen";
import { getSession } from "@/lib/session";

function Redirector() {
  const session = getSession();
  return <Navigate to={session ? "/explore" : "/"} replace />;
}

function App() {
  useEffect(() => {
    // Set page title
    document.title = "Pledgebond \u2014 A pledge is a sealed contract";
  }, []);

  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/explore" element={<Explore />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateBond />
                </ProtectedRoute>
              }
            />
            <Route path="/bond/:id" element={<BondDashboard />} />
            <Route
              path="/bond/:id/proof/:taskId"
              element={
                <ProtectedRoute>
                  <ProofSubmission />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bond/:id/release"
              element={
                <ProtectedRoute>
                  <ReleaseScreen />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Redirector />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1C191C",
              color: "#F2E2A6",
              border: "1px solid #C49A3A",
              fontFamily: "DM Sans, sans-serif",
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
