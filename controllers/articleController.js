const Article = require("../models/Article");
const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const Comment = require("../models/Comment");

exports.createArticle = async (req, res) => {
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
      sql.type(User)`SELECT * FROM users WHERE id = ${id} AND type = 'admin';`
    );
    if (userExists.rows.length === 0) {
      console.log("User Id doesn't exist");
      return res.status(400).json({ error: "User Id doesn't exist" });
    }

    // Create new user
    const newArticleResult = await db.query(sql.type(
      Article
    )`INSERT INTO articles (userid, title, content)
    VALUES (${id}, ${title}, ${content})
    RETURNING *;`);

    const article = newArticleResult.rows[0];
    console.log("Article returned by createArticle");
    console.log(article);
    res.json({ article });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllArticles = async (req, res) => {
  try {
    const db = await pool;

    // Check if user exists
    const articleResult = await db.query(
      sql.type(Article)`SELECT * FROM articles;`
    );
    const article = articleResult.rows;
    console.log("Articles returned by getAllArticles");
    console.log({ article });
    res.json({ article });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      console.log("Missing id route param");
      return res.status(400).json({ error: "Missing id route param" });
    }

    const db = await pool;

    // Check if user exists
    const parentArticleResult = await db.query(
      sql.type(Article)`SELECT * FROM articles WHERE id = ${id};`
    );
    const parentArticle = parentArticleResult.rows[0];

    const commentsResult = await db.query(
      sql.type(
        Comment
      )`SELECT * FROM comments WHERE rootid = ${id} AND type = 'article';`
    );
    const comments = commentsResult.rows;
    parentArticle.children = comments.filter((c) => c.parentid === -1);
    parentArticle.children.forEach((comment) => {
      recursivelyFillChildren(comment);
    });

    function recursivelyFillChildren(p) {
      p.children = comments.filter((c) => c.parentid === p.id);
      p.children.forEach((comment) => {
        recursivelyFillChildren(comment);
      });
    }
    console.log("Root or Parent Article returned by getArticleById");
    console.log(parentArticle);
    res.json({ article: parentArticle });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};
