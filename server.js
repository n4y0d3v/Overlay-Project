const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/overlay/:id', (req, res) => {
  res.sendFile(__dirname + '/public/overlay.html');
});

io.on('connection', (socket) => {
  socket.on('customize', (data) => {
    io.to(data.id).emit('update', data);
  });
  socket.on('join', (id) => {
    socket.join(id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));