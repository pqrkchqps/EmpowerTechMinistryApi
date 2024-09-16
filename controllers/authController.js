const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const uuidv4 = uuid.v4;
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();

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
    const emailExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE email = ${email};`
    );
    if (emailExists.rows.length > 0) {
      console.log("Email already exists");
      return res.status(400).json({ error: "Email already exists" });
    }

    checkUsername(username);

    async function checkUsername(un) {
      const usernameExists = await db.query(
        sql.type(User)`SELECT * FROM users WHERE username = ${un};`
      );
      if (usernameExists.rows.length > 0) {
        username += "-" + uuidv4();
        checkUsername(username);
      } else {
        username = un;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await db.query(sql.type(
      User
    )`INSERT INTO users (username, email, password, name, description)
    VALUES (${username}, ${email}, ${hashedPassword}, ${username}, ${"I’m here to succeed in my goals."})
    RETURNING *;`);

    // Sign and send JWT
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: 3600,
    });
    res.header("auth-token", token).json({ user: newUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    let { email, password, id_token } = req.body;

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

    if (validPassword === "google account") {
      if (!id_token) {
        console.log("Missing id_token");
        return res.status(400).json({ error: "Missing id_token" });
      }

      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (payload.email !== email || payload.exp < Date.now() / 1000) {
        console.log("Token is not valid for this account");
        return res
          .status(400)
          .json({ error: "Token is not valid for this account" });
      }
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
