const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");
const { checkGeneral } = require("../middleware/checkUser");

router.get("/:email", userController.getUser);
router.put("/update", auth, checkGeneral, userController.updateUser);
router.put(
  "/thread/readcount",
  auth,
  checkGeneral,
  userController.setThreadReadCount
);
router.put(
  "/article/readcount",
  auth,
  checkGeneral,
  userController.setArticleReadCount
);


module.exports = router;
