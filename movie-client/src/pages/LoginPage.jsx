import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setToken } from "../utils/auth";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirectTo URL from query params (this could be the previous page they were trying to access)
  const queryParams = new URLSearchParams(location.search);
  const redirectTo = queryParams.get("redirectTo") || "/"; // Default to home page if not present
  const isFromPersonDetail = queryParams.has("redirectTo"); // Check if user came from person detail page

  useEffect(() => {
    if (localStorage.getItem("token")) {
        navigate(redirectTo); // If user is already logged in, go to the previous page
    }
  }, [navigate, redirectTo]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://4.237.58.241:3000/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.bearerToken?.token && data.refreshToken?.token) {
        setToken(data.bearerToken.token, data.refreshToken.token);
        localStorage.setItem("email", email);
        navigate(redirectTo); // Redirect to the previous page after successful login
        window.location.href = window.location.href; // Reload the current page
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {isFromPersonDetail && <p>Please login before viewing the details of the person.</p>} {/* Show message if coming from PersonDetailPage */}
      <form onSubmit={handleLogin}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default LoginPage;
