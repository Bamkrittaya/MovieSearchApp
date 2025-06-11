import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './style.css'; 


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
  const imdbRating = movie.ratings?.find(r => r.source.includes('Internet'))?.value 
  ? `${movie.ratings.find(r => r.source.includes('Internet')).value}/10` 
  : 'Unknown';

const rtRating = movie.ratings?.find(r => r.source.includes('Rotten'))?.value 
  ? `${movie.ratings.find(r => r.source.includes('Rotten')).value}/100` 
  : 'Unknown';

const metaRating = movie.ratings?.find(r => r.source.includes('Metacritic'))?.value 
  ? `${movie.ratings.find(r => r.source.includes('Metacritic')).value}/100` 
  : 'Unknown';

  // Capitalize the first letter of the role
// Capitalize the first letter of each word, remove underscores, and join them
const capitalizeRole = (role) => {
  return role
    .split('_')  // Split the role by underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Capitalize the first letter of each word
    .join(' ');  // Join the words with a space
};

  return (
    <div className="movie-detail-container">
      <h1>{movie.title} ({movie.year})</h1>
      <div className="movie-detail">
      {movie.poster && <img src={movie.poster} alt={movie.title} className="movie-poster" />}
      <div className="rating">
      <h3>⭐️ Ratings ⭐️</h3>
        <p><strong>IMDb:</strong> {imdbRating}</p>
        <p><strong>Rotten Tomatoes:</strong> {rtRating}</p>
        <p><strong>Metacritic:</strong> {metaRating}</p>
      </div>
      <div className= "movie-detail-1">
      <p><strong>Year:</strong> {movie.year || 'N/A'}</p>
      <p><strong>Runtime:</strong> {movie.runtime && movie.runtime !== 'N/A' ? `${movie.runtime} minutes` : 'Unknown'}</p>
      <p><strong>Genres:</strong> {movie.genres?.join(', ') || 'Unknown'}</p>
      <p><strong>Country:</strong> {movie.country || 'Unknown'}</p>
      <p><strong>Box Office:</strong> {movie.boxoffice ? `$${new Intl.NumberFormat().format(movie.boxoffice)}` : 'Unknown'}</p>
      </div>
      <p className="plot"><strong></strong> {movie.plot || 'Unknown'}</p>
      

      </div>

      <h2 className="key-people">Key People</h2>
      <div className="key-people-grid">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Name</th>
              <th>Character</th>
            </tr>
          </thead>
          <tbody>
            {/* Dynamically render all people by role */}
            {Object.entries(peopleByRole).map(([role, people]) => (
              people.map((person) => (
                <tr key={person.id}>
                  <td>{capitalizeRole(role)}</td>{/* Capitalize the role */}
                  <td className="movie-detail-people"><Link to={`/people/${person.id}`} >{person.name}</Link></td>
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

