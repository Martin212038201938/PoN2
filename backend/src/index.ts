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

// PORT CONFIGURATION - EINFACH UND ROBUST
// Dieser Port (8100) ist identisch mit ecosystem.config.cjs
const DEFAULT_PORT = 8100;
const PORT = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
const HOST = '0.0.0.0';  // Immer auf allen Interfaces hören

console.log(`   Using PORT: ${PORT}${PORT === DEFAULT_PORT ? ' (default)' : ' (from env)'}`);
console.log(`   Using HOST: ${HOST}`);

// Export db for use in other modules
export { db };

// Middleware
app.use(helmet());

// CORS configuration - flexible for development and production
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
  origin: corsOrigin
    ? corsOrigin.split(',').map(o => o.trim())  // Support multiple origins: "http://a.com,http://b.com"
    : true,  // Allow all origins if not specified (reverse proxy handles security)
  credentials: true,
};
console.log(`   CORS origin: ${corsOrigin || 'all (reverse proxy mode)'}`);
app.use(cors(corsOptions));
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

// Health check - available on both /health and /api/health
const healthHandler = async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      port: PORT,
      host: HOST,
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
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

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
  console.log('🔄 Starting server...');

  try {
    // Test database connection with a simple query
    console.log('   Testing database connection...');
    await pool.query('SELECT 1');
    console.log('   ✅ Database connected successfully');

    // Start listening
    console.log(`   Starting HTTP server on ${HOST}:${PORT}...`);

    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 PoN2 Backend API running on ${HOST}:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API base: http://localhost:${PORT}/api`);
      logger.info(`Server started on ${HOST}:${PORT}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error(`   Try: lsof -i :${PORT} to see what's using it`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
