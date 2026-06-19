import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { env } from './env';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Optional auth: clients may pass a token in the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next();
    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join / leave a group chat room.
    socket.on('group:join', (groupId: string) => {
      socket.join(groupRoom(groupId));
    });

    socket.on('group:leave', (groupId: string) => {
      socket.leave(groupRoom(groupId));
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket() first.');
  }
  return io;
}

export function groupRoom(groupId: string): string {
  return `group:${groupId}`;
}

/** Emit an event to everyone in a group room. */
export function emitToGroup(groupId: string, event: string, payload: unknown): void {
  getIO().to(groupRoom(groupId)).emit(event, payload);
}
