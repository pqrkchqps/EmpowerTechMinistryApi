const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

router.get("/:email", auth, userController.getUser);

module.exports = router;
