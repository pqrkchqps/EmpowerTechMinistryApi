const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const auth = require("../middleware/auth");
const { checkAdmin, checkGeneral } = require("../middleware/checkUser");

router.post("/", auth, checkGeneral, articleController.createArticle);
router.put("/:id", auth, checkGeneral, articleController.editArticle);
router.get("/", articleController.getAllArticles);
router.get("/:id", articleController.getArticleById);

module.exports = router;
