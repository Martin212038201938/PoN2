import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || 'DETECTIVE',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
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
      const user = await prisma.user.findUnique({
        where: { email },
      });

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
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        secret,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        }
      );

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

        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

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
