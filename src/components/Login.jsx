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
      // AuthContext fires → currentUser set → Dashboard renders
      // Dashboard's refreshProfile() will call getMyProfile() and create the DB row if needed
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

      // FIX: Must call the backend immediately after Google sign-in.
      // signInWithPopup signs the user into Firebase but never touches our backend.
      // Without this call, new Google users get NO row in Neon DB → balance is always "—".
      // getMyProfile() calls /api/user/me which runs findOrCreate() → creates the row
      // with $10,000 starting balance on first login, or fetches existing row on return visits.
      try {
        await getMyProfile();
      } catch (backendErr) {
        // Non-fatal — AuthContext already logged them in.
        // Dashboard will retry refreshProfile() and show the error there.
        console.warn("Backend sync after Google login failed:", backendErr.message);
      }

      // AuthContext's onAuthStateChanged already fired → Dashboard will render
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
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-secondary"
          style={{ marginTop: "10px" }}
        >
          {loading ? "Signing in…" : "Sign in with Google"}
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
      return "An account already exists with this email. Try signing in with email & password.";
    case "auth/network-request-failed":  return "Network error. Check your connection and try again.";
    default:                             return "Google sign-in failed. Please try again.";
  }
}    const result = await signInWithPopup(auth, googleProvider);

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
