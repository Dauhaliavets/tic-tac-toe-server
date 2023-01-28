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

interface IRooms {
  [key: string]: string[];
}

let rooms: IRooms = {};

io.on('connection', (socket: Socket) => {
  socket.on('signIn', async () => {
    io.to(socket.id).emit('signInResponse', rooms);
  });

  socket.on('selectRoom', async ({ room }: { room: string }) => {
    socket.join(room);
    const newRoomState = [...rooms[room], socket.id];
    rooms[room] = newRoomState;
    socket.broadcast.emit('updateRooms', rooms);
  });

  socket.on('move', ({ board }) => {
    const [room] = [...socket.rooms];
    socket.to(room).emit('updateGame', board);
  });

  socket.on('disconnect', () => {
    const [roomName] = [...socket.rooms];
    rooms[roomName] = rooms[roomName].filter((userId) => userId !== socket.id);
    socket.broadcast.emit('updateRooms', rooms);
    socket.disconnect();
  });
});

httpServer.listen(PORT, () => console.log(`Server listen port - ${PORT}`));
