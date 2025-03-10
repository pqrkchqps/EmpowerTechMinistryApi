const Article = require("../models/Article");
const ArticleSection = require("../models/ArticleSection");
const SectionParagraph = require("../models/SectionParagraph");
const ArticleKeyword = require("../models/ArticleKeyword");
const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const Comment = require("../models/Comment");

exports.createArticle = async (req, res) => {
  try {
    const { title, image, type, sections, keywords } = req.body;
    const { id } = req.user;

    if (!title || !image || !type || !sections || !keywords) {
      console.log("Missing title, image, type, sections or keywords");
      return res
        .status(400)
        .json({ error: "Missing title, image, type, sections or keywords" });
    }

    const db = await pool;
    // Check if user exists
    const userExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE id = ${id};`
    );
    if (userExists.rows.length === 0) {
      console.log("User Id doesn't exist or is not admin");
      return res
        .status(401)
        .json({ error: "User Id doesn't exist or is not admin" });
    }

    const newArticleResult = await db.query(sql.type(
      Article
    )`INSERT INTO articles (userid, title, image, type)
    VALUES (${id}, ${title}, ${image}, ${type})
    RETURNING *;`);
    const article = newArticleResult.rows[0];

    const promises = [];

    for (section of sections) {
      const newArticleSectionPromise = db.query(sql.type(
        ArticleSection
      )`INSERT INTO articlesections (articleid, title)
      VALUES (${article.id}, ${sections.title})
      RETURNING *;`);

      promise.push(newArticleSectionPromise);

      newArticleSectionPromise.then((newArticleSectionResult) => {
        const articlesection = newArticleResult.rows[0];

        for (paragraph of paragraphs) {
          const newSectionParagraphPromise = db.query(sql.type(
            SectionParagraph
          )`INSERT INTO sectionparagraph (articlesectionid, content)
          VALUES (${articlesection.id}, ${paragraph})
          RETURNING *;`);
          promises.push(newSectionParagraphPromise);
        }
      });
    }

    for (keyword of keywords) {
      const newArticleKeywordPromise = db.query(sql.type(
        ArticleKeyword
      )`INSERT INTO articlekeywords (articleid, content)
      VALUES (${article.id}, ${keyword})
      RETURNING *;`);

      promises.push(newArticleKeywordPromise);
    }

    Promise.all(promises).then((results) => {
      article.sections = sections;
      article.keywords = keywords;
      console.log("Article returned by createArticle");
      console.log(article);
      res.json({ article });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllArticles = async (req, res) => {
  try {
    const db = await pool;

    const articleResult = await db.query(
      sql.type(Article)`SELECT 
      a.title, a.id, u.username, a.views, a.comment_count, ars.*, sp.*, ak.*
      EXTRACT (YEAR FROM a.date) AS YEAR,
      EXTRACT (MONTH FROM a.date) AS MONTH,
      EXTRACT (DAY FROM a.date) AS DAY 
      FROM articles a
      LEFT JOIN articlekeywords ak ON ak.articleid = a.id
      LEFT JOIN articlesections ars ON ars.articleid = a.id
      LEFT JOIN sectionparagraphs sp ON sp.articlesectionid = ars.id
      LEFT JOIN users u ON a.userid = u.id;`
    );
    const articles = articleResult.rows;

    console.log("Articles returned by getAllArticles");
    console.log({ articles });
    res.json({ articles });
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
