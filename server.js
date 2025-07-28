const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', () => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        socket.join(roomCode);
        rooms[roomCode] = { players: [{ id: socket.id, name: 'Player1' }], scores: {} };
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);
            const playerName = `Player${rooms[roomCode].players.length + 1}`;
            rooms[roomCode].players.push({ id: socket.id, name: playerName });
            socket.emit('joinedRoom', roomCode);
            io.to(roomCode).emit('updateLeaderboard', rooms[roomCode].scores);
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('updateScore', ({ roomCode, game, score }) => {
        // Score update logic...
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
