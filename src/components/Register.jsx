import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { getMyProfile } from "../api/authApi";

export default function Register({ onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);

      // FIX: Call the backend BEFORE signing out so the user row is created in
      // Neon DB with the $10,000 starting balance. Without this call,
      // findOrCreate() is never triggered and balance stays blank forever.
      try {
        await getMyProfile();
      } catch (backendErr) {
        console.warn("Backend registration sync failed:", backendErr.message);
      }

      alert("Registered successfully! Please login.");
      await signOut(auth);
      onSwitch();
    } catch (err) {
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
            placeholder="..."
            required
            autoComplete="new-password"
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="switch-link">
        Already have an account?{" "}
        <button onClick={onSwitch} className="link-btn">Sign in</button>
      </p>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use":  return "That email is already registered.";
    case "auth/invalid-email":         return "Please enter a valid email address.";
    case "auth/weak-password":         return "Password is too weak.";
    default:                           return "Something went wrong. Please try again.";
  }
}
