const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      console.log("Missing username, email or password");
      return res
        .status(400)
        .json({ error: "Missing username, email or password" });
    }

    email = email.toLowerCase();

    const db = await pool;
    // Check if user exists
    const userExists = await db.query(
      sql.type(
        User
      )`SELECT * FROM users WHERE email = ${email} OR username = ${username};`
    );
    if (userExists.rows.length > 0) {
      console.log("Email or Username already exists");
      return res
        .status(400)
        .json({ error: "Email or Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await db.query(sql.type(
      User
    )`INSERT INTO users (username, email, password)
    VALUES (${username}, ${email}, ${hashedPassword})
    RETURNING *;`);

    // Sign and send JWT
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: 3600,
    });
    res.header("auth-token", token).json({ newUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ error: "Missing email or password" });
    }

    email = email.toLowerCase();

    const db = await pool;

    // Check if user exists
    const userResult = await db.query(
      sql.type(User)`SELECT * FROM users WHERE email = ${email};`
    );
    const user = userResult.rows[0];

    if (!user) {
      console.log("Email not found");
      return res.status(400).json({ error: "Email not found" });
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("Invalid password");
      return res.status(400).json({ error: "Invalid password" });
    }

    // Sign and send JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 3600,
    });
    res.header("auth-token", token).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};
