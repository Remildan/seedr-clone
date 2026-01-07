const express = require('express')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

/**
 * Example: How to protect routes with JWT authentication
 * 
 * This file demonstrates how to use the authenticateToken middleware
 * to protect routes that require user authentication.
 */

// All routes in this router require authentication
router.use(authenticateToken)

/**
 * GET /api/example/protected
 * Example protected route - requires valid JWT token
 * 
 * The authenticateToken middleware will:
 * 1. Check for token in Authorization header
 * 2. Verify token is valid
 * 3. Attach userId to req.userId
 */
router.get('/protected', (req, res) => {
  // req.userId is available here thanks to authenticateToken middleware
  res.json({
    message: 'This is a protected route',
    userId: req.userId,
  })
})

/**
 * Alternative: Apply middleware to individual routes
 * GET /api/example/single-protected
 */
router.get('/single-protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This route is also protected',
    userId: req.userId,
  })
})

module.exports = router

