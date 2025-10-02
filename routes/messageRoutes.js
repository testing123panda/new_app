const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/', async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await Message.findByIdAndDelete(id);
  res.sendStatus(204);
});

module.exports = router;
