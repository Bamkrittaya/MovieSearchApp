import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import MoviesPage from './pages/MoviesPage.jsx';
import MovieDetailPage from './pages/MovieDetailPage.jsx';
import PersonDetailPage from './pages/PersonDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { getToken, clearToken } from './utils/auth'; // Import functions
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState(localStorage.getItem("email"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Handle user logout
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
  
    if (refreshToken) {
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
          
          // Clear local storage to remove expired tokens
          clearToken();
          setIsAuthenticated(false); // Set authentication state to false
          setEmail(null); // Clear email state
          localStorage.removeItem("email"); // Remove email from localStorage
          
          // Redirect to login page
          navigate("/login"); 
          return;
        }
  
        // If logout succeeds (i.e., refresh token was valid), proceed with logout
        clearToken(); // Clear tokens from localStorage
        setIsAuthenticated(false); // Set authenticated state to false
        setEmail(null); // Clear email state
        localStorage.removeItem("email"); // Remove email from localStorage
  
        navigate("/login"); // Redirect to login page
      } catch (error) {
        console.error("Error logging out:", error);
      }
    } else {
      // If there's no refresh token in localStorage, force the user to log in again
      console.error("No refresh token found, forcing re-login.");
      
      // Clear local storage
      clearToken();
      setIsAuthenticated(false); // Set authenticated state to false
      setEmail(null); // Clear email state
      localStorage.removeItem("email"); // Remove email from localStorage
      
      // Redirect to login page
      navigate("/login");
    }
  };
  

  // Check if the user is authenticated (i.e., if a token exists)
  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false); // Stop loading when the check is complete
  }, []);

  if (loading) return <div>Loading...</div>;

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
    </div>
  );
}

export default App;
