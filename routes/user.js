const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

router.get("/:email", auth, userController.getUser);
router.put("/update", auth, userController.updateUser);
router.put("/thread/readcount", auth, userController.setThreadReadCount);
router.put("/article/readcount", auth, userController.setArticleReadCount);


module.exports = router;
