// src/App.jsx
// ─────────────────────────────────────────────
// The auth gate: if Firebase says the user is logged in, show Dashboard.
// Otherwise show Login or Register. No react-router needed for this MVP.
// ─────────────────────────────────────────────

import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import "./App.css";

function AppContent() {
  const { currentUser, backendUser, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) return <h2 style={{ color: "white" }}>Loading...</h2>;

  if (currentUser) {
    if (!backendUser) return <h2 style={{ color: "white" }}>Syncing...</h2>;
    return <Dashboard />;
  }

  if (currentUser) return <Dashboard />;

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
    // AuthProvider MUST wrap everything so useAuth() works everywhere
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}