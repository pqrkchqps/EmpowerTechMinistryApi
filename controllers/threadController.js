const Thread = require("../models/Thread");
const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const Comment = require("../models/Comment");

exports.createThread = async (req, res) => {
  console.log("test");
  try {
    const { title, content } = req.body;
    const { id } = req.user;

    if (!title) {
      console.log("Missing title");
      return res.status(400).json({ error: "Missing title" });
    }

    const db = await pool;
    // Create new
    const newThreadResult = await db.query(sql.type(
      Thread
    )`INSERT INTO threads (userid, title, content)
    VALUES (${id}, ${title}, ${content})
    RETURNING id;`);

    const threadId = newThreadResult.rows[0].id;
    const threadResult = await db.query(
      sql.type(Thread)`SELECT 
      t.title, t.content, t.id, u.username, t.views, t.comment_count,
      EXTRACT (YEAR FROM t.date) AS YEAR,
      EXTRACT (MONTH FROM t.date) AS MONTH,
      EXTRACT (DAY FROM t.date) AS DAY 
      FROM threads t
      LEFT JOIN users u ON t.userid = u.id
      WHERE t.id = ${threadId};`
    );
    console.log("Thread returned by createThread");
    console.log(threadResult.rows[0]);
    res.json({ thread: threadResult.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.editThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    let { content } = req.body;
    const { id: userId } = req.user;

    if (!title) {
      console.log("Missing title");
      return res.status(400).json({ error: "Missing title" });
    }

    if (!content) {
      content = "";
    }

    const db = await pool;

    const foundThreadResult = await db.query(
      sql.type(Thread)`SELECT * FROM threads WHERE id = ${id};`
    );

    const thread = foundThreadResult.rows[0];

    if (thread.userid === userId) {
      const updatedThreadResult = await db.query(sql.type(
        Thread
      )`UPDATE threads SET
      title = ${title},
      content = ${content}
      RETURNING id;`);

      const threadId = updatedThreadResult.rows[0].id;
      const threadResult = await db.query(
        sql.type(Thread)`SELECT 
        t.title, t.content, t.id, u.username, t.views, t.comment_count,
        EXTRACT (YEAR FROM t.date) AS YEAR,
        EXTRACT (MONTH FROM t.date) AS MONTH,
        EXTRACT (DAY FROM t.date) AS DAY 
        FROM threads t
        LEFT JOIN users u ON t.userid = u.id
        WHERE t.id = ${threadId};`
      );
      console.log("Thread returned by editThread");
      console.log(threadResult.rows[0]);
      res.json({ thread: threadResult.rows[0] });
    } else {
      res.status(401).json({ error: `You do not own thread ${id}` });
    }
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
      sql.type(Thread)`SELECT 
      t.title, t.content, t.id, u.username, t.views, t.comment_count,
      EXTRACT (YEAR FROM t.date) AS YEAR,
      EXTRACT (MONTH FROM t.date) AS MONTH,
      EXTRACT (DAY FROM t.date) AS DAY 
      FROM threads t
      LEFT JOIN users u ON t.userid = u.id;`
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
      sql.type(Thread)`SELECT 
      t.title, t.content, t.id, u.id as userid, u.username, u.name, u.image, u.description, u.date, t.views, t.comment_count,
      EXTRACT (YEAR FROM t.date) AS YEAR,
      EXTRACT (MONTH FROM t.date) AS MONTH,
      EXTRACT (DAY FROM t.date) AS DAY
      FROM threads t
      LEFT JOIN users u ON t.userid = u.id
      WHERE t.id = ${id};`
    );
    const parentThread = parentThreadResult.rows[0];

    const commentsResult = await db.query(
      sql.type(Comment)`SELECT 
      c.content, c.id, c.parentid, u.id as userid, u.username, u.name, u.image,
      EXTRACT (YEAR FROM c.date) AS YEAR,
      EXTRACT (MONTH FROM c.date) AS MONTH,
      EXTRACT (DAY FROM c.date) AS DAY
      FROM comments c 
      LEFT JOIN users u ON c.userid = u.id
      WHERE rootid = ${id} AND c.type = 'thread';`
    );

    const comments = commentsResult.rows;
    parentThread.children = comments.filter((c) => c.parentid === -1);
    parentThread.children.forEach((comment) => {
      recursivelyFillChildren(comment);
    });

    function recursivelyFillChildren(p) {
      p.children = comments.filter((c) => c.parentid === p.id);
      p.children.forEach((comment) => {
        recursivelyFillChildren(comment);
      });
    }

    recursivelyRemoveDeletedLeaves(parentThread);

    function recursivelyRemoveDeletedLeaves(parent) {
      const childrenToRemove = [];
      parent.children.map((child) => {
        const countOfChildren = recursivelyRemoveDeletedLeaves(child);
        if (child.content === "deleted" && countOfChildren === 0) {
          childrenToRemove.push(child.id);
        }
      });
      parent.children = parent.children.filter(
        (c) => !childrenToRemove.includes(c.id)
      );
      return parent.children.length;
    }

    console.log("Root or Parent Thread returned by getThreadById");
    console.log(parentThread);
    res.json({ thread: parentThread });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};
