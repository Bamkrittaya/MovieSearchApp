require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./docs/openapi.json");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const moviesRouter = require("./routes/movies");
const peopleRouter = require("./routes/people");


const app = express();

// View engine setup (if you have views)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Middleware setups
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(cookieParser());
app.use(morgan("dev")); // Logger

// Attach knex instance to each request for easy DB access
app.use((req, res, next) => {
  req.db = knex;
  next();
});

// Serve static files from public (if you have static files)
app.use(express.static(path.join(__dirname, "public")));

// Swagger docs route
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));


// Your API routes
app.use("/movies", moviesRouter);
app.use("/people", peopleRouter);
app.get("/", (req, res) => {
  res.redirect("/docs");
});
app.use("/home", indexRouter);

app.use("/user", usersRouter);

// Knex version test route (optional)
app.get("/knex", (req, res, next) => {
  req.db.raw("SELECT VERSION()")
    .then((version) => {
      console.log(version[0][0]);
      res.send("Version logged successfully");
    })
    .catch((err) => {
      console.error(err);
      next(err);
    });
});

// 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
