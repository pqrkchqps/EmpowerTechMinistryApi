const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const auth = require("../middleware/auth");
const { checkAdmin } = require("../middleware/checkUser");

router.post("/", auth, checkAdmin, articleController.createArticle);
router.get("/", articleController.getAllArticles);
router.get("/:id", articleController.getArticleById);

module.exports = router;
