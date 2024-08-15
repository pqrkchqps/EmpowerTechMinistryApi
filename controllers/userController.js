const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.getUser = async (req, res) => {
  try {
    let { email } = req.params;


    if (!email) {
      console.log("Missing email");
      return res
        .status(400)
        .json({ error: "Missing email" });
    }

    email = email.toLowerCase();

    const db = await pool;
    // Check if user exists
    const userExists = await db.query(
      sql.type(User)`SELECT email, username FROM users WHERE email = ${email};`
    );
    if (userExists.rows.length === 0) {
      console.log(`User with '${email}' email not found`);
      return res
        .status(400)
        .json({ error: `User with '${email}' email not found` });
    }
    res.json({ user: userExists.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};