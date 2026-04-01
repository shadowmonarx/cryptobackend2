// src/components/Login.jsx
// ─────────────────────────────────────────────
// Signs in an existing Firebase user with email + password.
// On success, AuthContext automatically picks up the user and the
// app navigates to the Dashboard (or whatever is behind the auth gate).
// ─────────────────────────────────────────────

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";

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
      // AuthContext fires, currentUser is set, Dashboard renders
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
    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    // 🔥 optional debug
    console.log("Google user:", user.email);

    // No need to call backend manually
    // AuthContext will handle token + sync

  } catch (err) {
    console.error(err);
    setError("Google sign-in failed.");
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
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-secondary"
            style={{ marginTop: "10px" }}
            >
            Sign in with Google
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