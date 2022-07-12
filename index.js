const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
let users = []

const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', (socket) => {

    //username
    socket.on('send_username', (username) => {
        let trimmedUsername = username.trim()
        for (let index = 0; index < users.length; index++) {
            const element = users[index];
            if (element.username == trimmedUsername) {
                socket.emit('login_error', 'username already exists')
                return;
            }
        }
        if (trimmedUsername.length < 3) {
            socket.emit('login_error', 'username must be at least 3 characters')
            return;
        }

        if (trimmedUsername.length >= 10) {
            socket.emit('login_error', 'username must be less than 10 characters')
            return;
        }
        users.push({ 'id': socket.id, 'username': username })
        socket.emit('success_login', username)
        io.emit('user_list', users)
    });

    // chat message all
    socket.on('chat message', (msg) => {
        let user = users.find(user => user.id == socket.id)
        let message = { 'username': user.username, 'message': msg, 'id': socket.id, 'sentTime': new Date() }
        io.emit('chat message', message);
    });

    //disconnect
    socket.on('disconnect', () => {
        users.splice(users.findIndex(function (i) {
            return i.id === socket.id;
        }), 1);
        io.emit('user_list', users)
        io.emit('user_disconnected', socket.id)
    });

    //get user list
    socket.on('get_user_list', () => {
        socket.emit('user_list', users)
    })

    // send private messsage
    socket.on('private_message', (msg) => {
        let user = users.find(user => user.id == socket.id)
        let message = { 'message': msg.message, 'senderId': msg.senderId, 'receiverId': msg.receiverId, 'sentTime': new Date(), 'username': user.username }
        io.to(msg.senderId).emit('get_private_message', message)
        io.to(msg.receiverId).emit('get_private_message', message)
    })
});

