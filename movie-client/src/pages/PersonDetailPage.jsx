import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clearToken } from '../utils/auth'; // Import clearToken function
import { Bar } from 'react-chartjs-2'; // Import the Bar chart component
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'; // Import necessary Chart.js components
import './style.css'; 

// Register the necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function PersonDetailPage() {
  const { id } = useParams(); // Get person ID from URL parameters
  const [person, setPerson] = useState(null); // State to store person details
  const [error, setError] = useState(null); // For error handling
  const [ratingData, setRatingData] = useState(null); // For chart data
  const navigate = useNavigate(); // Hook for navigation

  // Function to check if the token is expired
  const isTokenExpired = (token) => {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    return Date.now() >= payload.exp * 1000;
  };

  useEffect(() => {
    const fetchPersonDetails = async () => {
      const token = localStorage.getItem("token"); // Get the token from localStorage

      if (!token || isTokenExpired(token)) {
        setError("Token expired or not found. Please log in.");
        clearToken(); // Clear the token from localStorage
        navigate(`/login?redirectTo=/people/${id}&expired=true`); // Redirect to login with a "redirectTo" param
        return;
      }

      try {
        const res = await fetch(`http://4.237.58.241:3000/people/${id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`, // Include the token in the header
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            clearToken();  // Remove the token from localStorage
            setError("Unauthorized access. Please log in again.");
            navigate('/login');  // Redirect to the login page
            return;
          }
          throw new Error(`Failed to fetch person data: ${res.statusText}`);
        }
        const data = await res.json();
        setPerson(data); // Set the fetched data to state

        // Prepare the rating data for the chart
        const imdbRatings = data.roles?.map(role => role.imdbRating).filter(Boolean); // Get IMDB ratings and filter out falsy values

        // Count ratings in specific ranges
        const ratingRanges = [0, 2, 4, 6, 8, 10];
        const ratingCount = new Array(ratingRanges.length - 1).fill(0);

        imdbRatings.forEach(rating => {
          for (let i = 0; i < ratingRanges.length - 1; i++) {
            if (rating >= ratingRanges[i] && rating < ratingRanges[i + 1]) {
              ratingCount[i]++;
              break;
            }
          }
        });

        // Set the chart data
        setRatingData({
          labels: ratingRanges.slice(0, -1).map((r, i) => `${r}-${ratingRanges[i + 1]}`),
          datasets: [
            {
              label: 'IMDB Ratings Count',
              data: ratingCount,
              backgroundColor: 'rgb(141, 75, 192)', // Bar color
              borderColor: 'rgb(141, 75, 192)', // Bar border color
              borderWidth: 1,
            },
          ],
        });

      } catch (err) {
        setError(`Error: ${err.message}`); // Handle other errors
      }
    };

    fetchPersonDetails();
  }, [id, navigate]); // Re-run effect when `id` or `navigate` changes

  if (error) {
    return <div>{error}</div>; // Show error message if there's any
  }

  if (!person) {
    return <p>Loading...</p>; // Show loading state until person data is fetched
  }

  return (
    <div className="person-detail-container">
      <h1>{person.name}</h1>
      <div className="person-detail">
        <p><strong>Born:</strong> {person.birthYear}</p>
        <p><strong>Death:</strong> {person.deathYear || "Unknown"}</p>
      </div>

      <h2>Roles in Movies:</h2>
      <div className="roles-grid">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Movie Title</th>
              <th>Character(s)</th>
              <th>IMDB Rating</th>
            </tr>
          </thead>
          <tbody>
            {person.roles && person.roles.length > 0 ? (
              person.roles.map((role, idx) => (
                <tr key={idx}>
                  <td>{role.category.charAt(0).toUpperCase() + role.category.slice(1)}</td>{/* Capitalize the role */}
                  <td>
                    <Link to={`/movies/${role.movieId}`} className="movie-link">
                      {role.movieName}
                    </Link>
                  </td>
                  <td>{role.characters?.join(", ") || "N/A"}</td>
                  <td>{role.imdbRating || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No roles available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2>IMDB Rating Distribution:</h2>
      {ratingData ? (
        <div className="chart-container">
          <Bar
            data={ratingData}
            options={{
              responsive: true,
              maintainAspectRatio: false, // Disable aspect ratio to make the chart fill the container
              plugins: {
                title: {
                  display: true,
                  text: 'Distribution of IMDB Ratings',
                },
                legend: {
                  position: 'top',
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                },
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />

        </div>
      ) : (
        <p>Loading chart...</p>
      )}
    </div>
  );
}

export default PersonDetailPage;
