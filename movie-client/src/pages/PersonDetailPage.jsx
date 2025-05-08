import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PersonDetailPage.css'; // Import custom CSS for the roles grid

function PersonDetailPage() {
  const { id } = useParams(); // Get person ID from URL parameters
  const [person, setPerson] = useState(null); // State to store person details
  const navigate = useNavigate(); // Hook for navigation
  const [error, setError] = useState(null); // For error handling

  useEffect(() => {
    const fetchPersonDetails = async () => {
      const token = localStorage.getItem("token"); // Get the token from localStorage

      if (!token) {
        setError("No token found, please log in.");
        navigate(`/login?redirectTo=/people/${id}`); // Redirect to login with a "redirectTo" param
        return;
      }

      try {
        // Fetch person details using the provided ID and Authorization token
        const res = await fetch(`http://4.237.58.241:3000/people/${id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`, // Include the token in the header
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Unauthorized access. Please log in again.");
            navigate('/login'); // Redirect to login page on 401
            return;
          }
          throw new Error(`Failed to fetch person data: ${res.statusText}`);
        }

        const data = await res.json();
        setPerson(data); // Set the fetched data to state

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
      <p><strong>Born:</strong> {person.birthYear}</p>
      <p><strong>Death:</strong> {person.deathYear || "N/A"}</p>

      <h2>Movies:</h2>
      <ul>
        {person.movies && person.movies.length > 0 ? (
          person.movies.map((movie) => (
            <li key={movie.id}>
              {movie.title} ({movie.year}) - Role: {movie.role}
            </li>
          ))
        ) : (
          <p>No movies listed.</p>
        )}
      </ul>

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
    </div>
  );
}

export default PersonDetailPage;
