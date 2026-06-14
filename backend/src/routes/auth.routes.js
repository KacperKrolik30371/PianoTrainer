const express = require("express");

const router = express.Router();

const { register, login } = require("../controllers/auth.controller");

router.get("/test", (req, res) => {
  res.json({
    message: "Auth działa",
  });
});

router.post("/register", register);
router.post("/login", login);

module.exports = router;
