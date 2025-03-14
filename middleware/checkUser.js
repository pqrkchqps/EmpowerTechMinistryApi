const pool = require("../db/pool");
const { sql } = require("slonik");
const User = require("../models/User");

const checkUser = (type) => async (req, res, next) => {
  const { id } = req.user;
  const db = await pool;
  let userExists;
  if (type) {
    userExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE id = ${id} AND type = ${type};`
    );
  } else {
    userExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE id = ${id};`
    );
  }

  if (userExists.rows.length === 0) {
    console.log("User Id doesn't exist");
    return res
      .status(400)
      .json({
        error:
          "User Id doesn't exist" + type ? `or is not of type ${type}` : "",
      });
  } else {
    next();
  }
};

const checkGeneral = checkUser();
const checkAdmin = checkUser("admin");

module.exports = { checkGeneral, checkAdmin };
