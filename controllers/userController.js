const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");

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
      sql.type(User)`SELECT * FROM users WHERE email = ${email};`
    );
    if (userExists.rows.length === 0) {
      console.log(`User with '${email}' email not found`);
      return res
        .status(400)
        .json({ error: `User with '${email}' email not found` });
    }
    const user = userExists.rows[0];
    delete user.password;
    res.json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    let { username, name, image, description } = req.body;

    if (!username || !name || !description) {
      console.log("Missing username, name or description");
      return res
        .status(400)
        .json({ error: "Missing username, name or description" });
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

exports.setThreadReadCount = async (req, res) => {
  try {
    let { thread_comment_read_count } = req.body;

    if (!thread_comment_read_count) {
      console.log("Missing thread_comment_read_count");
      return res
        .status(400)
        .json({ error: "Missing thread_comment_read_count" });
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

    const updatedUser = await db.query(
      sql.type(User)`UPDATE users SET 
      thread_comment_read_count = ${thread_comment_read_count}
      WHERE id = ${id}
      RETURNING thread_comment_read_count;`
    );

    res.json({ user: updatedUser.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.setArticleReadCount = async (req, res) => {
  try {
    let { article_comment_read_count } = req.body;

    if (!article_comment_read_count) {
      console.log("Missing article_comment_read_count");
      return res
        .status(400)
        .json({ error: "Missing article_comment_read_count" });
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

    const updatedUser = await db.query(
      sql.type(User)`UPDATE users SET 
      article_comment_read_count = ${article_comment_read_count}
      WHERE id = ${id}
      RETURNING article_comment_read_count;`
    );

    res.json({ user: updatedUser.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};