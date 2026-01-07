const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Register a new user
 * POST /api/auth/register
 * 
 * Request body: { email, password }
 * Response: { message, user: { id, email, createdAt }, token }
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input - ensure email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password using bcrypt
    // 10 rounds is a good balance between security and performance
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      // Don't return password in response for security
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    })

    // Generate JWT token for the new user
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    // Sign JWT token with user ID, expires in 7 days
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Return success response with user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Login user
 * POST /api/auth/login
 * 
 * Request body: { email, password }
 * Response: { message, user: { id, email }, token }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input - ensure email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user by email in database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // If user doesn't exist, return error (don't reveal if email exists)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password by comparing with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password)

    // If password doesn't match, return error
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token for authenticated user
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    // Sign JWT token with user ID, expires in 7 days
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Return success response with user data and token
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  register,
  login,
}

