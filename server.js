require("dotenv").config();
const express = require("express");
const cors = require("cors");
const seed = require("./db/seed");
seed();
const socketConnect = require("./db/socketConnect");

const app = express();
app.use(
  cors({ origin: process.env.FRONT_END_URL, exposedHeaders: ["auth-token"] })
);
app.use(express.json());

// Import routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/thread", require("./routes/thread"));
app.use("/api/article", require("./routes/article"));
app.use("/api/comment", require("./routes/comment"));

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

socketConnect(server);