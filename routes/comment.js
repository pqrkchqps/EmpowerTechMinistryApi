const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/auth");

router.post("/thread", auth, commentController.createThreadComment);
router.post("/article", auth, commentController.createArticleComment);

module.exports = router;
