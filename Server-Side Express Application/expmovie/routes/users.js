var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET;
const bcrypt = require('bcrypt');
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const { checkToken } = require("../middleware/authorization");
const { checkTokenOptional } = require("../middleware/checkTokenOptional");


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// Register route to create a new user
router.post('/register', function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      message: "Request body incomplete - email and password needed"
    });
  }

  req.db.from("users").select("*").where("email", "=", email)
    .then(users => {
      if (users.length > 0) {
        // Return conflict status with message (OPTIONAL enhancement)
        return res.status(409).json({ message: "User already exists" });
      }

      const saltRounds = 10;
      const hash = bcrypt.hashSync(password, saltRounds);
      return req.db.from("users").insert({ email, hash });
    })
    .then(() => {
      res.status(201).json({ message: "User created" }); // ✅ match test
    })
    .catch(e => {
      console.error("Registration error:", e);
      res.status(500).json({ message: "Too many requests, please try again later." });
    });
});

// Login route to authenticate the user and generate JWT
router.post('/login', function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  // Validate request
  if (!email || !password) {
    return res.status(400).json({
      message: 'Request body incomplete - email and password needed'
    });
  }

  req.db.from("users")
    .select("*")
    .where("email", "=", email)
    .then(users => {
      if (users.length === 0) {
        // Don't reveal which is wrong for security reasons
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = users[0];
      return bcrypt.compare(password, user.hash).then(match => {
        if (!match) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Token lifetimes
        const bearerExpiresInSeconds = req.body.bearerExpiresInSeconds || 600;
        const refreshExpiresInSeconds = req.body.refreshExpiresInSeconds || 86400;

        const expBearer = Math.floor(Date.now() / 1000) + bearerExpiresInSeconds;
        const expRefresh = Math.floor(Date.now() / 1000) + refreshExpiresInSeconds;

        // Login route
        const bearerToken = jwt.sign({ email, exp: expBearer }, ACCESS_SECRET);
        const refreshToken = jwt.sign({ email, exp: expRefresh }, REFRESH_SECRET);


        // Format exactly how tests expect
        res.status(200).json({
          bearerToken: {
            token: bearerToken,
            token_type: 'Bearer',
            expires_in: bearerExpiresInSeconds
          },
          refreshToken: {
            token: refreshToken,
            token_type: 'Refresh',
            expires_in: refreshExpiresInSeconds
          }
        });
      });
    })
    .catch(err => {
      console.error("Login error:", err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

// Refresh route to generate new tokens using refresh token
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Generate new tokens
    const bearerExpiresInSeconds = req.body.bearerExpiresInSeconds || 600;
    const refreshExpiresInSeconds = req.body.refreshExpiresInSeconds || 86400;

    const newBearerToken = jwt.sign(
      { email: decoded.email },
      process.env.ACCESS_SECRET,
      { expiresIn: bearerExpiresInSeconds }
    );

    const newRefreshToken = jwt.sign(
      { email: decoded.email },
      process.env.REFRESH_SECRET,
      { expiresIn: refreshExpiresInSeconds }
    );

    return res.status(200).json({
      bearerToken: {
        token: newBearerToken,
        token_type: "Bearer",
        expires_in: bearerExpiresInSeconds,
      },
      refreshToken: {
        token: newRefreshToken,
        token_type: "Refresh",
        expires_in: refreshExpiresInSeconds,
      },
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
    }

    return res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });
  }
});

// Logout route to invalidate the refresh token
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  // Validate presence and basic format of refreshToken
  if (!refreshToken || typeof refreshToken !== "string" || refreshToken.trim() === "") {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    // Check if token is already blacklisted
    const blacklisted = await req.db("invalid_tokens")
      .where({ token: refreshToken })
      .first();

    if (blacklisted) {
      return res.status(401).json({
        error: true,
        message: "Invalid JWT token",
      });
    }

    // Verify token (throws if invalid or expired)
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // If valid, insert into blacklist table
    await req.db("invalid_tokens").insert({ token: refreshToken });

    return res.status(200).json({
      error: false,
      message: "Token successfully invalidated",
    });
  } catch (err) {
    console.error("Logout token verify error:", err);

    if (err.name === "TokenExpiredError") {
      // Expired token, respond accordingly without blacklist insert
      return res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
    }

    // All other errors treated as invalid token
    return res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });
  }
});

// GET /user/{email}/profile
router.get("/:email/profile", checkTokenOptional, async (req, res) => {
  const email = req.params.email;
  const authenticatedUser = req.user?.email;

  try {
    const user = await req.db("users")
      .select("email", "firstName", "lastName", "dob", "address")
      .where("email", email)
      .first();

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    const responseData = {
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    };

    if (authenticatedUser === email) {
      responseData.dob = user.dob ? user.dob.toISOString().split("T")[0] : null;
      responseData.address = user.address ?? null;
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error retrieving profile:", error);
    res.status(500).json({ error: true, message: "Database error" });
  }
});


// PUT /user/{email}/profile
router.put("/:email/profile", checkToken, async (req, res) => {
  const email = req.params.email;
  const { firstName, lastName, dob, address } = req.body;

  // Ensure that the authenticated user is updating their own profile
  if (req.user.email !== email) {
    return res.status(403).json({ error: true, message: "Forbidden" });
  }

  // Validate the fields
  if (!firstName || !lastName || !dob || !address) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete: firstName, lastName, dob and address are required."
    });
  }

  if (typeof firstName !== "string" || typeof lastName !== "string" || typeof address !== "string") {
    return res.status(400).json({
      error: true,
      message: "Request body invalid: firstName, lastName and address must be strings only."
    });
  }

  // Validate date format for dob
  const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof dob !== "string" || !dob.match(dobPattern)) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
    });
  }

  const parsedDob = new Date(dob);
  const [year, month, day] = dob.split("-").map(Number);
  if (parsedDob.getFullYear() !== year || parsedDob.getMonth() + 1 !== month || parsedDob.getDate() !== day) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
    });
  }

  const today = new Date();
  if (parsedDob > today) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a date in the past."
    });
  }

  try {
    const user = await req.db("users").where("email", email).first();
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    await req.db("users")
      .where("email", email)
      .update({
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        dob: dob, // keep as the string provided, do NOT parse or convert
        address: address ?? null,
      });

    // After updating, return the updated profile
    res.status(200).json({
      email: user.email,
      firstName,
      lastName,
      dob,
      address: address ?? null,
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Database error" });
  }
});



module.exports = router;

