interface IRoom {
  name: string;
  users: string[];
}

type TRoomListenerArgs = { roomName: string };

enum Methods {
  GET = 'GET',
  POST = 'POST',
}

enum Types {
  X = 'X',
  O = 'O',
}

export { IRoom, Methods, Types, TRoomListenerArgs };
