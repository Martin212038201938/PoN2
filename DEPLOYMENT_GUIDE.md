# Race Condition Fix - Deployment Guide

## What Was Fixed

**Problem:** HTTP server wasn't starting despite successful database connection. PM2 showed "online" but API returned 503.

**Root Cause:** Async callback in `backend/src/db/index.ts` created a race condition:
```typescript
// OLD CODE (problematic)
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Failed');
  else console.log('Success');
});
```

The callback ran asynchronously AFTER module load, but `startServer()` tried to use the pool before the callback completed.

**Solution:** Removed async callback, simplified to synchronous pool creation:
```typescript
// NEW CODE (fixed)
export const pool = new Pool({...});
console.log('✅ PostgreSQL connection pool created');
export const db = drizzle(pool, { schema });
```

Connection test now happens in `startServer()` where it belongs:
```typescript
async function startServer() {
  await pool.query('SELECT 1');  // Test connection here
  app.listen(PORT, HOST, ...);
}
```

## Commits Included

- **9521c08** - Fix: Remove async callback race condition from pool initialization
- **1c98a5b** - Add: Deployment script for race condition fix with verification

## Deployment Instructions

### Option 1: Automated Deployment (Recommended)

SSH to AlwaysData and run the deployment script:

```bash
ssh y-b@ssh-y-b.alwaysdata.net

cd ~/pon2
git pull origin claude/migrate-prisma-to-drizzle-opqvS
bash deploy-race-condition-fix.sh
```

The script will:
1. Pull latest changes
2. Verify source code has the fix
3. Clean and rebuild backend
4. Verify compiled code has the fix
5. Restart PM2 with fresh code
6. Check logs for critical startup messages
7. Test API endpoint

### Option 2: Manual Deployment

If you prefer manual control:

```bash
# 1. Pull changes
cd ~/pon2
git pull origin claude/migrate-prisma-to-drizzle-opqvS

# 2. Verify fix in source
grep "PostgreSQL connection pool created" backend/src/db/index.ts
# Should output: console.log('✅ PostgreSQL connection pool created');

# 3. Clean build
cd backend
rm -rf dist/
npm run build

# 4. Verify fix in compiled code
grep "PostgreSQL connection pool created" dist/db/index.js
# Should find the console.log statement

# 5. Restart PM2
cd ~/pon2
pm2 delete pon2-backend
pm2 start backend/dist/index.js --name pon2-backend --cwd ~/pon2 --env production --time
pm2 save

# 6. Check logs (wait 5 seconds first)
sleep 5
pm2 logs pon2-backend --lines 50
```

## What to Look For

### Success Indicators

The logs should now show ALL three critical messages:

1. ✅ `Testing database connection...`
2. ✅ `Database connected successfully`
3. ✅ `🚀 PoN2 Backend API running on 0.0.0.0:8080`

Previously, we only saw database connection success but NOT the HTTP server startup.

### API Test

```bash
curl https://api.pon2.yellow-plane.com/api/health
```

Should return:
```
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok","timestamp":"..."}
```

## If It Still Doesn't Work

1. **Check for port conflicts:**
   ```bash
   lsof -i :8080
   ```

2. **Check for TypeScript errors:**
   ```bash
   cd ~/pon2/backend
   npm run build
   ```

3. **Check PM2 error logs:**
   ```bash
   pm2 logs pon2-backend --err --lines 100
   ```

4. **Verify environment variables:**
   ```bash
   pm2 show pon2-backend | grep -A 20 "env:"
   ```

5. **Check if .env file exists:**
   ```bash
   ls -la ~/pon2/backend/.env
   cat ~/pon2/backend/.env | grep DATABASE_URL
   ```

## Technical Details

### Why This Fix Works

1. **Synchronous Initialization:** Pool is created synchronously, no callback delays
2. **Explicit Testing:** Connection test happens in `startServer()` with proper error handling
3. **Predictable Flow:** Module loads → pool created → `startServer()` → test connection → start HTTP

### Files Changed

- `backend/src/db/index.ts` - Removed async callback, added sync console.log
- `deploy-race-condition-fix.sh` - Comprehensive deployment script with verification

### Migration Status

✅ Prisma → Drizzle migration complete
✅ All 17 tables migrated
✅ All 9 ENUMs migrated
✅ All 8 controllers migrated
✅ Switched to node-postgres (pg) for stability
✅ SSL configuration for AlwaysData
✅ Race condition fixed

## Next Steps

Once deployment succeeds:

1. ✅ Verify API health endpoint returns 200 OK
2. ✅ Test a few API endpoints (login, cases list, etc.)
3. ✅ Monitor logs for any errors
4. ✅ Create PR for the Prisma → Drizzle migration

## Support

If deployment fails, check:
- PM2 logs: `pm2 logs pon2-backend`
- PM2 status: `pm2 status`
- Process details: `pm2 show pon2-backend`
- Recent commits: `git log --oneline -5`
