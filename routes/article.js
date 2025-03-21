const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const auth = require("../middleware/auth");
const { checkAdmin, checkGeneral } = require("../middleware/checkUser");

router.post("/", auth, checkGeneral, articleController.createArticle);
router.put("/:id", auth, checkGeneral, articleController.editArticle);
router.get("/:id", articleController.getArticleById);
router.get("/", articleController.getAllArticles);

module.exports = router;
