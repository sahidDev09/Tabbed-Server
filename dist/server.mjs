"use strict";
import { Server } from 'socket.io';
import next from "next";
import { createServer } from "node:http";
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
// Store emails and room IDs in an array
const roomUsers = {};
app.prepare().then(() => {
    const httpServer = createServer(handle);
    const io = new Server(httpServer);
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);
        // Handle user joining a room
        socket.on("join-room", (roomId, userEmail) => {
            socket.join(roomId);
            // Ensure the room array exists
            if (!roomUsers[roomId]) {
                roomUsers[roomId] = [];
            }
            const userExists = roomUsers[roomId].some((user) => user.email === userEmail && user.socketId === socket.id);
            if (!userExists) {
                roomUsers[roomId].push({ email: userEmail, roomId: roomId, socketId: socket.id });
                console.log(`User ${userEmail} joined room ${roomId}`);
            }
            io.to(roomId).emit("room-users", roomUsers[roomId]);
            socket.to(roomId).emit("user-joined", `${userEmail} joined room ${roomId}`);
        });
        socket.on("document_content", (data) => {
            const { roomId, content, userEmail } = data;
            socket.to(roomId).emit("document_content", {
                roomId: roomId,
                content: content,
                userEmail: userEmail,
            });
        });
        // Handle document title updates
        socket.on("document_title_updated", (data) => {
            const { roomId, socketHeadline, userEmail } = data;
            socket.to(roomId).emit("document_title_updated", {
                socketHeadline: socketHeadline,
                userEmail: userEmail,
                roomId: roomId,
            });
        });
        // Handle cursor movements
        socket.on('cursor_moved', (data) => {
            const { roomId, userEmail, x, y, } = data;
            socket.to(roomId).emit('cursor_moved', { userEmail, x, y });
        });
        // Handle user disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // Remove user when they leave
            for (const roomId in roomUsers) {
                const initialLength = roomUsers[roomId].length;
                // Find the user by socketId and remove from room
                roomUsers[roomId] = roomUsers[roomId].filter((user) => user.socketId !== socket.id // Remove based on socketId
                );
                const finalLength = roomUsers[roomId].length;
                if (initialLength !== finalLength) {
                    io.to(roomId).emit("room-users", roomUsers[roomId]);
                }
                else {
                    return null;
                }
            }
            socket.broadcast.emit('user-left', `A user has left the room.`);
        });
    });
    httpServer.listen(port, () => {
        console.log(`Server running at http://${hostname}:${port}`);
    });
});
