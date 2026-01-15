import { Server } from 'socket.io';

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-task', (taskId: string) => {
    socket.join(`task:${taskId}`);
    console.log(`Socket ${socket.id} joined task ${taskId}`);
  });

  socket.on('leave-task', (taskId: string) => {
    socket.leave(`task:${taskId}`);
    console.log(`Socket ${socket.id} left task ${taskId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export function broadcastTaskUpdate(taskId: string, data: any) {
  io.to(`task:${taskId}`).emit('task-updated', data);
}

export function broadcastNewTask(data: any) {
  io.emit('task-created', data);
}

export function broadcastTaskDeleted(taskId: string) {
  io.emit('task-deleted', taskId);
}

export function broadcastNewComment(taskId: string, data: any) {
  io.to(`task:${taskId}`).emit('comment-added', data);
}

export function broadcastNewFile(taskId: string, data: any) {
  io.to(`task:${taskId}`).emit('file-uploaded', data);
}

export function broadcastNewVideo(taskId: string, data: any) {
  io.to(`task:${taskId}`).emit('video-added', data);
}

// Start server
const PORT = 3001;
io.listen(PORT);
console.log(`Socket.io server running on port ${PORT}`);
