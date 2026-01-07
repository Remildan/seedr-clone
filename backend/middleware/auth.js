const jwt = require('jsonwebtoken')

/**
 * Authentication middleware to protect routes
 * 
 * This middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies the token is valid and not expired
 * 3. Attaches userId to request object for use in route handlers
 * 4. Returns 401/403 if token is missing or invalid
 * 
 * Usage: Add this middleware to any route that requires authentication
 * Example: router.get('/protected', authenticateToken, handler)
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  // Expected format: "Bearer <token>"
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  // If no token provided, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  // Get JWT secret from environment variables
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // Verify and decode the JWT token
    // This will throw an error if token is invalid or expired
    const decoded = jwt.verify(token, jwtSecret)
    
    // Attach userId to request object
    // This allows route handlers to access the authenticated user's ID
    req.userId = decoded.userId
    
    // Call next() to continue to the next middleware/route handler
    next()
  } catch (error) {
    // Token is invalid or expired
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

module.exports = {
  authenticateToken,
}

