// src/components/Register.jsx
// ─────────────────────────────────────────────
// Creates a new Firebase user. Firebase sends a verification email
// automatically if you enable it in the console (recommended for prod).
// After registration the user is already signed in — Firebase does this
// automatically — so AuthContext picks up the new user immediately.
// ─────────────────────────────────────────────

import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/config";

export default function Register({ onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      // Firebase creates the user AND signs them in automatically
      await createUserWithEmailAndPassword(auth, email, password);
       alert("Registered successfully! Please login.");
       await signOut(auth);
       onSwitch();
      // AuthContext's onAuthStateChanged fires → currentUser is set → app re-renders
    } catch (err) {
      // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>Create Account</h2>
      <p className="subtitle">Start trading crypto today</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleRegister} noValidate>
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
          Password <span className="hint">(min 6 chars)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="switch-link">
        Already have an account?{" "}
        <button onClick={onSwitch} className="link-btn">Sign in</button>
      </p>
    </div>
  );
}

// Map Firebase error codes to human-readable messages
function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use":  return "That email is already registered.";
    case "auth/invalid-email":         return "Please enter a valid email address.";
    case "auth/weak-password":         return "Password is too weak.";
    default:                           return "Something went wrong. Please try again.";
  }
}