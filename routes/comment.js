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

router.delete(
  "/thread/:id",
  auth,
  checkGeneral,
  commentController.deleteThreadComment
);
router.delete(
  "/article/:id",
  auth,
  checkGeneral,
  commentController.deleteArticleComment
);

router.patch(
  "/thread/:id",
  auth,
  checkGeneral,
  commentController.editThreadComment
);
router.patch(
  "/article/:id",
  auth,
  checkGeneral,
  commentController.editArticleComment
);

module.exports = router;