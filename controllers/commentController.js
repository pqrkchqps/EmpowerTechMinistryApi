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

      const newCommentResult = await db.query(sql.type(
        Comment
      )`INSERT INTO comments (userid, parentid, rootid, content, type)
      VALUES (${id}, ${parentid}, ${rootid}, ${content}, ${type})
      RETURNING *;`);

      const comment = newCommentResult.rows[0];

      const commentsResult = await db.query(
        sql.type(Comment)`SELECT 
        c.content, c.id, c.parentid, u.username,
        EXTRACT (YEAR FROM c.date) AS YEAR,
        EXTRACT (MONTH FROM c.date) AS MONTH,
        EXTRACT (DAY FROM c.date) AS DAY
        FROM comments c 
        LEFT JOIN users u ON c.userid = u.id
        WHERE c.id = ${comment.id};`
      );
      console.log("Comment returned by createThreadComment");
      console.log(commentsResult.rows[0]);
      res.json({ comment: commentsResult.rows[0] });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server error" });
    }
  };
}

exports.createThreadComment = createCommentFunctionWithType("thread");
exports.createArticleComment = createCommentFunctionWithType("article");