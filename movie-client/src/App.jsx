import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import MoviesPage from './pages/MoviesPage.jsx';
import MovieDetailPage from './pages/MovieDetailPage.jsx';
import PersonDetailPage from './pages/PersonDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { getToken, getRefreshToken, clearToken, setToken } from './utils/auth'; // Import functions
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState(localStorage.getItem("email"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to check if the token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;

    const parts = token.split('.');
    if (parts.length !== 3) return true; // Invalid JWT

    const payload = JSON.parse(atob(parts[1])); // Decode the token's payload
    const expirationTime = payload.exp * 1000; // Expiry time is in seconds, convert to milliseconds

    return Date.now() >= expirationTime; // Compare expiration time with current time
  };

  // Handle user logout
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      // If no refresh token, force the user to log in again
      console.log("No refresh token found, forcing re-login.");
      clearToken();
      setIsAuthenticated(false);
      setEmail(null);
      localStorage.removeItem("email");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://4.237.58.241:3000/user/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // If the logout request fails due to an expired token, force the user to log in again
        console.error("Failed to logout due to expired token, forcing re-login.");
        
        clearToken(); // Clear tokens from localStorage
        setIsAuthenticated(false);
        setEmail(null);
        localStorage.removeItem("email");

        // Redirect to login page
        navigate("/login");
        return;
      }

      // If logout is successful (i.e., refresh token was valid), clear tokens
      clearToken();
      setIsAuthenticated(false);
      setEmail(null);
      localStorage.removeItem("email");

      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout error:", error);
      clearToken(); // Clear tokens in case of any error
      navigate("/login"); // Redirect to login page
    }
  };

  // Function to refresh the token using the refresh token
  const refreshToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearToken();
      return;
    }

    try {
      const res = await fetch("http://4.237.58.241:3000/user/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();
      if (res.ok && data.bearerToken && data.refreshToken) {
        setToken(data.bearerToken.token, data.refreshToken.token);
        setIsAuthenticated(true);
      } else {
        clearToken();
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      clearToken();
    }
  };

  // Check if the user is authenticated (i.e., if a token exists)
  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true); // Token exists, user is authenticated
    }
    setLoading(false); // Stop loading when the check is complete
  }, []);

  if (loading) return <div>Loading...</div>; // You can show a loading spinner here.

  return (
    <div>
      <nav className="navbar">
        <Link className="navbar-link" to="/">Home</Link>
        <Link className="navbar-link" to="/movies">Movies</Link>
        {isAuthenticated ? (
          <>
            <Link className="navbar-link" to="/login" onClick={handleLogout}>
              Logout
            </Link>
            <span className="navbar-email">👤 {email}</span>
          </>
        ) : (
          <>
            <Link className="navbar-link" to="/login">Login</Link>
            <Link className="navbar-link" to="/register">Register</Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:imdbID" element={<MovieDetailPage />} />
        <Route path="/people/:id" element={<PersonDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      {/* Footer Section */}
      <footer className="footer">
        {/* <p>All data is from API</p> */}
        <p>&copy; 2025 Krittaya Kruapat. All rights reserved.</p>
      </footer>
    </div>
  );
}
export default App;
