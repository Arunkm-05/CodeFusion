const express = require('express');
const router = express.Router();

let rooms = [];

// Get all rooms
router.get('/', (req, res) => {
  res.json(rooms);
});

// Create room (with password)
router.post('/', (req, res) => {
  const { name, createdBy, password } = req.body;
  
  const newRoom = {
    id: Date.now().toString(),
    name,
    createdBy,
    password: password || null, // Store password if provided
    participants: [createdBy],
    code: '// Start coding here...',
    createdAt: new Date()
  };
  
  rooms.push(newRoom);
  res.json(newRoom);
});

// Get single room (with password check)
router.get('/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  // Check password if provided in query params
  const userPassword = req.query.password;
  if (room.password && room.password !== userPassword) {
    return res.status(401).json({ error: 'Incorrect room password' });
  }
  
  // Don't send password back to client
  const { password, ...roomWithoutPassword } = room;
  res.json(roomWithoutPassword);
});

// Join room with password verification (new endpoint)
router.post('/:id/verify', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const { password } = req.body;
  if (room.password && room.password !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  
  res.json({ success: true, roomId: room.id });
});

// Save code to room
router.put('/:id/code', (req, res) => {
  const { code } = req.body;
  const room = rooms.find(r => r.id === req.params.id);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  room.code = code;
  console.log(`Code saved for room: ${room.name}`);
  res.json({ success: true, code: room.code });
});

module.exports = router;