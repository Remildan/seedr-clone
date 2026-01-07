const express = require('express')
const { register, login } = require('../controllers/authController')

const router = express.Router()

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Request body: { email, password }
 * Response: { message, user: { id, email, createdAt }, token }
 */
router.post('/register', register)

/**
 * POST /api/auth/login
 * Login with email and password, returns JWT token
 * 
 * Request body: { email, password }
 * Response: { message, user: { id, email }, token }
 */
router.post('/login', login)

module.exports = router

