const express = require("express");
const router = express.Router();


// GET Movies by Search 
router.get("/search", async (req, res) => {
    const title = req.query.title || "";
    const year = req.query.year || "";
    const perPage = 100;
    const pageRaw = req.query.page;

    let page;
    if (!pageRaw) {
        page = 1;
    } else if (isNaN(pageRaw) || pageRaw <= 0 || !Number.isInteger(Number(pageRaw))) {
        return res.status(400).json({
            error: true,
            message: "Invalid page format. page must be a number."
        });
    } else {
        page = parseInt(pageRaw);
    }

    // Validate year format
    if (year && !/^\d{4}$/.test(year)) {
        return res.status(400).json({
            error: true,
            message: "Invalid year format. Format must be yyyy."
        });
    }

    const currentYear = new Date().getFullYear();
    if (year && (year < 1900 || year > currentYear)) {
        return res.status(400).json({
            error: true,
            message: `Invalid year. Year must be between 1900 and ${currentYear}.`
        });
    }

    const offset = (page - 1) * perPage;

    try {
        const query = req.db("basics");

        if (title) query.where("primaryTitle", "like", `%${title}%`);
        if (year) query.where("year", year);

        const totalResult = await query.clone().count("* as count").first();
        const total = parseInt(totalResult.count);

        const movies = await query
            .clone()
            .select(
                "primaryTitle as title",
                "year",
                "tconst as imdbID",
                req.db.raw("CAST(imdbRating AS FLOAT) AS imdbRating"),
                req.db.raw("CAST(COALESCE(rottentomatoesRating, 0) AS UNSIGNED) AS rottenTomatoesRating"),
                req.db.raw("CAST(metacriticRating AS UNSIGNED) AS metacriticRating"),
                "rated as classification"
            )
            .offset(offset)
            .limit(perPage);

        const lastPage = Math.ceil(total / perPage);

        const pagination = {
            total,
            perPage,
            currentPage: page,
            lastPage,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < lastPage ? page + 1 : null,
            from: offset,
            to: offset + movies.length
        };

        res.status(200).json({
            data: movies,
            pagination
        });

    } catch (error) {
        console.error("Error in /movies/search:", error);
        res.status(500).json({ message: "Error executing search query" });
    }
});


// GET Movie Data by IMDb ID
router.get("/data/:imdbID", async (req, res) => {
    // Check if there are query parameters in the request URL
    const queryParams = Object.keys(req.query);
    if (queryParams.length > 0) {
        return res.status(400).json({
            error: true,
            message: "Query parameters are not permitted."
        });
    }

    const imdbID = req.params.imdbID;

    try {
        const movie = await req.db("movies.basics")
            .where("tconst", imdbID)
            .first();

        if (!movie) {
            return res.status(404).json({ error: true, message: "Movie not found" });
        }

        const principals = await req.db("movies.principals")
            .where("tconst", imdbID)
            .select("nconst", "category", "name", "characters");

        const formattedPrincipals = principals.map(p => ({
            id: p.nconst,
            category: p.category,
            name: p.name,
            characters: p.characters ? JSON.parse(p.characters) : [],
        }));

        res.json({
            title: movie.primaryTitle,
            year: movie.year,
            runtime: movie.runtimeMinutes,
            genres: movie.genres ? movie.genres.split(",") : [],
            country: movie.country,
            principals: formattedPrincipals,
            ratings: [
                { source: "Internet Movie Database", value: movie.imdbRating ? parseFloat(movie.imdbRating) : null },
                { source: "Rotten Tomatoes", value: movie.rottentomatoesRating ? parseInt(movie.rottentomatoesRating) : null },
                { source: "Metacritic", value: movie.metacriticRating ? parseInt(movie.metacriticRating) : null }
            ],
            boxoffice: movie.boxoffice || null,
            poster: movie.poster,
            plot: movie.plot,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Database error" });
    }
});


module.exports = router;