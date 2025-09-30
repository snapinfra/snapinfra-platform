import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_SIZE_IN_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '100');

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // Get client IP
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  // Clean up expired entries
  Object.keys(store).forEach(ip => {
    if (store[ip] && store[ip].resetTime < now) {
      delete store[ip];
    }
  });

  // Initialize or get current data for this IP
  if (!store[clientIP] || store[clientIP].resetTime < now) {
    store[clientIP] = {
      count: 1,
      resetTime: now + WINDOW_SIZE_IN_MS
    };
  } else {
    store[clientIP].count++;
  }

  const { count, resetTime } = store[clientIP];

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

  // Check if rate limit exceeded
  if (count > MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again after ${Math.ceil((resetTime - now) / 1000)} seconds.`,
      retryAfter: Math.ceil((resetTime - now) / 1000)
    });
    return;
  }

  next();
};