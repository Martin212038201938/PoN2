import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, users, generateId } from '../db';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.email, email));

      if (existingUsers.length > 0) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [user] = await db.insert(users).values({
        id: generateId(),
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'DETECTIVE',
      }).returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
      });

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const foundUsers = await db.select().from(users).where(eq(users.email, email));
      const user = foundUsers[0];

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({ error: 'Account is deactivated' });
        return;
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT
      const secret = process.env.JWT_SECRET as Secret;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: String(user.role),
      };

      // @ts-ignore - Type issue with expiresIn in jwt.sign, but the code is correct
      const token = jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    authenticate(req, res, async () => {
      try {
        if (!req.user) {
          res.status(401).json({ error: 'Not authenticated' });
          return;
        }

        const foundUsers = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        }).from(users).where(eq(users.id, req.user.id));

        const user = foundUsers[0];

        if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        res.json({ user });
      } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
      }
    });
  }
}

export const authController = new AuthController();
