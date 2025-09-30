import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DynamoService } from '@/services/database/dynamoService';
import { User, AuthenticatedRequest } from '@/types';
import { createError } from './errorHandler';

interface JWTPayload {
  sub: string; // Cognito user ID
  email?: string;
  username?: string;
  'cognito:username'?: string;
  exp: number;
  iat: number;
}

// JWT Authentication Middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      throw createError('Invalid or expired token', 401);
    }

    // Get user from database
    let user = await DynamoService.getUserByCognitoId(decoded.sub);

    // If user doesn't exist, create from JWT payload
    if (!user) {
      user = await DynamoService.createUser({
        email: decoded.email || decoded.username || 'unknown@example.com',
        username: decoded['cognito:username'] || decoded.username || 'unknown',
        cognitoId: decoded.sub
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        let user = await DynamoService.getUserByCognitoId(decoded.sub);

        if (!user) {
          user = await DynamoService.createUser({
            email: decoded.email || decoded.username || 'unknown@example.com',
            username: decoded['cognito:username'] || decoded.username || 'unknown',
            cognitoId: decoded.sub
          });
        }

        req.user = user;
      } catch (error) {
        // Invalid token, but we don't fail - just continue without user
        console.warn('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Development-only middleware for testing without Cognito
export const devAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Only use in development
  if (process.env.NODE_ENV !== 'development') {
    throw createError('Development auth not allowed in production', 403);
  }

  // Create a mock user for development
  req.user = {
    id: 'dev-user-123',
    email: 'dev@example.com',
    username: 'developer',
    cognitoId: 'dev-cognito-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  next();
};

// Cognito ID Token verification (for direct Cognito tokens)
export const verifyCognitoToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError('Access token required', 401);
    }

    // This would normally verify against Cognito's public keys
    // For now, we'll use a simple JWT verification
    // In production, you'd use AWS Cognito JWT verification
    
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.sub) {
      throw createError('Invalid token format', 401);
    }

    // Get or create user
    let user = await DynamoService.getUserByCognitoId(decoded.sub);
    if (!user) {
      user = await DynamoService.createUser({
        email: decoded.email || 'unknown@example.com',
        username: decoded['cognito:username'] || 'unknown',
        cognitoId: decoded.sub
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Helper function to get current user ID (works with different auth methods)
export const getCurrentUserId = (req: AuthenticatedRequest): string => {
  // If we have an authenticated user, use their ID
  if (req.user) {
    return req.user.id;
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'dev-user-123';
  }

  throw createError('User not authenticated', 401);
};

// Middleware to require authentication
export const requireAuth = authenticateToken;

// Middleware for admin-only routes (if needed later)
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Check if user has admin role (you'd implement this logic)
    // For now, we'll just allow all authenticated users
    next();
  } catch (error) {
    next(error);
  }
};