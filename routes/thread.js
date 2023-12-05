const express = require("express");
const router = express.Router();
const threadController = require("../controllers/threadController");
const auth = require("../middleware/auth");
const { checkGeneral } = require("../middleware/checkUser");

router.post("/", auth, checkGeneral, threadController.createThread);
router.get("/", threadController.getAllThreads);
router.get("/:id", threadController.getThreadById);

module.exports = router;
