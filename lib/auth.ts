import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Token expiration time
const JWT_EXPIRES_IN = '7d';

// Interface for JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for user
 * @param userId - User ID
 * @param email - User email
 * @returns JWT token string
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from request headers
 * @param req - Next.js API request
 * @returns Token string or null
 */
export function extractTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Get user ID from request (requires authentication middleware)
 * @param req - Next.js API request
 * @returns User ID or null
 */
export function getUserIdFromRequest(req: NextApiRequest): string | null {
  const token = extractTokenFromRequest(req);
  
  if (!token) {
    return null;
  }
  
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}

/**
 * Authentication middleware for API routes
 * @param req - Next.js API request
 * @returns User ID or throws error
 */
export function requireAuth(req: NextApiRequest): string {
  const userId = getUserIdFromRequest(req);
  
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  return userId;
}
