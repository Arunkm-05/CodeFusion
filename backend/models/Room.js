const express = require('express');
const router = express.Router();

let rooms = [];

// Get all rooms
router.get('/', (req, res) => {
  res.json(rooms);
});

// Create room
router.post('/', (req, res) => {
  const { name, createdBy } = req.body;
  
  const newRoom = {
    id: Date.now().toString(),
    name,
    createdBy,
    participants: [createdBy],
    code: '// Start coding here...',
    createdAt: new Date()
  };
  
  rooms.push(newRoom);
  res.json(newRoom);
});

// Get single room
router.get('/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

module.exports = router;