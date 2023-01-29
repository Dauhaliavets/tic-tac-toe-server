import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';
import { IRoom, Methods, TRoomListenerArgs, Types } from './models';

const PORT = 4000;

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: [Methods.GET, Methods.POST],
  },
});

let rooms: IRoom[] = [];

io.on('connection', (socket: Socket) => {
  socket.on('signIn', () => {
    io.to(socket.id).emit('updateRooms', rooms);
  });

  socket.on('createRoom', ({ roomName }: TRoomListenerArgs) => {
    rooms.push({ name: roomName, users: [socket.id] });
    socket.join(roomName);
    socket.broadcast.emit('updateRooms', rooms);
    io.to(socket.id).emit('createdRoom', { type: Types.X });
  });

  socket.on('selectRoom', ({ roomName }: TRoomListenerArgs) => {
    const selectedRoom = rooms.findIndex((room) => room.name === roomName);
    rooms[selectedRoom].users.push(socket.id);
    socket.join(roomName);
    io.to(socket.id).emit('joinedToRoom', { type: Types.O });
    socket.broadcast.emit('updateRooms', rooms);
  });

  socket.on('leaveRoom', ({ roomName }: TRoomListenerArgs) => {
    const indSelectedRoom = rooms.findIndex((room) => room.name === roomName);
    if (rooms[indSelectedRoom].users.length === 1) {
      rooms.splice(indSelectedRoom, 1);
    } else {
      rooms[indSelectedRoom].users = rooms[indSelectedRoom].users.filter((user) => user !== socket.id);
    }
    socket.leave(roomName);
    socket.to(roomName).emit('rivalLeftRoom');
    io.emit('updateRooms', rooms);
  });

  socket.on('move', ({ newBoard }) => {
    const roomName = [...socket.rooms];
    socket.to(roomName).emit('updateGame', newBoard);
  });

  socket.on('disconnect', () => {
    const indRoomIncludesUser = rooms.findIndex((room) => room.users.includes(socket.id));
    if (indRoomIncludesUser !== -1) {
      if (rooms[indRoomIncludesUser].users.length === 1) {
        rooms.splice(indRoomIncludesUser, 1);
      } else {
        rooms[indRoomIncludesUser].users = rooms[indRoomIncludesUser].users.filter((user) => user !== socket.id);
        const [roomName] = [...socket.rooms];
        socket.to(roomName).emit('rivalLeftRoom');
      }
      socket.broadcast.emit('updateRooms', rooms);
    }
    socket.disconnect();
  });
});

httpServer.listen(PORT, () => console.log(`Server listen port - ${PORT}`));
