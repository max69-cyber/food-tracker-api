import express from 'express';
import { createServer } from 'http';
import { env } from './config/env';
import { initSocket } from './config/socket';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import foodRoutes from './routes/foods.routes';
import entryRoutes from './routes/entries.routes';
import groupRoutes from './routes/groups.routes';
import messageRoutes from './routes/messages.routes';
import statisticsRoutes from './routes/statistics.routes';

const app = express();
const httpServer = createServer(app);

// Socket.io
initSocket(httpServer);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api', messageRoutes); // /api/groups/:id/messages, /api/messages/:messageId/reactions

// 404 + error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

export { app, httpServer };
