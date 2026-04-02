import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import "./App.css";

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Firebase is still restoring the session — don't render yet
  if (loading) return null;

  // User is logged in → show Dashboard (it handles its own backend loading state)
  if (currentUser) return <Dashboard />;

  // Not logged in → show auth forms
  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-container">
        <div className="brand">
          <span className="brand-icon">₿</span>
          <span className="brand-name">CryptoTrade</span>
        </div>
        {showRegister
          ? <Register onSwitch={() => setShowRegister(false)} />
          : <Login    onSwitch={() => setShowRegister(true)}  />
        }
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
