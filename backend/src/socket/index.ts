import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

/**
 * Setup Socket.io event handlers
 * Handles real-time updates for torrent progress
 */
export const setupSocketIO = (io: Server) => {
  // Middleware to authenticate socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return next(new Error('Server configuration error'))
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, jwtSecret) as { userId: string }
      
      // Attach userId to socket data for use in event handlers
      socket.data.userId = decoded.userId
      
      next()
    } catch (error) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  // Handle client connections
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId
    console.log(`User ${userId} connected via Socket.io`)

    // Join user-specific room for targeted updates
    socket.join(`user:${userId}`)

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`)
    })

    // Handle torrent progress requests
    socket.on('torrent:subscribe', (torrentId: string) => {
      // Join room for specific torrent updates
      socket.join(`torrent:${torrentId}`)
      console.log(`User ${userId} subscribed to torrent ${torrentId}`)
    })

    socket.on('torrent:unsubscribe', (torrentId: string) => {
      socket.leave(`torrent:${torrentId}`)
      console.log(`User ${userId} unsubscribed from torrent ${torrentId}`)
    })
  })

  // Export io instance for use in other modules (e.g., to emit torrent updates)
  return io
}

