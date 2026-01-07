import express from 'express'
import { register, login } from '../controllers/authController'

const router = express.Router()

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', register)

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', login)

export default router

