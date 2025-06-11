const express = require("express");
const router = express.Router();
const { checkToken } = require("../middleware/authorization");


router.get("/:id", checkToken, async (req, res) => {
    const personId = req.params.id;

    // Disallow query parameters (like ?aQueryParam=test)
    if (Object.keys(req.query).length > 0) {
        return res.status(400).json({
            error: true,
            message: "Query parameters are not permitted."
        });
    }

    try {
        const person = await req.db("movies.names")
            .where({ nconst: personId })
            .first();

        if (!person) {
            return res.status(404).json({ error: true, message: "Person not found" });
        }

        const roles = await req.db("movies.principals as p")
            .join("movies.basics as b", "p.tconst", "b.tconst")
            .select(
                "b.primaryTitle as movieName",
                "p.tconst as movieId",
                "p.category",
                "b.imdbRating",
                "p.characters"
            )
            .where("p.nconst", personId);

        const formattedRoles = roles.map(role => ({
            movieName: role.movieName,
            movieId: role.movieId,
            category: role.category,
            imdbRating: role.imdbRating ? parseFloat(role.imdbRating) : null,
            characters: role.characters ? JSON.parse(role.characters) : []
        }));

        res.status(200).json({
            name: person.primaryName,
            birthYear: person.birthYear ? parseInt(person.birthYear) : null,
            deathYear: person.deathYear ? parseInt(person.deathYear) : null,
            roles: formattedRoles
        });

    } catch (error) {
        console.error("Error fetching person:", error);
        res.status(500).json({ error: true, message: "Database error" });
    }
});



module.exports = router;