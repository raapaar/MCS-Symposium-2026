import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../services/firebase";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const userRef = doc(db, "users", credential.user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        await signOut(auth);
        throw new Error("This account is not authorized as an administrator.");
      }

      const userData = userSnapshot.data();

      if (userData.role !== "admin") {
        await signOut(auth);
        throw new Error("This account is not authorized as an administrator.");
      }

setSuccess(true);
window.location.href = "/admin/dashboard";
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <p className="section-eyebrow">MCS Symposium 2026</p>

          <h1>Administrator Login</h1>

          <p className="admin-login-intro">
            Sign in to manage symposium content, schedules,
            presenters, announcements, and other event information.
          </p>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-form-group">
              <label htmlFor="admin-email">
                Email address
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-password">
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="admin-message admin-message-error">
                {error}
              </div>
            )}

            {success && (
              <div className="admin-message admin-message-success">
                Administrator authentication successful.
              </div>
            )}

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <a href="/#home" className="admin-back-link">
            ← Return to symposium website
          </a>
        </div>
      </div>
    </section>
  );
}

export default AdminLogin;