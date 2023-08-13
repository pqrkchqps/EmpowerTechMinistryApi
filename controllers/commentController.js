const Comment = require("../models/Comment");
const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");

function createCommentFunctionWithType(type) {
  return async (req, res) => {
    try {
      const { content, parentid, rootid } = req.body;
      const { id } = req.user;

      if (!content || !rootid || !parentid) {
        console.log("Missing content, parentid or rootid");
        return res
          .status(400)
          .json({ error: "Missing content, parentid or rootid" });
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
      const newCommentResult = await db.query(sql.type(
        Comment
      )`INSERT INTO comments (userid, parentid, rootid, content, type)
      VALUES (${id}, ${parentid}, ${rootid}, ${content}, ${type})
      RETURNING *;`);

      const comment = newCommentResult.rows[0];
      console.log("Comment returned by createThreadComment");
      console.log(comment);
      res.json({ comment });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server error" });
    }
  };
}

exports.createThreadComment = createCommentFunctionWithType("thread");
exports.createArticleComment = createCommentFunctionWithType("article");