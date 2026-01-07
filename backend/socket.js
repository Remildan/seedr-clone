const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

/**
 * Setup Socket.io event handlers
 * Handles real-time updates for torrent progress
 * @param {Server} io
 */
const setupSocketIO = (io) => {
    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token

        if (!token) {
            return next(new Error('Authentication error: No token provided'))
        }

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            // In dev, maybe proceed? No, strictly require secret.
            return next(new Error('Server configuration error'))
        }

        try {
            // Verify JWT token
            const decoded = jwt.verify(token, jwtSecret)

            // Attach userId to socket data for use in event handlers
            socket.data.userId = decoded.userId

            next()
        } catch (error) {
            next(new Error('Authentication error: Invalid token'))
        }
    })

    // Handle client connections
    io.on('connection', (socket) => {
        const userId = socket.data.userId
        console.log(`User ${userId} connected via Socket.io`)

        // Join user-specific room for targeted updates
        socket.join(`user:${userId}`)

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected`)
        })

        // Handle torrent progress requests
        socket.on('torrent:subscribe', (torrentId) => {
            // Join room for specific torrent updates
            socket.join(`torrent:${torrentId}`)
            console.log(`User ${userId} subscribed to torrent ${torrentId}`)
        })

        socket.on('torrent:unsubscribe', (torrentId) => {
            socket.leave(`torrent:${torrentId}`)
            console.log(`User ${userId} unsubscribed from torrent ${torrentId}`)
        })
    })

    return io
}

module.exports = { setupSocketIO }
