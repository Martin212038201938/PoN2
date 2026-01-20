import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
// Note: Environment variables are loaded manually in ./db/index.ts (runs first due to import order)
// This bypasses dotenv's issues with PM2/shell pre-set variables
import { db, pool, users, generateId } from './db';
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

// DEBUG endpoint - diagnoses login issues (remove in production!)
app.get('/api/debug/login-check', async (_req: Request, res: Response) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // 1. Check JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  diagnostics.checks.jwt_secret = {
    status: jwtSecret && jwtSecret.length > 10 ? 'OK' : 'MISSING',
    length: jwtSecret ? jwtSecret.length : 0,
    isDefault: jwtSecret === 'your-secret-key-change-in-production',
  };

  // 2. Check DATABASE_URL
  diagnostics.checks.database_url = {
    status: process.env.DATABASE_URL ? 'OK' : 'MISSING',
    host: process.env.DATABASE_URL?.match(/@([^:\/]+)/)?.[1] || 'unknown',
  };

  // 3. Check database connection & admin user
  try {
    const result = await pool.query(
      "SELECT id, email, role, \"isActive\", \"firstName\" FROM users WHERE email = 'admin@pon2.de'"
    );
    diagnostics.checks.admin_user = {
      status: result.rows.length > 0 ? 'OK' : 'NOT_FOUND',
      exists: result.rows.length > 0,
      isActive: result.rows[0]?.isActive,
      role: result.rows[0]?.role,
    };
  } catch (err: any) {
    diagnostics.checks.admin_user = {
      status: 'DB_ERROR',
      error: err.message,
    };
  }

  // 4. Check password hash (test if bcrypt works)
  try {
    const bcrypt = require('bcryptjs');
    const result = await pool.query(
      "SELECT password FROM users WHERE email = 'admin@pon2.de'"
    );
    if (result.rows.length > 0) {
      const storedHash = result.rows[0].password;
      const isValid = await bcrypt.compare('password123', storedHash);
      diagnostics.checks.password_hash = {
        status: isValid ? 'OK' : 'MISMATCH',
        hashExists: !!storedHash,
        hashLength: storedHash?.length,
        passwordMatches: isValid,
      };
    } else {
      diagnostics.checks.password_hash = { status: 'NO_USER' };
    }
  } catch (err: any) {
    diagnostics.checks.password_hash = {
      status: 'ERROR',
      error: err.message,
    };
  }

  // 5. Environment info
  diagnostics.environment = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'not set',
  };

  // Overall status
  const allOk = Object.values(diagnostics.checks).every(
    (check: any) => check.status === 'OK'
  );
  diagnostics.overall = allOk ? 'ALL_CHECKS_PASSED' : 'ISSUES_FOUND';

  res.json(diagnostics);
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

// Auto-seed demo users if none exist
async function ensureDemoUsersExist() {
  console.log('🔄 Checking for existing users...');

  try {
    const existingUsers = await db.select().from(users);

    if (existingUsers.length === 0) {
      console.log('   ⚠️  No users found - creating demo users...');

      const hashedPassword = await bcrypt.hash('password123', 10);

      await db.insert(users).values([
        {
          id: generateId(),
          email: 'admin@pon2.de',
          password: hashedPassword,
          firstName: 'Max',
          lastName: 'Administrator',
          role: 'ADMIN',
          isActive: true,
        },
        {
          id: generateId(),
          email: 'detective@pon2.de',
          password: hashedPassword,
          firstName: 'Anna',
          lastName: 'Ermittler',
          role: 'DETECTIVE',
          isActive: true,
        },
      ]);

      console.log('   ✅ Demo users created successfully!');
      console.log('      Admin: admin@pon2.de / password123');
      console.log('      Detective: detective@pon2.de / password123');
    } else {
      console.log(`   ✅ Found ${existingUsers.length} existing user(s)`);
    }
  } catch (error) {
    console.error('   ⚠️  Could not check/create demo users:', error);
    // Don't fail startup - just log the error
  }
}

// Start server
async function startServer() {
  console.log('🔄 Starting server...');

  try {
    // Test database connection with a simple query
    console.log('   Testing database connection...');
    await pool.query('SELECT 1');
    console.log('   ✅ Database connected successfully');

    // Auto-seed demo users if none exist
    await ensureDemoUsersExist();

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
