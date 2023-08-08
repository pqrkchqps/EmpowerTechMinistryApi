const { createPool } = require("slonik");

let params = "";
if (process.env.NODE_ENV === "production") {
  params = "?sslmode=no-verify";
}

const pool = createPool(process.env.DATABASE_URL + params);

module.exports = pool;
