require("dotenv").config();
const express = require("express");
const cors = require("cors");
const seed = require("./db/seed");
seed();

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/thread", require("./routes/thread"));
app.use("/api/comment", require("./routes/comment"));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
