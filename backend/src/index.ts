import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// Note: Environment variables are loaded manually in ./db/index.ts (runs first due to import order)
// This bypasses dotenv's issues with PM2/shell pre-set variables
import { db, pool } from './db';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import caseRoutes from './routes/case.routes';
import personRoutes from './routes/person.routes';
import researchRoutes from './routes/research.routes';
import strategyRoutes from './routes/strategy.routes';
import documentRoutes from './routes/document.routes';
import integrationRoutes from './routes/integration.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Log what was loaded for debugging
console.log(`🔧 Server configuration:`);
console.log(`   PORT env: ${process.env.PORT || 'not set'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Verify critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL not set!');
  process.exit(1);
}

const app: Application = express();

// PORT CONFIGURATION - Multiple fallback strategies:
// 1. process.env.PORT from .env file (loaded by ./db/index.ts)
// 2. Fallback to 8100 (unlikely to conflict)
const PORT = parseInt(process.env.PORT || '8100', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log(`   Using PORT: ${PORT}`);
console.log(`   Using HOST: ${HOST}`);

// Export db for use in other modules
export { db };

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection with a simple query
    logger.info('Testing database connection...');
    await pool.query('SELECT 1');
    logger.info('✅ Database connected successfully');

    app.listen(PORT, HOST, () => {
      logger.info(`🚀 PoN2 Backend API running on ${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
