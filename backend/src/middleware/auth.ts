import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token from Authorization header and attaches userId to request
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get token from Authorization header (format: "Bearer <token>")
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  // Verify token
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string }
    
    // Attach userId to request object for use in route handlers
    req.userId = decoded.userId
    
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

