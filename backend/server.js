const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

const { exec } = require('child_process');  // ✅ ADD THIS at top
const fs = require('fs');                    // ✅ ADD THIS at top
const path = require('path'); 

// Code execution endpoint
app.post('/api/execute', (req, res) => {
  const { code, language } = req.body;
  
  console.log(`Executing ${language} code...`);
  
  let command;
  let tempFile;
  
  if (language === 'python') {
    tempFile = path.join(__dirname, 'temp_' + Date.now() + '.py');
    fs.writeFileSync(tempFile, code);
    command = `python "${tempFile}"`;
  } else if (language === 'javascript') {
    tempFile = path.join(__dirname, 'temp_' + Date.now() + '.js');
    fs.writeFileSync(tempFile, code);
    command = `node "${tempFile}"`;
  } else {
    return res.json({ error: 'Unsupported language. Use python or javascript' });
  }
  
  exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
    // Delete temp file
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    if (error) {
      if (error.killed) {
        res.json({ output: '❌ Execution timed out (5 seconds limit)' });
      } else {
        res.json({ output: stderr || error.message });
      }
    } else {
      res.json({ output: stdout || '✅ Code executed successfully (no output)' });
    }
  });
});


// Socket.io
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);
  
  let roomUsers = {};

socket.on('join-room', (roomId) => {
  socket.join(roomId);
  if (!roomUsers[roomId]) roomUsers[roomId] = [];
  roomUsers[roomId].push(socket.id);
  io.to(roomId).emit('user-joined', roomUsers[roomId]);
});
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

socket.on('drawing', (data) => {
    socket.to(data.roomId).emit('drawing', {
      x: data.x,
      y: data.y,
      type: data.type,
      color: data.color,
      size: data.size
    });
  });

  // Clear whiteboard
  socket.on('clear-canvas', (data) => {
    socket.to(data.roomId).emit('clear-canvas');
  });

  
  socket.on('code-change', (data) => {
    socket.to(data.roomId).emit('code-update', data.code);
  });
  
  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('new-message', {
      user: data.user,
      message: data.message,
      time: new Date().toLocaleTimeString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});