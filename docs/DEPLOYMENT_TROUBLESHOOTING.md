# Deployment Troubleshooting Guide

## Prisma Client Generation Issues

### Problem: "Failed to fetch the engine file" or "403 Forbidden"

**Symptoms:**
```
Error: Failed to fetch the engine file at https://binaries.prisma.sh/... - 403 Forbidden
```

**Solutions:**

1. **Check Internet Connectivity**
   - Ensure the server has internet access
   - Verify firewall rules allow HTTPS traffic to binaries.prisma.sh

2. **Use Environment Variables**
   ```bash
   PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
   ```

3. **Post-install Hook**
   - The backend `package.json` now includes a `postinstall` script
   - This automatically runs `prisma generate` after `npm install`

4. **Check .npmrc Configuration**
   - The backend `.npmrc` file includes Prisma-specific configurations
   - Allows fallback to cached engines if download fails

## TypeScript Compilation Errors

### Problem: "Module '@prisma/client' has no exported member"

**Symptoms:**
```
TS2305: Module '@prisma/client' has no exported member 'CaseStatus'
TS2305: Module '@prisma/client' has no exported member 'UserRole'
TS2694: Namespace 'Prisma' has no exported member 'CaseWhereInput'
```

**Root Cause:**
- Prisma Client was not generated before TypeScript compilation

**Solution:**
1. Ensure Prisma Client is generated:
   ```bash
   cd backend
   npx prisma generate
   ```

2. Verify the generated client exists:
   ```bash
   ls -la node_modules/.prisma/client/
   ```

3. Then compile TypeScript:
   ```bash
   npm run build
   ```

### Problem: JWT sign() Parameter Errors

**Symptoms:**
```
TS2769: No overload matches this call for jwt.sign()
```

**Solution:**
- Ensure `@types/jsonwebtoken` is installed
- Check that TypeScript can resolve the types:
  ```bash
  npm install --save-dev @types/jsonwebtoken
  ```

## Deployment Workflow

### Correct Order of Operations:

1. **Install Dependencies**
   ```bash
   npm install
   ```
   - This triggers `postinstall` hook
   - Automatically runs `prisma generate`

2. **Verify Prisma Client**
   ```bash
   ls node_modules/.prisma/client/
   ```

3. **Push Database Schema**
   ```bash
   npx prisma db push --skip-generate
   ```

4. **Build TypeScript**
   ```bash
   npm run build
   ```

5. **Start Application**
   ```bash
   npm run start:prod
   ```

## Common Issues on AlwaysData

### Issue: Binary Platform Mismatch

**Symptoms:**
- Prisma client runs locally but fails on AlwaysData

**Solution:**
Set the correct binary target in `prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  binaryTargets   = ["native", "debian-openssl-1.0.x"]
  previewFeatures = ["postgresqlExtensions"]
}
```

### Issue: Permission Errors

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solution:**
- Ensure the deployment directory has correct permissions
- Check that the Node.js process can write to `node_modules/`

## Testing Deployment Locally

Before deploying, test the deployment process locally:

```bash
# Clean install
rm -rf node_modules
npm install

# Verify Prisma client
ls node_modules/.prisma/client/

# Test build
npm run build

# Check output
ls dist/
```

## Environment Variables

Ensure these are set in production:

```bash
DATABASE_URL="postgresql://..."
NODE_ENV="production"
JWT_SECRET="your-secret-key"
PORT="8080"
```

## Getting Help

If issues persist:

1. Check deployment logs for specific error messages
2. Verify database connectivity with `npx prisma db pull`
3. Test Prisma client generation in isolation
4. Review the [Prisma documentation](https://www.prisma.io/docs/)
