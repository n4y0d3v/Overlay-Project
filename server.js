const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store overlay data
const overlays = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('join', (id) => {
    console.log(`Client joined overlay: ${id}`);
    const overlayData = overlays.get(id);
    if (overlayData) {
      socket.emit('update', overlayData);
    }
  });

  socket.on('customize', (data) => {
    console.log('Received overlay data:', data);
    overlays.set(data.id, data);
    // Emit to all clients in the room with this overlay ID
    io.emit('update', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Route for overlay page - this should come before the catch-all route
app.get('/overlay/:id', (req, res) => {
  const overlayPath = path.join(__dirname, 'public', 'overlay.html');
  res.sendFile(overlayPath, (err) => {
    if (err) {
      console.error('Error serving overlay:', err);
      res.status(500).send('Error loading overlay');
    }
  });
});

// Catch-all route to handle any other paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});