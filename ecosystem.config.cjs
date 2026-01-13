/**
 * PM2 Ecosystem Configuration for PoN2
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 start ecosystem.config.cjs --env production
 */

module.exports = {
  apps: [
    {
      name: 'pon2-backend',
      cwd: './backend',
      script: 'npx',
      args: 'tsx src/index.ts',

      // CRITICAL: Force PORT here to override any cached values
      env: {
        NODE_ENV: 'development',
        PORT: 8081,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8081,
      },

      // Process management
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // Logging
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Startup
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    }
  ]
};
