import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry } from "ag-grid-community";
import {
  ClientSideRowModelModule,
  PaginationModule,
  ValidationModule
} from "ag-grid-community";

import "ag-grid-community/styles/ag-theme-alpine.css";

// Register modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  PaginationModule,
  ValidationModule
]);

function MoviesPage() {
  const [query, setQuery] = useState(""); // For title search
  const [selectedYear, setSelectedYear] = useState(""); // For year dropdown
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]); // Store all movies for later filtering
  const navigate = useNavigate(); // For navigation on row click

  // Fetch all movies initially to populate the year dropdown
  useEffect(() => {
    async function fetchMovies() {
      try {
        const res = await fetch("http://4.237.58.241:3000/movies/search", {
          headers: { Accept: "application/json" }
        });

        const result = await res.json();
        const data = Array.isArray(result) ? result : result.data || [];

        setAllMovies(data); // Store all fetched movies
        setFilteredMovies(data); // Initially, display all movies
        console.log("First movie object:", data[0]);

      } catch (error) {
        console.error("Failed to fetch movies:", error);
      }
    }

    fetchMovies();
  }, []);

  // Get unique years for the dropdown, convert to numbers for consistency
  const years = [...new Set(allMovies.map((movie) => movie.year))].sort();
  
  // Ensure the year is a number for comparison
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value ? Number(e.target.value) : "");
  };

  const searchMovies = () => {
    // Filter based on query and selected year
    const filtered = allMovies.filter((movie) => {
      const matchesTitle = movie.title?.toLowerCase().includes(query.toLowerCase());
      const matchesYear = selectedYear ? Number(movie.year) === selectedYear : true; // Convert movie.year to a number
      return matchesTitle && matchesYear;
    });

    setFilteredMovies(filtered);
  };

  const columnDefs = [
    { field: "title", headerName: "Title", sortable: true, flex: 2 },
    { field: "year", headerName: "Year", sortable: true, flex: 1 },
    { field: "rank", headerName: "Rank", sortable: true, flex: 1 }
  ];

  const handleRowClick = (event) => {
    const imdbID = event.data.imdbID;
    if (imdbID) {
      navigate(`/movies/${imdbID}`);
    }
  };

  return (
    <div>
      <h1>Movie Search</h1>
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter movie title"
        />
      </div>

      {/* Dropdown for year selection */}
      <div>
        <select 
          value={selectedYear} 
          onChange={handleYearChange}
        >
          <option value="">Select Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <button onClick={searchMovies}>Search</button>

      <div className="ag-theme-alpine" style={{ height: 400, marginTop: 20 }}>
        <AgGridReact
          rowData={filteredMovies}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50, 100]} // Add 10 to the selector options
          onRowClicked={handleRowClick}
        />
      </div>
    </div>
  );
}

export default MoviesPage;
