const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/link", authController.sendLink);
router.post("/reset/:userId/:token", authController.sendLink);


module.exports = router;
