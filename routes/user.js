const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

router.get("/:email", auth, userController.getUser);
router.put("/update", auth, userController.updateUser);


module.exports = router;
