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
      return res.status(400).json({ error: "Missing email" });
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

exports.updateUser = async (req, res) => {
  try {
    let { username, name, image, description } = req.body;

    if (!username || !name || !image || !description) {
      console.log("Missing username, name, image or description");
      return res
        .status(400)
        .json({ error: "Missing username, name, image or description" });
    }
    let { id } = req.user;

    const db = await pool;
    // Check if user exists
    const userExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE id = ${id};`
    );
    if (userExists.rows.length === 0) {
      console.log(`User not found`);
      return res.status(400).json({ error: `User not found` });
    }

    const usernameExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE username = ${username};`
    );
    if (usernameExists.rows.length > 0) {
      for (u of usernameExists.rows) {
        if (u.id != id) {
          console.log(`Username already present`);
          return res.status(400).json({ error: `Username already present` });
        }
      }
    }
    const updatedUser = await db.query(
      sql.type(User)`UPDATE users SET 
      username = ${username},
      description = ${description},
      name = ${name},
      image = ${image}
      WHERE id = ${id}
      RETURNING email, username, date, description, name, image;`
    );

    res.json({ user: updatedUser.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};