const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getProgress,
  saveProgress,
  getRhythmProgress,
  saveRhythmProgress,
  getSettings,
  saveSettings,
} = require("../controllers/progress.controller");

const router = express.Router();

router.get("/note-recognition", authMiddleware, getProgress);
router.post("/note-recognition", authMiddleware, saveProgress);
router.get("/rhythm", authMiddleware, getRhythmProgress);
router.post("/rhythm", authMiddleware, saveRhythmProgress);
router.get("/settings", authMiddleware, getSettings);
router.post("/settings", authMiddleware, saveSettings);

module.exports = router;
