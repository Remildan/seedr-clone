import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password (10 rounds is a good balance between security and performance)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      // Don't return password in response
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    })

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    )

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
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    )

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

