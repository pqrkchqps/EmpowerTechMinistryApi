const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/auth");
const { checkGeneral } = require("../middleware/checkUser");

router.post(
  "/thread",
  auth,
  checkGeneral,
  commentController.createThreadComment
);
router.post(
  "/article",
  auth,
  checkGeneral,
  commentController.createArticleComment
);

module.exports = router;
