import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';

const PORT = 4000;

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

interface IRoom {
  name: string;
  users: string[];
}

let rooms: IRoom[] = [];

io.on('connection', (socket: Socket) => {
  socket.on('signIn', () => {
    io.to(socket.id).emit('updateRooms', rooms);
  });

  socket.on('createRoom', ({ roomName }: { roomName: string }) => {
    rooms.push({ name: roomName, users: [socket.id] });
    socket.join(roomName);
    socket.broadcast.emit('updateRooms', rooms);
    io.to(socket.id).emit('createdRoom', roomName);
  });

  socket.on('selectRoom', ({ roomName }: { roomName: string }) => {
    const selectedRoom = rooms.findIndex((room) => room.name === roomName);
    rooms[selectedRoom].users.push(socket.id);
    socket.join(roomName);
    socket.broadcast.emit('updateRooms', rooms);
  });

  socket.on('leaveRoom', ({ roomName }: { roomName: string }) => {
    const indSelectedRoom = rooms.findIndex((room) => room.name === roomName);
    if (rooms[indSelectedRoom].users.length === 1) {
      rooms.splice(indSelectedRoom, 1);
    } else {
      rooms[indSelectedRoom].users = rooms[indSelectedRoom].users.filter((user) => user !== socket.id);
    }
    socket.leave(roomName);
    io.emit('updateRooms', rooms);
  });

  socket.on('move', ({ roomName, newBoard }) => {
    socket.to(roomName).emit('updateGame', newBoard);
  });

  socket.on('disconnect', () => {
    const indRoomIncludesUser = rooms.findIndex((room) => room.users.includes(socket.id));
    if (indRoomIncludesUser !== -1) {
      if (rooms[indRoomIncludesUser].users.length === 1) {
        rooms.splice(indRoomIncludesUser, 1);
      } else {
        rooms[indRoomIncludesUser].users = rooms[indRoomIncludesUser].users.filter((user) => user !== socket.id);
      }
      socket.broadcast.emit('updateRooms', rooms);
    }
    socket.disconnect();
  });
});

httpServer.listen(PORT, () => console.log(`Server listen port - ${PORT}`));
