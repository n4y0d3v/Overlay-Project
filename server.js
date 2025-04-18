// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { BOOK_MAP, BIBLE_ID } = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

require('dotenv').config();
const API_KEY = process.env.BIBLE_API_KEY;

app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.get('/api/bible', limiter, async (req, res) => {
  const { ref, version = BIBLE_ID } = req.query;
  if (!ref) {
    return res.status(400).json({ error: 'Reference is required' });
  }

  try {
    const reference = ref.trim().toLowerCase();
    const parts = reference.match(/^(\d?\s*[a-zA-Z]+)\s*(\d+):(\d+)$/);
    if (!parts) {
      return res.status(400).json({ error: 'Invalid reference format' });
    }

    let book = parts[1].replace(/\s+/g, '');
    const chapter = parts[2];
    const verse = parts[3];

    book = book.replace(/^(1|2|3)\s*/, '$1');
    const bookCode = BOOK_MAP[book.toLowerCase()];
    if (!bookCode) {
      return res.status(400).json({ error: `Book "${book}" not found` });
    }

    const passageId = `${bookCode}.${chapter}.${verse}`;
    const response = await axios.get(`https://api.scripture.api.bible/v1/bibles/${version}/passages/${passageId}`, {
      headers: { 'api-key': API_KEY }
    });

    const text = response.data.data.content.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').trim();
    res.json({ ref: response.data.data.reference, text });
  } catch (error) {
    console.error('Bible API error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch verse' });
  }
});

const overlays = {};

io.on('connection', (socket) => {
  socket.on('joinOverlay', (overlayId) => {
    socket.join(overlayId);
    socket.overlayId = overlayId;
    if (overlays[overlayId]) {
      Object.values(overlays[overlayId]).forEach(data => {
        socket.emit('customize', data);
      });
    }
  });

  socket.on('customize', (data) => {
    const { id, type } = data;
    if (!overlays[id]) {
      overlays[id] = {};
    }
    overlays[id][type] = data;
    io.to(id).emit('customize', data);
  });

  socket.on('darkMode', ({ overlayId, darkMode }) => {
    io.to(overlayId).emit('darkMode', { darkMode });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/overlay/:id', (req, res) => {
  res.sendFile(__dirname + '/public/overlay.html');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});