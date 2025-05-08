import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './MovieDetailPage.css'; // Correct path to import the CSS

function MovieDetailPage() {
  const { imdbID } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    async function fetchMovieDetails() {
      try {
        const res = await fetch(`http://4.237.58.241:3000/movies/data/${imdbID}`, {
          headers: { Accept: "application/json" }
        });

        if (!res.ok) {
          console.error("❌ Failed to fetch movie:", res.statusText);
          return;
        }

        const data = await res.json();
        console.log("🎬 Movie data:", data);
        setMovie(data);
      } catch (err) {
        console.error("⚠️ Error fetching movie details:", err.message);
      }
    }

    if (imdbID) fetchMovieDetails();
  }, [imdbID]);

  if (!movie) return <p>Loading...</p>;

  // Get people for all roles dynamically
  const getPeopleByRole = () =>
    movie.principals?.reduce((acc, person) => {
      if (!acc[person.category]) acc[person.category] = [];
      acc[person.category].push(person);
      return acc;
    }, {}) || {};

  const peopleByRole = getPeopleByRole();

  // Extract ratings
  const imdbRating = movie.ratings?.find(r => r.source.includes('Internet'))?.value || 'N/A';
  const rtRating = movie.ratings?.find(r => r.source.includes('Rotten'))?.value || 'N/A';
  const metaRating = movie.ratings?.find(r => r.source.includes('Metacritic'))?.value || 'N/A';

  // Capitalize the first letter of the role
  const capitalizeRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="movie-detail-container">
      <h1>{movie.title} ({movie.year})</h1>
      {movie.poster && <img src={movie.poster} alt={movie.title} className="movie-poster" />}
      <p><strong>Year:</strong> {movie.year || 'N/A'}</p>
      <p><strong>Runtime:</strong> {movie.runtime && movie.runtime !== 'N/A' ? `${movie.runtime} minutes` : 'N/A'}</p>
      <p><strong>Genres:</strong> {movie.genres?.join(', ') || 'N/A'}</p>
      <p><strong>Country:</strong> {movie.country || 'N/A'}</p>
      <p><strong>Box Office:</strong> ${new Intl.NumberFormat().format(movie.boxoffice) || 'N/A'}</p>
      <p><strong>Plot:</strong> {movie.plot || 'N/A'}</p>

      <h3>Ratings:</h3>
      <ul>
        <li><strong>IMDb:</strong> {imdbRating}</li>
        <li><strong>Rotten Tomatoes:</strong> {rtRating}</li>
        <li><strong>Metacritic:</strong> {metaRating}</li>
      </ul>

      <h3>Key People:</h3>
      <div className="key-people-grid">
        <table>
          <thead>
            <tr>
              <td>Role</td>
              <td>Name</td>
              <td>Character</td>
            </tr>
          </thead>
          <tbody>
            {/* Dynamically render all people by role */}
            {Object.entries(peopleByRole).map(([role, people]) => (
              people.map((person) => (
                <tr key={person.id}>
                  <td>{capitalizeRole(role)}</td>{/* Capitalize the role */}
                  <td><Link to={`/people/${person.id}`} style={{ color: '#56ccf2', textDecoration: 'none' }}>{person.name}</Link></td>
                  <td>{person.characters?.join(", ") || "N/A"}</td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MovieDetailPage;

