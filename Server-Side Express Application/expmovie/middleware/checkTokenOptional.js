// checkTokenOptional.js
const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.ACCESS_SECRET;

function checkTokenOptional(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        try {
            const user = jwt.verify(token, ACCESS_SECRET);
            req.user = user;
        } catch (e) {
            // Invalid or expired token - silently ignore
        }
    }

    next();
}

module.exports = { checkTokenOptional };
