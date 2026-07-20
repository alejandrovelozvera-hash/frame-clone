import http from 'http';
import next from 'next';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const dev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'frame-clone-secret-change-in-production';

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = http.createServer(handle);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.email} (${socket.id})`);

    socket.on('join:file', (fileId: string) => {
      const room = `file:${fileId}`;
      socket.join(room);
      socket.to(room).emit('user:joined', {
        userId: user.userId,
        userEmail: user.email,
        socketId: socket.id,
      });
    });

    socket.on('leave:file', (fileId: string) => {
      const room = `file:${fileId}`;
      socket.leave(room);
      socket.to(room).emit('user:left', {
        userId: user.userId,
        userEmail: user.email,
      });
    });

    socket.on('join:project', (projectId: string) => {
      const room = `project:${projectId}`;
      socket.join(room);
      socket.to(room).emit('user:joined', {
        userId: user.userId,
        userEmail: user.email,
        socketId: socket.id,
      });
    });

    socket.on('leave:project', (projectId: string) => {
      const room = `project:${projectId}`;
      socket.leave(room);
      socket.to(room).emit('user:left', {
        userId: user.userId,
        userEmail: user.email,
      });
    });

    socket.on('cursor:moved', (data: { fileId: string; x: number; y: number }) => {
      socket.to(`file:${data.fileId}`).emit('cursor:moved', {
        userId: user.userId,
        x: data.x,
        y: data.y,
      });
    });

    socket.on('player:play', (data: { fileId: string; timecode: number }) => {
      socket.to(`file:${data.fileId}`).emit('player:played', {
        userId: user.userId,
        timecode: data.timecode,
      });
    });

    socket.on('player:pause', (data: { fileId: string; timecode: number }) => {
      socket.to(`file:${data.fileId}`).emit('player:paused', {
        userId: user.userId,
        timecode: data.timecode,
      });
    });

    socket.on('player:seek', (data: { fileId: string; timecode: number }) => {
      socket.to(`file:${data.fileId}`).emit('player:seeked', {
        userId: user.userId,
        timecode: data.timecode,
      });
    });

    socket.on('comment:added', (data: { fileId: string; comment: any }) => {
      socket.to(`file:${data.fileId}`).emit('comment:new', data.comment);
    });

    socket.on('comment:resolved', (data: { fileId: string; commentId: string }) => {
      socket.to(`file:${data.fileId}`).emit('comment:resolved', {
        commentId: data.commentId,
        userId: user.userId,
      });
    });

    socket.on('annotation:added', (data: { fileId: string; annotation: any }) => {
      socket.to(`file:${data.fileId}`).emit('annotation:new', data.annotation);
    });

    socket.on('annotation:removed', (data: { fileId: string; annotationId: string }) => {
      socket.to(`file:${data.fileId}`).emit('annotation:removed', {
        annotationId: data.annotationId,
        userId: user.userId,
      });
    });

    socket.on('disconnecting', () => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit('user:left', {
            userId: user.userId,
            userEmail: user.email,
          });
        }
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${user.email} (${reason})`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO ready`);
  });
});
