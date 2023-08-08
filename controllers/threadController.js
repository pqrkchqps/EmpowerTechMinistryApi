const Thread = require("../models/Thread");
const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const Comment = require("../models/Comment");

exports.createThread = async (req, res) => {
  try {
    const { title, content } = req.body;
    const { id } = req.user;

    if (!title) {
      console.log("Missing title");
      return res.status(400).json({ error: "Missing title" });
    }

    const db = await pool;
    // Check if user exists
    const userExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE id = ${id};`
    );
    if (userExists.rows.length === 0) {
      console.log("User Id doesn't exist");
      return res.status(400).json({ error: "User Id doesn't exist" });
    }

    // Create new user
    const newThreadResult = await db.query(sql.type(
      Thread
    )`INSERT INTO threads (userid, title, content)
    VALUES (${id}, ${title}, ${content})
    RETURNING *;`);

    const thread = newThreadResult.rows[0];
    console.log("Thread returned by createThread");
    console.log(thread);
    res.json({ thread });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllThreads = async (req, res) => {
  try {
    const db = await pool;

    // Check if user exists
    const threadResult = await db.query(
      sql.type(Thread)`SELECT * FROM threads;`
    );
    const threads = threadResult.rows;
    console.log("Threads returned by getAllThreads");
    console.log({ threads });
    res.json({ threads });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getThreadById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      console.log("Missing id route param");
      return res.status(400).json({ error: "Missing id route param" });
    }

    const db = await pool;

    // Check if user exists
    const parentThreadResult = await db.query(
      sql.type(Thread)`SELECT * FROM threads WHERE id = ${id};`
    );
    const parentThread = parentThreadResult.rows[0];

    const childThreadResult = await db.query(
      sql.type(
        Comment
      )`SELECT * FROM comments WHERE rootid = ${id} AND type = 'thread';`
    );
    const childThreads = childThreadResult.rows;
    parentThread.children = childThreads.filter((ct) => ct.parentid === -1);
    parentThread.children.forEach((childThread) => {
      recursivelyFillChildren(childThread);
    });

    function recursivelyFillChildren(p) {
      p.children = childThreads.filter((ct) => ct.parentid === p.id);
      p.children.forEach((childThread) => {
        recursivelyFillChildren(childThread);
      });
    }
    console.log("Root or Parent Thread returned by getThreadById");
    console.log(parentThread);
    res.json({ thread: parentThread });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};
