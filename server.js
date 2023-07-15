const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection',socket => {
    // console.log('new connection...');
    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id,username,room);
        socket.join(user.room);

        //welcomes new user
        socket.emit('message',formatMessage('admin','Welcome to ChatBox!'));
    
        //broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage('admin',`${user.username} has joined the chat`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
          room:user.room,
          users:getRoomUsers(user.room),
    });
    });


    //listen for chatMessage
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    //runs when client disconnects
    socket.on('disconnect', ()=> {
        const user = userLeave(socket.id);

        if(user){
          io.to(user.room).emit('message',formatMessage('admin',`${user.username} has left the chat`));

           //send users and room info
           io.to(user.room).emit('roomUsers', {
           room:user.room,
           users:getRoomUsers(user.room),
    });
        }
    });
});

const PORT =3000 || process.env.PORT;
server.listen(PORT, () => console.log('server running on port 3000'));