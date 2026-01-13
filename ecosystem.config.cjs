/**
 * PM2 Ecosystem Configuration for PoN2
 *
 * SINGLE SOURCE OF TRUTH für Port-Konfiguration!
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 start ecosystem.config.cjs --env production
 */

const PORT = 8100;  // EINHEITLICHER PORT - überall gleich!

module.exports = {
  apps: [
    {
      name: 'pon2-backend',
      cwd: './backend',
      script: 'npx',
      args: 'tsx src/index.ts',

      // KRITISCH: Port wird hier gesetzt UND an Node übergeben
      env: {
        NODE_ENV: 'development',
        PORT: PORT,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: PORT,
      },

      // Process management
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // Logging - KEIN separates Log-Verzeichnis (einfacher)
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Startup
      kill_timeout: 5000,
    }
  ]
};
