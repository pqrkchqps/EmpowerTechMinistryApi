const Article = require("../models/Article");
const ArticleSection = require("../models/ArticleSection");
const SectionParagraph = require("../models/SectionParagraph");
const ArticleKeyword = require("../models/ArticleKeyword");
const User = require("../models/User");
const { sql } = require("slonik");
const pool = require("../db/pool");
const Comment = require("../models/Comment");
const { validate } = require("uuid");

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

    function storeValue(v) {
      return () => v;
    }

    for (const sectionIndex in sections) {
      const newArticleSectionPromise = db.query(sql.type(
        ArticleSection
      )`INSERT INTO articlesections (articleid, sequence, title)
      VALUES (${article.id}, ${sectionIndex}, ${sections[sectionIndex].title})
      RETURNING *;`);

      promises.push(newArticleSectionPromise);

      const getSection = storeValue(sections[sectionIndex]);

      newArticleSectionPromise.then((newArticleSectionResult) => {
        const articleSection = newArticleSectionResult.rows[0];

        for (const paragraphIndex in getSection().paragraphs) {
          const newSectionParagraphPromise = db.query(sql.type(
            SectionParagraph
          )`INSERT INTO sectionparagraphs (articlesectionid, sequence, content)
          VALUES (${articleSection.id}, ${paragraphIndex}, ${
            getSection().paragraphs[paragraphIndex]
          })
          RETURNING *;`);
          promises.push(newSectionParagraphPromise);
        }
      });
    }

    for (const keyword of keywords) {
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

exports.editArticle = async (req, res) => {
  try {
    const { title, image, type, sections, keywords } = req.body;
    const { id } = req.params;
    const { id: userId } = req.user;

    if (!title || !image || !type || !sections || !keywords || !id) {
      console.log("Missing title, image, type, sections, keywords or id");
      return res.status(400).json({
        error: "Missing title, image, type, sections, keywords or id",
      });
    }

    const db = await pool;
    // Check if user exists
    const userExists = await db.query(
      sql.type(User)`SELECT * FROM users WHERE id = ${userId};`
    );
    if (userExists.rows.length === 0) {
      console.log("User Id doesn't exist or is not admin");
      return res
        .status(401)
        .json({ error: "User Id doesn't exist or is not admin" });
    }

    const newArticleResult = await db.query(sql.type(Article)`
    UPDATE articles
    SET 
      title = ${title},
      image = ${image},
      type = ${type}
    WHERE id = ${id}
    RETURNING *;`);
    const article = newArticleResult.rows[0];

    const deletePromises = [];

    const articleSectionsResult = await db.query(sql.type(ArticleSection)`
      SELECT * FROM articlesections
      WHERE articleid = ${id};`);

    const articleSections = articleSectionsResult.rows;

    for (const articleSection of articleSections) {
      const sectionParagraphPromise = db.query(
        sql.type(
          SectionParagraph
        )`DELETE FROM sectionparagraphs WHERE articlesectionid = ${articleSection.id};`
      );
      deletePromises.push(sectionParagraphPromise);
    }

    const articleKeywordPromise = db.query(
      sql.type(
        ArticleKeyword
      )`DELETE FROM articlekeywords WHERE articleid = ${id};`
    );

    deletePromises.push(articleKeywordPromise);

    Promise.all(deletePromises).then(async () => {
      await db.query(sql.type(ArticleSection)`
        DELETE FROM articlesections
        WHERE articleid = ${id};`);

      const promises = [];

      function storeValue(v) {
        return () => v;
      }

      for (const sectionIndex in sections) {
        const newArticleSectionPromise = db.query(sql.type(
          ArticleSection
        )`INSERT INTO articlesections (articleid, sequence, title)
        VALUES (${id}, ${sectionIndex}, ${sections[sectionIndex].title})
        RETURNING *;`);

        promises.push(newArticleSectionPromise);

        const getSection = storeValue(sections[sectionIndex]);

        newArticleSectionPromise.then((newArticleSectionResult) => {
          const articleSection = newArticleSectionResult.rows[0];

          for (const paragraphIndex in getSection().paragraphs) {
            const newSectionParagraphPromise = db.query(sql.type(
              SectionParagraph
            )`INSERT INTO sectionparagraphs (articlesectionid, sequence, content)
            VALUES (${articleSection.id}, ${paragraphIndex}, ${
              getSection().paragraphs[paragraphIndex]
            })
            RETURNING *;`);
            promises.push(newSectionParagraphPromise);
          }
        });
      }

      for (const keyword of keywords) {
        const newArticleKeywordPromise = db.query(sql.type(
          ArticleKeyword
        )`INSERT INTO articlekeywords (articleid, content)
        VALUES (${id}, ${keyword})
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
      sql.type(Article)`
      SELECT 
          a.id, 
          a.title, 
          to_char(a.date, 'Month DD, YYYY') AS time,
          a.image,
          a.type,
          u.username, 
          u.id AS userid,
          a.views, 
          a.comment_count, 
          COALESCE(
              (
                  SELECT jsonb_agg(
                      jsonb_build_object(
                          'title', ars.title,
                          'paragraphs', (
                              SELECT jsonb_agg(sp.content ORDER BY sp.sequence)
                              FROM sectionparagraphs sp
                              WHERE sp.articlesectionid = ars.id
                          )
                      )
                      ORDER BY ars.sequence
                  )
                  FROM articlesections ars
                  WHERE ars.articleid = a.id
              ),
              '[]'::jsonb
          ) AS sections,
          COALESCE(
              (
                  SELECT jsonb_agg(DISTINCT ak.content)
                  FROM articlekeywords ak
                  WHERE ak.articleid = a.id
              ),
              '[]'::jsonb
          ) AS keywords
      FROM articles a
      LEFT JOIN users u ON a.userid = u.id
      GROUP BY a.id, a.title, a.date, a.image, a.type, u.username, a.views, a.comment_count, u.id
      ORDER BY a.date DESC;
      `
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

    const articleResult = await db.query(
      sql.type(Article)`
      SELECT 
          a.id, 
          a.title, 
          to_char(a.date, 'Month DD, YYYY') AS time,
          a.image,
          a.type,
          u.username, 
          u.id AS userid,
          a.views, 
          a.comment_count, 
          COALESCE(
              (
                  SELECT jsonb_agg(
                      jsonb_build_object(
                          'title', ars.title,
                          'paragraphs', (
                              SELECT jsonb_agg(sp.content ORDER BY sp.sequence)
                              FROM sectionparagraphs sp
                              WHERE sp.articlesectionid = ars.id
                          )
                      )
                      ORDER BY ars.sequence
                  )
                  FROM articlesections ars
                  WHERE ars.articleid = a.id
              ),
              '[]'::jsonb
          ) AS sections,
          COALESCE(
              (
                  SELECT jsonb_agg(DISTINCT ak.content)
                  FROM articlekeywords ak
                  WHERE ak.articleid = a.id
              ),
              '[]'::jsonb
          ) AS keywords
      FROM articles a
      LEFT JOIN users u ON a.userid = u.id
      WHERE a.id = ${id}
      GROUP BY a.id, a.title, a.date, a.image, a.type, u.username, a.views, a.comment_count, u.id
      `
    );
    const parentArticle = articleResult.rows[0];

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
