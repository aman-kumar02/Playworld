const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// Serve all frontend files from the root directory
app.use(express.static(path.join(__dirname)));

// In-memory storage for rooms. In a real app, use a database.
const rooms = {};

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Store username on the socket connection object
    socket.on('createProfile', (username) => {
        socket.data.username = username;
    });

    // Create a new room
    socket.on('createRoom', () => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        socket.join(roomCode);
        
        const playerName = socket.data.username || 'Host';
        rooms[roomCode] = {
            players: [{ id: socket.id, name: playerName }],
            scores: {}
        };
        
        socket.emit('roomCreated', roomCode);
    });

    // Join an existing room
    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);
            const playerName = socket.data.username || `Player${rooms[roomCode].players.length + 1}`;
            rooms[roomCode].players.push({ id: socket.id, name: playerName });

            socket.emit('joinedRoom', roomCode);
            // Announce new player and update leaderboard for everyone in the room
            io.to(roomCode).emit('playerJoined', playerName);
            io.to(roomCode).emit('updateLeaderboard', rooms[roomCode].scores);
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    // Receive a score update from a game
    socket.on('updateScore', ({ roomCode, game, score }) => {
        if (rooms[roomCode]) {
            const player = rooms[roomCode].players.find(p => p.id === socket.id);
            if (player) {
                if (!rooms[roomCode].scores[game]) {
                    rooms[roomCode].scores[game] = {};
                }
                rooms[roomCode].scores[game][player.name] = score;
                // Broadcast the updated scores for that specific game to the room
                io.to(roomCode).emit('updateLeaderboard', { game, scores: rooms[roomCode].scores[game] });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`A user disconnected: ${socket.id}`);
        // Add logic here to remove player from a room and update leaderboards
    });
});

// Fallback to serve index.html for any route not found
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(port, () => {
    console.log(`AI Playworld server listening on port ${port}`);
});
