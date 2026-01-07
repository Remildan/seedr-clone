require('dotenv').config()
const app = require('./app')

// Get port from environment variable or use default
const PORT = process.env.PORT || 5000

// Create HTTP server
const http = require('http')
const server = http.createServer(app)

// Initialize Socket.io
const { Server } = require('socket.io')
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Setup Socket.io handlers
const { setupSocketIO } = require('./socket')
setupSocketIO(io)

// Export io instance for use in controllers/services
module.exports = { io }

// Start the server

// Start the server
// Initialize Auto-Delete Cron Job
const { startAutoDelete } = require('./src/services/autoDelete')
startAutoDelete()

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  console.log(`🔌 Socket.io initialized`)
})

