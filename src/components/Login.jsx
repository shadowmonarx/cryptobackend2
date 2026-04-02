import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { getMyProfile } from "../api/authApi";

export default function Login({ onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // FIX: Call backend so new Google users get a DB row created via findOrCreate()
      // with their $10,000 starting balance. Without this, balance is always blank.
      try {
        await getMyProfile();
      } catch (backendErr) {
        console.warn("Backend sync after Google login failed:", backendErr.message);
      }
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message);
      setError(friendlyGoogleError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>Welcome Back</h2>
      <p className="subtitle">Sign in to your trading account</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleLogin} noValidate>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-secondary"
          style={{ marginTop: "10px" }}
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </form>

      <p className="switch-link">
        No account?{" "}
        <button onClick={onSwitch} className="link-btn">Register here</button>
      </p>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Invalid email or password.";
    case "auth/invalid-email":      return "Please enter a valid email address.";
    case "auth/too-many-requests":  return "Too many attempts. Please wait and try again.";
    default:                        return "Sign-in failed. Please try again.";
  }
}

function friendlyGoogleError(code) {
  switch (code) {
    case "auth/popup-closed-by-user":    return "Sign-in cancelled. Please try again.";
    case "auth/popup-blocked":           return "Popup was blocked. Please allow popups for this site and try again.";
    case "auth/cancelled-popup-request": return "Sign-in cancelled.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Try signing in with email and password.";
    case "auth/network-request-failed":  return "Network error. Check your connection and try again.";
    default:                             return "Google sign-in failed. Please try again.";
  }
}
