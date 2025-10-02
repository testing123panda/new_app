const express = require('express');
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Save to DB - TODO
    res.status(201).json({ ok: true, body: req.body });
  } catch (err) {
    res.status(500).json({ error: "Failed to save call" });
  }
});

module.exports = router;
